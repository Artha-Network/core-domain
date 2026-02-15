import { z } from "zod";

export enum MilestoneStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  amountCents: z.number().int().positive(),
  status: z.nativeEnum(MilestoneStatus),
  order: z.number().int()
});

export type Milestone = z.infer<typeof MilestoneSchema>;

/**
 * Validates that a set of milestones is mathematically sound.
 */
export function validateMilestoneSet(
  milestones: Milestone[], 
  totalDealValue: number
): boolean {
  // 1. Check Total Value
  const sum = milestones.reduce((acc, m) => acc + m.amountCents, 0);
  if (sum !== totalDealValue) return false;

  // 2. Check Sequence (Must start at order 0, no gaps)
  const sorted = [...milestones].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].order !== i + 1) return false;
  }

  return true;
}

/**
 * Determines if a specific milestone can be activated.
 * Rule: You cannot start Milestone 2 until Milestone 1 is Approved.
 */
export function canActivateMilestone(
  targetMilestone: Milestone, 
  allMilestones: Milestone[]
): boolean {
  if (targetMilestone.order === 1) return true; // First one is always startable

  const previous = allMilestones.find(m => m.order === targetMilestone.order - 1);
  return previous?.status === MilestoneStatus.APPROVED;
}
