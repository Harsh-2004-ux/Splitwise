# API Endpoints Reference - Splitwise Clone

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

---

## Authentication Endpoints

### Register New User

```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

Response (201):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-06-12T10:30:00.000Z"
  }
}
```

### Login User

```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}

Response (401):
{
  "message": "Invalid credentials"
}
```

### Get Current User Profile

```
GET /auth/me
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-06-12T10:30:00.000Z"
}

Response (401):
{
  "message": "Not authorized"
}
```

---

## Groups Endpoints

### List User's Groups

```
GET /groups
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "groups": [
    {
      "_id": "607f1f77bcf86cd799439012",
      "name": "Trip",
      "description": "Summer vacation",
      "createdBy": "507f1f77bcf86cd799439011",
      "members": [
        {
          "user": "507f1f77bcf86cd799439011",
          "role": "admin",
          "joinedAt": "2024-06-12T10:30:00.000Z"
        },
        {
          "user": "508f1f77bcf86cd799439012",
          "role": "member",
          "joinedAt": "2024-06-12T11:00:00.000Z"
        }
      ],
      "createdAt": "2024-06-12T10:30:00.000Z"
    }
  ]
}
```

### Get Specific Group

```
GET /groups/:groupId
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "_id": "607f1f77bcf86cd799439012",
  "name": "Trip",
  "description": "Summer vacation",
  "createdBy": "507f1f77bcf86cd799439011",
  "members": [...],
  "createdAt": "2024-06-12T10:30:00.000Z"
}

Response (404):
{
  "message": "Group not found"
}
```

### Create New Group

```
POST /groups
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Weekend Trip",
  "description": "Beach getaway with friends"
}

Response (201):
{
  "_id": "607f1f77bcf86cd799439013",
  "name": "Weekend Trip",
  "description": "Beach getaway with friends",
  "createdBy": "507f1f77bcf86cd799439011",
  "members": [
    {
      "user": "507f1f77bcf86cd799439011",
      "role": "admin",
      "joinedAt": "2024-06-12T12:00:00.000Z"
    }
  ],
  "createdAt": "2024-06-12T12:00:00.000Z"
}
```

### Update Group

```
PUT /groups/:groupId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description"
}

Response (200):
{
  "_id": "607f1f77bcf86cd799439012",
  "name": "Updated Group Name",
  "description": "Updated description",
  ...
}

Response (403):
{
  "message": "Only group creator can update"
}
```

### Delete Group

```
DELETE /groups/:groupId
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "message": "Group deleted successfully"
}

Response (403):
{
  "message": "Only group creator can delete"
}
```

### Add Member to Group

```
POST /groups/:groupId/members
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "email": "newmember@example.com"
}

Response (200):
{
  "_id": "607f1f77bcf86cd799439012",
  "name": "Trip",
  "members": [
    ...
    {
      "user": "508f1f77bcf86cd799439013",
      "role": "member",
      "joinedAt": "2024-06-12T13:00:00.000Z"
    }
  ]
}

Response (404):
{
  "message": "User not found"
}
```

---

## Expenses Endpoints

### Create Expense (with splits)

```
POST /expenses
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "groupId": "607f1f77bcf86cd799439012",
  "title": "Lunch at restaurant",
  "amount": 60,
  "paidBy": "507f1f77bcf86cd799439011",
  "splitType": "EQUAL",
  "splits": [
    {
      "user": "507f1f77bcf86cd799439011",
      "owedAmount": 20
    },
    {
      "user": "508f1f77bcf86cd799439012",
      "owedAmount": 20
    },
    {
      "user": "508f1f77bcf86cd799439013",
      "owedAmount": 20
    }
  ]
}

Response (201):
{
  "_id": "609f1f77bcf86cd799439014",
  "groupId": "607f1f77bcf86cd799439012",
  "title": "Lunch at restaurant",
  "amount": 60,
  "paidBy": "507f1f77bcf86cd799439011",
  "splitType": "EQUAL",
  "splits": [...],
  "createdAt": "2024-06-12T14:00:00.000Z"
}
```

### Split Type Examples

**EQUAL Split:**

```
"splitType": "EQUAL",
"splits": [
  {"user": "userId1", "owedAmount": 20},
  {"user": "userId2", "owedAmount": 20},
  {"user": "userId3", "owedAmount": 20}
]
// Total: 60 ÷ 3 people
```

**UNEQUAL Split (exact amounts):**

```
"splitType": "UNEQUAL",
"splits": [
  {"user": "userId1", "owedAmount": 30},
  {"user": "userId2", "owedAmount": 15},
  {"user": "userId3", "owedAmount": 15}
]
// Must sum to total expense amount
```

**PERCENTAGE Split:**

```
"amount": 100,
"splitType": "PERCENTAGE",
"splits": [
  {"user": "userId1", "owedAmount": 50},    // 50%
  {"user": "userId2", "owedAmount": 30},    // 30%
  {"user": "userId3", "owedAmount": 20}     // 20%
]
// Percentages must sum to 100
```

**SHARE Split (weighted distribution):**

```
"amount": 100,
"splitType": "SHARE",
"splits": [
  {"user": "userId1", "owedAmount": 50, "shareUnits": 2},   // 2 shares = 50
  {"user": "userId2", "owedAmount": 33.33, "shareUnits": 1},// 1 share = 33.33
  {"user": "userId3", "owedAmount": 16.67, "shareUnits": 0.5} // 0.5 shares = 16.67
]
// Distribution based on share units
```

### List Group Expenses

