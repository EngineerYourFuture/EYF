"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { API_BASE } from "@/lib/api";
import { useConfirm } from "@/components/confirm";

type Access = { path: string; contentType: string; filename: string };

export function PrivateLessonMedia({ orgId, assetId, lessonId, title, alt, captionsUrl, captionsAssetId }: Readonly<{
  orgId: string; assetId: string; lessonId: string; title: string; alt: string; captionsUrl?: string; captionsAssetId?: string;
}>) {
  const action = useApiAction();
  const actionRef = useRef(action);
  actionRef.current = action;
  const [access, setAccess] = useState<Access | null>(null);
  const [privateCaptions, setPrivateCaptions] = useState<string>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const playback = useRef({ time: 0, playing: false });
  useEffect(() => {
    let cancelled = false;
    setError("");
    const request = (id: string) => actionRef.current<Access>(`/orgs/${orgId}/media/${id}/access`, { method: "POST", body: JSON.stringify({ lessonId }) }, { silent: true });
    void Promise.all([request(assetId), captionsAssetId ? request(captionsAssetId) : Promise.resolve(null)])
      .then(([value, captions]) => { if (!cancelled) { setAccess(value); setPrivateCaptions(captions ? `${API_BASE}${captions.path}` : undefined); } })
      .catch(() => { if (!cancelled) { setAccess(null); setError("This file is unavailable or your access has changed."); } });
    return () => { cancelled = true; };
  }, [orgId, assetId, lessonId, captionsAssetId, revision]);
  useEffect(() => {
    // Refresh before expiry while preserving video position and play/pause state.
    const timer = setTimeout(() => {
      if (video.current) playback.current = { time: video.current.currentTime, playing: !video.current.paused };
      setRevision((value) => value + 1);
    }, 240_000);
    return () => clearTimeout(timer);
  }, [revision]);
  function refresh() {
    if (video.current) playback.current = { time: video.current.currentTime, playing: !video.current.paused };
    setRevision((value) => value + 1);
  }
  const url = access ? `${API_BASE}${access.path}` : "";
  return <div className="space-y-3">
    {error && <p role="alert">{error}</p>}
    {!access && !error && <output className="block text-sm text-text-2">Opening private media…</output>}
    {access?.contentType.startsWith("image/") && <Image src={url} alt={alt} width={1000} height={650} unoptimized className="w-full h-auto rounded-lg" onError={() => setError("This media link expired. Refresh access to continue.")} />}
    {access?.contentType.startsWith("video/") && <video ref={video} src={url} crossOrigin="anonymous" aria-label={title || "Lesson video"} controls preload="metadata" className="w-full rounded-lg" onError={() => setError("This media link expired. Refresh access to continue.")} onLoadedMetadata={() => { if (video.current && playback.current.time) { video.current.currentTime = playback.current.time; if (playback.current.playing) void video.current.play().catch(() => {}); } }}><track kind="captions" src={privateCaptions ?? captionsUrl} srcLang="en" label="English" default /></video>}
    {access && !/^(image|video)\//.test(access.contentType) && <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">{title || access.filename} (new tab)</a>}
    <Button type="button" variant="ghost" onClick={refresh}>Refresh media access</Button>
  </div>;
}

export function PrivateMediaLibrary({ orgId }: Readonly<{ orgId: string }>) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const media = useApi<{ id: string; filename: string; size: number }[]>(open ? `/orgs/${orgId}/media` : null);
  const action = useApiAction(), confirm = useConfirm();
  return <details className="mt-6 border-t border-border py-4" onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer font-medium">Manage private uploads</summary>
    <p className="my-3 text-sm text-text-2">Latest 100 uploads in this workspace. Files used by lessons cannot be deleted.</p>
    {media.error && <p role="alert">Could not load uploads. <Button type="button" variant="ghost" onClick={() => void media.mutate()}>Retry</Button></p>}
    {media.data?.length === 0 && <p className="text-text-2">No private uploads yet.</p>}
    <ul className="divide-y divide-border">{media.data?.map((file) => <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="break-all">{file.filename} · {(file.size / 1024 / 1024).toFixed(1)} MB</span><Button type="button" variant="ghost" disabled={busy} onClick={async () => {
      if (!await confirm({ title: `Delete ${file.filename}?`, confirmLabel: "Delete upload", danger: true })) return;
      setBusy(true);
      try { await action(`/orgs/${orgId}/media/${file.id}`, { method: "DELETE" }); await media.mutate(); }
      catch { /* API explains why in-use files are retained. */ } finally { setBusy(false); }
    }}>Delete unused upload</Button></li>)}</ul>
  </details>;
}

export function PrivateMediaUpload({ orgId, accept, onUploaded, label = "Upload a private file" }: Readonly<{ orgId: string; accept: string; label?: string; onUploaded: (asset: { id: string; filename: string }) => void }>) {
  const action = useApiAction();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <label className="block text-sm">{label}
    <input type="file" accept={accept} disabled={busy} className="mt-2 block w-full min-h-11" onChange={async (event) => {
      const input = event.currentTarget, file = input.files?.[0];
      if (!file) return;
      setBusy(true); setError("");
      const body = new FormData(); body.set("file", file);
      try { onUploaded(await action(`/orgs/${orgId}/media`, { method: "POST", body }, { silent: true })); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed. Try again."); }
      finally { setBusy(false); input.value = ""; }
    }} />
    {busy && <output className="block">Uploading…</output>}
    {error && <span role="alert" className="block text-hard">{error}</span>}
  </label>;
}
