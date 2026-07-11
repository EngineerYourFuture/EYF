// k6 load smoke for the EYF API. Run against staging, never prod:
//   BASE_URL=https://staging-api.eyf.in k6 run load/k6-smoke.js
//
// Wire into CI (nightly / pre-release) as a gate: the thresholds below fail the
// run if p95 latency or error rate regress. Add authenticated scenarios with a
// seeded token to exercise the real request paths.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  scenarios: {
    ramp: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% errors
    http_req_duration: ["p(95)<400", "p(99)<1000"],
  },
};

export default function () {
  const readyz = http.get(`${BASE}/readyz`);
  check(readyz, { "readyz 200": (r) => r.status === 200 });

  const health = http.get(`${BASE}/v1/health`);
  check(health, { "health ok": (r) => r.json("ok") === true });

  sleep(1);
}
