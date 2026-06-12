import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { 
  Home, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  DollarSign, 
  Plus, 
  ChevronRight,
  TrendingUp,
  User
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch groups list for the sidebar
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: api.groups.list,
    enabled: !!user,
  });

  // Fetch overall balances for top bar
  const { data: balances } = useQuery({
    queryKey: ['overallBalances'],
    queryFn: api.balances.overallBalances,
    enabled: !!user,
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isGroupActive = (groupId) => location.pathname === `/group/${groupId}`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/60 text-slate-300">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800/60">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500 text-white font-bold text-xl shadow-lg shadow-brand-500/20">
          $
        </div>
        <div>
          <span className="font-extrabold text-white text-lg tracking-tight font-display">Splitwise</span>
          <span className="text-xs block text-brand-400 font-semibold tracking-wider uppercase">Monetize Split</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
        <div className="space-y-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive('/') 
                ? 'bg-brand-500 text-white font-medium shadow-md shadow-brand-500/10' 
                : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home size={18} />
              <span>Dashboard</span>
            </div>
            <ChevronRight size={14} className={isActive('/') ? 'opacity-100' : 'opacity-0'} />
          </Link>
        </div>

        {/* Groups segment */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-4">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">My Groups</span>
            <Link 
              to="/create-group" 
              className="p-1 rounded-md text-brand-500 hover:bg-brand-500/10 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <Plus size={16} />
            </Link>
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-slate-500 animate-pulse">Loading groups...</div>
            ) : groups && groups.length > 0 ? (
              groups.map((group) => (
                <Link
                  key={group._id}
                  to={`/group/${group._id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isGroupActive(group._id)
                      ? 'bg-slate-800 text-brand-400 border border-slate-750 font-semibold shadow-inner'
                      : 'hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500/80"></div>
                    <span className="truncate">{group.name}</span>
                  </div>
                  <ChevronRight size={12} className={isGroupActive(group._id) ? 'opacity-100' : 'opacity-0'} />
                </Link>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 italic">No groups created yet</div>
            )}
          </div>
        </div>
      </nav>

      {/* User profile & Log out */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/20">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-700/60 shadow-sm">
            <User size={18} />
          </div>
          <div className="truncate">
            <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-[0.98] transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen text-slate-200 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900/30 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-850 hover:text-slate-200"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-bold text-white font-display hidden md:block">
              {isActive('/') ? 'My Financial Dashboard' : 'Group Workspace'}
            </h1>
            <span className="text-lg font-bold text-white font-display md:hidden">Splitwise</span>
          </div>

          {/* Quick Balance Header Bar */}
          {balances && (
            <div className="flex items-center gap-4 text-xs font-semibold md:text-sm">
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500">Net:</span>
                <span className={balances.netBalance >= 0 ? 'text-brand-500' : 'text-red-500'}>
                  {balances.netBalance >= 0 ? '+' : ''}${balances.netBalance}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-slide-in">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div 
        className={`md:hidden fixed inset-y-0 left-0 w-64 transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-out z-50`}
      >
        {sidebarContent}
      </div>
    </div>
  );
}
