# AI Context — Splitwise Clone Reference Document

This is the living source of truth for the Splitwise Clone application. Keep this updated after making any architectural changes.

---

## 1. Directory Structure

```
Splitwise/
├── docker-compose.yml       # Local MongoDB container orchestrator
├── README.md                # System installation & run guidelines
├── AI_CONTEXT.md            # Architecture & Schemas (this file)
├── BUILD_PLAN.md            # Detailed build process log
├── AI_PROMPTS.md            # Prompts used during development
├── backend/
│   ├── package.json
│   ├── .env                 # Server ports, JWT secret, DB URI
│   └── src/
│       ├── server.js        # Express and Socket.io bootstrapper
│       ├── config/
│       │   └── db.js        # Database connector
│       ├── middleware/
│       │   └── auth.js      # JWT extraction and validation
│       ├── models/
│       │   ├── User.js      # Credentials and dates
│       │   ├── Group.js     # Group meta and member roles
│       │   ├── Expense.js   # Main expense & inline splits array
│       │   ├── Settlement.js# Recording payment transactions
│       │   └── Comment.js   # Chat messages on expenses
│       ├── routes/
│       │   ├── auth.js      # Authentication endpoints
│       │   ├── groups.js    # Groups CRUD & memberships
│       │   ├── expenses.js  # Expenses calculations & settlements
│       │   └── comments.js  # Expense chat comments
│       └── utils/
│           ├── splitEngine.js    # Mathematical splits calculator
│           └── debtSimplifier.js # Greedy debt simplifier
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx         # App mounting & QueryClient setup
        ├── App.jsx          # React Router layout paths
        ├── index.css        # Tailwind directives and glassmorphic tokens
        ├── components/
        │   ├── Layout.jsx   # Header, mobile drawer & navigation sidebar
        │   ├── AddExpenseModal.jsx     # Equal/Unequal/Share split inputs
        │   ├── SettleUpModal.jsx       # Record payment form
        │   └── ExpenseDetailModal.jsx  # Expense breakdowns & live chat
        ├── store/
        │   └── useAuthStore.js # Zustand authentication store
        ├── pages/
        │   ├── Login.jsx        # Auth registration / log-in forms
        │   ├── Dashboard.jsx    # Stats summaries & groups grids
        │   ├── CreateGroup.jsx  # Group creation form
        │   └── GroupDetail.jsx  # Primary workspace (Expenses, Balances, Logs)
        └── utils/
            ├── api.js       # Centralized Fetch wrapper with headers
            └── socket.js    # Socket.io connection instance
```

---

## 2. Database Collection Schemas (MongoDB / Mongoose)

### Users (`User`)
* `name`: String (required, trimmed)
* `email`: String (required, unique, lowercase, trimmed)
* `passwordHash`: String (required)
* `createdAt`: Date (default: `Date.now`)

### Groups (`Group`)
* `name`: String (required, trimmed)
* `description`: String (trimmed)
* `createdBy`: ObjectId -> `User` (required)
* `members`: Array of:
  * `user`: ObjectId -> `User` (required)
  * `role`: String (`admin` | `member`, default: `member`)
  * `joinedAt`: Date (default: `Date.now`)
* `createdAt`: Date (default: `Date.now`)

### Expenses (`Expense`)
* `groupId`: ObjectId -> `Group` (required)
* `paidBy`: ObjectId -> `User` (required)
* `title`: String (required, trimmed)
* `amount`: Number (required, min 0.01)
* `splitType`: String (`EQUAL` | `UNEQUAL` | `PERCENTAGE` | `SHARE`)
* `splits`: Array of:
  * `user`: ObjectId -> `User` (required)
  * `owedAmount`: Number (required)
  * `shareUnits`: Number (optional)
* `createdAt`: Date (default: `Date.now`)

### Settlements (`Settlement`)
* `groupId`: ObjectId -> `Group` (required)
* `payerId`: ObjectId -> `User` (required)
* `payeeId`: ObjectId -> `User` (required)
* `amount`: Number (required, min 0.01)
* `note`: String (trimmed)
* `settledAt`: Date (default: `Date.now`)

### Comments (`Comment`)
* `expenseId`: ObjectId -> `Expense` (required)
* `userId`: ObjectId -> `User` (required)
* `message`: String (required, trimmed)
* `createdAt`: Date (default: `Date.now`)

---

## 3. REST API Routing Endpoints

| Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new user | Public |
| `POST` | `/api/auth/login` | Authenticate & get token | Public |
| `GET` | `/api/auth/me` | Fetch logged-in user profile | Private |
| `GET` | `/api/groups` | List user's groups | Private |
| `GET` | `/api/groups/:id` | Fetch specific group meta | Private |
| `POST` | `/api/groups` | Create group | Private |
| `POST` | `/api/groups/:id/members` | Add user to group by email | Private |
| `DELETE`| `/api/groups/:id/members/:uid` | Remove member | Private |
| `GET` | `/api/groups/:id/expenses` | List group expenses | Private |
| `POST` | `/api/groups/:id/expenses` | Add expense + splits | Private |
| `PUT` | `/api/expenses/:id` | Update expense + splits | Private |
| `DELETE`| `/api/expenses/:id` | Delete expense | Private |
| `GET` | `/api/groups/:id/balances` | Get group balance positions & transfers | Private |
| `GET` | `/api/users/me/balances` | Get user net balances globally | Private |
| `GET` | `/api/groups/:id/settlements` | Get recorded group settlements | Private |
| `POST` | `/api/groups/:id/settlements` | Record a payment | Private |
| `GET` | `/api/expenses/:expenseId/comments` | Fetch chat comments | Private |
| `POST` | `/api/expenses/:expenseId/comments` | Post chat comment | Private |

---

## 4. WebSocket Real-time System

### Connection
The socket client connects to the Express port `http://localhost:5000` (or VITE_SOCKET_URL in production).

### Event Subscriptions
* `joinGroup`: Join room identified by `groupId`.
* `leaveGroup`: Leave room identified by `groupId`.
* `joinExpense`: Join room identified by `expenseId`.
* `leaveExpense`: Leave room identified by `expenseId`.

### Event Broadcasts (Server -> Client)
* `expense:created`: Broadcasts the full populated expense object to group room `groupId` when added.
* `balance:updated`: Broadcasts `{ groupId }` trigger to update balance list feeds.
* `comment:new`: Broadcasts the full populated comment object to expense room `expenseId` when a new comment is posted.
