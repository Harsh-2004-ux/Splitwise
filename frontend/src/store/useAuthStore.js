import { create } from 'zustand';

const getInitialUser = () => {
  try {
    const user = localStorage.getItem('splitwise_user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('splitwise_token') || null,
  isAuthenticated: !!localStorage.getItem('splitwise_token'),
  
  setAuth: (user, token) => {
    localStorage.setItem('splitwise_token', token);
    localStorage.setItem('splitwise_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  
  clearAuth: () => {
    localStorage.removeItem('splitwise_token');
    localStorage.removeItem('splitwise_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      const newUser = state.user ? { ...state.user, ...updatedFields } : null;
      if (newUser) {
        localStorage.setItem('splitwise_user', JSON.stringify(newUser));
      }
      return { user: newUser };
    });
  }
}));
