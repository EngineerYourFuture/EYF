# EYF — Engineer Your Future

India's placement operating system: a turborepo/pnpm monorepo. `apps/web` (Next.js 15, App Router), `apps/api` (Fastify 5 + Prisma), `apps/mobile` (Expo/React Native — experimental, not in the CI health stack), `packages/{db,types,ui,config}`.

## Health Stack

- typecheck: pnpm typecheck
- lint: pnpm lint
- test: pnpm test:ci

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
