import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Users, AlertCircle, ArrowLeft } from 'lucide-react';

export default function CreateGroup() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.groups.create(name, description),
    onSuccess: (data) => {
      // Invalidate groups lists so they refresh
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['overallBalances'] });
      // Redirect to the newly created group details
      navigate(`/group/${data._id}`);
    },
    onError: (err) => {
      setError(err.message || 'Failed to create group');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white font-display">Create Expense Group</h2>
        <p className="text-slate-400 text-sm mt-1">Create a group workspace to track and split expenses with friends.</p>
      </div>

      <div className="glass-card p-6 md:p-8">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-5 text-sm animate-slide-in">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Group Name
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ski Trip 2026, Roommates"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group sharing expenses for?"
              rows={3}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm text-slate-200 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4"
          >
            {mutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Create Group</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
