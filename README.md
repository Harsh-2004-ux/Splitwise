# Splitwise Clone - Shared Expense Importer & Debt Settler

A full-stack Splitwise-style app with JWT authentication, groups, dated memberships, custom split types, settlements, balance simplification, real-time comments, and a CSV importer for the provided `expenses_export.csv`.

## Tech Stack

- Frontend: React (Vite), TailwindCSS, Zustand, React Query, Socket.io-client
- Backend: Node.js, Express, Mongoose, Socket.io
- Database: MongoDB

Assignment note: the current implementation still uses MongoDB, while the assignment asks for relational DBs only. The import feature and anomaly reporting are implemented, but persistence should be migrated to PostgreSQL/SQLite before a strict final submission.

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Core Features

1. Sign up, log in, and authenticate with JWT.
2. Create groups and manage members.
3. Track member join/leave dates for imported data.
4. Create expenses with equal, unequal, percentage, and share splits.
5. Record settlements and calculate simplified balances.
6. Import `expenses_export.csv` without editing the file by hand.
7. Store and show a row-by-row import report with anomalies and actions.

## Importing the Assignment CSV

1. Register or log in.
2. Create/open the flatmates group.
3. Click **Import CSV** on the group page.
4. Select the provided `expenses_export.csv`.
5. Open the **Import report** tab to review every anomaly and action.

The importer is implemented in `backend/src/utils/csvImportEngine.js`.