```
GET /expenses/group/:groupId
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "expenses": [
    {
      "_id": "609f1f77bcf86cd799439014",
      "groupId": "607f1f77bcf86cd799439012",
      "title": "Lunch at restaurant",
      "amount": 60,
      "paidBy": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "splitType": "EQUAL",
      "splits": [...],
      "createdAt": "2024-06-12T14:00:00.000Z"
    }
  ]
}
```

### Get Expense Details

```
GET /expenses/:expenseId
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "_id": "609f1f77bcf86cd799439014",
  "groupId": "607f1f77bcf86cd799439012",
  "title": "Lunch at restaurant",
  "amount": 60,
  "paidBy": {...},
  "splitType": "EQUAL",
  "splits": [...],
  "createdAt": "2024-06-12T14:00:00.000Z"
}
```

### Update Expense

```
PUT /expenses/:expenseId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Updated expense title",
  "amount": 75,
  "splits": [...]
}

Response (200):
{
  // Updated expense object
}

Response (403):
{
  "message": "Only the person who paid can edit"
}
```

### Delete Expense

```
DELETE /expenses/:expenseId
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "message": "Expense deleted successfully"
}

Response (403):
{
  "message": "Only the person who paid can delete"
}
```

### Get Group Balances (Simplified Debts)

```
GET /groups/:groupId/balances
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "balances": [
    {
      "fromUser": {
        "_id": "508f1f77bcf86cd799439012",
        "name": "Alice",
        "email": "alice@example.com"
      },
      "toUser": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 25,
      "description": "Alice owes John $25"
    },
    {
      "fromUser": {
        "_id": "508f1f77bcf86cd799439013",
        "name": "Bob",
        "email": "bob@example.com"
      },
      "toUser": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 15,
      "description": "Bob owes John $15"
    }
  ]
}
```

### Get User Summary (All Groups)

```
GET /summary
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "totalOwed": 100,      // Total you owe others
  "totalOwedToYou": 250, // Total others owe you
  "netBalance": 150,     // Net amount you're owed
  "groups": [
    {
      "groupId": "607f1f77bcf86cd799439012",
      "groupName": "Trip",
      "balance": 50        // Your net balance in this group
    },
    {
      "groupId": "608f1f77bcf86cd799439013",
      "groupName": "Apartment",
      "balance": 100
    }
  ]
}
```

### Record Settlement (Payment)

```
POST /expenses/settle
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "groupId": "607f1f77bcf86cd799439012",
  "payerId": "508f1f77bcf86cd799439012",
  "payeeId": "507f1f77bcf86cd799439011",
  "amount": 25,
  "note": "Paid via Venmo"
}

Response (201):
{
  "_id": "60af1f77bcf86cd799439015",
  "groupId": "607f1f77bcf86cd799439012",
  "payerId": "508f1f77bcf86cd799439012",
  "payeeId": "507f1f77bcf86cd799439011",
  "amount": 25,
  "note": "Paid via Venmo",
  "settledAt": "2024-06-12T15:00:00.000Z"
}
```

---

## Comments Endpoints

### Add Comment to Expense

```
POST /comments
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "expenseId": "609f1f77bcf86cd799439014",
  "message": "Should we split the tax equally?"
}

Response (201):
{
  "_id": "60bf1f77bcf86cd799439016",
  "expenseId": "609f1f77bcf86cd799439014",
  "userId": "507f1f77bcf86cd799439011",
  "message": "Should we split the tax equally?",
  "createdAt": "2024-06-12T15:30:00.000Z"
}
```

### Get Expense Comments

```
GET /comments/expense/:expenseId
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "comments": [
    {
      "_id": "60bf1f77bcf86cd799439016",
      "expenseId": "609f1f77bcf86cd799439014",
      "userId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "message": "Should we split the tax equally?",
      "createdAt": "2024-06-12T15:30:00.000Z"
    }
  ]
}
```

---

## Socket.io Real-time Events

### Client to Server Events

**Join Group Room:**

```javascript
socket.emit("joinGroup", groupId);
```

**Leave Group Room:**

```javascript
socket.emit("leaveGroup", groupId);
```

**Join Expense Chat:**

```javascript
socket.emit("joinExpense", expenseId);
```

**Leave Expense Chat:**

```javascript
socket.emit("leaveExpense", expenseId);
```

### Server to Client Events

**New Expense Created:**

```javascript
// Event: 'expense:created'
{
  expenseId: '609f1f77bcf86cd799439014',
  title: 'Lunch',
  amount: 60,
  createdAt: '2024-06-12T14:00:00.000Z'
}
```

**Group Balance Updated:**

```javascript
// Event: 'balance:updated'
{
  groupId: '607f1f77bcf86cd799439012',
  balances: [...]
}
```

**New Comment Posted:**

```javascript
// Event: 'comment:new'
{
  _id: '60bf1f77bcf86cd799439016',
  expenseId: '609f1f77bcf86cd799439014',
  userId: '507f1f77bcf86cd799439011',
  message: 'Should we split the tax equally?',
  createdAt: '2024-06-12T15:30:00.000Z'
}
```

---

## Error Responses

All endpoints follow this error response format:

### 400 Bad Request

```json
{
  "message": "Invalid input data",
  "errors": ["Field is required", "Invalid email format"]
}
```

### 401 Unauthorized

```json
{
  "message": "Not authorized"
}
```

### 403 Forbidden

```json
{
  "message": "Permission denied"
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token is obtained from `/auth/register` or `/auth/login` endpoints.

---

## Testing Tools

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

1. Import the endpoints as a Postman Collection
2. Set `{{BASE_URL}}` to `http://localhost:5000/api`
3. Set `{{TOKEN}}` from login response
4. Use `Bearer {{TOKEN}}` in Authorization tab

### Using Thunder Client (VS Code Extension)

Similar to Postman, create a collection with these endpoints.
