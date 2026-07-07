import { formatMoney, monthLabel } from "../api";
import type { ExtData } from "../store";
import { cashFlowByMonth, lastMonths, spendByCategory } from "../store";
import { CategoryIcon, FlowIcon } from "./icons";

interface Props {
  ext: ExtData;
  month: string;
}

function shortMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export default function CashFlowView({ ext, month }: Props) {
  const months = lastMonths(6, month);
  const rows = cashFlowByMonth(ext.txns, months);
  const max = Math.max(1, ...rows.flatMap((r) => [r.income_cents, r.expense_cents]));
  const current = rows[rows.length - 1];
  const net = current.income_cents - current.expense_cents;

  const spent = [...spendByCategory(ext.txns, month).entries()].sort((a, b) => b[1] - a[1]);
  const totalSpent = spent.reduce((s, [, v]) => s + v, 0);

  const hasData = ext.txns.length > 0;

  return (
    <div className="screen">
      <div className="settle-card">
        <h3>{monthLabel(month)}</h3>
        <div className="big-figure num">
          <span style={{ color: net < 0 ? "var(--danger)" : "var(--accent-ink)" }}>
            {net >= 0 ? "+" : "\u2212"}
            {formatMoney(Math.abs(net))}
          </span>{" "}
          <span className="unit">net</span>
        </div>
        <div className="big-figure-sub num">
          Income {formatMoney(current.income_cents)} · Spending {formatMoney(current.expense_cents)}
        </div>
      </div>

      {!hasData ? (
        <div className="empty">
          <div className="big">
            <FlowIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>No cash flow yet</strong>
          </p>
          <p>Add income and expenses under Transactions to see money in vs. money out.</p>
        </div>
      ) : (
        <>
          <div className="chart-card">
            <h3 className="section-title">Last 6 months</h3>
            <div className="cf-bars">
              {rows.map((r) => (
                <div key={r.month} className="cf-col">
                  <div className="pair">
                    <div
                      className="bar-in"
                      style={{ height: `${(r.income_cents / max) * 100}%` }}
                      title={`In ${formatMoney(r.income_cents)}`}
                    />
                    <div
                      className="bar-out"
                      style={{ height: `${(r.expense_cents / max) * 100}%` }}
                      title={`Out ${formatMoney(r.expense_cents)}`}
                    />
                  </div>
                  <div className="bar-label">{shortMonth(r.month)}</div>
                </div>
              ))}
            </div>
            <div className="legend">
              <span>
                <i style={{ background: "var(--accent)" }} /> Money in
              </span>
              <span>
                <i style={{ background: "var(--ink)" }} /> Money out
              </span>
            </div>
          </div>

          {spent.length > 0 && (
            <div className="chart-card">
              <h3 className="section-title">Spending by category</h3>
              <div className="cat-list">
                {spent.map(([cat, amt]) => (
                  <div key={cat} className="cat-row">
                    <span className="cat-icon">
                      <CategoryIcon category={cat} width={17} height={17} />
                    </span>
                    <span className="cat-name">{cat}</span>
                    <span className="cat-amt num">{formatMoney(amt)}</span>
                    <span className="cat-pct num">
                      {totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
