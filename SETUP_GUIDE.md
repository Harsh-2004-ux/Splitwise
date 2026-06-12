# Splitwise Clone - Setup & Configuration Guide

## 📦 Project Overview

This is a full-stack Splitwise clone with JWT authentication, real-time Socket.io features, and MongoDB backend.

**Tech Stack:**

- **Backend**: Node.js + Express + Mongoose + Socket.io
- **Frontend**: React + Vite + TailwindCSS v3 + Zustand + React Query
- **Database**: MongoDB (Local or Cloud)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm installed
- **MongoDB** (local installation, Docker, or MongoDB Atlas cloud)
- **Git** (to clone the repository)

---

## 📥 Step 1: Clone the Repository

```bash
git clone https://github.com/Harsh-2004-ux/Splitwise.git
cd Splitwise
```

---

## 🔧 Step 2: Backend Setup

### 2.1 Install Backend Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment Variables

Create a `.env` file in the `backend/` directory with the following content:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Connection String
# Replace with your MongoDB URI:
# - Local: mongodb://localhost:27017/splitwise
# - Atlas: mongodb+srv://username:password@cluster.mongodb.net/splitwise?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/splitwise

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
```

**Environment Variables Reference:**
| Variable | Example | Notes |
|----------|---------|-------|
| `PORT` | `5000` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/splitwise` | MongoDB connection URI |
| `JWT_SECRET` | `strong_random_string` | JWT signing secret (⚠️ Change in production) |

### 2.3 Connect MongoDB

**Option A: Local MongoDB Installation**

```bash
# On Windows, if MongoDB is installed as a service
# It should already be running. Verify:
mongosh --eval "db.runCommand({ ping: 1 })"
```

**Option B: Docker Compose (if available)**

```bash
cd .. # Go back to root
docker-compose up -d  # Starts MongoDB on port 27017
```

**Option C: MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string
3. Update `MONGODB_URI` in `.env` with your Atlas URI

### 2.4 Start Backend Server

```bash
npm run dev
```

Expected output:

```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

---

## 🎨 Step 3: Frontend Setup

### 3.1 Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 3.2 Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Environment Variables Reference:**
| Variable | Example | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Socket.io server URL |

### 3.3 Start Frontend Server

```bash
npm run dev
```

Expected output:

```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## ✅ Step 4: Verify Installation

### Backend Verification

1. Open `http://localhost:5000` in your browser
   - Expected: "Splitwise Clone API is running"

2. Check MongoDB connection in terminal output
   - Expected: "MongoDB Connected: localhost"

### Frontend Verification

1. Open `http://localhost:5173` in your browser
2. You should see the Splitwise login page
3. Try signing up with test credentials

### Real-time Testing

1. Open the application in **two different browser tabs**
2. Create a group and add an expense in one tab
3. Verify the change appears **instantly** in the other tab (Socket.io working ✓)

---

## 📁 Project Structure

```
Splitwise/
├── backend/
│   ├── package.json
│   ├── .env.example          # Reference for environment variables
│   ├── src/
│   │   ├── server.js         # Express + Socket.io entry point
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # JWT authentication
│   │   └── utils/            # Split engine & debt simplifier
│   └── node_modules/         # Installed packages (git ignored)
│
├── frontend/
│   ├── package.json
│   ├── .env.example          # Reference for environment variables
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── App.jsx           # Router configuration
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── store/            # Zustand state management
│   │   └── utils/            # API & Socket.io utilities
│   └── node_modules/         # Installed packages (git ignored)
│
├── docker-compose.yml        # Optional MongoDB container
├── .gitignore                # Git ignore rules
└── README.md                 # Documentation
```

---

## 🔐 Security Notes

### ⚠️ Before Production

1. **Change JWT_SECRET**: Use a strong random string (min 32 characters)

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update CORS**: In `backend/src/server.js`, replace:

   ```javascript
   origin: "*"; // Allows any origin
   ```

   With your frontend URL:

   ```javascript
   origin: "https://yourdomain.com";
   ```

3. **MongoDB Security**: If using Atlas, set IP whitelist and use strong passwords

4. **Environment Variables**: Never commit `.env` files. They are git-ignored.

---

## 🛠️ Available Scripts

### Backend

```bash
npm run dev    # Start with nodemon (auto-reload on changes)
npm start      # Start production server
```

### Frontend

```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run lint    # Run ESLint
npm run preview # Preview production build
```

---

## 📊 Database Schema

### Users

- `name`: String
- `email`: String (unique)
- `passwordHash`: String
- `createdAt`: Date

### Groups

- `name`: String
- `description`: String (optional)
- `createdBy`: ObjectId (User)
- `members`: Array of {user, role, joinedAt}
- `createdAt`: Date

### Expenses

- `groupId`: ObjectId (Group)
- `paidBy`: ObjectId (User)
- `title`: String
- `amount`: Number
- `splitType`: String (EQUAL, UNEQUAL, PERCENTAGE, SHARE)
- `splits`: Array of {user, owedAmount, shareUnits}
- `createdAt`: Date

### Settlements

- `groupId`: ObjectId (Group)
- `payerId`: ObjectId (User)
- `payeeId`: ObjectId (User)
- `amount`: Number
- `note`: String
- `settledAt`: Date

### Comments

- `expenseId`: ObjectId (Expense)
- `userId`: ObjectId (User)
- `message`: String
- `createdAt`: Date

---

## 🐛 Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Ensure MongoDB is running. Check with `mongosh` or start Docker container.

### Port Already in Use

```
Error: listen EADDRINUSE :::5000
```

**Solution**: Change PORT in `.env` or kill process using port 5000.

### CORS Error on Frontend

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Ensure `VITE_API_URL` and backend CORS match. Restart both servers.

### Socket.io Not Connecting

```
WebSocket connection failed
```

**Solution**: Verify `VITE_SOCKET_URL` matches backend Socket.io URL.

---

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Groups

- `GET /api/groups` - List all user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/members` - Add member to group

### Expenses

- `GET /api/expenses/group/:groupId` - List group expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/groups/:groupId/balances` - Get group balances
- `GET /api/summary` - Get user's overall summary

### Comments

- `GET /api/comments/expense/:expenseId` - Get expense comments
- `POST /api/comments` - Add comment to expense

### Settlements

- `POST /api/expenses/settle` - Record settlement payment

---

## 📝 Example: Create & Test Expense

### 1. Register & Login

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'
```

### 2. Get Auth Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### 3. Create Group

```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Trip","description":"Summer vacation"}'
```

### 4. Create Expense (Equal Split)

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "groupId":"GROUP_ID",
    "title":"Lunch",
    "amount":60,
    "splitType":"EQUAL",
    "splits":[
      {"user":"USER_ID_1","owedAmount":20},
      {"user":"USER_ID_2","owedAmount":20},
      {"user":"USER_ID_3","owedAmount":20}
    ]
  }'
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push to remote: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 License

MIT License - Feel free to use and modify

---

## ❓ Support

For issues or questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [API Endpoints](#-api-endpoints) documentation
3. Open an issue on GitHub

**Happy splitting!** 💰
