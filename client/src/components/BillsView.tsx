import { formatMoney, ordinal } from "../api";
import type { Bill, Member } from "../types";
import { CATEGORY_ICONS } from "../types";

interface Props {
  bills: Bill[];
  members: Member[];
  onEdit: (bill: Bill) => void;
  onAdd: () => void;
}

export default function BillsView({ bills, members, onEdit, onAdd }: Props) {
  const monthlyTotal = bills.reduce((s, b) => s + b.amount_cents, 0);

  const byCategory = new Map<string, Bill[]>();
  for (const b of bills) {
    if (!byCategory.has(b.category)) byCategory.set(b.category, []);
    byCategory.get(b.category)!.push(b);
  }

  const payerLabel = (b: Bill) => {
    if (b.payer_member_id == null) return "Either partner";
    return members.find((m) => m.id === b.payer_member_id)?.name ?? "—";
  };

  const splitLabel = (b: Bill) => {
    if (b.split_type === "payer") return "payer covers";
    if (b.split_type === "custom") return `${b.split_pct}/${100 - b.split_pct} split`;
    return "50/50 split";
  };

  return (
    <div className="screen">
      <div className="settle-card">
        <h3>Recurring total</h3>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
          {formatMoney(monthlyTotal)}
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-soft)" }}> / month</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
          {bills.length} recurring {bills.length === 1 ? "bill" : "bills"}
        </div>
      </div>

      {bills.length === 0 && (
        <div className="empty">
          <div className="big">🧾</div>
          <p>
            <strong>No recurring bills</strong>
          </p>
          <p>Add the bills you and your partner pay every month.</p>
          <button className="btn primary" style={{ marginTop: 14 }} onClick={onAdd}>
            Add a bill
          </button>
        </div>
      )}

      {[...byCategory.entries()].map(([category, catBills]) => (
        <div key={category} className="bill-group">
          <div className="section-title">
            {CATEGORY_ICONS[category] || "📌"} {category}
          </div>
          {catBills.map((b) => (
            <button key={b.id} className="bill-card" onClick={() => onEdit(b)}>
              <span className="icon">{CATEGORY_ICONS[b.category] || "📌"}</span>
              <span className="bill-main">
                <span className="name">{b.name}</span>
                <span className="meta">
                  <span>
                    Due {ordinal(b.due_day)} · {payerLabel(b)} · {splitLabel(b)}
                  </span>
                  {b.autopay === 1 && <span className="pill autopay">Autopay</span>}
                </span>
              </span>
              <span className="bill-right">
                <span className="amount">{formatMoney(b.amount_cents)}</span>
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
