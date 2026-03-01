import { z } from "zod";

/** User model schema */
export const UserSchema = z.object({
  id: z.string().uuid(),
  walletAddress: z.string(),
  network: z.enum(["devnet", "testnet"]),
  lastSeenAt: z.string(),
  createdAt: z.string(),
  reputation: z.number(),
});

export type User = z.infer<typeof UserSchema>;
