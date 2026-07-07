import { useState } from "react";
import { formatMoney } from "../api";
import type { Member } from "../types";
import type { ExtData, Txn, TxnKind } from "../store";
import { TXN_CATEGORIES, nextExtId, todayISO } from "../store";
import { CategoryIcon, PlusIcon, SwapIcon } from "./icons";

interface Props {
  ext: ExtData;
  members: Member[];
  mutate: (fn: (d: ExtData) => void) => Promise<void>;
}

function dateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function TxnForm({
  txn,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  txn: Txn | null;
  members: Member[];
  onClose: () => void;
  onSave: (data: Omit<Txn, "id">) => void;
  onDelete: () => void;
}) {
  const [kind, setKind] = useState<TxnKind>(txn?.kind ?? "expense");
  const [merchant, setMerchant] = useState(txn?.merchant ?? "");
  const [amount, setAmount] = useState(txn ? (txn.amount_cents / 100).toFixed(2) : "");
  const [category, setCategory] = useState(txn?.category ?? "Groceries");
  const [date, setDate] = useState(txn?.date ?? todayISO());
  const [memberId, setMemberId] = useState<number | null>(txn?.member_id ?? null);
  const [notes, setNotes] = useState(txn?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!merchant.trim()) return setError("Who was it paid to (or from)?");
    if (!Number.isFinite(cents) || cents <= 0) return setError("Enter a valid amount.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Pick a date.");
    onSave({
      kind,
      merchant: merchant.trim(),
      amount_cents: cents,
      category: kind === "income" ? "Income" : category,
      date,
      member_id: memberId,
      notes,
    });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>{txn ? "Edit transaction" : "Add a transaction"}</h2>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Type</label>
          <div className="seg">
            <button className={kind === "expense" ? "on" : ""} onClick={() => setKind("expense")}>
              Expense
            </button>
            <button className={kind === "income" ? "on" : ""} onClick={() => setKind("income")}>
              Income
            </button>
          </div>
        </div>

        <div className="field">
          <label>{kind === "expense" ? "Paid to" : "Received from"}</label>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder={kind === "expense" ? "e.g. Trader Joe's" : "e.g. Paycheck"}
            autoFocus={!txn}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Amount</label>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {kind === "expense" && (
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {TXN_CATEGORIES.filter((c) => c !== "Income").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>{kind === "expense" ? "Spent by" : "Received by"}</label>
          <div className="seg">
            <button className={memberId === null ? "on" : ""} onClick={() => setMemberId(null)}>
              Joint
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                className={memberId === m.id ? "on" : ""}
                onClick={() => setMemberId(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember" />
        </div>

        <div className="form-actions">
          <button className="btn primary block" onClick={submit}>
            {txn ? "Save changes" : "Add transaction"}
          </button>
          {txn &&
            (confirmDelete ? (
              <button className="btn danger block" onClick={onDelete}>
                Tap again to confirm delete
              </button>
            ) : (
              <button className="btn danger block" onClick={() => setConfirmDelete(true)}>
                Delete transaction
              </button>
            ))}
          <button className="btn subtle block" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsView({ ext, members, mutate }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);

  const sorted = [...ext.txns].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const recent = sorted.slice(0, 100);

  const byDate = new Map<string, Txn[]>();
  for (const t of recent) {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(t);
  }

  const memberName = (id: number | null) =>
    id == null ? "Joint" : (members.find((m) => m.id === id)?.name ?? "\u2014");

  const save = async (data: Omit<Txn, "id">) => {
    await mutate((d) => {
      if (editing) {
        const t = d.txns.find((x) => x.id === editing.id);
        if (t) Object.assign(t, data);
      } else {
        d.txns.push({ id: nextExtId(d), ...data });
      }
    });
    setFormOpen(false);
  };

  const remove = async () => {
    if (!editing) return;
    await mutate((d) => {
      d.txns = d.txns.filter((t) => t.id !== editing.id);
    });
    setFormOpen(false);
  };

  return (
    <div className="screen">
      {ext.txns.length === 0 && (
        <div className="empty">
          <div className="big">
            <SwapIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>No transactions yet</strong>
          </p>
          <p>Log spending and income to see your cash flow and budgets fill in.</p>
          <button
            className="btn primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add a transaction
          </button>
        </div>
      )}

      {[...byDate.entries()].map(([date, txns]) => (
        <div key={date} className="bill-group">
          <div className="section-title">{dateLabel(date)}</div>
          <div className="row-list">
            {txns.map((t) => (
              <button
                key={t.id}
                className="lrow"
                onClick={() => {
                  setEditing(t);
                  setFormOpen(true);
                }}
              >
                <span className="icon">
                  <CategoryIcon category={t.category} width={18} height={18} />
                </span>
                <span className="main">
                  <span className="t">{t.merchant}</span>
                  <span className="s">
                    {t.category} · {memberName(t.member_id)}
                  </span>
                </span>
                <span className="end">
                  <span className={`amt num ${t.kind === "income" ? "income" : ""}`}>
                    {t.kind === "income" ? "+" : "\u2212"}
                    {formatMoney(t.amount_cents)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        className="fab"
        aria-label="Add transaction"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <PlusIcon />
      </button>

      {formOpen && (
        <TxnForm
          txn={editing}
          members={members}
          onClose={() => setFormOpen(false)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}
