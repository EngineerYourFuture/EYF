# EYF — Engineer Your Future

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

EYF serves three audiences named by the owner:

- **Individual students:** engineering students preparing for placements, practicing technical skills, preparing for interviews, and tracking their work and progress.
- **Colleges:** training and placement teams organizing learning programs, enrolling cohorts, assessing students, reviewing practical work, and following up with learners.
- **Companies:** organizations managing employee or intern learning, assessments, certificates, and hiring workflows within a private workspace.

**Open decision:** the owner named all three audiences without selecting a primary customer. Their commercial priority is undecided. Do not silently choose one audience for the entire product; identify the audience of each requested surface.

## Product Purpose

Connect preparation, learning, practical work, assessment, and progress records in one platform. Students use general EYF to prepare for engineering careers; colleges and companies use the private commercial LMS to organize and manage learning.

The owner wants EYF to stand out and become profitable. Revenue targets, adoption targets, and measurable learning or placement outcomes have not been confirmed in this initialization.

## Positioning

EYF's implemented learning mechanism connects a diagnostic, focused practice, practical work, reassessment, and a report of the resulting evidence. Organization reviewers can assess practical submissions shared with consent, alongside cohort learning operations.

This is a product mechanism, not evidence of market exclusivity or better outcomes than competing products. Readiness scores, certificates, and completed lessons must be described according to what they actually measure; they do not establish employment, salary, or job performance.

## Operating Context

The product has separate web entry points:

- **General EYF:** student preparation, practice, progress, career tools, and public product information. Local entry: `http://localhost:3000` (`pnpm --filter @eyf/web dev`).
- **Private LMS:** organization learning and administration, available to active organization members according to their roles. Local entry: `http://localhost:3001` (`pnpm --filter @eyf/web dev:lms`).
- **Platform administration:** EYF staff tools, including organization provisioning and licensed seat management, on the general deployment at `/admin/organizations`.

The student learning workflow includes baseline assessment, targeted practice, practical exercises, reassessment, and reviewing or explicitly sharing progress evidence.

The LMS workflow includes provisioning an organization, inviting members, authoring and publishing courses, assembling programs, enrolling cohorts, completing lessons and assessments, reviewing progress, and issuing or revoking certificates. Staff tasks depend on the user's effective permissions and scope.

## Capabilities and Constraints

- **Portal separation is an explicit owner requirement.** Keep the commercial LMS separate from general EYF navigation and routes. A separate URL alone does not provide confidentiality; enforce membership, role, and resource scope at the API.
- The deployments currently share identity, an API, and a database. They are not separate customer databases or independent authentication systems. Platform administrators do not automatically receive organization membership or customer course access.
- Organization permissions distinguish owners, administrators, learning staff, instructors, reviewers, HR, managers, mentors, recruiters, and learners. Preserve role restrictions, department or assignment scope, licensed seat limits, account suspension, and audit records. The current matrix is maintained in [docs/GO-LIVE.md](docs/GO-LIVE.md).
- Published LMS courses require active membership of their organization. Current cohorts assign programs; they do not establish separate per-course purchase entitlements.
- The implementation includes course revisions, programs, cohorts, quizzes, coding exercise references, timed assessments, certificates, progress reporting, CSV enrollment, and learner follow-up workflows. Feature implementation must not be presented as proof of production validation.
- **Payments are deliberately the final integration milestone.** Preserve the current transparent payment preview and the ability to continue through the product. Do not simulate a successful charge or invent paid entitlements. Organization authorization and seat limits remain enforced during preview.
- Code execution, AI, audio transcription, email delivery, and other external services depend on their configured providers and workers. Unavailable services must have honest states; never present fabricated results as real execution or assessment.
- Evidence sharing requires explicit consent and supports expiry or revocation. Private LMS access does not make a publicly hosted external video or file confidential.
- The active interface context is the responsive web product. An Expo companion exists in `apps/mobile` with daily challenge, flashcard, and streak surfaces; its presence does not establish native feature parity or a confirmed native redesign scope.
- Final production domains, validated pricing, curriculum completeness, and demonstrated customer outcomes remain open or require separate launch validation. Use [docs/GO-LIVE.md](docs/GO-LIVE.md) for changing deployment requirements.

## Brand Commitments

The established product name is **EYF — Engineer Your Future**. General EYF and EYF LMS belong to the same product, with distinct public and private contexts.

The repository describes an India-focused engineering placement product. Existing product copy uses direct, task-focused language. Preserve established terminology and factual meaning during refinements; do not introduce guarantees of placement, salary, or business results.

The incumbent visual system is recorded separately in [docs/DESIGN.md](docs/DESIGN.md). This initialization records product context and does not authorize a rebrand.

## Evidence on Hand

- [docs/GO-LIVE.md](docs/GO-LIVE.md): current portal boundaries, role matrix, operational requirements, and known validation limits.
- [apps/web/lib/portal.ts](apps/web/lib/portal.ts): public and private web entry points and route boundaries.
- [packages/types/src/org-permissions.ts](packages/types/src/org-permissions.ts): organization capabilities and role grants.
- [apps/api/src/routes/lms-access.integration.test.ts](apps/api/src/routes/lms-access.integration.test.ts) and [apps/web/e2e/portal-access.spec.ts](apps/web/e2e/portal-access.spec.ts): authorization and portal regression coverage. Tests are implementation evidence, not customer outcome evidence.
- [apps/api/src/services/placement-sprint.ts](apps/api/src/services/placement-sprint.ts) and [apps/api/src/services/practical-labs.ts](apps/api/src/services/practical-labs.ts): implemented practical learning mechanics and authored exercises.
- `apps/web/public`: existing application icons and social preview assets.
- `specs/`: historical product plans. Proposed revenue, market comparisons, pricing, testimonials, or outcome claims in planning documents require independent confirmation before becoming current product facts or public copy.

No verified customer adoption, placement improvement, willingness to pay, profitability, or competitor superiority was established during initialization. Do not invent proof, logos, customer quotes, or success statistics.

## Product Principles

1. Connect learning activity to inspectable work and clearly describe the limits of that evidence.
2. Preserve the boundary between general student preparation and private organization operations.
3. Match each action and record to the user's permissions, organization, and scope.
4. Keep the learner's next step clear, including when a provider is unavailable or payments remain in preview.
5. Ground product claims in demonstrated behavior and validated outcomes.

## Accessibility & Inclusion

Preserve existing keyboard operation, visible focus, dialog focus handling, reduced-motion preferences, responsive layouts, and text wrapping. Course authors must supply meaningful image descriptions and captions through the media provider where applicable. Do not claim accessibility certification or standards compliance without a separate audit.
