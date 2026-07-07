import { useState } from "react";
import { formatMoney } from "../api";
import type { Member } from "../types";
import type { Account, AccountType, ExtData } from "../store";
import { ACCOUNT_TYPES, isLiability, netWorthCents, nextExtId } from "../store";
import { PlusIcon, WalletIcon } from "./icons";

interface Props {
  ext: ExtData;
  members: Member[];
  mutate: (fn: (d: ExtData) => void) => Promise<void>;
}

function parseMoney(v: string): number {
  return Math.round(parseFloat(v) * 100);
}

function AccountForm({
  account,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  account: Account | null;
  members: Member[];
  onClose: () => void;
  onSave: (data: Omit<Account, "id">) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");
  const [balance, setBalance] = useState(account ? (account.balance_cents / 100).toFixed(2) : "");
  const [owner, setOwner] = useState<number | null>(account?.owner_member_id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const liability = isLiability(type);

  const submit = () => {
    const cents = parseMoney(balance || "0");
    if (!name.trim()) return setError("Give the account a name.");
    if (!Number.isFinite(cents) || cents < 0) return setError("Enter a valid balance.");
    onSave({ name: name.trim(), type, balance_cents: cents, owner_member_id: owner });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>{account ? "Edit account" : "Add an account"}</h2>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Joint checking, Amex"
            autoFocus={!account}
          />
        </div>

        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{liability ? "Amount owed" : "Current balance"}</label>
          <input
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="field">
          <label>Belongs to</label>
          <div className="seg">
            <button className={owner === null ? "on" : ""} onClick={() => setOwner(null)}>
              Joint
            </button>
            {members.map((m) => (
              <button key={m.id} className={owner === m.id ? "on" : ""} onClick={() => setOwner(m.id)}>
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn primary block" onClick={submit}>
            {account ? "Save changes" : "Add account"}
          </button>
          {account &&
            (confirmDelete ? (
              <button className="btn danger block" onClick={onDelete}>
                Tap again to confirm delete
              </button>
            ) : (
              <button className="btn danger block" onClick={() => setConfirmDelete(true)}>
                Delete account
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

export default function AccountsView({ ext, members, mutate }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const assets = ext.accounts.filter((a) => !isLiability(a.type));
  const liabilities = ext.accounts.filter((a) => isLiability(a.type));
  const typeLabel = (t: AccountType) => ACCOUNT_TYPES.find((x) => x.value === t)?.label ?? t;
  const ownerLabel = (id: number | null) =>
    id == null ? "Joint" : (members.find((m) => m.id === id)?.name ?? "\u2014");

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const save = async (data: Omit<Account, "id">) => {
    await mutate((d) => {
      if (editing) {
        const a = d.accounts.find((x) => x.id === editing.id);
        if (a) Object.assign(a, data);
      } else {
        d.accounts.push({ id: nextExtId(d), ...data });
      }
    });
    setFormOpen(false);
  };

  const remove = async () => {
    if (!editing) return;
    await mutate((d) => {
      d.accounts = d.accounts.filter((a) => a.id !== editing.id);
    });
    setFormOpen(false);
  };

  const renderGroup = (title: string, list: typeof assets) =>
    list.length > 0 && (
      <div className="bill-group">
        <div className="section-title">{title}</div>
        <div className="row-list">
          {list.map((a) => (
            <button
              key={a.id}
              className="lrow"
              onClick={() => {
                setEditing(a);
                setFormOpen(true);
              }}
            >
              <span className="icon">
                <WalletIcon width={18} height={18} />
              </span>
              <span className="main">
                <span className="t">{a.name}</span>
                <span className="s">
                  {typeLabel(a.type)} · {ownerLabel(a.owner_member_id)}
                </span>
              </span>
              <span className="end">
                <span className="amt num">
                  {isLiability(a.type) ? "\u2212" : ""}
                  {formatMoney(a.balance_cents)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="screen">
      <div className="settle-card">
        <h3>Net worth</h3>
        <div className="big-figure num">{formatMoney(netWorthCents(ext.accounts))}</div>
        <div className="big-figure-sub num">
          Assets {formatMoney(assets.reduce((s, a) => s + a.balance_cents, 0))} · Debts{" "}
          {formatMoney(liabilities.reduce((s, a) => s + a.balance_cents, 0))}
        </div>
      </div>

      {ext.accounts.length === 0 && (
        <div className="empty">
          <div className="big">
            <WalletIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>No accounts yet</strong>
          </p>
          <p>Add checking, savings, cards, and loans to see your household net worth.</p>
          <button className="btn primary" style={{ marginTop: 16 }} onClick={openAdd}>
            Add an account
          </button>
        </div>
      )}

      {renderGroup("Assets", assets)}
      {renderGroup("Debts", liabilities)}

      <button className="fab" aria-label="Add account" onClick={openAdd}>
        <PlusIcon />
      </button>

      {formOpen && (
        <AccountForm
          account={editing}
          members={members}
          onClose={() => setFormOpen(false)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}
