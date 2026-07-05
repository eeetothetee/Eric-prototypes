import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---------- Household / members ----------

app.get("/api/household", (req, res) => {
  const nameRow = db
    .prepare("SELECT value FROM settings WHERE key = 'household_name'")
    .get();
  const members = db.prepare("SELECT * FROM members ORDER BY id").all();
  res.json({
    householdName: nameRow ? nameRow.value : "Our Household",
    members,
  });
});

app.put("/api/household", (req, res) => {
  const { householdName } = req.body;
  if (typeof householdName !== "string" || !householdName.trim()) {
    return res.status(400).json({ error: "householdName is required" });
  }
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('household_name', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(householdName.trim());
  res.json({ ok: true });
});

app.put("/api/members/:id", (req, res) => {
  const { name, emoji, color } = req.body;
  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });
  db.prepare("UPDATE members SET name = ?, emoji = ?, color = ? WHERE id = ?").run(
    typeof name === "string" && name.trim() ? name.trim() : member.name,
    typeof emoji === "string" && emoji ? emoji : member.emoji,
    typeof color === "string" && color ? color : member.color,
    member.id
  );
  res.json(db.prepare("SELECT * FROM members WHERE id = ?").get(member.id));
});

// ---------- Bills ----------

function validateBill(body) {
  const errors = [];
  if (typeof body.name !== "string" || !body.name.trim()) errors.push("name is required");
  const amount = Number(body.amountCents);
  if (!Number.isInteger(amount) || amount <= 0) errors.push("amountCents must be a positive integer");
  const dueDay = Number(body.dueDay);
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) errors.push("dueDay must be 1-31");
  if (body.splitType && !["shared", "payer", "custom"].includes(body.splitType))
    errors.push("invalid splitType");
  return errors;
}

app.get("/api/bills", (req, res) => {
  const bills = db
    .prepare("SELECT * FROM bills WHERE active = 1 ORDER BY due_day, name")
    .all();
  res.json(bills);
});

