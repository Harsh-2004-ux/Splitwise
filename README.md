# Splitwise Clone — Premium Expense Sharing & Debt Settler

A full-stack, real-time Splitwise clone with JWT authentication, custom expense-splitting structures (Equal, Unequal, Percentages, and Shares), automated greedy debt simplification, and interactive expense chats.

## Tech Stack
* **Frontend**: React (Vite) + TailwindCSS v3 + Zustand (State) + React Query (Fetching) + Socket.io-client (Realtime)
* **Backend**: Node.js + Express + Mongoose + Socket.io
* **Database**: MongoDB (Local or Atlas Cloud)

---

## Getting Started

### 1. Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### 2. Set Up Database
You can run MongoDB in any of these ways:
1. **Docker Compose (Recommended)**: Spin up a local MongoDB container using:
   ```bash
   docker-compose up -d
   ```
2. **Local MongoDB**: Ensure you have MongoDB running locally at `mongodb://localhost:27017/splitwise`.
3. **MongoDB Atlas**: Provide your cloud connection URI in the `.env` configuration.

---

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your local environmental variables file:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to match your port and MONGODB_URI.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend developer server:
   ```bash
   npm run dev
   ```

The backend server will launch at `http://localhost:5000`.

---

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite developer server:
   ```bash
   npm run dev
   ```

The frontend client will launch at `http://localhost:5173`. Open this URL in multiple browser windows to test real-time Socket.io expense chat synchronization!

---

## Core Features
1. **Sign In / Sign Up**: Authentication secured with `bcryptjs` password hashing and token-based JWT headers.
2. **Group Workspaces**: Create groups and invite friends by entering their email address.
3. **Split Engines**:
   * **Equal**: Splits costs evenly, adjusting rounding penny differences.
   * **Unequal**: Splits exact customized dollar amounts per participant.
   * **Percentage**: Allocates shares by custom percentages (sums to 100%).
   * **Share**: Allocates shares dynamically based on weight items (e.g. 1 share vs 3 shares).
4. **Debt Simplification**: Greedy matching algorithm that calculates minimal payments required to settle group debts (e.g., instead of A paying B and B paying C, A directly pays C).
5. **Real-time Chat**: Discussion timeline built inside each expense modal, powered by Socket.io rooms.
