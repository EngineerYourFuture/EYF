"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card, Button, Badge } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { startPeer, type PeerHandle } from "@/lib/peer-rtc";
import { toast } from "sonner";

type Mock = {
  id: string; type: string; status: string;
  candidateId: string; peerId: string | null;
  problemFocus: string | null; startedAt: string | null;
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data: mock } = useApi<Mock>(`/mocks/${params.id}`);
  const { getToken, userId } = useAuth();
  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const peerRef   = useRef<PeerHandle | null>(null);
  const [connState, setConnState] = useState<"idle" | "connecting" | "connected" | "ended" | "failed">("idle");

  useEffect(() => {
    return () => { peerRef.current?.stop(); };
  }, []);

  async function startCall() {
    if (!mock || !userId) { return; }
    try {
      const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (localRef.current) { localRef.current.srcObject = local; localRef.current.play().catch(() => {/*noop*/}); }
      setConnState("connecting");
      // Initiator = candidate; peer = answerer. Clerk userId is the clerkId,
      // not our internal id, so this is a simplification — in prod, embed the
      // real EYF userId in the JWT/Clerk claim.
      const initiator = mock.candidateId === userId; // OK as proxy when userId === clerkId
      peerRef.current = await startPeer({
        mockId: mock.id,
        initiator,
        localStream: local,
        getToken: async () => await getToken(),
        events: {
          onRemoteStream: (stream) => {
            if (remoteRef.current) { remoteRef.current.srcObject = stream; remoteRef.current.play().catch(() => {/*noop*/}); }
          },
          onConnect: () => setConnState("connected"),
          onClose:   () => setConnState("ended"),
          onFailed:  () => setConnState("failed"),
        },
      });
    } catch (e) { toast.error((e as Error).message); setConnState("ended"); }
  }

  function endCall() {
    peerRef.current?.stop();
    peerRef.current = null;
    setConnState("ended");
  }

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
