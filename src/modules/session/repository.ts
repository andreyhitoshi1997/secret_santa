import { eq } from "drizzle-orm";
import { db } from "../../database/client";
import { sessions } from "../../database/schema/sessions";
import { Session, SessionInsert, SessionUpdate } from "./model";
import { SessionStatus } from "@/modules/session/sessionStatus";

export namespace SessionRepository {
  export const insertSession = async (sessionInsert: SessionInsert) => {
    try {
      const [result] = await db
        .insert(sessions)
        .values({
          ...sessionInsert,
          status: sessionInsert.status
            ? SessionStatus[sessionInsert.status as keyof typeof SessionStatus]
            : undefined,
        })
        .returning();

      const session: Session = result as Session;

      return session;
    } catch (error) {
      console.error("Error inserting session:", error);
      throw error;
    }
  };

  export const queryById = async (id: string) => {
    try {
      const result = await db.query.sessions.findFirst({
        where: eq(sessions.id, id),
      });

      if (!result) {
        return null;
      }

      const session: Session = result as Session;

      return session;
    } catch (error) {
      console.error("Error querying session by id:", error);
      throw error;
    }
  };

  export const queryBySecretToken = async (secretToken: string) => {
    try {
      const result = await db.query.sessions.findFirst({
        where: eq(sessions.secretToken, secretToken),
      });

      if (!result) {
        return null;
      }

      const session: Session = result as Session;

      return session;
    } catch (error) {
      console.error("Error querying session by secret token:", error);
      throw error;
    }
  };

  export const queryByCreatorEmail = async (creatorEmail: string) => {
    try {
      const results = await db.query.sessions.findMany({
        where: eq(sessions.creatorEmail, creatorEmail),
      });

      const sessionList: Session[] = results as Session[];

      return sessionList;
    } catch (error) {
      console.error("Error querying sessions by creator email:", error);
      throw error;
    }
  };

  export const update = async (id: string, sessionUpdate: SessionUpdate) => {
    try {
      const [result] = await db
        .update(sessions)
        .set({
          ...sessionUpdate,
          status: sessionUpdate.status
            ? SessionStatus[sessionUpdate.status as keyof typeof SessionStatus]
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, id))
        .returning();

      if (!result) {
        return null;
      }

      const session: Session = result as Session;

      return session;
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  };

  export const closeSession = async (id: string) => {
    try {
      const [result] = await db
        .update(sessions)
        .set({
          status: SessionStatus.ClOSED,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, id))
        .returning();

      if (!result) {
        return null;
      }

      const session: Session = result as Session;

      return session;
    } catch (error) {
      console.error("Error closing session:", error);
      throw error;
    }
  };
}
