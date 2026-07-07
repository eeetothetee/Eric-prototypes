import { formatMoney } from "../api";
import type { MonthData } from "../types";
import type { ExtData } from "../store";
import { cashFlowByMonth, netWorthCents, spendByCategory, txnMonth } from "../store";
import {
  ChevronRight,
  FlowIcon,
  GaugeIcon,
  ListIcon,
  RepeatIcon,
  SwapIcon,
  TargetIcon,
  WalletIcon,
} from "./icons";

export type Sub = "accounts" | "transactions" | "cashflow" | "budget" | "goals" | "recurring";

interface Props {
  ext: ExtData;
  monthData: MonthData;
  month: string;
  onOpen: (sub: Sub) => void;
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

export default function Dashboard({ ext, monthData, month, onOpen }: Props) {
  const { accounts, txns, budgets, goals } = ext;

  // Accounts
  const netWorth = netWorthCents(accounts);

  // Cash flow (this month)
  const [cf] = cashFlowByMonth(txns, [month]);
  const net = cf.income_cents - cf.expense_cents;

  // Transactions (this month)
  const monthTxns = txns.filter((t) => txnMonth(t) === month);
  const latest = [...txns].sort((a, b) => b.date.localeCompare(a.date))[0];

  // Budget (this month)
  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const spent = spendByCategory(txns, month);
  const totalSpent = [...spent.entries()]
    .filter(([cat]) => budgets[cat] != null)
    .reduce((s, [, v]) => s + v, 0);
  const budgetPct = totalBudget > 0 ? totalSpent / totalBudget : 0;

  // Recurring (bills this month)
  const paidCount = monthData.items.filter((it) => it.payment).length;
  const billCount = monthData.items.length;

  // Goals
  const goalTarget = goals.reduce((s, g) => s + g.target_cents, 0);
  const goalSaved = goals.reduce((s, g) => s + g.saved_cents, 0);
  const goalPct = goalTarget > 0 ? goalSaved / goalTarget : 0;

  return (
    <div className="screen">
      <div className="dash-grid">
        <button className="dash-card wide" onClick={() => onOpen("accounts")}>
          <Head icon={<WalletIcon width={17} height={17} />} label="Accounts · Net worth" />
          <div className="dash-figure num">
            <span className={netWorth < 0 ? "neg" : ""}>{formatMoney(netWorth)}</span>
          </div>
          <div className="dash-sub">
            {accounts.length === 0
              ? "Add your bank accounts and cards"
              : `${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
          </div>
        </button>

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

        <button className="dash-card" onClick={() => onOpen("transactions")}>
          <Head icon={<SwapIcon width={17} height={17} />} label="Transactions" />
          <div className="dash-figure num">{monthTxns.length}</div>
          <div className="dash-sub">
            {latest ? `Latest: ${latest.merchant}` : "None recorded this month"}
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
              <div className="dash-sub">Set monthly limits per category</div>
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
              <div className="dash-sub">Save toward something together</div>
            </>
          )}
        </button>

        <button className="dash-card wide" onClick={() => onOpen("recurring")}>
          <Head icon={<RepeatIcon width={17} height={17} />} label="Recurring bills" />
          <div className="dash-figure num">
            {billCount === 0 ? "—" : `${paidCount} of ${billCount} paid`}
          </div>
          <div className="dash-sub num">
            {billCount === 0
              ? "Add your monthly bills"
              : monthData.summary.dueCents > 0
                ? `${formatMoney(monthData.summary.dueCents)} remaining this month`
                : "All bills covered this month"}
          </div>
        </button>
      </div>

      {accounts.length === 0 && txns.length === 0 && goals.length === 0 && (
        <div className="empty" style={{ paddingTop: 28 }}>
          <div className="big">
            <ListIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>Welcome to your household dashboard</strong>
          </p>
          <p>Tap any card to add accounts, transactions, budgets, and goals.</p>
        </div>
      )}
    </div>
  );
}