app.post("/api/bills", (req, res) => {
  const errors = validateBill(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });
  const b = req.body;
  const info = db
    .prepare(
      `INSERT INTO bills (name, category, amount_cents, due_day, payer_member_id, split_type, split_pct, autopay, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      b.name.trim(),
      b.category || "Other",
      Number(b.amountCents),
      Number(b.dueDay),
      b.payerMemberId || null,
      b.splitType || "shared",
      Number.isInteger(Number(b.splitPct)) ? Number(b.splitPct) : 50,
      b.autopay ? 1 : 0,
      b.notes || ""
    );
  res.status(201).json(db.prepare("SELECT * FROM bills WHERE id = ?").get(info.lastInsertRowid));
});

app.put("/api/bills/:id", (req, res) => {
  const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  const errors = validateBill(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });
  const b = req.body;
  db.prepare(
    `UPDATE bills SET name = ?, category = ?, amount_cents = ?, due_day = ?, payer_member_id = ?,
     split_type = ?, split_pct = ?, autopay = ?, notes = ? WHERE id = ?`
  ).run(
    b.name.trim(),
    b.category || "Other",
    Number(b.amountCents),
    Number(b.dueDay),
    b.payerMemberId || null,
    b.splitType || "shared",
    Number.isInteger(Number(b.splitPct)) ? Number(b.splitPct) : 50,
    b.autopay ? 1 : 0,
    b.notes || "",
    bill.id
  );
  res.json(db.prepare("SELECT * FROM bills WHERE id = ?").get(bill.id));
});

app.delete("/api/bills/:id", (req, res) => {
  const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  // Soft-delete keeps historical payments intact.
  db.prepare("UPDATE bills SET active = 0 WHERE id = ?").run(bill.id);
  res.json({ ok: true });
});

// ---------- Payments (per month) ----------

app.get("/api/months/:month", (req, res) => {
  const month = req.params.month;
  if (!MONTH_RE.test(month)) return res.status(400).json({ error: "month must be YYYY-MM" });

  const bills = db
    .prepare("SELECT * FROM bills WHERE active = 1 ORDER BY due_day, name")
    .all();
  const payments = db.prepare("SELECT * FROM payments WHERE month = ?").all(month);
  const paymentsByBill = new Map(payments.map((p) => [p.bill_id, p]));

  // Also include inactive bills that were paid this month (history preservation).
  const paidInactiveBills = db
    .prepare(
      `SELECT b.* FROM bills b JOIN payments p ON p.bill_id = b.id
       WHERE b.active = 0 AND p.month = ? ORDER BY b.due_day, b.name`
    )
    .all(month);

  const allBills = [...bills, ...paidInactiveBills];
  const items = allBills.map((b) => ({ bill: b, payment: paymentsByBill.get(b.id) || null }));

  const paidCents = items.reduce((s, it) => s + (it.payment ? it.payment.amount_cents : 0), 0);
  // Remaining is based on planned amounts of unpaid bills, so an over/under actual
  // payment on one bill doesn't distort what is still owed on the others.
  const dueCents = items.reduce((s, it) => s + (it.payment ? 0 : it.bill.amount_cents), 0);
  const totalCents = paidCents + dueCents;

  // Per-member contribution vs fair share for the settle-up view.
  const members = db.prepare("SELECT * FROM members ORDER BY id").all();
  const contribution = Object.fromEntries(members.map((m) => [m.id, 0]));
  const fairShare = Object.fromEntries(members.map((m) => [m.id, 0]));
  for (const it of items) {
    const p = it.payment;
    if (p && p.paid_by_member_id != null && contribution[p.paid_by_member_id] !== undefined) {
      contribution[p.paid_by_member_id] += p.amount_cents;
    }
    if (!p) continue;
    const b = it.bill;
    if (members.length === 2) {
      const [m1, m2] = members;
      if (b.split_type === "payer") {
        const payer = b.payer_member_id ?? p.paid_by_member_id;
        if (payer != null && fairShare[payer] !== undefined) fairShare[payer] += p.amount_cents;
      } else if (b.split_type === "custom") {
        fairShare[m1.id] += Math.round((p.amount_cents * b.split_pct) / 100);
        fairShare[m2.id] += p.amount_cents - Math.round((p.amount_cents * b.split_pct) / 100);
      } else {
        const half = Math.round(p.amount_cents / 2);
        fairShare[m1.id] += half;
        fairShare[m2.id] += p.amount_cents - half;
      }
    }
  }

  res.json({
    month,
    items,
    summary: { totalCents, paidCents, dueCents },
    members,
    contribution,
    fairShare,
  });
});

app.post("/api/bills/:id/pay", (req, res) => {
  const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  const month = req.body.month || currentMonth();
  if (!MONTH_RE.test(month)) return res.status(400).json({ error: "month must be YYYY-MM" });
  const amount = req.body.amountCents != null ? Number(req.body.amountCents) : bill.amount_cents;
  if (!Number.isInteger(amount) || amount <= 0)
    return res.status(400).json({ error: "amountCents must be a positive integer" });

  db.prepare(
    `INSERT INTO payments (bill_id, month, amount_cents, paid_by_member_id)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(bill_id, month) DO UPDATE SET
       amount_cents = excluded.amount_cents,
       paid_by_member_id = excluded.paid_by_member_id,
       paid_at = datetime('now')`
  ).run(bill.id, month, amount, req.body.paidByMemberId || null);
  res.json(db.prepare("SELECT * FROM payments WHERE bill_id = ? AND month = ?").get(bill.id, month));
});

app.delete("/api/bills/:id/pay/:month", (req, res) => {
  if (!MONTH_RE.test(req.params.month))
    return res.status(400).json({ error: "month must be YYYY-MM" });
  db.prepare("DELETE FROM payments WHERE bill_id = ? AND month = ?").run(
    req.params.id,
    req.params.month
  );
  res.json({ ok: true });
});

// ---------- History (last 6 months trend) ----------

app.get("/api/history", (req, res) => {
  const rows = db
    .prepare(
      `SELECT month, SUM(amount_cents) AS paid_cents, COUNT(*) AS paid_count
       FROM payments GROUP BY month ORDER BY month DESC LIMIT 12`
    )
    .all();
  res.json(rows.reverse());
});

// ---------- Static client ----------

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Family bills app listening on http://localhost:${PORT}`);
});
