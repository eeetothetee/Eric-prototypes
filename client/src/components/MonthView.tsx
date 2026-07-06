import { currentMonth, formatMoney, monthLabel, ordinal, shiftMonth } from "../api";
import type { Bill, MonthData, MonthItem } from "../types";
import { CategoryIcon, CheckIcon, ChevronLeft, ChevronRight, ListIcon, initials } from "./icons";

interface Props {
  data: MonthData;
  month: string;
  onMonthChange: (m: string) => void;
  onTogglePaid: (bill: Bill) => void;
  onEditBill: (bill: Bill) => void;
  onAddBill: () => void;
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="pct">
        {Math.round(pct * 100)}
        <small>%</small>
      </div>
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
          const w = total > 0 ? Math.max(2, (paid / total) * 100) : 0;
          return (
            <div key={m.id} className="settle-row">
              <div
                className="avatar"
                style={{ background: m.color, width: 28, height: 28, fontSize: 11, border: "none" }}
              >
                {initials(m.name)}
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${w}%`, background: m.color }} />
              </div>
              <div className="amt num">{formatMoney(paid)}</div>
            </div>
          );
        })}
      </div>
      {amount >= 100 ? (
        <div className="settle-verdict">
          {owes.name} owes {owed.name} {formatMoney(amount)} to settle up
        </div>
      ) : (
        <div className="settle-verdict even">Settled up — nothing owed</div>
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
        <CategoryIcon category={bill.category} width={18} height={18} />
      </button>
      <button className="bill-main" onClick={onEdit}>
        <span className="name">{bill.name}</span>
        <span className="meta">
          <span>Due {ordinal(bill.due_day)}</span>
          {bill.autopay === 1 && <span className="pill autopay">Auto</span>}
          {!paid && isPastDue && <span className="pill overdue">Overdue</span>}
          {paid && paidBy && <span className="pill paid-by">{paidBy}</span>}
        </span>
      </button>
      <div className="bill-right">
        <div className="amount num">{formatMoney(payment ? payment.amount_cents : bill.amount_cents)}</div>
        <button
          className={`paycheck ${paid ? "done" : ""}`}
          onClick={onToggle}
          aria-label={paid ? "Mark unpaid" : "Mark paid"}
        >
          <CheckIcon strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function BillGroup({
  title,
  items,
  isPastDue,
  memberName,
  onTogglePaid,
  onEditBill,
}: {
  title: string;
  items: MonthItem[];
  isPastDue: boolean;
  memberName: (id: number | null) => string | null;
  onTogglePaid: (bill: Bill) => void;
  onEditBill: (bill: Bill) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="bill-group">
      <div className="section-title">{title}</div>
      <div className="rows">
        {items.map((it) => (
          <BillRow
            key={it.bill.id}
            item={it}
            isPastDue={isPastDue}
            memberName={memberName}
            onToggle={() => onTogglePaid(it.bill)}
            onEdit={() => onEditBill(it.bill)}
          />
        ))}
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
          <ChevronLeft width={18} height={18} />
        </button>
        <span className="label">{monthLabel(month)}</span>
        <button onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Next month">
          <ChevronRight width={18} height={18} />
        </button>
      </div>

      <div className="summary-card">
        <ProgressRing pct={pct} />
        <div className="summary-figures">
          <div className="row">
            <span>Total</span>
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
          <div className="big">
            <ListIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>No bills yet</strong>
          </p>
          <p>Add your rent, utilities, and subscriptions to start tracking together.</p>
          <button className="btn primary" style={{ marginTop: 16 }} onClick={onAddBill}>
            Add your first bill
          </button>
        </div>
      )}

      <BillGroup
        title="Overdue"
        items={overdue}
        isPastDue
        memberName={memberName}
        onTogglePaid={onTogglePaid}
        onEditBill={onEditBill}
      />
      <BillGroup
        title="Upcoming"
        items={upcoming}
        isPastDue={false}
        memberName={memberName}
        onTogglePaid={onTogglePaid}
        onEditBill={onEditBill}
      />
      <BillGroup
        title="Paid"
        items={paidItems}
        isPastDue={false}
        memberName={memberName}
        onTogglePaid={onTogglePaid}
        onEditBill={onEditBill}
      />
    </div>
  );
}
