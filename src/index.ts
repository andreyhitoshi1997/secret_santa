import { Elysia } from "elysia";
import { z } from "zod";
import { managementSession } from "./modules/session/service";

const createSessionSchema = z.object({
  creatorEmail: z.string().email(),
  sessionName: z.string().optional(),
});

const sessionResponseSchema = z.object({
  sessionId: z.string(),
  secretToken: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

const closeSessionResponseSchema = z.object({
  status: z.string(),
  closedAt: z.string(),
});

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .post(
    "/session",
    async ({ body }) => {
      const validatedBody = createSessionSchema.parse(body);
      const service = new managementSession();
      const session = await service.createSession(validatedBody);

      return session;
    },
    {
      body: createSessionSchema,
      response: sessionResponseSchema,
    }
  )
  .post(
    "/sessions/:sessionId/close",
    async ({ params }) => {
      const service = new managementSession();
      const result = await service.closeSession(params.sessionId);

      return result;
    },
    {
      response: closeSessionResponseSchema,
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
