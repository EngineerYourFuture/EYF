import "dotenv/config";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";

const host = new URL(env.JUDGE0_URL).hostname;
if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
  console.log("A remote Judge0 is configured. Start the EYF worker with dev:worker, then run judge:smoke.");
} else {
  const docker = ["/Applications/Docker.app/Contents/Resources/bin/docker", "/usr/bin/docker", "/usr/local/bin/docker", "/opt/homebrew/bin/docker"].find(existsSync);
  if (!docker) { console.error("Docker is not installed in a standard location. See docs/GO-LIVE.md for judge setup."); process.exitCode = 1; }
  else {
    const info = spawnSync(docker, ["info", "--format", "{{.CgroupVersion}} {{.Architecture}}"], { encoding: "utf8", timeout: 5000 });
    if (info.status !== 0) { console.error("Start Docker, then retry judge:start."); process.exitCode = 1; }
    else if (info.stdout.trim() !== "1 x86_64") {
      console.error("This Docker host cannot run the bundled Judge0 sandbox. Use Linux amd64 with cgroup v1, or configure JUDGE0_URL and JUDGE0_TOKEN for a compatible private host. Sandbox limits remain enabled."); process.exitCode = 1;
    } else {
      const result = spawnSync(docker, ["compose", "--profile", "judge", "up", "-d", "judge0", "judge0-worker"], { cwd: fileURLToPath(new URL("../../../../", import.meta.url)), stdio: "inherit", timeout: 120_000 });
      process.exitCode = result.status ?? 1;
      if (result.status === 0) console.log("Judge containers started. Run dev:worker in another terminal, then judge:smoke. Container startup alone does not verify execution.");
    }
  }
}
