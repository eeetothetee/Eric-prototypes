import { useState } from "react";
import { formatMoney } from "../api";
import type { ExtData, Goal } from "../store";
import { nextExtId } from "../store";
import { PlusIcon, TargetIcon } from "./icons";

interface Props {
  ext: ExtData;
  mutate: (fn: (d: ExtData) => void) => Promise<void>;
}

function GoalForm({
  goal,
  onClose,
  onSave,
  onDelete,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: (data: Omit<Goal, "id">) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? (goal.target_cents / 100).toFixed(0) : "");
  const [saved, setSaved] = useState(goal ? (goal.saved_cents / 100).toFixed(2) : "0");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = () => {
    const targetCents = Math.round(parseFloat(target) * 100);
    const savedCents = Math.round(parseFloat(saved || "0") * 100);
    if (!name.trim()) return setError("Give the goal a name.");
    if (!Number.isFinite(targetCents) || targetCents <= 0) return setError("Enter a target amount.");
    if (!Number.isFinite(savedCents) || savedCents < 0) return setError("Enter a valid saved amount.");
    onSave({
      name: name.trim(),
      target_cents: targetCents,
      saved_cents: savedCents,
      target_date: /^\d{4}-\d{2}$/.test(targetDate) ? targetDate : null,
    });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>{goal ? "Edit goal" : "Add a goal"}</h2>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emergency fund, Japan trip"
            autoFocus={!goal}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Target</label>
            <input
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label>Saved so far</label>
            <input inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Target month (optional)</label>
          <input type="month" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn primary block" onClick={submit}>
            {goal ? "Save changes" : "Add goal"}
          </button>
          {goal &&
            (confirmDelete ? (
              <button className="btn danger block" onClick={onDelete}>
                Tap again to confirm delete
              </button>
            ) : (
              <button className="btn danger block" onClick={() => setConfirmDelete(true)}>
                Delete goal
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

function targetLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function GoalsView({ ext, mutate }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const totalTarget = ext.goals.reduce((s, g) => s + g.target_cents, 0);
  const totalSaved = ext.goals.reduce((s, g) => s + g.saved_cents, 0);

  const save = async (data: Omit<Goal, "id">) => {
    await mutate((d) => {
      if (editing) {
        const g = d.goals.find((x) => x.id === editing.id);
        if (g) Object.assign(g, data);
      } else {
        d.goals.push({ id: nextExtId(d), ...data });
      }
    });
    setFormOpen(false);
  };

  const remove = async () => {
    if (!editing) return;
    await mutate((d) => {
      d.goals = d.goals.filter((g) => g.id !== editing.id);
    });
    setFormOpen(false);
  };

  return (
    <div className="screen">
      {ext.goals.length > 0 && (
        <div className="settle-card">
          <h3>All goals</h3>
          <div className="big-figure num">
            {formatMoney(totalSaved)} <span className="unit">of {formatMoney(totalTarget)}</span>
          </div>
          <div className="meter" style={{ marginTop: 12 }}>
            <div
              style={{
                width: `${totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {ext.goals.length === 0 ? (
        <div className="empty">
          <div className="big">
            <TargetIcon width={36} height={36} strokeWidth={1.2} />
          </div>
          <p>
            <strong>No goals yet</strong>
          </p>
          <p>Save toward something together — a trip, a house, an emergency fund.</p>
          <button
            className="btn primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add a goal
          </button>
        </div>
      ) : (
        <div className="bill-group">
          <div className="section-title">Goals</div>
          <div className="row-list">
            {ext.goals.map((g) => {
              const p = g.target_cents > 0 ? g.saved_cents / g.target_cents : 0;
              return (
                <button
                  key={g.id}
                  className="meter-row"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => {
                    setEditing(g);
                    setFormOpen(true);
                  }}
                >
                  <div className="top">
                    <span className="name">
                      <TargetIcon width={16} height={16} />
                      {g.name}
                    </span>
                    <span className="nums">
                      <strong>{formatMoney(g.saved_cents)}</strong> / {formatMoney(g.target_cents)}
                    </span>
                  </div>
                  <div className="meter">
                    <div style={{ width: `${Math.min(100, p * 100)}%` }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 6 }} className="num">
                    {Math.round(p * 100)}% funded
                    {g.target_date ? ` · by ${targetLabel(g.target_date)}` : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        className="fab"
        aria-label="Add goal"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <PlusIcon />
      </button>

      {formOpen && (
        <GoalForm goal={editing} onClose={() => setFormOpen(false)} onSave={save} onDelete={remove} />
      )}
    </div>
  );
}
