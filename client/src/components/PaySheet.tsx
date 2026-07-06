import { useState } from "react";
import { api, formatMoney, monthLabel } from "../api";
import type { Bill, Member } from "../types";

interface Props {
  bill: Bill;
  month: string;
  members: Member[];
  onClose: () => void;
  onPaid: () => void;
}

export default function PaySheet({ bill, month, members, onClose, onPaid }: Props) {
  const defaultPayer = bill.payer_member_id ?? members[0]?.id ?? null;
  const [paidBy, setPaidBy] = useState<number | null>(defaultPayer);
  const [amount, setAmount] = useState((bill.amount_cents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      return setError("Enter a valid amount.");
    setBusy(true);
    try {
      await api.payBill(bill.id, { month, amountCents, paidByMemberId: paidBy });
      onPaid();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record payment");
      setBusy(false);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>
          Mark “{bill.name}” paid · {monthLabel(month)}
        </h2>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Who paid it?</label>
          <div className="seg">
            {members.map((m) => (
              <button key={m.id} className={paidBy === m.id ? "on" : ""} onClick={() => setPaidBy(m.id)}>
                {m.emoji} {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Amount paid (planned: {formatMoney(bill.amount_cents)})</label>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn primary block" onClick={submit} disabled={busy}>
            Record payment
          </button>
          <button className="btn subtle block" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
