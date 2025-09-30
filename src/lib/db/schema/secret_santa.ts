import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sessionTable = pgTable("sessions", {
  sessionId: varchar("session_id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  secretToken: varchar("secret_token", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
