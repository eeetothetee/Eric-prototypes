import { useState } from "react";
import { formatMoney, monthLabel } from "../api";
import type { ExtData } from "../store";
import { BUDGET_CATEGORIES, spendByCategory } from "../store";
import { CategoryIcon, GaugeIcon } from "./icons";

interface Props {
  ext: ExtData;
  month: string;
  mutate: (fn: (d: ExtData) => void) => Promise<void>;
}

function BudgetSheet({
  budgets,
  onClose,
  onSave,
}: {
  budgets: Record<string, number>;
  onClose: () => void;
  onSave: (next: Record<string, number>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      BUDGET_CATEGORIES.map((c) => [c, budgets[c] ? (budgets[c] / 100).toFixed(0) : ""])
    )
  );

  const submit = () => {
    const next: Record<string, number> = {};
    for (const c of BUDGET_CATEGORIES) {
      const v = parseFloat(values[c]);
      if (Number.isFinite(v) && v > 0) next[c] = Math.round(v * 100);
    }
    onSave(next);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>Monthly limits</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 16px" }}>
          Set a monthly limit per category. Leave blank to skip a category.
        </p>
        {BUDGET_CATEGORIES.map((c) => (
          <div key={c} className="field-row" style={{ alignItems: "center", marginBottom: 10 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500 }}>
              <CategoryIcon category={c} width={16} height={16} />
              {c}
            </div>
            <div className="field" style={{ marginBottom: 0, maxWidth: 130 }}>
              <input
                inputMode="numeric"
                placeholder="—"
                value={values[c]}
                onChange={(e) => setValues({ ...values, [c]: e.target.value })}
              />
            </div>
          </div>
        ))}
        <div className="form-actions">
          <button className="btn primary block" onClick={submit}>
            Save budget
          </button>
          <button className="btn subtle block" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BudgetView({ ext, month, mutate }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const spent = spendByCategory(ext.txns, month);
  const cats = BUDGET_CATEGORIES.filter((c) => ext.budgets[c] != null);
  const totalBudget = cats.reduce((s, c) => s + ext.budgets[c], 0);
  const totalSpent = cats.reduce((s, c) => s + (spent.get(c) || 0), 0);
  const pct = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const save = async (next: Record<string, number>) => {
    await mutate((d) => {
      d.budgets = next;
    });
    setSheetOpen(false);
  };

  return (
    <div className="screen">
      {cats.length > 0 && (
        <div className="settle-card">
          <h3>{monthLabel(month)}</h3>
          <div className="big-figure num">
            {formatMoney(totalSpent)}{" "}
            <span className="unit">of {formatMoney(totalBudget)}</span>
          </div>
          <div className="meter" style={{ marginTop: 12 }}>
            <div className={pct > 1 ? "over" : ""} style={{ width: `${Math.min(100, pct * 100)}%` }} />
          </div>
          <div className="big-figure-sub num">
            {pct <= 1
              ? `${formatMoney(totalBudget - totalSpent)} left to spend`
              : `${formatMoney(totalSpent - totalBudget)} over budget`}
          </div>
        </div>
      )}

      {cats.length === 0 ? (
        <div className="empty">
          <div className="big">
            <GaugeIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>No budget set</strong>
          </p>
          <p>Set monthly limits per category, then log transactions to track against them.</p>
          <button className="btn primary" style={{ marginTop: 16 }} onClick={() => setSheetOpen(true)}>
            Set up budget
          </button>
        </div>
      ) : (
        <>
          <div className="bill-group">
            <div className="section-title">Categories</div>
            <div className="row-list">
              {cats.map((c) => {
                const limit = ext.budgets[c];
                const used = spent.get(c) || 0;
                const p = used / limit;
                return (
                  <div key={c} className="meter-row">
                    <div className="top">
                      <span className="name">
                        <CategoryIcon category={c} width={16} height={16} />
                        {c}
                      </span>
                      <span className="nums">
                        <strong>{formatMoney(used)}</strong> / {formatMoney(limit)}
                      </span>
                    </div>
                    <div className="meter">
                      <div className={p > 1 ? "over" : ""} style={{ width: `${Math.min(100, p * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button className="btn subtle block" onClick={() => setSheetOpen(true)}>
            Edit limits
          </button>
        </>
      )}

      {sheetOpen && (
        <BudgetSheet budgets={ext.budgets} onClose={() => setSheetOpen(false)} onSave={save} />
      )}
    </div>
  );
}
