"use client";
import Image from "next/image";
import Link from "next/link";
import { PUBLIC_APP_URL } from "@/lib/portal";
import { lessonEmbed, lessonUrl, type LessonBlock } from "@eyf/types";
import { PrivateLessonMedia } from "./private-media";

function isPrivateMedia(block: LessonBlock): boolean {
  return ["image", "video", "file"].includes(block.type) && typeof block.data.assetId === "string" && block.data.assetId.length > 0;
}

function PrivateBlock({ block, orgId, lessonId }: Readonly<{ block: LessonBlock; orgId?: string; lessonId: string }>) {
  const text = (key: string) => typeof block.data[key] === "string" ? block.data[key] as string : "";
  if (!orgId) return <output>Open this private media from your organization workspace.</output>;
  return <PrivateLessonMedia orgId={orgId} assetId={text("assetId")} lessonId={lessonId} title={text("title")} alt={text("alt")} captionsAssetId={text("captionsAssetId") || undefined} captionsUrl={lessonUrl(block.data.captionsUrl) ?? undefined} />;
}

export function LessonBlocks({ blocks, answers, onAnswer, lessonId, orgId, completed = false }: Readonly<{
  blocks: LessonBlock[]; answers: Record<string, number>; onAnswer: (id: string, choice: number) => void; lessonId: string; orgId?: string; completed?: boolean;
}>) {
  return <div className="space-y-5">{blocks.map((block, index) => {
    const text = (key: string) => typeof block.data[key] === "string" ? block.data[key] as string : "";
    const key = `${lessonId}-${index}`;
    if (isPrivateMedia(block)) return <PrivateBlock key={`${key}-${text("assetId")}`} orgId={orgId} lessonId={lessonId} block={block} />;
    switch (block.type) {
      case "heading": return <h3 key={key} className="text-xl font-semibold break-words">{text("text")}</h3>;
      case "rich_text": return <p key={key} className="text-text-2 leading-relaxed whitespace-pre-wrap break-words">{text("text")}</p>;
      case "callout": return <aside key={key} className="rounded-lg border border-border bg-surface-2 p-4 whitespace-pre-wrap">{text("text")}</aside>;
      case "code": return <pre key={key} className="rounded-lg bg-surface-2 border border-border p-4 overflow-auto text-sm"><code>{text("code")}</code></pre>;
      case "toggle": return <details key={key} className="border-b border-border py-3"><summary className="cursor-pointer font-medium min-h-11">{text("title") || "More detail"}</summary><p className="mt-3 whitespace-pre-wrap text-text-2">{text("text")}</p></details>;
      case "image": {
        const url = lessonUrl(block.data.url);
        return url ? <figure key={key}><Image src={url} alt={text("alt")} width={1000} height={650} unoptimized className="w-full h-auto rounded-lg" />{text("caption") && <figcaption className="mt-2 text-sm text-text-2">{text("caption")}</figcaption>}</figure> : <output className="block" key={key} >This image is unavailable.</output>;
      }
      case "video": case "embed": {
        const url = lessonUrl(block.data.url), embed = lessonEmbed(url);
        if (!url) return <output className="block" key={key} >This media is unavailable.</output>;
        if (embed) return <iframe key={key} title={text("title") || "Lesson video"} src={embed} className="w-full aspect-video rounded-lg border border-border" loading="lazy" allow="fullscreen; picture-in-picture" referrerPolicy="no-referrer" allowFullScreen />;
        if (block.type === "video" && /\.(mp4|webm|ogg)(\?|$)/i.test(url)) return <video key={key} controls preload="metadata" className="w-full rounded-lg"><source src={url} /><track kind="captions" src={lessonUrl(block.data.captionsUrl) ?? undefined} srcLang="en" label="English" default />Your browser cannot play this video. <a href={url}>Open video</a></video>;
        return <a key={key} href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">{text("title") || "Open lesson resource"} (new tab)</a>;
      }
      case "file": {
        const url = lessonUrl(block.data.url);
        return url ? <a key={key} href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">{text("title") || "Open attached file"} (new tab)</a> : <p key={key}>This attachment is unavailable.</p>;
      }
      case "judged_code": return <div key={key} className="space-y-2"><Link href={`${PUBLIC_APP_URL}/problems/${encodeURIComponent(text("problemSlug"))}`} target="_blank" className="inline-flex min-h-11 items-center underline underline-offset-4">Solve exercise: {text("problemSlug")} (new tab)</Link><p className="text-sm text-text-2">Pass the exercise, then return here to complete the lesson.</p></div>;
      case "quiz": {
        const choices = Array.isArray(block.data.choices) ? block.data.choices : [];
        return <fieldset key={key} className="rounded-lg border border-border p-4" disabled={completed}><legend className="font-semibold px-1">{text("question")}</legend><div className="space-y-2">{choices.map((choice, i) => <label key={i} className="flex gap-3 items-start py-2 min-h-11"><input className="mt-1" type="radio" name={`quiz-${key}`} checked={answers[String(index)] === i} onChange={() => onAnswer(String(index), i)} /><span>{String(choice)}</span></label>)}</div>{completed && <p className="text-sm text-easy">Passed with this lesson.</p>}</fieldset>;
      }
      case "divider": return <hr key={key} className="border-border" />;
      default: return <output key={key}  className="block text-text-2">This content type is not available. Ask your instructor to update this lesson.</output>;
    }
  })}</div>;
}
