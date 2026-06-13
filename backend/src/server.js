import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import groupRoutes from './routes/groups.js';
import expenseRoutes from './routes/expenses.js';
import commentRoutes from './routes/comments.js';
import importRoutes from './routes/imports.js';

// Load Environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: '*', // In production, replace with specific frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.io Server
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Attach io to the request object so routes can broadcast events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', expenseRoutes);
app.use('/api', commentRoutes);
app.use('/api', importRoutes);

app.get('/', (req, res) => {
  res.send('Splitwise Clone API is running');
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Join group channel for real-time notifications
  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group room: ${groupId}`);
  });

  // Leave group channel
  socket.on('leaveGroup', (groupId) => {
    socket.leave(groupId);
    console.log(`User ${socket.id} left group room: ${groupId}`);
  });

  // Join expense channel for realtime expense comments
  socket.on('joinExpense', (expenseId) => {
    socket.join(expenseId);
    console.log(`User ${socket.id} joined expense room: ${expenseId}`);
  });

  // Leave expense channel
  socket.on('leaveExpense', (expenseId) => {
    socket.leave(expenseId);
    console.log(`User ${socket.id} left expense room: ${expenseId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
