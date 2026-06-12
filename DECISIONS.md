# DECISIONS.md - Project Decision Log

This file records the significant technical and product decisions made during the Splitwise Clone project.

## Decision 1: Use MongoDB with Mongoose

### Options Considered

1. PostgreSQL with Prisma
2. MongoDB with Mongoose

### Decision

MongoDB with Mongoose was selected.

### Reason

MongoDB was easier to run locally and matched the user's preference. Mongoose also gave a simple way to model users, groups, expenses, settlements, and comments without requiring Prisma transaction setup or a MongoDB replica set.

## Decision 2: Store Expense Splits as Embedded Documents

### Options Considered

1. Store splits in a separate collection
2. Store splits inside the `Expense` document

### Decision

Splits are embedded inside each expense document.

### Reason

Expense splits are normally created, read, and updated together with the expense. Embedding them reduces extra database lookups and keeps the expense record self-contained.

## Decision 3: Use JWT Authentication

### Options Considered

1. Session-based authentication
2. JWT-based authentication

### Decision

JWT authentication was selected.

### Reason

JWT works well for a React frontend and Express API. It keeps the backend stateless and allows the frontend to attach the token in API headers.

## Decision 4: Hash Passwords with bcryptjs

### Options Considered

1. Store plain passwords
2. Hash passwords before storing

### Decision

Passwords are hashed with `bcryptjs`.

### Reason

Plain passwords are unsafe. Hashing protects user credentials even if the database is exposed.

## Decision 5: Support Multiple Split Types

### Options Considered

1. Equal split only
2. Equal and unequal split
3. Equal, unequal, percentage, and share splits

### Decision

The project supports `EQUAL`, `UNEQUAL`, `PERCENTAGE`, and `SHARE` split types.

### Reason

These split modes match real Splitwise-style use cases. They allow simple bills, exact custom amounts, percentage-based division, and weighted shares.

## Decision 6: Use Cent-Based Money Calculation

### Options Considered

1. Use normal JavaScript decimal arithmetic directly
2. Convert money to cents during calculations

### Decision

The split engine converts money to cents during calculation.

### Reason

JavaScript floating-point arithmetic can produce inaccurate money totals. Cent-based calculation helps prevent rounding mistakes and ensures splits add back to the original expense total.

## Decision 7: Use a Greedy Debt Simplification Algorithm

### Options Considered

1. Show all direct debts from every expense
2. Calculate net balances and simplify payments

### Decision

The project calculates net balances and uses a greedy algorithm to suggest minimal settlements.

### Reason

This creates a cleaner user experience. Instead of many small payments, users get a simplified list of who should pay whom.

## Decision 8: Use Socket.io for Real-Time Updates

### Options Considered

1. Poll the API repeatedly
2. Use WebSockets through Socket.io

### Decision

Socket.io was selected.

### Reason

Expense updates and comments should appear quickly across browser tabs. Socket.io rooms make it easy to send group events only to users viewing that group or expense.

## Decision 9: Use React Query for Server State

### Options Considered

1. Store all API data in local React state
2. Use React Query for fetched data

### Decision

React Query was selected.

### Reason

React Query handles loading, caching, refetching, and server synchronization cleanly.

## Decision 10: Use Zustand for Auth State

### Options Considered

1. React Context
2. Redux
3. Zustand

### Decision

Zustand was selected.

### Reason

The app only needs lightweight global state for authentication. Zustand is simpler than Redux and avoids unnecessary boilerplate.

## Decision 11: Keep CSV Import Out of Scope

### Options Considered

1. Build a CSV ingestion pipeline
2. Focus on real-time expense entry through UI and API

### Decision

CSV import was kept out of scope for this version.

### Reason

The implemented project is an interactive Splitwise clone. Its main workflows are group creation, expense entry, balance calculation, settlement, and chat. Data quality is handled through form/API validation instead of CSV import validation.
