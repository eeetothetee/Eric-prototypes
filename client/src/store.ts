import { IS_STATIC } from "./api";

// ------------------------------------------------------------------
// Extended household data: accounts, transactions, budgets, goals.
// In static mode this lives in localStorage; in server mode it is
// persisted as a JSON document via /api/appdata.
// ------------------------------------------------------------------

export type AccountType = "checking" | "savings" | "credit" | "loan" | "cash";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance_cents: number; // for credit/loan this is the amount owed
  owner_member_id: number | null; // null = joint
}

export type TxnKind = "expense" | "income";

export interface Txn {
  id: number;
  date: string; // YYYY-MM-DD
  merchant: string;
  category: string;
  kind: TxnKind;
  amount_cents: number; // always positive; kind gives the sign
  account_id: number | null;
  member_id: number | null; // who spent/received
  notes: string;
}

export interface Goal {
  id: number;
  name: string;
  target_cents: number;
  saved_cents: number;
  target_date: string | null; // YYYY-MM
}

export interface ExtData {
  accounts: Account[];
  txns: Txn[];
  budgets: Record<string, number>; // category -> monthly limit in cents
  goals: Goal[];
  seq: number;
}

export const ACCOUNT_TYPES: { value: AccountType; label: string; liability: boolean }[] = [
  { value: "checking", label: "Checking", liability: false },
  { value: "savings", label: "Savings", liability: false },
  { value: "cash", label: "Cash", liability: false },
  { value: "credit", label: "Credit card", liability: true },
  { value: "loan", label: "Loan", liability: true },
];

export const TXN_CATEGORIES = [
  "Groceries",
  "Dining",
  "Shopping",
  "Entertainment",
  "Transportation",
  "Health",
  "Kids",
  "Travel",
  "Home",
  "Income",
  "Other",
] as const;

export const BUDGET_CATEGORIES = TXN_CATEGORIES.filter((c) => c !== "Income");

const EMPTY: ExtData = { accounts: [], txns: [], budgets: {}, goals: [], seq: 100 };
const LS_KEY = "family-bills:ext:v1";

function normalize(raw: unknown): ExtData {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<ExtData>;
  return {
    accounts: Array.isArray(d.accounts) ? d.accounts : [],
    txns: Array.isArray(d.txns) ? d.txns : [],
    budgets: d.budgets && typeof d.budgets === "object" ? d.budgets : {},
    goals: Array.isArray(d.goals) ? d.goals : [],
    seq: typeof d.seq === "number" ? d.seq : 100,
  };
}

export async function loadExt(): Promise<ExtData> {
  if (IS_STATIC) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? normalize(JSON.parse(raw)) : { ...EMPTY };
    } catch {
      return { ...EMPTY };
    }
  }
  const res = await fetch("/api/appdata");
  if (!res.ok) throw new Error("Failed to load data");
  return normalize(await res.json());
}

export async function saveExt(data: ExtData): Promise<void> {
  if (IS_STATIC) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    return;
  }
  const res = await fetch("/api/appdata", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save data");
}

export function nextExtId(data: ExtData): number {
  data.seq += 1;
  return data.seq;
}

// ---------- Derived figures ----------

export function isLiability(type: AccountType): boolean {
  return type === "credit" || type === "loan";
}

export function netWorthCents(accounts: Account[]): number {
  return accounts.reduce(
    (s, a) => s + (isLiability(a.type) ? -a.balance_cents : a.balance_cents),
    0
  );
}

export function txnMonth(t: Txn): string {
  return t.date.slice(0, 7);
}

export interface CashFlowMonth {
  month: string;
  income_cents: number;
  expense_cents: number;
}

export function cashFlowByMonth(txns: Txn[], months: string[]): CashFlowMonth[] {
  const map = new Map<string, CashFlowMonth>(
    months.map((m) => [m, { month: m, income_cents: 0, expense_cents: 0 }])
  );
  for (const t of txns) {
    const row = map.get(txnMonth(t));
    if (!row) continue;
    if (t.kind === "income") row.income_cents += t.amount_cents;
    else row.expense_cents += t.amount_cents;
  }
  return months.map((m) => map.get(m)!);
}

/** Spend per category for a month (expenses only). */
export function spendByCategory(txns: Txn[], month: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of txns) {
    if (t.kind !== "expense" || txnMonth(t) !== month) continue;
    out.set(t.category, (out.get(t.category) || 0) + t.amount_cents);
  }
  return out;
}

export function lastMonths(n: number, from?: string): string[] {
  const [y, m] = (from ?? new Date().toISOString().slice(0, 7)).split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
