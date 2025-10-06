import { db } from "@/database/client";
import { sessions } from "@/database/schema/sessions";
import { eq } from "drizzle-orm";
import { SessionStatus } from "./sessionStatus";

export class managementSession {
  constructor() {}

  async createSession(request: { creatorEmail: string; sessionName?: string }) {
    try {
      if (!request.creatorEmail || !request.sessionName) {
        throw new Error("Digite corretamente os dados informados");
      }

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

      if (!newSession || newSession.length === 0) {
        throw new Error("Falha ao criar a sessão");
      }

      return {
        sessionId: newSession[0].sessionId,
        secretToken: newSession[0].secretToken,
        status: newSession[0].status,
        createdAt: newSession[0].createdAt.toISOString(),
      };
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro interno do servidor ao criar sessão");
    }
  }

  async closeSession(sessionId: string) {
    try {
      if (!sessionId) {
        throw new Error("Digite corretamente a sessão");
      }

      const now = new Date();
      const updatedSession = await db
        .update(sessions)
        .set({
          status: SessionStatus.CLOSED,
          updatedAt: now,
          closedAt: now,
        })
        .where(eq(sessions.id, sessionId))
        .returning({
          status: sessions.status,
          closedAt: sessions.closedAt,
        });

      if (updatedSession.length === 0) {
        throw new Error("Session not found");
      }

      return {
        status: updatedSession[0].status,
        closedAt:
          updatedSession[0].closedAt?.toISOString() || now.toISOString(),
      };
    } catch (error) {
      console.error("Erro ao fechar sessão:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro interno do servidor ao fechar sessão");
    }
  }
}
