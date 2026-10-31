"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card, Button, Badge } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { startPeer, type PeerHandle } from "@/lib/peer-rtc";
import { toast } from "sonner";
import { LoadError, loadFailed } from "@/components/load-error";

type Mock = {
  id: string; type: string; status: string;
  viewerIsCandidate: boolean;
  problemFocus: string | null; startedAt: string | null;
};

type Call = { peer: PeerHandle | null; stream: MediaStream | null; gen: number };

/**
 * Ends the call, or cancels one still being set up, and releases the camera and
 * mic. Bumping `gen` makes an in-flight startCall drop whatever it resolves to.
 * Safe to call more than once.
 */
function hangUp(call: Call) {
  call.gen += 1;
  call.peer?.stop();
  call.peer = null;
  call.stream?.getTracks().forEach((t) => t.stop());
  call.stream = null;
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data: mock, error, mutate: reload } = useApi<Mock>(`/mocks/${params.id}`);
  const { getToken, userId } = useAuth();
  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  // Held outside the <video> refs: React detaches those before effect cleanup runs.
  const call = useRef<Call>({ peer: null, stream: null, gen: 0 }).current;
  const [connState, setConnState] = useState<"idle" | "connecting" | "connected" | "ended" | "failed">("idle");

  const gone = loadFailed(error, mock);
  useEffect(() => () => hangUp(call), [call]);
  // A session that disappears mid-call must not keep transmitting behind the error screen.
  useEffect(() => { if (gone) { hangUp(call); } }, [gone, call]);

  async function startCall() {
    if (!mock || !userId) { return; }
    // A retry starts clean: the previous attempt's connection, signalling loop and camera end first.
    hangUp(call);
    const gen = call.gen;
    const current = () => gen === call.gen;
    try {
      const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (!current()) { local.getTracks().forEach((t) => t.stop()); return; }
      call.stream = local;
      if (localRef.current) { localRef.current.srcObject = local; localRef.current.play().catch(() => {/*noop*/}); }
      setConnState("connecting");
      // Initiator = candidate; peer = answerer. The server decides which side the
      // viewer is on: the client only knows its Clerk id, never the internal one.
      const initiator = mock.viewerIsCandidate;
      const peer = await startPeer({
        mockId: mock.id,
        initiator,
        localStream: local,
        getToken: async () => await getToken(),
        // Events from a superseded attempt are ignored, so they can't end the current one.
        events: {
          onRemoteStream: (stream) => {
            if (current() && remoteRef.current) { remoteRef.current.srcObject = stream; remoteRef.current.play().catch(() => {/*noop*/}); }
          },
          onConnect: () => { if (current()) setConnState("connected"); },
          onClose:   () => { if (current()) { hangUp(call); setConnState("ended"); } },
          onFailed:  () => { if (current()) { hangUp(call); setConnState("failed"); } },
        },
      });
      if (!current()) { peer.stop(); return; }
      call.peer = peer;
    } catch (e) {
      if (!current()) return;
      hangUp(call);
      toast.error((e as Error).message);
      setConnState("ended");
    }
  }

  function endCall() {
    hangUp(call);
    setConnState("ended");
  }

  if (gone) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto"><LoadError page error={error} what="mock interview" retry={() => reload()} back={{ href: "/peer-mocks", label: "All peer mocks" }} /></div>;
  if (!mock) { return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>; }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Badge>PEER</Badge>
        <span className="font-display text-lg">{mock.problemFocus ?? "general"}</span>
        <Badge tone={(() => { if (connState === "connected") { return "easy" as const; } if (connState === "ended" || connState === "failed") { return "hard" as const; } return "accent" as const; })()} className="ml-auto">
          {connState}
        </Badge>
      </div>

      {connState === "failed" && (
        <div className="mt-4 rounded-xl border border-hard/40 bg-hard/[0.06] px-4 py-3 text-sm">
          <span className="font-medium text-hard">Connection failed.</span>{" "}
          <span className="text-text-2">Your network likely blocks direct peer connections (strict NAT/firewall). Retry, or try a different network / hotspot.</span>
        </div>
      )}

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <VideoTile label="You"    ref={localRef}  mirrored />
        <VideoTile label="Peer"   ref={remoteRef} />
      </div>

      <div className="mt-6 flex gap-3">
        {connState === "idle"   && <Button onClick={startCall}>Start call</Button>}
        {connState === "failed" && <Button onClick={startCall}>Retry connection</Button>}
        {connState === "connecting" && <Button disabled>Connecting…</Button>}
        {(connState === "connected" || connState === "connecting") && <Button variant="ghost" onClick={endCall}>End call</Button>}
      </div>

      <Card className="mt-8 text-sm text-text-3">
        <p>Tip: Take turns. 15 min you interview, 15 min they interview. End the call to log session and submit feedback to your peer.</p>
      </Card>
    </div>
  );
}

const VideoTile = (function () {
  const Tile = (
    { label, mirrored }: { label: string; mirrored?: boolean },
    ref: React.Ref<HTMLVideoElement>,
  ) => (
    <Card className="p-0 overflow-hidden">
      <div className="px-3 py-2 text-text-3 text-xs uppercase tracking-wider border-b border-border">{label}</div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- live WebRTC peer stream; no caption track exists for a real-time call. */}
      <video ref={ref} autoPlay playsInline muted={mirrored}
        style={{ width: "100%", aspectRatio: "16/9", background: "#000", transform: mirrored ? "scaleX(-1)" : undefined }} />
    </Card>
  );
  Tile.displayName = "VideoTile";
  return (require("react") as typeof import("react")).forwardRef(Tile);
})();
