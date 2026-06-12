import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { X, DollarSign, Calculator, Info } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, groupId, groupMembers = [], expenseToEdit = null }) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');

  // Track checked state and values (amount, %, or shares) for each group member
  // structure: { userId: { checked: boolean, value: string } }
  const [memberSplits, setMemberSplits] = useState({});
  const [validationError, setValidationError] = useState('');

  // Reset form when modal opens or expenseToEdit changes
  useEffect(() => {
    if (isOpen) {
      setValidationError('');
      if (expenseToEdit) {
        setTitle(expenseToEdit.title);
        setAmount(expenseToEdit.amount.toString());
        setPaidBy(expenseToEdit.paidBy._id || expenseToEdit.paidBy);
        setSplitType(expenseToEdit.splitType);

        const initialSplits = {};
        groupMembers.forEach((m) => {
          const mId = m.user._id || m.user;
          const matchedSplit = expenseToEdit.splits.find((s) => (s.user._id || s.user) === mId);
          
          if (matchedSplit) {
            let val = '';
            if (expenseToEdit.splitType === 'UNEQUAL') val = matchedSplit.owedAmount.toString();
            else if (expenseToEdit.splitType === 'PERCENTAGE') {
              // Calculate percentage from owedAmount
              const pct = (matchedSplit.owedAmount / expenseToEdit.amount) * 100;
              val = Math.round(pct * 100) / 100;
            } 
            else if (expenseToEdit.splitType === 'SHARE') val = (matchedSplit.shareUnits || 1).toString();

            initialSplits[mId] = { checked: true, value: val };
          } else {
            initialSplits[mId] = { checked: false, value: '' };
          }
        });
        setMemberSplits(initialSplits);
      } else {
        setTitle('');
        setAmount('');
        setPaidBy(currentUser?._id || '');
        setSplitType('EQUAL');

        // Check everyone by default for equal split
        const initialSplits = {};
        groupMembers.forEach((m) => {
          const mId = m.user._id || m.user;
          initialSplits[mId] = { checked: true, value: '1' }; // Default value 1 for share/percent init
        });
        setMemberSplits(initialSplits);
      }
    }
  }, [isOpen, expenseToEdit, groupMembers, currentUser]);

  // Handle changes in splitType and preset values
  useEffect(() => {
    if (isOpen && !expenseToEdit) {
      setMemberSplits((prev) => {
        const updated = { ...prev };
        groupMembers.forEach((m) => {
          const mId = m.user._id || m.user;
          if (updated[mId]) {
            if (splitType === 'EQUAL') {
              updated[mId].value = '';
            } else if (splitType === 'PERCENTAGE') {
              // Set default split percent equally
              const activeCount = Object.values(updated).filter((s) => s.checked).length;
              const defaultPct = activeCount > 0 ? (100 / activeCount).toFixed(1) : '0';
              if (updated[mId].checked) {
                updated[mId].value = defaultPct;
              }
            } else if (splitType === 'SHARE') {
              if (updated[mId].checked) {
                updated[mId].value = '1';
              }
            } else if (splitType === 'UNEQUAL') {
              if (updated[mId].checked && amount) {
                const activeCount = Object.values(updated).filter((s) => s.checked).length;
                const shareAmount = activeCount > 0 ? (Number(amount) / activeCount).toFixed(2) : '0';
                updated[mId].value = shareAmount;
              } else {
                updated[mId].value = '0';
              }
            }
          }
        });
        return updated;
      });
    }
  }, [splitType, amount, isOpen]);

  const handleCheckboxToggle = (memberId) => {
    setMemberSplits((prev) => {
      const current = prev[memberId];
      const updatedChecked = !current.checked;
      
      let defaultValue = '';
      if (updatedChecked) {
        if (splitType === 'SHARE') defaultValue = '1';
        else if (splitType === 'PERCENTAGE') defaultValue = '0';
        else if (splitType === 'UNEQUAL' && amount) {
          const activeCount = Object.values(prev).filter((s) => s.checked).length + 1;
          defaultValue = (Number(amount) / activeCount).toFixed(2);
        }
      }

      return {
        ...prev,
        [memberId]: {
          checked: updatedChecked,
          value: defaultValue,
        }
      };
    });
  };

  const handleValueChange = (memberId, val) => {
    setMemberSplits((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        value: val,
      }
    }));
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.expenses.create(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['overallBalances'] });
      onClose();
    },
    onError: (err) => {
      setValidationError(err.message || 'Failed to create expense');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.expenses.update(expenseToEdit._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['overallBalances'] });
      onClose();
    },
    onError: (err) => {
      setValidationError(err.message || 'Failed to update expense');
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

    const checkedMembers = Object.keys(memberSplits).filter((mId) => memberSplits[mId].checked);
    if (checkedMembers.length === 0) {
      setValidationError('Please select at least one member to split the expense with');
      return;
    }

    // Build splitsInput for backend
    let splitsInput = [];
    if (splitType === 'EQUAL') {
      splitsInput = checkedMembers.map((mId) => ({ user: mId }));
    } else if (splitType === 'UNEQUAL') {
      let sum = 0;
      splitsInput = checkedMembers.map((mId) => {
        const val = Number(memberSplits[mId].value) || 0;
        sum += val;
        return { user: mId, value: val };
      });
      // Validate sum matches amount
      if (Math.abs(sum - numAmount) > 0.02) {
        setValidationError(`Sum of splits ($${sum.toFixed(2)}) must equal total amount ($${numAmount.toFixed(2)})`);
        return;
      }
    } else if (splitType === 'PERCENTAGE') {
      let sum = 0;
      splitsInput = checkedMembers.map((mId) => {
        const val = Number(memberSplits[mId].value) || 0;
        sum += val;
        return { user: mId, value: val };
      });
      if (Math.abs(sum - 100) > 0.05) {
        setValidationError(`Sum of percentages (${sum.toFixed(1)}%) must equal 100%`);
        return;
      }
    } else if (splitType === 'SHARE') {
      splitsInput = checkedMembers.map((mId) => {
        const val = Number(memberSplits[mId].value) || 0;
        if (val <= 0 || !Number.isInteger(val)) {
          throw new Error('Share units must be positive integers');
        }
        return { user: mId, value: val };
      });
    }

    const payload = {
      title,
      amount: numAmount,
      splitType,
      paidBy,
      splitsInput,
    };

    if (expenseToEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const totalSelectedShares = Object.keys(memberSplits)
    .filter((id) => memberSplits[id].checked)
    .reduce((sum, id) => sum + (Number(memberSplits[id].value) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-card p-6 md:p-8 relative bg-slate-900 border-slate-800 shadow-2xl animate-modal-pop max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-bold text-white mb-6 font-display">
          {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
        </h3>

        {validationError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-5 text-sm animate-slide-in">
            <Info size={16} className="flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Description / Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Groceries, Pizza night"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
            />
          </div>

          {/* Amount and PaidBy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Amount ($)
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition text-sm text-slate-200"
              >
                {groupMembers.map((m) => (
                  <option key={m.user._id || m.user} value={m.user._id || m.user} className="bg-slate-900">
                    {m.user.name} {(m.user._id || m.user) === currentUser?._id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Split Option
            </label>
            <div className="flex bg-slate-950/40 p-1 rounded-xl border border-slate-800/80">
              {['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    splitType === type
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type === 'PERCENTAGE' ? '%' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Individual Splits Setup */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Split Details
            </label>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {groupMembers.map((member) => {
                const memberId = member.user._id || member.user;
                const split = memberSplits[memberId] || { checked: false, value: '' };

                // Calculate preview dollars
                let previewAmount = 0;
                const totalAmt = Number(amount) || 0;

                if (split.checked) {
                  if (splitType === 'EQUAL') {
                    const activeCount = Object.values(memberSplits).filter((s) => s.checked).length;
                    previewAmount = activeCount > 0 ? totalAmt / activeCount : 0;
                  } else if (splitType === 'UNEQUAL') {
                    previewAmount = Number(split.value) || 0;
                  } else if (splitType === 'PERCENTAGE') {
                    previewAmount = (Number(split.value) / 100) * totalAmt;
                  } else if (splitType === 'SHARE') {
                    const shares = Number(split.value) || 0;
                    previewAmount = totalSelectedShares > 0 ? (shares / totalSelectedShares) * totalAmt : 0;
                  }
                }

                return (
                  <div 
                    key={memberId} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${
                      split.checked 
                        ? 'bg-slate-800/40 border-slate-700/80 shadow-sm' 
                        : 'bg-transparent border-transparent opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={split.checked}
                        onChange={() => handleCheckboxToggle(memberId)}
                        className="w-4 h-4 rounded text-green-600 bg-slate-900 border-slate-750 focus:ring-green-600"
                      />
                      <div className="truncate">
                        <span className="text-sm font-semibold text-white truncate block">
                          {member.user.name}
                        </span>
                        <span className="text-xxs text-slate-500 truncate block">
                          {member.user.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Interactive input box based on splitType */}
                      {split.checked && splitType !== 'EQUAL' && (
                        <div className="relative w-24">
                          <input
                            type="number"
                            step={splitType === 'PERCENTAGE' ? '0.1' : splitType === 'UNEQUAL' ? '0.01' : '1'}
                            value={split.value}
                            onChange={(e) => handleValueChange(memberId, e.target.value)}
                            className="w-full text-right bg-slate-950/60 border border-slate-800 rounded-lg py-1 px-2 pr-7 text-xs text-white focus:border-green-600 focus:ring-0 outline-none"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-500">
                            {splitType === 'PERCENTAGE' ? '%' : splitType === 'SHARE' ? 'sh' : '$'}
                          </span>
                        </div>
                      )}

                      {/* Split Share Preview tag */}
                      {split.checked && (
                        <span className="text-xs font-semibold text-slate-400 min-w-[55px] text-right bg-slate-950/30 px-2.5 py-1 rounded-lg border border-slate-800/50">
                          ${previewAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 btn-primary text-sm py-3 flex items-center justify-center gap-2"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>{expenseToEdit ? 'Save Changes' : 'Add Expense'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
