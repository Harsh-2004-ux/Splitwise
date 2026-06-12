import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { socket } from '../utils/socket';
import { useAuthStore } from '../store/useAuthStore';
import { X, Calendar, DollarSign, MessageSquare, Send, User } from 'lucide-react';

export default function ExpenseDetailModal({ isOpen, onClose, expense, groupId }) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const chatBottomRef = useRef(null);

  const expenseId = expense?._id;

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', expenseId],
    queryFn: () => api.comments.list(expenseId),
    enabled: !!expenseId && isOpen,
  });

  // Connect socket and listen to real-time events
  useEffect(() => {
    if (isOpen && expenseId) {
      socket.connect();
      socket.emit('joinExpense', expenseId);

      const handleNewComment = (newComment) => {
        // Optimistically add comment to query cache
        queryClient.setQueryData(['comments', expenseId], (old = []) => {
          if (old.some((c) => c._id === newComment._id)) return old;
          return [...old, newComment];
        });
      };

      socket.on('comment:new', handleNewComment);

      return () => {
        socket.emit('leaveExpense', expenseId);
        socket.off('comment:new', handleNewComment);
        socket.disconnect();
      };
    }
  }, [isOpen, expenseId, queryClient]);

  // Scroll to chat bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isOpen]);

  const postCommentMutation = useMutation({
    mutationFn: (msg) => api.comments.create(expenseId, msg),
    onSuccess: (newComment) => {
      setMessage('');
      // Update local query cache immediately
      queryClient.setQueryData(['comments', expenseId], (old = []) => {
        if (old.some((c) => c._id === newComment._id)) return old;
        return [...old, newComment];
      });
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    postCommentMutation.mutate(message.trim());
  };

  if (!isOpen || !expense) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-card relative bg-slate-900 border-slate-800 shadow-2xl animate-modal-pop flex flex-col md:flex-row max-h-[85vh] overflow-hidden rounded-3xl">
        
        {/* Left Side: Expense Details */}
        <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-800/80 overflow-y-auto">
          <button 
            onClick={onClose}
            className="md:hidden absolute top-5 right-5 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>

          <div className="space-y-6">
            <div>
              <span className="text-xxs font-bold bg-green-600/10 text-green-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Split breakdown ({expense.splitType})
              </span>
              <h3 className="text-xl font-extrabold text-white mt-3 font-display break-words">
                {expense.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                <Calendar size={13} />
                <span>{formatDate(expense.createdAt)}</span>
              </div>
            </div>

            {/* Amount & Paid By Summary */}
            <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Paid By</span>
                <span className="text-sm font-semibold text-white mt-0.5 block truncate max-w-[150px]">
                  {expense.paidBy.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Total Cost</span>
                <span className="text-lg font-black text-green-600 mt-0.5 block">
                  ${expense.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Splits list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Share Breakdowns</h4>
              <div className="space-y-2">
                {expense.splits.map((split) => {
                  const isPayer = (split.user._id || split.user) === (expense.paidBy._id || expense.paidBy);
                  const isCurrent = (split.user._id || split.user) === currentUser?._id;
                  
                  return (
                    <div 
                      key={split._id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50 flex-shrink-0">
                          <User size={14} />
                        </div>
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {split.user.name} {isCurrent ? '(You)' : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">${split.owedAmount.toFixed(2)}</span>
                        {split.shareUnits !== null && (
                          <span className="text-[10px] text-slate-500 block">
                            {split.shareUnits} share{split.shareUnits > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Chat Comments */}
        <div className="flex-1 flex flex-col bg-slate-950/40 h-[400px] md:h-auto overflow-hidden relative">
          <button 
            onClick={onClose}
            className="hidden md:block absolute top-5 right-5 z-20 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-2 bg-slate-900/30">
            <MessageSquare size={16} className="text-green-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Expense Chat</h4>
          </div>

          {/* Chat Messages Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => {
                const isMyMessage = (comment.userId._id || comment.userId) === currentUser?._id;
                
                return (
                  <div 
                    key={comment._id} 
                    className={`flex flex-col max-w-[80%] ${
                      isMyMessage ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-slate-500 mb-0.5 px-1">
                      {isMyMessage ? 'You' : comment.userId.name}
                    </span>
                    <div 
                      className={`p-3 rounded-2xl text-xs break-words border ${
                        isMyMessage 
                          ? 'bg-green-600 text-white border-green-400/20 rounded-tr-none' 
                          : 'bg-slate-900 text-slate-200 border-slate-800 rounded-tl-none'
                      }`}
                    >
                      {comment.message}
                    </div>
                    <span className="text-[8px] text-slate-600 mt-1 px-1">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <MessageSquare size={24} className="opacity-30" />
                <span className="text-xxs italic">No comments. Ask a question or start discussion!</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Box */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question or comment..."
              className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:border-green-600 focus:ring-0 outline-none placeholder:text-slate-500"
            />
            <button 
              type="submit"
              disabled={!message.trim() || postCommentMutation.isPending}
              className="w-8 h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-all duration-150 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
