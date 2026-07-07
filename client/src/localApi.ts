import type { BillInput } from "./api";
import type { Bill, Household, HistoryRow, Member, MonthData, Payment } from "./types";

// A fully client-side implementation of the same API surface as the server,
// backed by localStorage. Used for the static (GitHub Pages) build where there
// is no backend. Data lives on the device/browser.

const STORAGE_KEY = "family-bills:v1";
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

interface Store {
  householdName: string;
  members: Member[];
  bills: Bill[];
  payments: Payment[];
  seq: number;
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function seed(): Store {
  return {
    householdName: "Our Household",
    members: [
      { id: 1, name: "Partner 1", emoji: "🧑", color: "#1c1c1a" },
      { id: 2, name: "Partner 2", emoji: "🧑", color: "#0f766e" },
    ],
    bills: [],
    payments: [],
    seq: 2,
  };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      save(fresh);
      return fresh;
    }
    return JSON.parse(raw) as Store;
  } catch {
    const fresh = seed();
    save(fresh);
    return fresh;
  }
}

function save(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function nextId(store: Store): number {
  store.seq += 1;
  return store.seq;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function computeMonth(store: Store, month: string): MonthData {
  const activeBills = store.bills
    .filter((b) => b.active === 1)
    .sort((a, b) => a.due_day - b.due_day || a.name.localeCompare(b.name));
  const payments = store.payments.filter((p) => p.month === month);
  const paymentsByBill = new Map(payments.map((p) => [p.bill_id, p]));

  const paidInactiveBills = store.bills
    .filter((b) => b.active === 0 && paymentsByBill.has(b.id))
    .sort((a, b) => a.due_day - b.due_day || a.name.localeCompare(b.name));

  const allBills = [...activeBills, ...paidInactiveBills];
  const items = allBills.map((b) => ({ bill: b, payment: paymentsByBill.get(b.id) || null }));

  const paidCents = items.reduce((s, it) => s + (it.payment ? it.payment.amount_cents : 0), 0);
  const dueCents = items.reduce((s, it) => s + (it.payment ? 0 : it.bill.amount_cents), 0);
  const totalCents = paidCents + dueCents;

  const members = [...store.members].sort((a, b) => a.id - b.id);
  const contribution: Record<number, number> = Object.fromEntries(members.map((m) => [m.id, 0]));
  const fairShare: Record<number, number> = Object.fromEntries(members.map((m) => [m.id, 0]));

  for (const it of items) {
    const p = it.payment;
    if (p && p.paid_by_member_id != null && contribution[p.paid_by_member_id] !== undefined) {
      contribution[p.paid_by_member_id] += p.amount_cents;
    }
    if (!p) continue;
    const b = it.bill;
    if (members.length === 2) {
      const [m1, m2] = members;
      if (b.split_type === "payer") {
        const payer = b.payer_member_id ?? p.paid_by_member_id;
        if (payer != null && fairShare[payer] !== undefined) fairShare[payer] += p.amount_cents;
      } else if (b.split_type === "custom") {
        const first = Math.round((p.amount_cents * b.split_pct) / 100);
        fairShare[m1.id] += first;
        fairShare[m2.id] += p.amount_cents - first;
      } else {
        const half = Math.round(p.amount_cents / 2);
        fairShare[m1.id] += half;
        fairShare[m2.id] += p.amount_cents - half;
      }
    }
  }

  return {
    month,
    items,
    summary: { totalCents, paidCents, dueCents },
    members,
    contribution,
    fairShare,
  };
}

function fail(msg: string): never {
  throw new Error(msg);
}

export const localApi = {
  getHousehold: async (): Promise<Household> => {
    const s = load();
    return { householdName: s.householdName, members: [...s.members].sort((a, b) => a.id - b.id) };
  },

  updateHousehold: async (householdName: string) => {
    if (!householdName.trim()) fail("householdName is required");
    const s = load();
    s.householdName = householdName.trim();
    save(s);
    return { ok: true };
  },

  updateMember: async (id: number, data: Partial<Pick<Member, "name" | "emoji" | "color">>) => {
    const s = load();
    const m = s.members.find((x) => x.id === id);
    if (!m) fail("Member not found");
    if (typeof data.name === "string" && data.name.trim()) m.name = data.name.trim();
    if (typeof data.emoji === "string" && data.emoji) m.emoji = data.emoji;
    if (typeof data.color === "string" && data.color) m.color = data.color;
    save(s);
    return m;
  },

  getMonth: async (month: string): Promise<MonthData> => {
    if (!MONTH_RE.test(month)) fail("month must be YYYY-MM");
    return computeMonth(load(), month);
  },

  getHistory: async (): Promise<HistoryRow[]> => {
    const s = load();
    const byMonth = new Map<string, { paid_cents: number; paid_count: number }>();
    for (const p of s.payments) {
      const agg = byMonth.get(p.month) || { paid_cents: 0, paid_count: 0 };
      agg.paid_cents += p.amount_cents;
      agg.paid_count += 1;
      byMonth.set(p.month, agg);
    }
    return [...byMonth.entries()]
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  },

  createBill: async (data: BillInput): Promise<Bill> => {
    if (!data.name.trim()) fail("name is required");
    if (!Number.isInteger(data.amountCents) || data.amountCents <= 0)
      fail("amountCents must be a positive integer");
    if (!Number.isInteger(data.dueDay) || data.dueDay < 1 || data.dueDay > 31)
      fail("dueDay must be 1-31");
    const s = load();
    const bill: Bill = {
      id: nextId(s),
      name: data.name.trim(),
      category: data.category || "Other",
      amount_cents: data.amountCents,
      due_day: data.dueDay,
      payer_member_id: data.payerMemberId ?? null,
      split_type: data.splitType || "shared",
      split_pct: Number.isInteger(data.splitPct) ? data.splitPct : 50,
      autopay: data.autopay ? 1 : 0,
      notes: data.notes || "",
      active: 1,
    };
    s.bills.push(bill);
    save(s);
    return bill;
  },

  updateBill: async (id: number, data: BillInput): Promise<Bill> => {
    const s = load();
    const bill = s.bills.find((b) => b.id === id);
    if (!bill) fail("Bill not found");
    if (!data.name.trim()) fail("name is required");
    if (!Number.isInteger(data.amountCents) || data.amountCents <= 0)
      fail("amountCents must be a positive integer");
    if (!Number.isInteger(data.dueDay) || data.dueDay < 1 || data.dueDay > 31)
      fail("dueDay must be 1-31");
    bill.name = data.name.trim();
    bill.category = data.category || "Other";
    bill.amount_cents = data.amountCents;
    bill.due_day = data.dueDay;
    bill.payer_member_id = data.payerMemberId ?? null;
    bill.split_type = data.splitType || "shared";
    bill.split_pct = Number.isInteger(data.splitPct) ? data.splitPct : 50;
    bill.autopay = data.autopay ? 1 : 0;
    bill.notes = data.notes || "";
    save(s);
    return bill;
  },

  deleteBill: async (id: number) => {
    const s = load();
    const bill = s.bills.find((b) => b.id === id);
    if (!bill) fail("Bill not found");
    bill.active = 0;
    save(s);
    return { ok: true };
  },

  payBill: async (
    id: number,
    data: { month: string; amountCents?: number; paidByMemberId?: number | null }
  ): Promise<Payment> => {
    const s = load();
    const bill = s.bills.find((b) => b.id === id);
    if (!bill) fail("Bill not found");
    const month = data.month || currentMonth();
    if (!MONTH_RE.test(month)) fail("month must be YYYY-MM");
    const amount = data.amountCents != null ? data.amountCents : bill.amount_cents;
    if (!Number.isInteger(amount) || amount <= 0) fail("amountCents must be a positive integer");

    let payment = s.payments.find((p) => p.bill_id === id && p.month === month);
    if (payment) {
      payment.amount_cents = amount;
      payment.paid_by_member_id = data.paidByMemberId ?? null;
      payment.paid_at = nowStamp();
    } else {
      payment = {
        id: nextId(s),
        bill_id: id,
        month,
        amount_cents: amount,
        paid_by_member_id: data.paidByMemberId ?? null,
        paid_at: nowStamp(),
      };
      s.payments.push(payment);
    }
    save(s);
    return payment;
  },

  unpayBill: async (id: number, month: string) => {
    if (!MONTH_RE.test(month)) fail("month must be YYYY-MM");
    const s = load();
    s.payments = s.payments.filter((p) => !(p.bill_id === id && p.month === month));
    save(s);
    return { ok: true };
  },
};
