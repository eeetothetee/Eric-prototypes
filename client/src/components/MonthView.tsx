import { currentMonth, formatMoney, monthLabel, ordinal, shiftMonth } from "../api";
import type { Bill, MonthData, MonthItem } from "../types";
import { CATEGORY_ICONS } from "../types";

interface Props {
  data: MonthData;
  month: string;
  onMonthChange: (m: string) => void;
  onTogglePaid: (bill: Bill) => void;
  onEditBill: (bill: Bill) => void;
  onAddBill: () => void;
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="#7ee0b8"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="pct">{Math.round(pct * 100)}%</div>
    </div>
  );
}

function SettleUp({ data }: { data: MonthData }) {
  const { members, contribution, fairShare } = data;
  if (members.length !== 2) return null;
  const total = Object.values(contribution).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const [m1, m2] = members;
  // Positive balance = paid more than their fair share.
  const balance1 = (contribution[m1.id] || 0) - (fairShare[m1.id] || 0);
  const owes = balance1 > 0 ? m2 : m1;
  const owed = balance1 > 0 ? m1 : m2;
  const amount = Math.abs(balance1);

  return (
    <div className="settle-card">
      <h3>Who paid what</h3>
      <div className="settle-body">
        {members.map((m) => {
          const paid = contribution[m.id] || 0;
          const w = total > 0 ? Math.max(4, (paid / total) * 100) : 0;
          return (
            <div key={m.id} className="settle-row">
              <div className="avatar" style={{ background: m.color, width: 30, height: 30, fontSize: 14, border: "none" }}>
                {m.emoji}
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${w}%`, background: m.color }} />
              </div>
              <div className="amt">{formatMoney(paid)}</div>
            </div>
          );
        })}
      </div>
      {amount >= 100 ? (
        <div className="settle-verdict">
          {owes.name} owes {owed.name} {formatMoney(amount)} to settle up
        </div>
      ) : (
        <div className="settle-verdict even">You're all settled up 🎉</div>
      )}
    </div>
  );
}

function BillRow({
  item,
  isPastDue,
  memberName,
  onToggle,
  onEdit,
}: {
  item: MonthItem;
  isPastDue: boolean;
  memberName: (id: number | null) => string | null;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { bill, payment } = item;
  const paid = !!payment;
  const paidBy = payment ? memberName(payment.paid_by_member_id) : null;
  return (
    <div className={`bill-card ${paid ? "paid" : isPastDue ? "overdue" : ""}`}>
      <button className="icon" onClick={onEdit} aria-label={`Edit ${bill.name}`}>
        {CATEGORY_ICONS[bill.category] || "📌"}
      </button>
      <button className="bill-main" onClick={onEdit}>
        <div className="name">{bill.name}</div>
        <div className="meta">
          <span>Due {ordinal(bill.due_day)}</span>
          {bill.autopay === 1 && <span className="pill autopay">Autopay</span>}
          {!paid && isPastDue && <span className="pill overdue">Overdue</span>}
          {paid && paidBy && <span className="pill paid-by">Paid by {paidBy}</span>}
        </div>
      </button>
      <div className="bill-right">
        <div className="amount">{formatMoney(payment ? payment.amount_cents : bill.amount_cents)}</div>
        <button
          className={`paycheck ${paid ? "done" : ""}`}
          onClick={onToggle}
          aria-label={paid ? "Mark unpaid" : "Mark paid"}
        >
          ✓
        </button>
      </div>
    </div>
  );
}

export default function MonthView({ data, month, onMonthChange, onTogglePaid, onEditBill, onAddBill }: Props) {
  const { items, summary, members } = data;
  const pct = summary.totalCents > 0 ? summary.paidCents / summary.totalCents : 0;

  const now = new Date();
  const isCurrentMonth = month === currentMonth();
  const isPastMonth = month < currentMonth();
  const today = now.getDate();

  const memberName = (id: number | null) => members.find((m) => m.id === id)?.name ?? null;

  const unpaid = items.filter((it) => !it.payment);
  const paidItems = items.filter((it) => it.payment);
  const overdue = unpaid.filter((it) => isPastMonth || (isCurrentMonth && it.bill.due_day < today));
  const upcoming = unpaid.filter((it) => !overdue.includes(it));

  return (
    <div className="screen">
      <div className="month-switcher">
        <button onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Previous month">
          ‹
        </button>
        <span className="label">{monthLabel(month)}</span>
        <button onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="summary-card">
        <ProgressRing pct={pct} />
        <div className="summary-figures">
          <div className="row">
            <span>Total bills</span>
            <strong>{formatMoney(summary.totalCents)}</strong>
          </div>
          <div className="row">
            <span>Paid</span>
            <strong>{formatMoney(summary.paidCents)}</strong>
          </div>
          <div className="row due">
            <span>Remaining</span>
            <strong>{formatMoney(Math.max(0, summary.dueCents))}</strong>
          </div>
        </div>
      </div>

      <SettleUp data={data} />

      {items.length === 0 && (
        <div className="empty">
          <div className="big">🧾</div>
          <p>
            <strong>No bills yet</strong>
          </p>
          <p>Add your rent, utilities, and subscriptions to start tracking together.</p>
          <button className="btn primary" style={{ marginTop: 14 }} onClick={onAddBill}>
            Add your first bill
          </button>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="bill-group">
          <div className="section-title">Overdue</div>
          {overdue.map((it) => (
            <BillRow
              key={it.bill.id}
              item={it}
              isPastDue
              memberName={memberName}
              onToggle={() => onTogglePaid(it.bill)}
              onEdit={() => onEditBill(it.bill)}
            />
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="bill-group">
          <div className="section-title">Upcoming</div>
          {upcoming.map((it) => (
            <BillRow
              key={it.bill.id}
              item={it}
              isPastDue={false}
              memberName={memberName}
              onToggle={() => onTogglePaid(it.bill)}
              onEdit={() => onEditBill(it.bill)}
            />
          ))}
        </div>
      )}

      {paidItems.length > 0 && (
        <div className="bill-group">
          <div className="section-title">Paid</div>
          {paidItems.map((it) => (
            <BillRow
              key={it.bill.id}
              item={it}
              isPastDue={false}
              memberName={memberName}
              onToggle={() => onTogglePaid(it.bill)}
              onEdit={() => onEditBill(it.bill)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
