import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
    // The DB-backed integration tests share one Postgres, so running test files
    // in parallel races on shared fixtures (skill upserts, seeded ids). Run them
    // sequentially for deterministic, flake-free results.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts", "src/**/*.d.ts", "src/generated/**", "src/server.ts", "src/jobs/**",
        // Thin external-service adapters: their "logic" is glue over a third-party
        // SDK/HTTP client (LLMs, payments, auth, email, push, PDF). Unit-testing
        // them means mocking the client and asserting call args — brittle and
        // low-signal. They're exercised via integration/E2E instead. Pure helpers
        // extracted out of these (e.g. razorpay signature verify) remain covered.
        "src/services/anthropic.ts", "src/services/clerk.ts", "src/services/judge0.ts",
        "src/services/whisper.ts", "src/services/email.ts", "src/services/push.ts",
        "src/services/peer-signal.ts", "src/services/ai-mock.ts", "src/services/pdf.ts",
        "src/services/offer-letter.ts", "src/services/roast.ts", "src/services/strategist.ts",
        "src/services/communication.ts", "src/services/project-prep.ts", "src/services/razorpay.ts",
        // DB-first-with-static-fallback content sources: thin glue over prisma that
        // returns a hardcoded bank until the CMS tables have rows. Integration-tested.
        "src/lib/mcq-source.ts", "src/lib/assessment-source.ts",
        "src/lib/communication-source.ts", "src/lib/company-sims-source.ts",
        // Guidance orchestrates gatherReadinessInput + @eyf/types compute (100% covered)
        // + a Redis-cached LLM coach note — glue with no standalone logic to unit-test.
        "src/services/guidance.ts",
        // Sentry monitoring adapter (only active with SENTRY_DSN).
        "src/lib/observability.ts",
      ],
    },
  },
});
