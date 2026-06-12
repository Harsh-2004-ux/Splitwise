import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../utils/api';
import { UserPlus, Search, Mail } from 'lucide-react';

export default function Friends() {
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [success, setSuccess] = useState('');

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const users = await api.users.list();
      return users.filter(u => u._id !== currentUser?._id);
    },
  });

  const filteredFriends = useMemo(() => {
    return allUsers.filter(friend => 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUsers, searchQuery]);

  const handleAddFriend = (e) => {
    e.preventDefault();
    setSuccess('');
    if (!newFriendEmail.trim()) {
      return;
    }
    // For demo, just show success message
    setSuccess('Friend added successfully!');
    setNewFriendEmail('');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 glass-card animate-pulse rounded-xl"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 glass-card animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white font-display">Friends</h2>
        <p className="hidden text-slate-400 text-sm mt-1 md:block">Manage your friends and split expenses together</p>
      </div>

      {/* Add Friend Form */}
      <div className="glass-card p-5 space-y-4 border-[#a7e7dc]/30 bg-transparent md:bg-slate-900/60 md:p-6">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <UserPlus size={18} className="text-green-400" />
          Add more friends
        </h3>
        
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleAddFriend} className="flex gap-2">
          <div className="flex-1 relative">
            <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={newFriendEmail}
              onChange={(e) => setNewFriendEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition text-sm"
          >
            Add
          </button>
        </form>
      </div>

      {/* Search Bar */}
      <div className="relative hidden md:block">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
        />
      </div>

      {/* Friends List */}
      {filteredFriends.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide px-1">
            {filteredFriends.length} Friend{filteredFriends.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {filteredFriends.map((friend) => (
              <div
                key={friend._id}
                className="glass-card p-4 flex items-center justify-between group hover:bg-slate-900/60 hover:border-green-600/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {friend.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{friend.name}</p>
                    <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-2 py-4 text-center md:glass-card md:p-12">
          <div className="relative mx-auto mb-6 h-40 w-44 rounded-[48%] bg-[#a7e7dc]">
            <div className="absolute left-7 top-5 h-28 w-16 -rotate-3 rounded-md border-4 border-white bg-[#5bc5af]" />
            <div className="absolute left-12 top-8 h-24 w-14 -rotate-12 bg-[#0f8f79]" />
            <div className="absolute right-8 bottom-4 h-20 w-10 rounded-t-full bg-[#1b9f88]" />
            <div className="absolute right-12 top-16 h-8 w-8 rounded-full bg-[#258c78]" />
            <div className="absolute left-24 top-7 h-4 w-4 rotate-45 rounded-sm bg-[#258c78]" />
            <div className="absolute left-[116px] top-10 h-3 w-3 rotate-45 rounded-sm bg-[#258c78]" />
          </div>
          <h3 className="font-semibold text-white mb-1">
            {allUsers.length === 0 ? `Welcome to Splitwise, ${currentUser?.name?.split(' ')[0] || 'there'}!` : 'No results found'}
          </h3>
          <p className="mx-auto max-w-[260px] text-slate-300 text-sm">
            {allUsers.length === 0 ? 'As you use Splitwise, friends and group mates will show here.' : 'Try adjusting your search'}
          </p>
        </div>
      )}
    </div>
  );
}

