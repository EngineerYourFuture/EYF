const log = (level: string, msg: unknown) => {
  const line = `[${level}] ${new Date().toISOString()} ${msg instanceof Error ? msg.stack ?? msg.message : String(msg)}`;
  if (level === "ERROR") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
};

export const logger = {
  info: (msg: unknown) => log("INFO", msg),
  warn: (msg: unknown) => log("WARN", msg),
  error: (msg: unknown) => log("ERROR", msg),
};
