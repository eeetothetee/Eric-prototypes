import type { Bill, Household, HistoryRow, Member, MonthData, Payment } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

export const api = {
  getHousehold: () => request<Household>("/api/household"),
  updateHousehold: (householdName: string) =>
    request("/api/household", { method: "PUT", body: JSON.stringify({ householdName }) }),
  updateMember: (id: number, data: Partial<Pick<Member, "name" | "emoji" | "color">>) =>
    request<Member>(`/api/members/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getMonth: (month: string) => request<MonthData>(`/api/months/${month}`),
  getHistory: () => request<HistoryRow[]>("/api/history"),

  createBill: (data: BillInput) =>
    request<Bill>("/api/bills", { method: "POST", body: JSON.stringify(data) }),
  updateBill: (id: number, data: BillInput) =>
    request<Bill>(`/api/bills/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBill: (id: number) => request(`/api/bills/${id}`, { method: "DELETE" }),

  payBill: (id: number, data: { month: string; amountCents?: number; paidByMemberId?: number | null }) =>
    request<Payment>(`/api/bills/${id}/pay`, { method: "POST", body: JSON.stringify(data) }),
  unpayBill: (id: number, month: string) =>
    request(`/api/bills/${id}/pay/${month}`, { method: "DELETE" }),
};

export interface BillInput {
  name: string;
  category: string;
  amountCents: number;
  dueDay: number;
  payerMemberId: number | null;
  splitType: "shared" | "payer" | "custom";
  splitPct: number;
  autopay: boolean;
  notes: string;
}

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
