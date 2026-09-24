# Pocket

A personal expense tracker. Log what you spend, review it month by month, and
keep each category against a budget you set. A React front end talks to a small
Express + MongoDB API.

## Features

- **Monthly view** — a month navigator scopes every total, chart and list to the
  selected month; summary cards adapt (spent, daily average, left to spend).
- **Expenses** — add, edit and delete transactions with merchant, amount,
  category, date and an optional note.
- **Budgets** — per-category monthly budgets, editable in-app and persisted to
  the database.
- **Charts** — a 6-month spending trend (click a bar to jump to that month) and
  a category-breakdown donut, both hand-drawn SVG, no chart library.
- **Search & filter** — filter the transaction list by text and category.
- **Statement import** — paste bank statement text or upload a CSV, review the
  AI-extracted transactions (editable, one row at a time, income vs. expense
  shown by sign), and save only what you select. See [Statement import](#statement-import) below.

## Tech

| | |
|---|---|
| Front end | React 19, TypeScript, Vite |
| Back end | Express 5, MongoDB (official driver) |
| Architecture | `domain` (types + pure logic) → `application` (use-case hooks + ports) → `infrastructure` (HTTP adapters) → `presentation` (components), wired in `composition.ts` |

## Project layout

```
src/
  domain/         expense & month models, pure calculations
  application/    use-case hooks (useExpenseTracker, useBudgets, useStatementImport) + repository ports
  infrastructure/ HTTP adapters implementing the ports (http/apiClient, http/*Repository)
  presentation/   components (charts, modal, budgets view, import view, transaction list…)
  composition.ts  binds ports to adapters
backend/
  src/
    routes/       /api/expenses, /api/budgets, /api/import
    repositories/ MongoDB access
    domain/       shared expense model + request validation
    ai/           statement-extraction: Gemini client, chunking, zod schema, orchestration
  prompts/        extraction prompt (plain text, versioned)
samples/          fake statement.csv / statement.txt for trying the import feature
```

## Getting started

**Prerequisites:** Node 20+, and a MongoDB instance running locally
(`mongodb://127.0.0.1:27017` by default).

### 1. API

```bash
cd backend
npm install
cp .env.example .env
npm run seed   # optional: insert sample expenses
npm run dev    # http://localhost:3000
```

### 2. Web app

```bash
npm install
npm run dev    # http://localhost:5173
```

The app calls the API at `http://localhost:3000` by default. To point it
elsewhere, set `VITE_API_URL` (see [`.env.example`](.env.example)).

## Statement import

**How it works.** On the *Import* tab, paste statement text or upload a CSV
(read as plain text client-side — nothing is parsed as CSV in the browser).
`POST /api/import/parse` splits it into ~50-line chunks, asks Gemini to extract
each chunk as JSON (`backend/prompts/extract.v1.txt`, handling European
`DD/MM/YYYY` dates and comma-decimal amounts), and validates the response with
zod. If a chunk's response isn't valid JSON or isn't an array, it's retried
once with the validation error fed back to the model; if it still fails, that
chunk is reported as unparsed rather than failing the whole import. Individual
rows that fail validation (bad date, unknown category, …) are rejected on
their own and listed separately — one bad row never drops the rest of the
chunk. Nothing is saved by this endpoint; it only parses. The API key is
optional at boot — the rest of the app works without it, and
`POST /api/import/parse` returns a clear `503` until `GEMINI_API_KEY` is set
in `backend/.env` (get one from [Google AI Studio](https://aistudio.google.com/apikey)).

The extracted amount is **signed** (negative for money out, positive for
money in) so the review table can show income and expenses at a glance; saving
a row converts it to the app's normal unsigned `Expense.amount` plus category
(a new `Income` category was added for this). Try it with the fake data in
[`samples/`](samples).

**Fake data.** `samples/statement.csv` and `samples/statement.txt` are
entirely made up — fictional Portuguese-style merchants, amounts and dates,
generated for testing. They are not real bank data. Each includes a couple of
deliberately messy lines (a truncated merchant, a duplicate transaction, a
line of garbage) to exercise the reject/retry paths.

**Known limitations:**
- A transaction that spans a chunk boundary (rare, since chunks are ~50 lines)
  can be split or missed.
- The model can miscategorise — that's exactly what the review step and the
  category dropdown are for.
- No deduplication against transactions already saved; importing the same
  statement twice will create duplicates.
- Statement chunks for one import are parsed in parallel — a very large
  statement means several concurrent model calls.

## Scripts

**Front end:** `npm run dev` · `build` · `lint` · `preview`
**Back end:** `npm run dev` · `start` · `seed` · `typecheck` · `test`
