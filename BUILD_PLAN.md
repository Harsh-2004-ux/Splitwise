# Build Plan - Splitwise Clone

This document logs the research, design decisions, and implementation timeline for the Splitwise Clone project.

---

## 1. Context & Architectural Decisions

### Switch to MongoDB
Initially, PostgreSQL + Prisma was proposed. However, the plan was updated to **MongoDB** + **Mongoose** to align database transactions and schema structure with local setup ease. Using Mongoose avoids the MongoDB replica set requirement of Prisma (which is necessary for transactions in Prisma), allowing smooth local development.

### Embedded Document Model
Instead of storing splits in a separate collection, expense splits are embedded inside the `Expense` collection as a subdocument array. This allows atomicity: creating or updating an expense and its splits is accomplished in a single document write.

---

## 2. Implementation History

### Phase 0: Planning & Setup
* Verified Node.js environment (v22.12.0) and git versioning.
* Created root `.gitignore` to protect environment files and ignore `node_modules/`.
* Created local database orchestrator (`docker-compose.yml`) for MongoDB.

### Phase 1: Backend Foundation
* Scaffolded backend module and installed core packages (Express, Mongoose, JWT, bcryptjs, Socket.io).
* Created database connector (`db.js`) and environment properties.
* Designed schemas: `User`, `Group`, `Expense`, `Settlement`, `Comment`.
* Programmed JWT token signature helper and private authorization middleware.
* Built Authentication APIs (Register, Login, profile fetch) and Groups CRUD APIs.

### Phase 2: Expenses Core & Logic
* Implemented **Split Engine** (`splitEngine.js`):
  * Calculates EQUAL splits, handling dividing penny remainders.
  * Validates UNEQUAL sums to match total expense.
  * Validates PERCENTAGE sums to 100% and computes decimal values.
  * Allocates SHARE weights dynamically.
* Implemented **Debt Simplification** (`debtSimplifier.js`):
  * Summarizes net ledger positions across all expenses and settlements.
  * Isolates debtors and creditors.
  * Sorts values and greedily matches largest pairs, generating a minimal settlement path.
* Exposed endpoints: List expenses, Create expense (triggers split engine), Edit/Delete expenses, get Group Balances (triggers simplifier), get User Overall Summary, and Settlement recording.

### Phase 3: Frontend Scaffolding & Components
* Scaffolder React + Vite JavaScript template inside `frontend/`.
* Configured TailwindCSS v3 custom theme styles and glassmorphism UI variables inside `index.css`.
* Integrated state management via **Zustand** (`useAuthStore.js`) and fetching hooks via **React Query** (`main.jsx`).
* Programmed global layouts sidebar navigation and user indicator profiles (`Layout.jsx`).
* Developed Pages:
  * `Login.jsx`: registration and login forms with sliding panels.
  * `Dashboard.jsx`: global credit/debt summaries and group grids.
  * `CreateGroup.jsx`: form to create group workspaces.
  * `GroupDetail.jsx`: tabbed navigation for expenses, simplified balances, and logs.
* Developed Modals:
  * `AddExpenseModal.jsx`: split calculator matching engine.
  * `SettleUpModal.jsx`: settle up transaction logs.
  * `ExpenseDetailModal.jsx`: expense split items and chat.

### Phase 4: Sockets Realtime Integration
* Configured backend Socket.io connection handshakes and group/expense room allocations in `server.js`.
* Broadcasted events: `expense:created`, `balance:updated`, `comment:new`.
* Client socket connection setup in `socket.js`.
* Enabled real-time discussion timeline within `ExpenseDetailModal.jsx`.
