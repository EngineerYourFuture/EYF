"use client";
import { canInOrg } from "@eyf/types";
import { fieldClass } from "./shared";

const GROUPS = ["My learning", "Training", "People", "Workspace"];

export function workspaceSections(roles: string[]) {
  const can = (cap: Parameters<typeof canInOrg>[1]) => canInOrg(roles, cap).granted;
  const skills = canInOrg(roles, "people:skills-read");
  return [
    { id: "learning", label: "My programs", group: "My learning" },
    { id: "courses", label: can("learn:author") ? "Courses" : "My courses", group: can("learn:author") ? "Training" : "My learning" },
    { id: "assessments", label: "Assessments", group: "My learning" },
    { id: "certificates", label: "Certificates", group: "My learning" },
    ...(can("learn:author") || can("learn:publish") ? [{ id: "programs", label: "Programs", group: "Training" }] : []),
    ...(can("learn:enroll") ? [{ id: "cohorts", label: "Cohorts", group: "Training" }] : []),
    ...(can("assess:grade") ? [{ id: "reviews", label: "Reviews", group: "Training" }] : []),
    ...(can("org:members") ? [{ id: "people", label: "People and access", group: "People" }] : []),
    ...(skills.granted && skills.scope !== "own" ? [{ id: "skills", label: "Skill records", group: "People" }] : []),
    ...(can("talent:search") || can("hire:pipeline") ? [{ id: "hire", label: "Hiring", group: "People" }] : []),
    { id: "access", label: "Your access", group: "Workspace" },
    ...(can("org:manage") ? [{ id: "settings", label: "Settings", group: "Workspace" }] : []),
  ].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));
}
export function WorkspaceNav({ sections, value, onChange }: Readonly<{ sections: ReturnType<typeof workspaceSections>; value: string; onChange: (id: string) => void }>) {
  const groups = GROUPS.filter((group) => sections.some((s) => s.group === group));
  return <>
    <label className="block lg:hidden text-sm font-medium">Workspace section<select aria-label="Workspace section" className={`${fieldClass} mt-2`} value={value} onChange={(e) => onChange(e.target.value)}>{groups.map((group) => <optgroup key={group} label={group}>{sections.filter((s) => s.group === group).map((s) => <option key={s.id} value={s.id}>{group} · {s.label}</option>)}</optgroup>)}</select></label>
    <div role="tablist" tabIndex={-1} aria-label="Organization console" aria-orientation="vertical" className="hidden lg:block space-y-5" onKeyDown={(e) => {
      const focusedId = (e.target as HTMLElement).closest('[role="tab"]')?.id;
      const index = sections.findIndex((s) => focusedId ? `org-tab-${s.id}` === focusedId : s.id === value);
      const nextByKey: Record<string, number> = {
        Home: 0, End: sections.length - 1,
        ArrowDown: (index + 1) % sections.length, ArrowRight: (index + 1) % sections.length,
        ArrowUp: (index - 1 + sections.length) % sections.length, ArrowLeft: (index - 1 + sections.length) % sections.length,
      };
      const next = nextByKey[e.key] ?? -1;
      if (next < 0) { return; } e.preventDefault(); const id = sections[next]!.id; onChange(id); document.getElementById(`org-tab-${id}`)?.focus();
    }}>{groups.map((group) => <div key={group}><p className="px-3 mb-1 text-sm font-semibold text-text-2">{group}</p>{sections.filter((s) => s.group === group).map((s) => <button type="button" key={s.id} id={`org-tab-${s.id}`} role="tab" aria-label={s.label} aria-selected={value === s.id} aria-controls="org-panel" tabIndex={value === s.id ? 0 : -1} onClick={() => onChange(s.id)} className={`w-full min-h-11 text-left px-3 py-2 rounded-r-md border-l text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${value === s.id ? "border-brand bg-surface-3 font-medium text-text-1" : "border-transparent text-text-2 hover:bg-surface"}`}>{s.label}</button>)}</div>)}</div>
  </>;
}
