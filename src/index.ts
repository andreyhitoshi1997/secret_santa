import { Elysia } from "elysia";
import { z } from "zod";
import { managementSession } from "./modules/session/service";
import { ParticipantsService } from "./modules/participants/service";
import {
  AddParticipantsRequestSchema,
  AddParticipantsResponseSchema,
} from "./modules/participants/model";
import { SessionStatus } from "./modules/session/sessionStatus";

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

const lockSessionResponseSchema = z.object({
  status: z.nativeEnum(SessionStatus),
  participantCount: z.number(),
  emailsSent: z.number(),
  lockedAt: z.string(),
});

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .post(
    "/session",
    async ({ body }) => {
      const validatedBody = createSessionSchema.parse(body);
      const service = new managementSession();
      const result = await service.createSession(validatedBody);

      return result;
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
  .post(
    "/sessions/:sessionId/participants",
    async ({ params, body }) => {
      const validatedBody = AddParticipantsRequestSchema.parse(body);

      const participantsService = new ParticipantsService();
      const result = await participantsService.addParticipants(
        params.sessionId,
        validatedBody
      );

      return result;
    },
    {
      body: AddParticipantsRequestSchema,
      response: AddParticipantsResponseSchema,
    }
  )
  .post(
    "/sessions/:sessionId/lock",
    async ({ params }) => {
      const service = new managementSession();
      const result = await service.lockSession(params.sessionId);

      return result;
    },
    {
      response: lockSessionResponseSchema,
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
