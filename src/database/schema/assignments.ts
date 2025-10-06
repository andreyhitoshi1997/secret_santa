import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";
import { participants } from "./participants";

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  giverId: uuid("giver_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
