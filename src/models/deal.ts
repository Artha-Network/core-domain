import { z } from "zod";

/** Deal model schema */
export const DealSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string(),
  sellerId: z.string(),
  buyerWallet: z.string().optional(),
  sellerWallet: z.string().optional(),
  priceUsd: z.number(),
  status: z.string(),
  onchainAddress: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Deal = z.infer<typeof DealSchema>;
