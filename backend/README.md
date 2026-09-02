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

Validation failures return `400` with `{ error, details: string[] }`.

Documents store `_id` as the string UUID exposed as `id`, plus server-managed
`createdAt` / `updatedAt`.
