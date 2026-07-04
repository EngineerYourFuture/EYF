"use client";
/**
 * Minimal WebRTC peer-connection wrapper that wires SDP + ICE to our
 * long-polled signaling endpoint. One peer is the "initiator" (creates the
 * offer); the other waits for the offer and responds.
 */
import { buildIceServers } from "@eyf/types";
import type { SessionUser } from "@eyf/types";

export type PeerEvents = {
  onRemoteStream: (stream: MediaStream) => void;
  onConnect: () => void;
  onClose: () => void;
  /** P2P could not be established (e.g. symmetric NAT with no reachable TURN). */
  onFailed?: () => void;
};

// STUN + TURN (when NEXT_PUBLIC_TURN_* is configured) so connections survive
// symmetric NAT on campus/corporate networks; STUN-only fails silently there.
const ICE_SERVERS = buildIceServers({
  turnUrl: process.env.NEXT_PUBLIC_TURN_URL,
  turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME,
  turnCredential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
}) as RTCIceServer[];

export type PeerHandle = {
  pc: RTCPeerConnection;
  stop: () => void;
};

export async function startPeer(opts: {
  mockId: string;
  initiator: boolean;
  localStream: MediaStream;
  getToken: () => Promise<string | null>;
  events: PeerEvents;
}): Promise<PeerHandle> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  opts.localStream.getTracks().forEach((t) => pc.addTrack(t, opts.localStream));

  pc.ontrack = (e) => opts.events.onRemoteStream(e.streams[0]!);
  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    if (s === "connected") opts.events.onConnect();
    else if (s === "failed") (opts.events.onFailed ?? opts.events.onClose)();
    else if (s === "closed" || s === "disconnected") opts.events.onClose();
  };
  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === "failed") (opts.events.onFailed ?? opts.events.onClose)();
  };
  pc.onicecandidate = async (e) => {
    if (e.candidate) await send({ kind: "ice", payload: e.candidate.toJSON() });
  };

  let stopped = false;
  async function send(env: { kind: "offer" | "answer" | "ice" | "bye"; payload: unknown }) {
    const token = await opts.getToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1"}/peer/${opts.mockId}/signal`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(env),
    });
  }

  async function recvLoop() {
    while (!stopped) {
      try {
        const token = await opts.getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1"}/peer/${opts.mockId}/signal`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const env = json.data;
        if (!env) continue;
        if (env.kind === "offer") {
          await pc.setRemoteDescription(env.payload);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await send({ kind: "answer", payload: answer });
        } else if (env.kind === "answer") {
          await pc.setRemoteDescription(env.payload);
        } else if (env.kind === "ice") {
          try { await pc.addIceCandidate(env.payload); } catch { /* race */ }
        } else if (env.kind === "bye") {
          stop();
        }
      } catch { /* swallow + retry */ }
    }
  }

  if (opts.initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await send({ kind: "offer", payload: offer });
  }
  recvLoop();

  function stop() {
    if (stopped) return;
    stopped = true;
    try { pc.close(); } catch {/*noop*/}
    opts.events.onClose();
  }

  void ({} as SessionUser); // keep import shape for IDE
  return { pc, stop };
}
