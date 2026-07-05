# Family Bills

A mobile-first web app for couples to track their monthly bills together — inspired by
[Monarch for Couples](https://www.monarch.com/for-couples).

## Features

- **Shared household** — two partners with names, emoji avatars, and colors.
- **Recurring bills** — add bills with amount, due day, category, autopay flag, usual payer,
  and notes.
- **Monthly checklist** — every month you get the full bill list grouped into
  Overdue / Upcoming / Paid. Tap the check to mark a bill paid, recording who paid it
  and the actual amount (handy for variable bills like electricity).
- **Progress ring** — see at a glance how much of the month's bills are covered.
- **Fair splitting & settle up** — each bill can be split 50/50, by a custom percentage,
  or covered entirely by the payer. The app compares what each partner actually paid
  against their fair share and tells you who owes whom.
- **Insights** — a 6-month paid trend chart and a category breakdown for the current month.
- **Month navigation** — flip back to review past months or ahead to plan next month.

## Tech stack

- **Client:** React 19 + TypeScript + Vite, plain CSS (no UI framework), mobile-first layout
  with a bottom tab bar and bottom-sheet forms.
- **Server:** Node.js + Express + better-sqlite3. Data lives in `server/data/family-bills.db`.

## Running

```bash
npm run install:all   # install server + client dependencies
npm run build         # build the client into client/dist
npm start             # serve API + built client on http://localhost:3000
```

Open http://localhost:3000 on your phone (or in a browser with mobile viewport).
Both partners can use the same URL on your home network — the data is shared in one
household database.

### Development

```bash
npm run dev:server    # Express API with auto-reload on :3000
npm run dev:client    # Vite dev server on :5173, proxies /api to :3000
```

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/household` | Household name + members |
| PUT | `/api/household` | Rename household |
| PUT | `/api/members/:id` | Update partner name/emoji/color |
| GET | `/api/bills` | List active recurring bills |
| POST | `/api/bills` | Create bill |
| PUT | `/api/bills/:id` | Update bill |
| DELETE | `/api/bills/:id` | Soft-delete bill (history preserved) |
| GET | `/api/months/:month` | Bills + payments + settle-up for `YYYY-MM` |
| POST | `/api/bills/:id/pay` | Record/replace a payment for a month |
| DELETE | `/api/bills/:id/pay/:month` | Undo a payment |
| GET | `/api/history` | Paid totals for the last 12 months |
