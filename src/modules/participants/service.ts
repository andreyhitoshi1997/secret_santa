import { db } from "@/database/client";
import { sessions } from "@/database/schema/sessions";
import { participants } from "@/database/schema/participants";
import { eq, and, inArray } from "drizzle-orm";
import { SessionStatus } from "@/modules/session/sessionStatus";
import {
  AddParticipantsRequest,
  AddParticipantsResponse,
  ParticipantInsert,
} from "./model";

export class ParticipantsService {
  constructor() {}

  async addParticipants(
    sessionId: string,
    request: AddParticipantsRequest
  ): Promise<AddParticipantsResponse> {
    const session = await db
      .select({
        id: sessions.id,
        status: sessions.status,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      throw new Error("Session not found");
    }

    console.log("Debug - Session status from DB:", session[0].status);
    console.log("Debug - Expected status:", SessionStatus.OPEN);
    console.log(
      "Debug - Status comparison:",
      session[0].status === SessionStatus.OPEN
    );

    if (session[0].status !== SessionStatus.OPEN) {
      throw new Error(
        `Cannot add participants to session with status: ${session[0].status}`
      );
    }

    const existingParticipants = await db
      .select({ email: participants.email })
      .from(participants)
      .where(eq(participants.sessionId, sessionId));

    const existingEmails = new Set(
      existingParticipants.map((p) => p.email.toLowerCase())
    );

    const participantsToAdd: ParticipantInsert[] = [];
    const duplicatesIgnored: string[] = [];

    for (const participantData of request.participants) {
      const emailLower = participantData.email.toLowerCase();

      if (existingEmails.has(emailLower)) {
        duplicatesIgnored.push(participantData.email);
      } else {
        participantsToAdd.push({
          sessionId,
          email: participantData.email,
          name: participantData.name || null,
          isCreator: false,
        });
        existingEmails.add(emailLower);
      }
    }

    let addedCount = 0;
    if (participantsToAdd.length > 0) {
      await db.insert(participants).values(participantsToAdd);
      addedCount = participantsToAdd.length;
    }

    const totalParticipantsResult = await db
      .select({ count: participants.id })
      .from(participants)
      .where(eq(participants.sessionId, sessionId));

    const totalParticipants = totalParticipantsResult.length;

    return {
      added: addedCount,
      totalParticipants,
      duplicatesIgnored,
    };
  }

  async getParticipants(sessionId: string) {
    return await db
      .select({
        id: participants.id,
        email: participants.email,
        name: participants.name,
        isCreator: participants.isCreator,
        createdAt: participants.createdAt,
      })
      .from(participants)
      .where(eq(participants.sessionId, sessionId))
      .orderBy(participants.createdAt);
  }
}
