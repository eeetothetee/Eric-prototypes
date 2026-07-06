import { useState } from "react";
import { api, IS_STATIC } from "../api";
import type { Household, Member } from "../types";

interface Props {
  household: Household;
  onSaved: () => void;
}

function MemberEditor({ member, onSaved }: { member: Member; onSaved: () => void }) {
  const [name, setName] = useState(member.name);
  const [emoji, setEmoji] = useState(member.emoji);
  const [color, setColor] = useState(member.color);
  const [busy, setBusy] = useState(false);

  const dirty = name !== member.name || emoji !== member.emoji || color !== member.color;

  const save = async () => {
    setBusy(true);
    try {
      await api.updateMember(member.id, { name, emoji, color });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="member-edit">
        <input
          className="emoji-input"
          value={emoji}
          maxLength={4}
          onChange={(e) => setEmoji(e.target.value)}
          aria-label="Emoji"
        />
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color" />
      </div>
      {dirty && (
        <button className="btn subtle block" style={{ marginTop: 8 }} onClick={save} disabled={busy}>
          Save {name || "member"}
        </button>
      )}
    </div>
  );
}

export default function SettingsView({ household, onSaved }: Props) {
  const [householdName, setHouseholdName] = useState(household.householdName);
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    setBusy(true);
    try {
      await api.updateHousehold(householdName);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <div className="settings-card">
        <h3 className="section-title">Household</h3>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Household name</label>
          <input value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
        </div>
        {householdName !== household.householdName && (
          <button className="btn subtle block" onClick={saveName} disabled={busy}>
            Save household name
          </button>
        )}
      </div>

      <div className="settings-card">
        <h3 className="section-title">Partners</h3>
        {household.members.map((m) => (
          <MemberEditor key={m.id} member={m} onSaved={onSaved} />
        ))}
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>
          Set each partner's name, emoji, and color. These show up on payments and the settle-up
          view.
        </p>
      </div>

      <div className="settings-card">
        <h3 className="section-title">About</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: 0 }}>
          Family Bills — a shared monthly bill tracker for couples. Add your recurring bills, mark
          them paid each month, and see who owes whom.
        </p>
        {IS_STATIC && (
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: 0 }}>
            You're using the offline demo. Your data is saved privately in this browser on this
            device, so it won't sync between phones. To share bills live with your partner, run the
            full app with its server.
          </p>
        )}
      </div>
    </div>
  );
}
