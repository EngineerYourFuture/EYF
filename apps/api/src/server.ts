import { buildApp } from "./app.js";
import { env } from "./env.js";
import { captureException, flushSentry } from "./lib/observability.js";

const app = await buildApp();

// Last-resort guards: log + report, then let the platform restart us.
process.on("unhandledRejection", (reason) => {
  app.log.error({ reason }, "unhandledRejection");
  captureException(reason);
});
process.on("uncaughtException", (err) => {
  app.log.fatal({ err }, "uncaughtException");
  captureException(err);
});

try {
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info(`EYF API listening on http://${env.API_HOST}:${env.API_PORT}/v1`);
} catch (err) {
  app.log.error(err);
  await flushSentry();
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} received, shutting down…`);
    await app.close();
    await flushSentry();
    process.exit(0);
  });
}
