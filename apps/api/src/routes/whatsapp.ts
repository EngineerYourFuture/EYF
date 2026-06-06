import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleCommand, parseCommand, twiml } from "../services/whatsapp.js";

const twilioBody = z.object({
  From: z.string(),
  Body: z.string().optional().default(""),
});

export async function whatsappRoutes(app: FastifyInstance) {
  // Accept Twilio's URL-encoded form posts. Fastify parses form-urlencoded
  // by default when we register the parser.
  app.addContentTypeParser(
    "application/x-www-form-urlencoded",
    { parseAs: "string" },
    (_req, body, done) => {
      try {
        const params = new URLSearchParams(body as string);
        const obj: Record<string, string> = {};
        for (const [k, v] of params) obj[k] = v;
        done(null, obj);
      } catch (err) {
        done(err as Error);
      }
    },
  );

  app.post("/webhook", async (req, reply) => {
    const parsed = twilioBody.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .code(200) // Twilio retries on non-200; respond empty TwiML.
        .type("text/xml")
        .send(twiml("Couldn't parse your message. Try /help"));
    }
    const cmd = parseCommand(parsed.data.Body);
    try {
      const text = await handleCommand(parsed.data.From, cmd);
      return reply.type("text/xml").send(twiml(text));
    } catch (err) {
      req.log.error({ err }, "whatsapp handler failed");
      return reply.type("text/xml").send(twiml("Something broke on our end. Try again in a minute."));
    }
  });

  // Dev-only: simulate a Twilio webhook call from a curl/postman.
  app.post("/dev-send", async (req, reply) => {
    if (process.env.NODE_ENV === "production") {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "" } });
    }
    const { from, body } = z.object({ from: z.string(), body: z.string() }).parse(req.body);
    const cmd = parseCommand(body);
    const text = await handleCommand(from, cmd);
    return { success: true, data: { reply: text } };
  });
}
