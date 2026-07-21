"use client";
import { useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "stopped" | "denied";

/**
 * MediaRecorder hook for voice input. Returns the latest recorded Blob
 * once stopped. Cleans up the underlying stream on unmount.
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [blob, setBlob]   = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => () => {
    recRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  async function start() {
    setError(null); setBlob(null); chunksRef.current = [];
    try {
      setState("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mime: string;
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mime = "audio/webm;codecs=opus";
      else if (MediaRecorder.isTypeSupported("audio/webm")) mime = "audio/webm";
      else mime = "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: rec.mimeType });
        setBlob(b); setState("stopped");
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start(250);
      setState("recording");
    } catch (e) {
      setError((e as Error).message);
      setState("denied");
    }
  }

  function stop() {
    if (recRef.current?.state === "recording") recRef.current.stop();
  }

  function reset() {
    setBlob(null); setState("idle"); setError(null);
  }

  return { state, blob, error, start, stop, reset };
}
