import { z } from "zod";

/** ResolveTicket model schema */
export const ResolveTicketSchema = z.object({
  id: z.string().uuid(),
  dealId: z.string(),
  finalAction: z.string(),
  rationaleCid: z.string().nullable(),
  confidence: z.number().nullable(),
  issuedAt: z.string(),
});

export type ResolveTicket = z.infer<typeof ResolveTicketSchema>;

