import { z } from "zod";
import { SessionStatus } from "./sessionStatus";

export const SessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  creatorEmail: z.string().email(),
  secretToken: z.string().uuid(),
  status: z.nativeEnum(SessionStatus).default(SessionStatus.OPEN),
  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().nullable(),
});

export type Session = z.infer<typeof SessionSchema>;

export const SessionInsertSchema = SessionSchema.omit({
  id: true,
  secretToken: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  status: true,
});

export type SessionInsert = z.infer<typeof SessionInsertSchema>;

export const SessionUpdateSchema = SessionSchema.omit({
  id: true,
  creatorEmail: true,
  secretToken: true,
  createdAt: true,
}).partial();

export type SessionUpdate = z.infer<typeof SessionUpdateSchema>;

export interface Assignment {
  giverId: string;
  receiverId: string;
}

export interface LockSessionResponse {
  status: SessionStatus;
  participantCount: number;
  emailsSent: number;
  lockedAt: string;
}

export class SessionBusinessLogic {
  static generateAssignments(participantIds: string[]): Assignment[] {
    if (participantIds.length < 3) {
      throw new Error(
        "Minimum 3 participants required to generate valid assignments"
      );
    }

    const shuffled = [...participantIds];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const assignments: Assignment[] = [];
    for (let i = 0; i < shuffled.length; i++) {
      const giverId = shuffled[i];
      const receiverId = shuffled[(i + 1) % shuffled.length];

      assignments.push({
        giverId,
        receiverId,
      });
    }

    return assignments;
  }

  static validateAssignments(
    assignments: Assignment[],
    participantIds: string[]
  ): boolean {
    const givers = new Set(assignments.map((a) => a.giverId));
    if (givers.size !== participantIds.length) {
      return false;
    }

    const receivers = new Set(assignments.map((a) => a.receiverId));
    if (receivers.size !== participantIds.length) {
      return false;
    }

    for (const id of participantIds) {
      if (!givers.has(id) || !receivers.has(id)) {
        return false;
      }
    }

    for (const assignment of assignments) {
      if (assignment.giverId === assignment.receiverId) {
        return false;
      }
    }

    return true;
  }
}
