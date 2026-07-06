export interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

export interface Bill {
  id: number;
  name: string;
  category: string;
  amount_cents: number;
  due_day: number;
  payer_member_id: number | null;
  split_type: "shared" | "payer" | "custom";
  split_pct: number;
  autopay: number;
  notes: string;
  active: number;
}

export interface Payment {
  id: number;
  bill_id: number;
  month: string;
  amount_cents: number;
  paid_by_member_id: number | null;
  paid_at: string;
}

export interface MonthItem {
  bill: Bill;
  payment: Payment | null;
}

export interface MonthData {
  month: string;
  items: MonthItem[];
  summary: { totalCents: number; paidCents: number; dueCents: number };
  members: Member[];
  contribution: Record<number, number>;
  fairShare: Record<number, number>;
}

export interface Household {
  householdName: string;
  members: Member[];
}

export interface HistoryRow {
  month: string;
  paid_cents: number;
  paid_count: number;
}

export const CATEGORIES = [
  "Housing",
  "Utilities",
  "Internet & Phone",
  "Insurance",
  "Subscriptions",
  "Transportation",
  "Debt & Loans",
  "Childcare",
  "Health",
  "Other",
] as const;
