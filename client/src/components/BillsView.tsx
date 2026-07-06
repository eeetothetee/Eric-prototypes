import { formatMoney, ordinal } from "../api";
import type { Bill, Member } from "../types";
import { CategoryIcon, ListIcon } from "./icons";

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
    if (b.payer_member_id == null) return "Either";
    return members.find((m) => m.id === b.payer_member_id)?.name ?? "\u2014";
  };

  const splitLabel = (b: Bill) => {
    if (b.split_type === "payer") return "payer covers";
    if (b.split_type === "custom") return `${b.split_pct}/${100 - b.split_pct}`;
    return "50/50";
  };

  return (
    <div className="screen">
      <div className="settle-card">
        <h3>Recurring total</h3>
        <div className="big-figure num">
          {formatMoney(monthlyTotal)} <span className="unit">/ month</span>
        </div>
        <div className="big-figure-sub">
          {bills.length} recurring {bills.length === 1 ? "bill" : "bills"}
        </div>
      </div>

      {bills.length === 0 && (
        <div className="empty">
          <div className="big">
            <ListIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>No recurring bills</strong>
          </p>
          <p>Add the bills you and your partner pay every month.</p>
          <button className="btn primary" style={{ marginTop: 16 }} onClick={onAdd}>
            Add a bill
          </button>
        </div>
      )}

      {[...byCategory.entries()].map(([category, catBills]) => (
        <div key={category} className="bill-group">
          <div className="section-title">{category}</div>
          <div className="rows">
            {catBills.map((b) => (
              <button key={b.id} className="bill-card" onClick={() => onEdit(b)}>
                <span className="icon">
                  <CategoryIcon category={b.category} width={18} height={18} />
                </span>
                <span className="bill-main">
                  <span className="name">{b.name}</span>
                  <span className="meta">
                    <span>
                      Due {ordinal(b.due_day)} · {payerLabel(b)} · {splitLabel(b)}
                    </span>
                    {b.autopay === 1 && <span className="pill autopay">Auto</span>}
                  </span>
                </span>
                <span className="bill-right">
                  <span className="amount num">{formatMoney(b.amount_cents)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
