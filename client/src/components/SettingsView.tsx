import { useState } from "react";
import { api, IS_STATIC } from "../api";
import type { Household, Member } from "../types";
import { initials } from "./icons";

interface Props {
  household: Household;
  onSaved: () => void;
}

function MemberEditor({ member, onSaved }: { member: Member; onSaved: () => void }) {
  const [name, setName] = useState(member.name);
  const [color, setColor] = useState(member.color);
  const [busy, setBusy] = useState(false);

  const dirty = name !== member.name || color !== member.color;

  const save = async () => {
    setBusy(true);
    try {
      await api.updateMember(member.id, { name, color });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="member-edit">
        <div
          className="avatar"
          style={{ background: color, border: "none", width: 40, height: 40, flexShrink: 0 }}
        >
          {initials(name)}
        </div>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color" />
      </div>
      {dirty && (
        <button className="btn subtle block" style={{ marginTop: 10 }} onClick={save} disabled={busy}>
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
        <p className="body-text faint">
          Each partner has a name and a color. These identify payments and the settle-up view.
        </p>
      </div>

      <div className="settings-card">
        <h3 className="section-title">About</h3>
        <p className="body-text">
          Family Bills — a shared monthly bill tracker for couples. Add your recurring bills, mark
          them paid each month, and see who owes whom.
        </p>
        {IS_STATIC && (
          <p className="body-text faint">
            You're using the offline version. Data is saved privately in this browser on this
            device, so it won't sync between phones. To share bills live with your partner, run
            the full app with its server.
          </p>
        )}
      </div>
    </div>
  );
}
