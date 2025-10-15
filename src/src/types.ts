export enum DealStatus {
  INITIATED = "INITIATED",
  FUNDED = "FUNDED",
  RELEASED = "RELEASED",
  DISPUTED = "DISPUTED",
  REFUNDED = "REFUNDED"
}
export type Deal = {
  id: string;
  buyer: string;
  seller: string;
  amount: bigint;
  status: DealStatus;
};
