import { DealStatus } from "./types";

const allowed = new Set<string>([
  "INITIATED->FUNDED",
  "FUNDED->RELEASED",
  "FUNDED->DISPUTED",
  "DISPUTED->RELEASED",
  "DISPUTED->REFUNDED"
]);

export function isTransitionAllowed(from: DealStatus, to: DealStatus): boolean {
  if (from === to) return true;
  return allowed.has(`${from}->${to}`);
}
