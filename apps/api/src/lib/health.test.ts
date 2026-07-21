import "dotenv/config";
import { describe, it, expect } from "vitest";
import { checkReadiness } from "./health.js";

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("checkReadiness", () => {
  it("probes db + redis and reports the shape", async () => {
    const r = await checkReadiness();
    expect(typeof r.ok).toBe("boolean");
    expect(typeof r.checks.db).toBe("boolean");
    expect(typeof r.checks.redis).toBe("boolean");
    expect(r.checks.db).toBe(true); // DB is up in the integration env
  });
});
