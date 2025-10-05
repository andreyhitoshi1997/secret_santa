import { db } from "@/database/client";
import { sessions } from "@/database/schema/sessions";

export class managementSession {
  constructor() {}

  async createSession(request: { creatorEmail: string; sessionName?: string }) {
    const newSession = await db
      .insert(sessions)
      .values({
        name: request.sessionName,
        creatorEmail: request.creatorEmail,
      })
      .returning({
        sessionId: sessions.id,
        secretToken: sessions.secretToken,
        status: sessions.status,
        createdAt: sessions.createdAt,
      });

    return {
      sessionId: newSession[0].sessionId,
      secretToken: newSession[0].secretToken,
      status: newSession[0].status,
      createdAt: newSession[0].createdAt.toISOString(),
    };
  }
}
