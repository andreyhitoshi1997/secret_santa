import { eq } from "drizzle-orm";
import { db } from "../database/client";
import { sessions } from "../database/schema/sessions";
import { Session, SessionInsert, SessionUpdate } from "./model";

export namespace SessionRepository {
  export const insertSession = async (sessionInsert: SessionInsert) => {
    const [result] = await db
      .insert(sessions)
      .values(sessionInsert)
      .returning();

    const session: Session = result as Session;

    return session;
  };

  export const queryById = async (id: string) => {
    const result = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });

    if (!result) {
      return null;
    }

    const session: Session = result as Session;

    return session;
  };

  export const queryBySecretToken = async (secretToken: string) => {
    const result = await db.query.sessions.findFirst({
      where: eq(sessions.secretToken, secretToken),
    });

    if (!result) {
      return null;
    }

    const session: Session = result as Session;

    return session;
  };

  export const queryByCreatorEmail = async (creatorEmail: string) => {
    const results = await db.query.sessions.findMany({
      where: eq(sessions.creatorEmail, creatorEmail),
    });

    const sessionList: Session[] = results as Session[];

    return sessionList;
  };

  export const update = async (id: string, sessionUpdate: SessionUpdate) => {
    const [result] = await db
      .update(sessions)
      .set({
        ...sessionUpdate,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();

    if (!result) {
      return null;
    }

    const session: Session = result as Session;

    return session;
  };

  export const deleteById = async (id: string) => {
    const [result] = await db
      .delete(sessions)
      .where(eq(sessions.id, id))
      .returning();

    if (!result) {
      return null;
    }

    const session: Session = result as Session;

    return session;
  };
}
