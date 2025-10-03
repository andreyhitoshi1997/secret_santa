import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  creatorEmail: varchar("creator_email", { length: 255 }).notNull(),
  secretToken: varchar("secret_token", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
