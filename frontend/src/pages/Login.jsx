import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../utils/api';
import { Mail, Lock, User, ShieldAlert, ArrowRight, Check, X, Loader } from 'lucide-react';

export default function Login() {
  // Component starts here
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        if (!name) {
          throw new Error('Name is required');
        }
        // Register only - don't auto-login
        data = await api.auth.register(name, email, password);
        setSuccess('Account created! Please sign in with your credentials.');
        // Reset form and switch to sign-in tab
        setTimeout(() => {
          setName('');
          setEmail('');
          setPassword('');
          setIsRegister(false);
          setSuccess('');
        }, 2000);
      } else {
        // Sign-in - navigate to dashboard
        data = await api.auth.login(email, password);
        setAuth(data, data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setUsersLoading(true);
    try {
      // Fetch all registered users
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const userData = await response.json();
      setUsers(userData);
      setShowUserModal(true);
    } catch (err) {
      setError('Failed to load users. Please try again.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSelectUser = async (selectedEmail) => {
    setError('');
    setLoading(true);
    try {
      // For demo: use a test password. In production, use actual OAuth or prompt for password
      const testPassword = 'test123'; // Demo password for quick testing
      const data = await api.auth.login(selectedEmail, testPassword);
      setAuth(data, data.token);
      setShowUserModal(false);
      navigate('/');
    } catch (err) {
      setError(`Failed to login as ${selectedEmail}. Please use email/password login instead.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#070b19]">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-600/10 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 text-white font-extrabold text-3xl shadow-xl shadow-green-600/25 mb-4">
            $
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Splitwise
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            Split expenses easily with friends
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 bg-slate-900/50 border border-slate-800/80 shadow-2xl animate-fade-in">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                !isRegister 
                  ? 'border-green-600 text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                isRegister 
                  ? 'border-green-600 text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-5 text-sm animate-slide-in">
              <ShieldAlert size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 p-3.5 rounded-xl mb-5 text-sm animate-slide-in">
              <Check size={16} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-green-600/15 hover:shadow-green-600/25 active:scale-[0.98] mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {!isRegister && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900/50 text-slate-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-slate-200 font-medium py-3 rounded-xl transition active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            className="text-green-400 hover:text-green-300 font-semibold"
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        <p className="text-center text-slate-600 text-xs mt-4 space-x-2">
          <a href="#" className="hover:text-slate-400">Terms</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-400">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-400">Contact us</a>
        </p>
      </div>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-96 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Select Account</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-4">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size={24} className="animate-spin text-green-600" />
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user.email)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-700/50 hover:border-green-600 hover:bg-green-600/10 transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center group-hover:bg-green-600/30 transition">
                        <Mail size={18} className="text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 truncate">{user.name}</p>
                        <p className="text-sm text-slate-400 truncate">{user.email}</p>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-green-400 transition flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">No users found. Create an account first.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 p-4">
              <button
                onClick={() => setShowUserModal(false)}
                className="w-full px-4 py-2 text-slate-400 hover:text-slate-200 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
