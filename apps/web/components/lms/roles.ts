import type { OrgCapability, OrgRoleName, OrgScope } from "@eyf/types";

export const ROLE_DETAILS: Record<OrgRoleName, { name: string; group: string; description: string }> = {
  OWNER: { name: "Owner", group: "Workspace administration", description: "Manage the workspace and all organization roles, and view license usage." },
  ADMIN: { name: "Administrator", group: "Workspace administration", description: "Manage people, learning and settings. Cannot grant owner or administrator roles or manage billing." },
  LND: { name: "Learning manager", group: "Learning and review", description: "Create and publish courses, enroll learners and manage assessments." },
  INSTRUCTOR: { name: "Instructor", group: "Learning and review", description: "Create courses and assessments, teach and grade work. Cannot publish or enroll learners." },
  REVIEWER: { name: "Reviewer", group: "Learning and review", description: "Review learning content and grade submissions. Cannot publish or manage accounts." },
  MENTOR: { name: "Mentor", group: "Learning and review", description: "Teach and support assigned mentees. Assessment and skill records are limited to mentees." },
  HR: { name: "HR manager", group: "People and hiring", description: "Manage learner and intern accounts, enrollment and hiring. Cannot assign staff roles." },
  ENG_MANAGER: { name: "Engineering manager", group: "People and hiring", description: "Manage learning and assessment records within an assigned department, plus hiring tools." },
  RECRUITER: { name: "Recruiter", group: "People and hiring", description: "Manage hiring assessments and pipeline, and search consenting candidates. Cannot issue offers." },
  MEMBER: { name: "Learner", group: "Learners", description: "Access organization learning and personal results. No people management or course authoring." },
  INTERN: { name: "Intern", group: "Learners", description: "Access organization learning and personal results as an intern. No staff permissions." },
};
export const ROLE_GROUPS = ["Workspace administration", "Learning and review", "People and hiring", "Learners"];
export const roleName = (role: string) => ROLE_DETAILS[role as OrgRoleName]?.name ?? role;
export const CAPABILITY_LABELS: Record<OrgCapability, string> = {
  "org:manage": "Workspace settings", "org:billing": "License and usage", "org:members": "People and invitations",
  "org:audit": "Audit history", "org:branding": "Workspace branding", "learn:author": "Create courses and programs",
  "learn:publish": "Publish learning content", "learn:enroll": "Enroll learners", "learn:teach": "Teach courses",
  "learn:review": "Review learning content", "assess:author": "Create assessments", "assess:administer": "Schedule assessments",
  "assess:grade": "Grade and review submissions", "assess:view-results": "Assessment results", "people:skills-read": "Skill records",
  "mentor:mentees": "Mentoring", "talent:search": "Search consenting candidates", "hire:pipeline": "Hiring pipeline",
  "hire:offer": "Issue offers", "reports:team": "Team reports", "reports:org": "Organization reports",
};
export const SCOPE_LABELS: Record<OrgScope, string> = { org: "This organization", department: "Assigned department", team: "Assigned team", mentees: "Assigned mentees", own: "Your own or assigned records" };

export function workspaceHref(orgId: string, tab = "programs") {
  return `/orgs?${new URLSearchParams({ org: orgId, tab }).toString()}`;
}
export const countLabel = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;
