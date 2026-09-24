# expenses backend

Local Express + MongoDB API for the expense tracker. Speaks the same
`Expense` shape as the frontend (`src/domain/expense.ts`), so the frontend's
`ExpenseRepository` can move from `localStorage` to HTTP without further changes.

## Setup

```bash
cp .env.example .env   # adjust if your MongoDB isn't on the default port
npm install
npm run seed           # optional: insert a starter set of expenses
npm run dev            # watch mode on http://localhost:3000
```

Set `GEMINI_API_KEY` in `.env` to enable statement import
(`POST /api/import/parse`). Everything else works without it. Get a key from
[Google AI Studio](https://aistudio.google.com/apikey).

## Layout

| Path | Role |
| --- | --- |
| `src/domain/expense.ts` | Types, categories, default budgets, request validation |
| `src/env.ts` | Validated environment config |
| `src/db.ts` | MongoDB connection lifecycle (connect / getDb / disconnect) |
| `src/repositories/expenseRepository.ts` | CRUD against the `expenses` collection + indexes |
| `src/repositories/settingsRepository.ts` | Persisted budgets in the `settings` collection |
| `src/routes/expenses.ts` | Expense REST endpoints |
| `src/routes/budgets.ts` | Budget REST endpoints |
| `src/routes/import.ts` | Statement-import endpoint |
| `src/ai/client.ts` | Thin Gemini (`@google/genai`) wrapper (lazy — only errors if used without a key) |
| `src/ai/chunk.ts` | Splits statement text into ~50-line chunks |
| `src/ai/schema.ts` | zod schema for one extracted transaction |
| `src/ai/extractTransactions.ts` | Orchestrates chunk → model → validate → retry-once → merge |
| `prompts/extract.v1.txt` | The extraction prompt (plain text, versioned by filename) |
| `src/server.ts` | Wiring: JSON, CORS, error handling, graceful shutdown |
| `src/seed.ts` | `npm run seed` — starter data (`-- --force` to reset) |

## API

Base URL `http://localhost:3000`.

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `{ status: "ok" }` |
| `GET` | `/api/expenses` | — | `Expense[]`, newest first |
| `GET` | `/api/expenses/:id` | — | `Expense` or `404` |
| `POST` | `/api/expenses` | `NewExpense` | `201` + created `Expense` |
| `PATCH` | `/api/expenses/:id` | partial `NewExpense` (`note: null` clears) | updated `Expense` or `404` |
| `DELETE` | `/api/expenses/:id` | — | `204` or `404` |
| `GET` | `/api/budgets` | — | `Record<Category, number>` (defaults merged in) |
| `PUT` | `/api/budgets` | `Record<Category, number>` | saved budgets |
| `POST` | `/api/import/parse` | `{ text: string }` | `{ transactions, unparsed }` — parses only, saves nothing |

Validation failures return `400` with `{ error, details: string[] }`.
`POST /api/import/parse` returns `503` if `GEMINI_API_KEY` isn't set.

Documents store `_id` as the string UUID exposed as `id`, plus server-managed
`createdAt` / `updatedAt`.

## Categories

The fixed category list lives in one place, `categories` in
`src/domain/expense.ts` (mirrored in the frontend's `src/domain/expense.ts`):
`Groceries`, `Restaurants & Cafes`, `Transport`, `Fuel`, `Housing & Utilities`,
`Subscriptions`, `Health`, `Shopping`, `Entertainment`, `Travel`, `Income`,
`Other`. `Income` is excluded from every spending calculation on the frontend
(`calculateSpendTotal`, `summariseByCategory`) — it's for classifying incoming
transactions (salary, refunds), not for budgeting.

## Tests

```bash
npm test
```

Vitest, with `callModel` mocked (`src/ai/*.test.ts`) — covers zod validation
and the chunk-level retry/fallback logic without making real API calls.
