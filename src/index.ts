import { app } from "./app";
import { env } from "./config/env";

// Listen on all interfaces (0.0.0.0) so both localhost and 127.0.0.1 work in Safari/Chrome
const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`${env.appName} listening on http://127.0.0.1:${env.port}`);
});

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close server cleanly.", error);
      process.exit(1);
      return;
    }
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
