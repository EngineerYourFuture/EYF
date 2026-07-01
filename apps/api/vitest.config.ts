import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      // Don't count tests, generated clients, or infra bootstrap against coverage.
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts", "src/generated/**", "src/server.ts", "src/jobs/**"],
    },
  },
});
