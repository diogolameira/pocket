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
  application/    use-case hooks (useExpenseTracker, useBudgets) + repository ports
  infrastructure/ HTTP adapters implementing the ports (http/apiClient, http/*Repository)
  presentation/   components (charts, modal, budgets view, transaction list…)
  composition.ts  binds ports to adapters
backend/
  src/
    routes/       /api/expenses, /api/budgets
    repositories/ MongoDB access
    domain/       shared expense model + request validation
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

## Scripts

**Front end:** `npm run dev` · `build` · `lint` · `preview`
**Back end:** `npm run dev` · `start` · `seed` · `typecheck`
