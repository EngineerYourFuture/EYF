import type { Page } from "@playwright/test";

type Block = { type: string; data: Record<string, unknown> };
export async function portal(page: Page) {
  const state = { role: "OWNER", title: "Backend onboarding", courseStatus: "DRAFT", program: "", published: false, attached: false, cohort: "", enrolled: false, complete: false, submitted: false, template: false, invited: false, blocks: [{ type: "rich_text", data: { text: "Read the introduction." } }] as Block[], failCourses: false };
  const token = `lms.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
  await page.addInitScript((token) => { localStorage.setItem("eyf_dev_token", token); localStorage.setItem("eyf_dev_userid", "lms-user"); localStorage.setItem("eyf-theme", "light"); }, token);
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ body: "<p>Lesson video</p>", contentType: "text/html" }));
  await page.route("**/v1/**", async (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname.replace(/^\/v1/, ""); const method = request.method();
    const body = method === "POST" || method === "PATCH" ? request.postDataJSON() ?? {} : {};
    const org = { id: "lms-org", name: "Demo academy", plan: "TRIAL" };
    const course = { id: "course-1", title: state.title, description: "Backend fundamentals", status: state.courseStatus, version: 1, _count: { lessons: 1, enrollments: 0 } };
    const lesson = { id: "lesson-1", title: "Introduction", type: "RICH_TEXT", blocks: state.blocks, estMinutes: 5, orderIndex: 0, completed: state.complete };
    const program = { id: "path-1", title: state.program, published: state.published, _count: { items: state.attached ? 1 : 0, cohorts: state.cohort ? 1 : 0 } };
    const member = { id: "member-1", roles: ["MEMBER"], status: "ACTIVE", user: { name: "Learner One", email: "learner@example.test" } };
    let data: unknown = null;
    if (path === "/me") data = { user: { id: "lms-user", name: "LMS user", role: "STUDENT_FREE", subscription: { plan: "FREE" } } };
    else if (path === "/billing/status") data = { enabled: false };
    else if (path === "/talent/consent") data = { inPool: false, scope: null };
    else if (path === "/talent/offers") data = [];
    else if (path === "/orgs/lms-org/access") data = { roles: [state.role], departmentId: null, plan: "TRIAL", seats: { used: 2, licensed: 10 } };
    else if (path === "/orgs/mine") data = [{ roles: [state.role], org }];
    else if (path === "/orgs/lms-org/courses") {
      if (state.failCourses) return route.fulfill({ status: 500, json: { success: false, error: { code: "UNAVAILABLE", message: "Unavailable" } } });
      data = [course];
    } else if (path === "/orgs/lms-org/courses/course-1") data = { ...course, lessons: [lesson] };
    else if (path === "/orgs/lms-org/lessons/lesson-1" && method === "PATCH") { state.blocks = body.blocks; data = lesson; }
    else if (path === "/orgs/lms-org/courses/course-1/publish") { state.courseStatus = "PUBLISHED"; data = course; }
    else if (path === "/orgs/lms-org/work/courses") data = state.courseStatus === "PUBLISHED" ? [{ ...course, lessonCount: 1, completedCount: state.complete ? 1 : 0 }] : [];
    else if (path === "/orgs/lms-org/work/courses/course-1") data = { ...course, lessons: [{ ...lesson, blocks: state.blocks.map((b) => b.type === "quiz" ? { type: b.type, data: { question: b.data.question, choices: b.data.choices } } : b) }] };
    else if (path === "/orgs/lms-org/work/lessons/lesson-1/complete") {
      const quizIndex = state.blocks.findIndex((b) => b.type === "quiz");
      if (quizIndex >= 0 && body.answers?.[quizIndex] !== 0) return route.fulfill({ status: 422, json: { success: false, error: { code: "LESSON_INCOMPLETE", message: "Answer question 1 correctly before completing this lesson." } } });
      state.complete = true; data = { completed: true };
    } else if (path === "/orgs/lms-org/paths") { if (method === "POST") { state.program = body.title; data = { ...program, title: body.title }; } else data = state.program ? [program] : []; }
    else if (path === "/orgs/lms-org/paths/path-1") data = { ...program, items: state.attached ? [{ courseId: "course-1", orderIndex: 0, required: true, course }] : [] };
    else if (path === "/orgs/lms-org/paths/path-1/items") { state.attached = true; data = {}; }
    else if (path === "/orgs/lms-org/paths/path-1/publish") { state.published = true; data = {}; }
    else if (path === "/orgs/lms-org/cohorts") { if (method === "POST") { state.cohort = body.name; data = { id: "cohort-1" }; } else data = state.cohort ? [{ id: "cohort-1", name: state.cohort, path: program, _count: { enrollments: state.enrolled ? 1 : 0 } }] : []; }
    else if (path === "/orgs/lms-org/learning-members") data = [member];
    else if (path === "/orgs/lms-org/cohorts/cohort-1/enroll") { state.enrolled = true; data = { enrolled: 1, rejected: [] }; }
    else if (path === "/orgs/lms-org/cohorts/cohort-1/funnel") data = { cohort: { driveTitle: null, driveDeadline: null, minimumProgress: 100 }, funnel: { enrolled: state.enrolled ? 1 : 0, completed: state.complete ? 1 : 0, stuck: 0, eligible: state.complete ? 1 : 0 }, rows: state.enrolled ? [{ enrollmentId: "enrollment-1", member: { id: member.id, name: member.user.name, email: member.user.email }, progressPct: state.complete ? 100 : 0, stuckFlag: false, eligibility: { eligible: state.complete, reasons: state.complete ? [] : ["100% required; 0% achieved."] }, followUp: { status: "NONE", note: "", dueAt: null, overdue: false } }] : [] };
    else if (path === "/orgs/lms-org/work/paths") data = state.enrolled ? [{ cohortId: "cohort-1", cohortName: state.cohort, pathTitle: state.program, progressPct: state.complete ? 100 : 0, courses: [{ ...course, lessonCount: 1, completedCount: state.complete ? 1 : 0 }] }] : [];
    else if (path === "/orgs/lms-org/members") data = { items: [member], nextCursor: null };
    else if (path === "/orgs/lms-org/invites") { if (method === "POST") { state.invited = true; data = { token: "demo-invitation-code-12345" }; } else data = state.invited ? [{ id: "invite-1", email: "learner@example.test", roles: ["MEMBER"], expiresAt: "2027-01-01" }] : []; }
    else if (path === "/orgs/lms-org/blueprints") data = [{ id: "blueprint-1", name: "Backend check", category: "TECHNICAL", questionCount: 1, passingScore: 60, _count: { runs: 1 } }];
    else if (path === "/orgs/lms-org/runs") data = [];
    else if (path === "/orgs/lms-org/cert-templates") { if (method === "POST") { state.template = true; data = {}; } else data = state.template ? [{ id: "template-1", name: "Backend graduate" }] : []; }
    else if (path === "/orgs/lms-org/certificates" || path === "/orgs/lms-org/work/certificates") data = state.submitted && state.template ? [{ id: "cert-1", title: "Backend graduate", verificationCode: "verify-lms", revokedAt: null }] : [];
    else if (path === "/orgs/lms-org/work/assessments") data = [{ runId: "run-1", name: "Backend check", durationMin: 10, questionCount: 1, myStatus: state.submitted ? "SUBMITTED" : "NOT_STARTED", myScore: state.submitted ? 100 : null }];
    else if (path === "/orgs/lms-org/runs/run-1/start") data = { attemptId: "attempt-1", expiresAt: new Date(Date.now() + 600000).toISOString(), questions: [{ id: "q-1", prompt: "Which service stores records?", choices: ["Database", "Stylesheet"] }] };
    else if (path === "/orgs/lms-org/attempts/attempt-1/submit") { state.submitted = true; data = { score: 100, passed: true }; }
    return route.fulfill({ json: { success: true, data } });
  });
  return state;
}
