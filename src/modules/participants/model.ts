import { z } from "zod";

export const ParticipantSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  isCreator: z.boolean().default(false),
  createdAt: z.date(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const ParticipantInsertSchema = ParticipantSchema.omit({
  id: true,
  createdAt: true,
}).partial({
  isCreator: true,
});

export type ParticipantInsert = z.infer<typeof ParticipantInsertSchema>;

// Schema for individual participant in the request
export const AddParticipantItemSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().optional(),
});

export type AddParticipantItem = z.infer<typeof AddParticipantItemSchema>;

// Schema for the request body
export const AddParticipantsRequestSchema = z.object({
  participants: z
    .array(AddParticipantItemSchema)
    .min(1, "At least one participant is required")
    .max(50, "Maximum 50 participants can be added at once"),
});

export type AddParticipantsRequest = z.infer<
  typeof AddParticipantsRequestSchema
>;

// Schema for the response
export const AddParticipantsResponseSchema = z.object({
  added: z.number().min(0),
  totalParticipants: z.number().min(0),
  duplicatesIgnored: z.array(z.string().email()),
});

export type AddParticipantsResponse = z.infer<
  typeof AddParticipantsResponseSchema
>;
