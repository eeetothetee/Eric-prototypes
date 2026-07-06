import { useState } from "react";
import { api } from "../api";
import type { BillInput } from "../api";
import type { Bill, Member } from "../types";
import { CATEGORIES } from "../types";

interface Props {
  bill: Bill | null;
  members: Member[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export default function BillForm({ bill, members, onClose, onSaved }: Props) {
  const [name, setName] = useState(bill?.name ?? "");
  const [category, setCategory] = useState(bill?.category ?? "Other");
  const [amount, setAmount] = useState(bill ? (bill.amount_cents / 100).toFixed(2) : "");
  const [dueDay, setDueDay] = useState(bill?.due_day ?? 1);
  const [payerMemberId, setPayerMemberId] = useState<number | null>(bill?.payer_member_id ?? null);
  const [splitType, setSplitType] = useState<BillInput["splitType"]>(bill?.split_type ?? "shared");
  const [splitPct, setSplitPct] = useState(bill?.split_pct ?? 50);
  const [autopay, setAutopay] = useState(bill?.autopay === 1);
  const [notes, setNotes] = useState(bill?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = async () => {
    setError(null);
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!name.trim()) return setError("Give the bill a name.");
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      return setError("Enter a valid amount.");

    const input: BillInput = {
      name: name.trim(),
      category,
      amountCents,
      dueDay,
      payerMemberId,
      splitType,
      splitPct,
      autopay,
      notes,
    };
    setBusy(true);
    try {
      if (bill) {
        await api.updateBill(bill.id, input);
        onSaved(`${input.name} updated`);
      } else {
        await api.createBill(input);
        onSaved(`${input.name} added`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!bill) return;
    setBusy(true);
    try {
      await api.deleteBill(bill.id);
      onSaved(`${bill.name} deleted`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setBusy(false);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>{bill ? "Edit bill" : "Add a bill"}</h2>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent, Electricity, Netflix"
            autoFocus={!bill}
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
            <label>Due day of month</label>
            <select value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Usually paid by</label>
          <div className="seg">
            <button className={payerMemberId === null ? "on" : ""} onClick={() => setPayerMemberId(null)}>
              Either
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                className={payerMemberId === m.id ? "on" : ""}
                onClick={() => setPayerMemberId(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>How is it split?</label>
          <div className="seg">
            <button className={splitType === "shared" ? "on" : ""} onClick={() => setSplitType("shared")}>
              50 / 50
            </button>
            <button className={splitType === "custom" ? "on" : ""} onClick={() => setSplitType("custom")}>
              Custom
            </button>
            <button className={splitType === "payer" ? "on" : ""} onClick={() => setSplitType("payer")}>
              Payer covers
            </button>
          </div>
        </div>

        {splitType === "custom" && members.length === 2 && (
          <div className="field">
            <label>
              {members[0].name} pays {splitPct}% · {members[1].name} pays {100 - splitPct}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={splitPct}
              onChange={(e) => setSplitPct(Number(e.target.value))}
            />
          </div>
        )}

        <div className="switch-row">
          <div>
            <div className="lbl">Autopay</div>
            <div className="hint">This bill is paid automatically</div>
          </div>
          <button
            className={`toggle ${autopay ? "on" : ""}`}
            onClick={() => setAutopay(!autopay)}
            aria-label="Toggle autopay"
          />
        </div>

        <div className="field">
          <label>Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Account number, login, reminders…"
          />
        </div>

        <div className="form-actions">
          <button className="btn primary block" onClick={submit} disabled={busy}>
            {bill ? "Save changes" : "Add bill"}
          </button>
          {bill &&
            (confirmDelete ? (
              <button className="btn danger block" onClick={remove} disabled={busy}>
                Tap again to confirm delete
              </button>
            ) : (
              <button className="btn danger block" onClick={() => setConfirmDelete(true)}>
                Delete bill
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
