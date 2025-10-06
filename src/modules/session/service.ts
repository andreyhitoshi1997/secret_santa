import { db } from "@/database/client";
import { sessions } from "@/database/schema/sessions";
import { participants } from "@/database/schema/participants";
import { assignments } from "@/database/schema/assignments";
import { eq, count } from "drizzle-orm";
import { SessionStatus } from "./sessionStatus";
import { SessionBusinessLogic, LockSessionResponse, Assignment } from "./model";
import { EmailService, AssignmentEmail } from "../email/service";

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

  async lockSession(sessionId: string): Promise<LockSessionResponse> {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      if (session[0].status === SessionStatus.LOCKED) {
        throw new Error("Session is already locked");
      }

      if (session[0].status === SessionStatus.CLOSED) {
        throw new Error("Cannot lock a closed session");
      }

      const sessionParticipants = await db
        .select({
          id: participants.id,
          email: participants.email,
          name: participants.name,
        })
        .from(participants)
        .where(eq(participants.sessionId, sessionId));

      if (sessionParticipants.length < 3) {
        throw new Error("Minimum 3 participants required to lock session");
      }

      const participantIds = sessionParticipants.map((p) => p.id);
      const generatedAssignments =
        SessionBusinessLogic.generateAssignments(participantIds);

      if (
        !SessionBusinessLogic.validateAssignments(
          generatedAssignments,
          participantIds
        )
      ) {
        throw new Error("Failed to generate valid assignments");
      }

      const now = new Date();

      const result = await db.transaction(async (tx) => {
        const updatedSession = await tx
          .update(sessions)
          .set({
            status: SessionStatus.LOCKED,
            updatedAt: now,
          })
          .where(eq(sessions.id, sessionId))
          .returning({
            status: sessions.status,
          });

        if (updatedSession.length === 0) {
          throw new Error("Failed to lock session");
        }

        const assignmentInserts = generatedAssignments.map((assignment) => ({
          sessionId,
          giverId: assignment.giverId,
          receiverId: assignment.receiverId,
        }));

        await tx.insert(assignments).values(assignmentInserts);

        return updatedSession[0];
      });

      const emailService = new EmailService();
      const emailData: AssignmentEmail[] = [];

      for (const assignment of generatedAssignments) {
        const giver = sessionParticipants.find(
          (p) => p.id === assignment.giverId
        );
        const receiver = sessionParticipants.find(
          (p) => p.id === assignment.receiverId
        );

        if (giver && receiver) {
          emailData.push({
            participantName: giver.name || giver.email,
            participantEmail: giver.email,
            sessionName: session[0].name || `Secret Santa Session`,
            giftRecipientName: receiver.name || receiver.email,
            giftRecipientEmail: receiver.email,
          });
        }
      }

      const emailResults = await emailService.sendMultipleAssignmentEmails(
        emailData
      );

      return {
        status: result.status,
        participantCount: sessionParticipants.length,
        emailsSent: emailResults.sent,
        lockedAt: now.toISOString(),
      };
    } catch (error) {
      console.error("Erro ao trancar sessão:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro interno do servidor ao trancar sessão");
    }
  }
}
