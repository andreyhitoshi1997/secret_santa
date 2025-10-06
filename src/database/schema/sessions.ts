import { SessionStatus } from "@/modules/session/sessionStatus";
import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const sessionStatusEnum = pgEnum("SessionStatus", [
  SessionStatus.OPEN,
  SessionStatus.CLOSED,
  SessionStatus.LOCKED,
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  creatorEmail: varchar("creator_email", { length: 255 }).notNull(),
  secretToken: uuid("secret_token").notNull().unique().defaultRandom(),
  status: sessionStatusEnum("status").notNull().default(SessionStatus.OPEN),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});
