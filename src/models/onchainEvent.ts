import { z } from "zod";

/** On-chain event record */
export const OnchainEventSchema = z.object({
  id: z.string().uuid(),
  dealId: z.string().uuid(),
  txSig: z.string(),
  slot: z.number(),
  instruction: z.string(),
  mint: z.string().optional(),
  amount: z.string().optional(),
  createdAt: z.string(),
});

export type OnchainEvent = z.infer<typeof OnchainEventSchema>;
