import { buildApp } from "./app.js";
import { env } from "./env.js";

const app = await buildApp();

try {
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info(`EYF API listening on http://${env.API_HOST}:${env.API_PORT}/v1`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} received, shutting down…`);
    await app.close();
    process.exit(0);
  });
}
