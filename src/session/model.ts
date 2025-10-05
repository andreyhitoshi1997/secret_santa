import { z } from "zod";

export const SessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  creatorEmail: z.string().email(),
  secretToken: z.string().uuid(),
  status: z.enum(["open", "closed", "completed"]).default("open"),
  createdAt: z.date(),
  updatedAt: z.date(),
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
