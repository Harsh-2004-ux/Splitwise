import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('splitwise_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    // If unauthorized, clear auth store
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  auth: {
    register: (name, email, password) => 
      apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    login: (email, password) => 
      apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    getMe: () => apiFetch('/auth/me'),
  },

  groups: {
    list: () => apiFetch('/groups'),
    get: (id) => apiFetch(`/groups/${id}`),
    create: (name, description) => 
      apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      }),
    addMember: (groupId, email) => 
      apiFetch(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    removeMember: (groupId, userId) => 
      apiFetch(`/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      }),
  },

  expenses: {
    list: (groupId) => apiFetch(`/groups/${groupId}/expenses`),
    create: (groupId, { title, amount, splitType, splitsInput, paidBy }) => 
      apiFetch(`/groups/${groupId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({ title, amount, splitType, splitsInput, paidBy }),
      }),
    update: (id, data) => 
      apiFetch(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) => 
      apiFetch(`/expenses/${id}`, {
        method: 'DELETE',
      }),
  },

  balances: {
    groupBalances: (groupId) => apiFetch(`/groups/${groupId}/balances`),
    overallBalances: () => apiFetch('/users/me/balances'),
  },

  settlements: {
    create: (groupId, { payerId, payeeId, amount, note }) => 
      apiFetch(`/groups/${groupId}/settlements`, {
        method: 'POST',
        body: JSON.stringify({ payerId, payeeId, amount, note }),
      }),
    list: (groupId) => apiFetch(`/groups/${groupId}/settlements`),
  },

  comments: {
    list: (expenseId) => apiFetch(`/expenses/${expenseId}/comments`),
    create: (expenseId, message) => 
      apiFetch(`/expenses/${expenseId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  }
};
