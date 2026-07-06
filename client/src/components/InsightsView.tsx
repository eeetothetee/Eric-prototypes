import { useEffect, useState } from "react";
import { api, formatMoney } from "../api";
import type { HistoryRow, MonthData } from "../types";
import { CategoryIcon } from "./icons";

function shortMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export default function InsightsView({ monthData }: { monthData: MonthData }) {
  const [history, setHistory] = useState<HistoryRow[] | null>(null);

  useEffect(() => {
    api.getHistory().then(setHistory).catch(() => setHistory([]));
  }, [monthData]);

  const rows = (history ?? []).slice(-6);
  const maxPaid = Math.max(1, ...rows.map((r) => r.paid_cents));

  // Category breakdown of this month's planned bills.
  const catTotals = new Map<string, number>();
  let planned = 0;
  for (const it of monthData.items) {
    const amt = it.payment ? it.payment.amount_cents : it.bill.amount_cents;
    catTotals.set(it.bill.category, (catTotals.get(it.bill.category) || 0) + amt);
    planned += amt;
  }
  const cats = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="screen">
      <div className="chart-card">
        <h3 className="section-title">Paid per month</h3>
        {history === null ? (
          <div className="loading">Loading</div>
        ) : rows.length === 0 ? (
          <div className="empty" style={{ padding: "24px 0" }}>
            <p>No payments recorded yet. Mark bills paid to see your trend here.</p>
          </div>
        ) : (
          <div className="bars">
            {rows.map((r) => (
              <div key={r.month} className="bar-col">
                <div className="bar-amt num">{formatMoney(r.paid_cents).replace(/\.\d{2}$/, "")}</div>
                <div className="bar" style={{ height: `${(r.paid_cents / maxPaid) * 80}%` }} />
                <div className="bar-label">{shortMonthLabel(r.month)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chart-card">
        <h3 className="section-title">This month by category</h3>
        {cats.length === 0 ? (
          <div className="empty" style={{ padding: "24px 0" }}>
            <p>Add bills to see a category breakdown.</p>
          </div>
        ) : (
          <div className="cat-list">
            {cats.map(([cat, amt]) => (
              <div key={cat} className="cat-row">
                <span className="cat-icon">
                  <CategoryIcon category={cat} width={17} height={17} />
                </span>
                <span className="cat-name">{cat}</span>
                <span className="cat-amt num">{formatMoney(amt)}</span>
                <span className="cat-pct num">
                  {planned > 0 ? Math.round((amt / planned) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
