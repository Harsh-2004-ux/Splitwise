import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { X, DollarSign, Send, Info } from 'lucide-react';

export default function SettleUpModal({ 
  isOpen, 
  onClose, 
  groupId, 
  groupMembers = [], 
  defaultPayerId = '', 
  defaultPayeeId = '', 
  defaultAmount = '' 
}) {
  const queryClient = useQueryClient();

  const [payerId, setPayerId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValidationError('');
      setPayerId(defaultPayerId || (groupMembers[0]?.user?._id || groupMembers[0]?.user || ''));
      setPayeeId(defaultPayeeId || (groupMembers[1]?.user?._id || groupMembers[1]?.user || ''));
      setAmount(defaultAmount ? defaultAmount.toString() : '');
      setNote('');
    }
  }, [isOpen, defaultPayerId, defaultPayeeId, defaultAmount, groupMembers]);

  const mutation = useMutation({
    mutationFn: (data) => api.settlements.create(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['overallBalances'] });
      onClose();
    },
    onError: (err) => {
      setValidationError(err.message || 'Failed to record settlement payment');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid amount greater than 0');
      return;
    }

    if (!payerId) {
      setValidationError('Please select who paid');
      return;
    }

    if (!payeeId) {
      setValidationError('Please select who received the money');
      return;
    }

    if (payerId === payeeId) {
      setValidationError('Payer and payee cannot be the same person');
      return;
    }

    mutation.mutate({
      payerId,
      payeeId,
      amount: numAmount,
      note,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card p-6 md:p-8 relative bg-slate-900 border-slate-800 shadow-2xl animate-modal-pop">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-bold text-white mb-6 font-display flex items-center gap-2">
          <span>Record a Payment</span>
        </h3>

        {validationError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-5 text-sm animate-slide-in">
            <Info size={16} className="flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Payer selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Who Paid? (Debtor)
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm text-slate-200"
            >
              {groupMembers.map((m) => (
                <option key={m.user._id || m.user} value={m.user._id || m.user} className="bg-slate-900">
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payee selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Who Was Paid? (Creditor)
            </label>
            <select
              value={payeeId}
              onChange={(e) => setPayeeId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm text-slate-200"
            >
              {groupMembers.map((m) => (
                <option key={m.user._id || m.user} value={m.user._id || m.user} className="bg-slate-900">
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Payment Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm text-slate-200"
              />
            </div>
          </div>

          {/* Memo / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Sent via Venmo, paid cash"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm text-slate-200"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary text-sm py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 btn-primary text-sm py-3 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Record Settle</span>
                  <Send size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
