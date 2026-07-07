import { formatMoney, ordinal } from "../api";
import type { Bill, MonthData, MonthItem } from "../types";
import type { ExtData } from "../store";
import { cashFlowByMonth, spendByCategory, txnMonth } from "../store";
import {
  CategoryIcon,
  CheckIcon,
  ChevronRight,
  FlowIcon,
  GaugeIcon,
  SwapIcon,
  TargetIcon,
} from "./icons";

export type Sub = "transactions" | "cashflow" | "budget" | "goals" | "recurring";

interface Props {
  ext: ExtData;
  monthData: MonthData;
  month: string;
  onOpen: (sub: Sub) => void;
  onPayBill: (bill: Bill) => void;
  onViewBills: () => void;
}

function Head({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="dash-head">
      {icon}
      <span className="microlabel">{label}</span>
      <ChevronRight width={15} height={15} />
    </div>
  );
}

function DueRow({
  item,
  overdue,
  onPay,
}: {
  item: MonthItem;
  overdue: boolean;
  onPay: () => void;
}) {
  const { bill } = item;
  return (
    <div className={`bill-card ${overdue ? "overdue" : ""}`}>
      <span className="icon">
        <CategoryIcon category={bill.category} width={18} height={18} />
      </span>
      <span className="bill-main">
        <span className="name">{bill.name}</span>
        <span className="meta">
          <span>Due {ordinal(bill.due_day)}</span>
          {overdue && <span className="pill overdue">Overdue</span>}
          {bill.autopay === 1 && <span className="pill autopay">Auto</span>}
        </span>
      </span>
      <span className="bill-right">
        <span className="amount num">{formatMoney(bill.amount_cents)}</span>
        <button className="paycheck" onClick={onPay} aria-label={`Pay ${bill.name}`}>
          <CheckIcon strokeWidth={2.2} />
        </button>
      </span>
    </div>
  );
}

export default function Dashboard({ ext, monthData, month, onOpen, onPayBill, onViewBills }: Props) {
  const { txns, budgets, goals } = ext;

  // --- Due next: the reason you open the app ---
  const today = new Date().getDate();
  const unpaid = monthData.items.filter((it) => !it.payment);
  const overdueSet = new Set(unpaid.filter((it) => it.bill.due_day < today).map((it) => it.bill.id));
  const dueNext = [...unpaid]
    .sort((a, b) => {
      const ao = overdueSet.has(a.bill.id) ? 0 : 1;
      const bo = overdueSet.has(b.bill.id) ? 0 : 1;
      return ao - bo || a.bill.due_day - b.bill.due_day;
    })
    .slice(0, 4);
  const paidCount = monthData.items.filter((it) => it.payment).length;
  const billCount = monthData.items.length;

  // --- Glimpses ---
  const [cf] = cashFlowByMonth(txns, [month]);
  const net = cf.income_cents - cf.expense_cents;

  const monthTxns = txns.filter((t) => txnMonth(t) === month);

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const spent = spendByCategory(txns, month);
  const totalSpent = [...spent.entries()]
    .filter(([cat]) => budgets[cat] != null)
    .reduce((s, [, v]) => s + v, 0);
  const budgetPct = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const goalTarget = goals.reduce((s, g) => s + g.target_cents, 0);
  const goalSaved = goals.reduce((s, g) => s + g.saved_cents, 0);
  const goalPct = goalTarget > 0 ? goalSaved / goalTarget : 0;

  return (
    <div className="screen">
      {/* Hero: what needs paying */}
      <div className="bill-group">
        <div className="hero-head">
          <div className="section-title">Due next</div>
          {billCount > 0 && (
            <button className="hero-link num" onClick={onViewBills}>
              {paidCount} of {billCount} paid
              <ChevronRight width={13} height={13} />
            </button>
          )}
        </div>

        {billCount === 0 ? (
          <div className="rows">
            <div className="hero-done">
              <p>
                <strong>No bills set up yet</strong>
              </p>
              <p>Add your rent, utilities, and subscriptions to see what's due here.</p>
              <button className="btn primary" onClick={onViewBills}>
                Add your bills
              </button>
            </div>
          </div>
        ) : dueNext.length === 0 ? (
          <div className="rows">
            <div className="hero-done">
              <span className="hero-check">
                <CheckIcon width={20} height={20} strokeWidth={2} />
              </span>
              <p>
                <strong>All bills paid this month</strong>
              </p>
              <p className="num">{formatMoney(monthData.summary.paidCents)} covered together</p>
            </div>
          </div>
        ) : (
          <>
            <div className="rows">
              {dueNext.map((it) => (
                <DueRow
                  key={it.bill.id}
                  item={it}
                  overdue={overdueSet.has(it.bill.id)}
                  onPay={() => onPayBill(it.bill)}
                />
              ))}
            </div>
            {monthData.summary.dueCents > 0 && (
              <div className="hero-foot num">
                {formatMoney(monthData.summary.dueCents)} remaining this month
              </div>
            )}
          </>
        )}
      </div>

      {/* Everything else, at a glance */}
      <div className="dash-grid">
        <button className="dash-card" onClick={() => onOpen("cashflow")}>
          <Head icon={<FlowIcon width={17} height={17} />} label="Cash flow" />
          <div className="dash-figure num">
            <span className={net > 0 ? "pos" : net < 0 ? "neg" : ""}>
              {net >= 0 ? "+" : "\u2212"}
              {formatMoney(Math.abs(net))}
            </span>
          </div>
          <div className="dash-sub num">
            In {formatMoney(cf.income_cents)} · Out {formatMoney(cf.expense_cents)}
          </div>
        </button>

        <button className="dash-card" onClick={() => onOpen("budget")}>
          <Head icon={<GaugeIcon width={17} height={17} />} label="Budget" />
          {totalBudget > 0 ? (
            <>
              <div className="dash-figure num">{Math.round(budgetPct * 100)}%</div>
              <div className="meter">
                <div
                  className={budgetPct > 1 ? "over" : ""}
                  style={{ width: `${Math.min(100, budgetPct * 100)}%` }}
                />
              </div>
              <div className="dash-sub num">
                {formatMoney(totalSpent)} of {formatMoney(totalBudget)}
              </div>
            </>
          ) : (
            <>
              <div className="dash-figure">—</div>
              <div className="dash-sub">Set monthly limits</div>
            </>
          )}
        </button>

        <button className="dash-card" onClick={() => onOpen("goals")}>
          <Head icon={<TargetIcon width={17} height={17} />} label="Goals" />
          {goals.length > 0 ? (
            <>
              <div className="dash-figure num">{Math.round(goalPct * 100)}%</div>
              <div className="meter">
                <div style={{ width: `${Math.min(100, goalPct * 100)}%` }} />
              </div>
              <div className="dash-sub num">
                {formatMoney(goalSaved)} of {formatMoney(goalTarget)}
              </div>
            </>
          ) : (
            <>
              <div className="dash-figure">—</div>
              <div className="dash-sub">Save toward something</div>
            </>
          )}
        </button>

        <button className="dash-card" onClick={() => onOpen("transactions")}>
          <Head icon={<SwapIcon width={17} height={17} />} label="Spending" />
          <div className="dash-figure num">{formatMoney(cf.expense_cents)}</div>
          <div className="dash-sub">
            {monthTxns.length === 0
              ? "Log what you spend"
              : `${monthTxns.length} transaction${monthTxns.length === 1 ? "" : "s"} this month`}
          </div>
        </button>
      </div>
    </div>
  );
}
