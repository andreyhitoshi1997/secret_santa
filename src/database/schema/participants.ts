import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { sessions } from "./sessions";

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  isCreator: boolean("is_creator").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
