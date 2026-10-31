export type LessonBlock = { type: string; data: Record<string, unknown> };

/** Authored media may navigate only to ordinary HTTPS resources. */
export function lessonUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Only known video providers become frames; arbitrary sites remain links. */
export function lessonEmbed(value: unknown): string | null {
  const safe = lessonUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  if (["youtube.com", "www.youtube.com", "youtu.be", "www.youtube-nocookie.com"].includes(url.hostname)) {
    const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") ?? url.pathname.split("/").pop();
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (["vimeo.com", "player.vimeo.com"].includes(url.hostname)) {
    const id = url.pathname.split("/").pop();
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
