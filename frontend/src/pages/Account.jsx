import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LogOut,
  Mail,
  Bell,
  Lock,
  Palette,
  Star,
  HelpCircle,
  QrCode,
  Edit,
  Camera
} from 'lucide-react';

export default function Account() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      clearAuth();
      navigate('/login');
    }
  };

  const handleEditProfile = async () => {
    // For now, just toggle edit mode
    // In production, this would update the backend
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-extrabold text-white font-display">Account</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your profile and preferences</p>
      </div>

      {/* User Profile Card */}
      <div className="bg-transparent p-0 md:glass-card md:p-6 md:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-sky-300 via-sky-700 to-slate-950 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
              <span className="absolute -bottom-1 -right-1 rounded-md border-2 border-[#202124] bg-white p-0.5 text-slate-800">
                <Camera size={13} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full font-bold text-white text-lg bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-1.5 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                />
              ) : (
                <h3 className="font-bold text-white text-lg">{user?.name}</h3>
              )}
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <Mail size={12} />
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleEditProfile}
            className="rounded-lg px-2 py-1 text-sm font-medium text-[#1cc29f] transition hover:bg-white/10 md:bg-slate-800/60 md:p-2 md:text-slate-400 md:hover:bg-slate-700 md:hover:text-slate-200"
          >
            <span className="md:hidden">Edit</span>
            <Edit size={18} className="hidden md:block" />
          </button>
        </div>
      </div>

      {/* Pro Upgrade Card */}
      <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-700 to-purple-950 p-6 space-y-4 md:glass-card">
        <div className="space-y-2">
          <h3 className="font-bold text-white">Do more with Splitwise Pro</h3>
          <p className="text-sm text-slate-400">
            Get advanced features like expense categories, custom currencies, and more.
          </p>
        </div>
        <button className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition">
          Get Splitwise Pro
        </button>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide px-1">
          Quick Actions
        </h3>
        <div className="flex items-center gap-5 p-2 cursor-pointer group hover:bg-white/5 transition-all md:glass-card md:p-4">
          <QrCode size={20} className="text-slate-400 group-hover:text-green-400 transition" />
          <span className="font-medium text-slate-100">Scan code</span>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide px-1">
          Preferences
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-5 p-2 cursor-pointer group hover:bg-white/5 transition-all md:glass-card md:p-4">
            <Mail size={20} className="text-slate-400 group-hover:text-green-400 transition flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-300">Email settings</p>
              <p className="text-xs text-slate-500">Manage notification preferences</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-2 cursor-pointer group hover:bg-white/5 transition-all md:glass-card md:p-4">
            <Bell size={20} className="text-slate-400 group-hover:text-green-400 transition flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-300">Device and push notifications</p>
              <p className="text-xs text-slate-500">Configure alerts and reminders</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-2 cursor-pointer group hover:bg-white/5 transition-all md:glass-card md:p-4">
            <Lock size={20} className="text-slate-400 group-hover:text-green-400 transition flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-300">Security</p>
              <p className="text-xs text-slate-500">Change password and 2FA</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-2 cursor-pointer group hover:bg-white/5 transition-all md:glass-card md:p-4">
            <Palette size={20} className="text-slate-400 group-hover:text-green-400 transition flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-300">Appearance</p>
              <p className="text-xs text-slate-500">Dark mode, theme customization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide px-1">
          Feedback
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-5 p-2 cursor-pointer group hover:bg-white/5 transition-all md:glass-card md:p-4">
            <Star size={20} className="text-slate-400 group-hover:text-green-400 transition" />
            <span className="font-medium text-slate-300">Rate Splitwise</span>
          </div>

          <div className="flex items-center gap-5 p-2 cursor-pointer group hover:bg-white/5 transition-all md:glass-card md:p-4">
            <HelpCircle size={20} className="text-slate-400 group-hover:text-green-400 transition" />
            <span className="font-medium text-slate-300">Contact Splitwise support</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-5 border-t border-white/10 p-3 cursor-pointer group hover:bg-red-600/10 transition-all md:glass-card md:p-4 md:border"
      >
        <LogOut size={20} className="text-red-500 group-hover:text-red-400 transition" />
        <span className="font-medium text-red-500 group-hover:text-red-400 transition">Log out</span>
      </button>

      {/* Footer */}
      <div className="text-center space-y-2 text-xs text-slate-500 pt-4">
        <p>Made with ❤️ in Providence, RI, USA</p>
        <p>Copyright © 2026 Splitwise Clone, Inc.</p>
        <div className="flex items-center justify-center gap-2">
          <a href="#" className="hover:text-slate-400 transition">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-400 transition">Terms of Service</a>
        </div>
        <p className="text-slate-600">v2.6.5.9/940</p>
      </div>
    </div>
  );
}
