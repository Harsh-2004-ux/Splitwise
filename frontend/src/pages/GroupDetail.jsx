import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Users, 
  DollarSign, 
  Plus, 
  ArrowLeft, 
  UserPlus, 
  Trash2, 
  Edit3, 
  MessageSquare,
  History,
  Info,
  Check,
  Upload,
  FileText
} from 'lucide-react';

import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import ExpenseDetailModal from '../components/ExpenseDetailModal';

export default function GroupDetail() {
  const { id: groupId } = useParams();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balances' | 'settlements' | 'import'
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [importError, setImportError] = useState('');

  // Modals visibility states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // States to pass data to modals
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // Default settle values
  const [settlePayer, setSettlePayer] = useState('');
  const [settlePayee, setSettlePayee] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  // 1. Queries
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.groups.get(groupId),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => api.expenses.list(groupId),
  });

  const { data: balanceData, isLoading: balancesLoading } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => api.balances.groupBalances(groupId),
  });

  const { data: settlements = [], isLoading: settlementsLoading } = useQuery({
    queryKey: ['settlements', groupId],
    queryFn: () => api.settlements.list(groupId),
  });

  const { data: importReport, isLoading: importLoading } = useQuery({
    queryKey: ['importReport', groupId],
    queryFn: () => api.imports.latest(groupId),
  });

  // 2. Mutations
  const inviteMutation = useMutation({
    mutationFn: (email) => api.groups.addMember(groupId, email),
    onSuccess: () => {
      setInviteEmail('');
      setInviteSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      setTimeout(() => setInviteSuccess(false), 3000);
    },
    onError: (err) => {
      setInviteError(err.message || 'Failed to add member');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId) => api.expenses.delete(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['overallBalances'] });
    }
  });

  const importMutation = useMutation({
    mutationFn: ({ csvText, fileName }) => api.imports.create(groupId, { csvText, fileName }),
    onSuccess: () => {
      setImportError('');
      setActiveTab('import');
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['importReport', groupId] });
      queryClient.invalidateQueries({ queryKey: ['overallBalances'] });
    },
    onError: (err) => {
      setImportError(err.message || 'Import failed');
      setActiveTab('import');
    },
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess(false);
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(inviteEmail.trim());
  };

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (e, exp) => {
    e.stopPropagation(); // Avoid opening details modal
    setExpenseToEdit(exp);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (e, expId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(expId);
    }
  };

  const handleOpenSettleSuggested = (from, to, amount) => {
    setSettlePayer(from);
    setSettlePayee(to);
    setSettleAmount(amount);
    setIsSettleModalOpen(true);
  };

  const handleOpenSettleGeneral = () => {
    setSettlePayer('');
    setSettlePayee('');
    setSettleAmount('');
    setIsSettleModalOpen(true);
  };

  const handleOpenExpenseDetails = (exp) => {
    setSelectedExpense(exp);
    setIsDetailModalOpen(true);
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      const csvText = await file.text();
      importMutation.mutate({ csvText, fileName: file.name });
    } catch (err) {
      setImportError(err.message || 'Could not read CSV file');
      setActiveTab('import');
    } finally {
      event.target.value = '';
    }
  };

  const isLoading = groupLoading || expensesLoading || balancesLoading || settlementsLoading || importLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 glass-card animate-pulse"></div>
        <div className="h-60 glass-card animate-pulse"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-bold text-white">Group Not Found</h3>
        <p className="text-slate-400 mt-2">The group you are trying to view does not exist or you lack permission.</p>
        <Link to="/" className="btn-primary inline-block mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  // Find user's balance in this group
  const myBalanceInfo = balanceData?.balances?.find(
    (b) => (b.user?._id || b.user) === currentUser?._id
  );
  const myBalance = myBalanceInfo ? myBalanceInfo.balance : 0;

  return (
    <div className="space-y-8">
      {/* Header / Back to Dashboard */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display truncate max-w-md">
              {group.name}
            </h2>
            {group.description && (
              <p className="text-slate-400 text-sm mt-1">{group.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <label className="btn-secondary flex items-center gap-2 text-sm py-2 cursor-pointer">
              <Upload size={16} />
              <span>{importMutation.isPending ? 'Importing...' : 'Import CSV'}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvUpload}
                disabled={importMutation.isPending}
                className="hidden"
              />
            </label>

            <button 
              onClick={handleOpenSettleGeneral}
              className="btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <DollarSign size={16} />
              <span>Settle Debt</span>
            </button>
            
            <button 
              onClick={handleOpenAddExpense}
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Column (Main panel / Sidebar invite & members list) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Tabs and workspace list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            {['expenses', 'balances', 'settlements', 'import'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-all capitalize ${
                  activeTab === tab
                    ? 'border-green-600 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'settlements' ? 'settlements log' : tab === 'import' ? 'import report' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content: Expenses List */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {expenses.length > 0 ? (
                expenses.map((expense) => {
                  const isOwner = (expense.paidBy._id || expense.paidBy) === currentUser?._id;
                  const mySplit = expense.splits.find((s) => (s.user._id || s.user) === currentUser?._id);

                  return (
                    <div
                      key={expense._id}
                      onClick={() => handleOpenExpenseDetails(expense)}
                      className="glass-card p-4 flex items-center justify-between cursor-pointer group hover:bg-slate-900/60 hover:border-green-600/15 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex flex-col items-center justify-center border border-slate-700/50 flex-shrink-0 group-hover:bg-slate-750 transition-colors">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {new Date(expense.createdAt).toLocaleDateString([], { month: 'short' })}
                          </span>
                          <span className="text-sm font-black text-white leading-none mt-0.5">
                            {new Date(expense.createdAt).toLocaleDateString([], { day: '2-digit' })}
                          </span>
                        </div>

                        <div className="truncate">
                          <h4 className="font-bold text-white text-sm group-hover:text-green-400 transition-colors truncate">
                            {expense.title}
                          </h4>
                          <span className="text-xxs text-slate-500 mt-1 block">
                            Paid by <span className="font-medium text-slate-400">{expense.paidBy.name}</span>
                          </span>
                        </div>
                      </div>

                      {/* Expense summary costings */}
                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <span className="text-xxs text-slate-500 block">Total Cost</span>
                          <span className="text-sm font-extrabold text-white">${expense.amount.toFixed(2)}</span>
                        </div>

                        <div className="text-right min-w-[70px]">
                          {mySplit ? (
                            <>
                              <span className="text-xxs text-slate-500 block">Your Share</span>
                              <span className={`text-xs font-semibold ${isOwner ? 'text-green-600' : 'text-slate-300'}`}>
                                ${mySplit.owedAmount.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xxs text-slate-500 italic block">Not involved</span>
                          )}
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => handleOpenEditExpense(e, expense)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-600/10 transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteExpense(e, expense._id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="glass-card p-10 text-center text-slate-500 italic text-sm">
                  No expenses added yet. Click "Add Expense" to get started.
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Balances & Debt Simplification */}
          {activeTab === 'balances' && (
            <div className="space-y-6">
              
              {/* Suggested Settlements Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Suggested Transfers (Simplified)</h3>
                {balanceData?.suggestedSettlements && balanceData.suggestedSettlements.length > 0 ? (
                  <div className="space-y-2.5">
                    {balanceData.suggestedSettlements.map((settle, idx) => {
                      const isCurrentDebtor = settle.from === currentUser?._id;
                      const isCurrentCreditor = settle.to === currentUser?._id;

                      return (
                        <div 
                          key={idx} 
                          className="glass-card p-4 flex items-center justify-between border-slate-800/80 bg-slate-900/20"
                        >
                          <div className="text-sm text-slate-300 flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white">{settle.fromUser.name}</span>
                            <span className="text-slate-500 text-xs">owes</span>
                            <span className="font-bold text-white">{settle.toUser.name}</span>
                            <span className="text-slate-500 text-xs">:</span>
                            <span className="font-extrabold text-green-600 text-base">${settle.amount.toFixed(2)}</span>
                          </div>

                          <button
                            onClick={() => handleOpenSettleSuggested(settle.from, settle.to, settle.amount)}
                            className="btn-primary text-xs py-1.5 shadow-none"
                          >
                            Settle Up
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center text-slate-500 text-xs italic">
                    Group is fully settled up! No transfers needed.
                  </div>
                )}
              </div>

              {/* Group Members Net Balances Positions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Net Position Matrix</h3>
                <div className="space-y-2">
                  {balanceData?.balances?.map((bal) => (
                    <div 
                      key={bal.user._id} 
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/20 border border-slate-800/40 text-sm"
                    >
                      <span className="font-semibold text-slate-200">
                        {bal.user.name} {(bal.user._id || bal.user) === currentUser?._id ? '(You)' : ''}
                      </span>
                      {bal.balance > 0 ? (
                        <span className="text-green-600 font-bold bg-green-600/10 px-2 py-0.5 rounded-md text-xs">
                          Owed: +${bal.balance.toFixed(2)}
                        </span>
                      ) : bal.balance < 0 ? (
                        <span className="text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-md text-xs">
                          Owes: -${Math.abs(bal.balance).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md text-xs font-semibold">
                          Settled
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Settlements Log */}
          {activeTab === 'settlements' && (
            <div className="space-y-4">
              {settlements.length > 0 ? (
                settlements.map((settle) => (
                  <div 
                    key={settle._id} 
                    className="glass-card p-4 flex items-center justify-between border-slate-850 bg-slate-950/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-600/15 text-green-600 flex items-center justify-center flex-shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-200">
                          <span className="font-bold">{settle.payerId.name}</span>
                          <span className="text-slate-500 mx-1">paid</span>
                          <span className="font-bold">{settle.payeeId.name}</span>
                          <span className="font-extrabold text-white ml-2">${settle.amount.toFixed(2)}</span>
                        </p>
                        {settle.note && (
                          <p className="text-xs text-slate-500 italic mt-0.5">"{settle.note}"</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {new Date(settle.settledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="glass-card p-10 text-center text-slate-500 italic text-sm">
                  No settlements recorded yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              {importError && (
                <div className="glass-card p-4 border-red-500/30 bg-red-500/10 text-sm text-red-200">
                  {importError}
                </div>
              )}

              {!importReport ? (
                <div className="glass-card p-10 text-center text-slate-500 italic text-sm">
                  Upload expenses_export.csv to generate the row-by-row import report.
                </div>
              ) : (
                <>
                  <div className="glass-card p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText size={16} className="text-green-500" />
                          <span>{importReport.fileName}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Imported {new Date(importReport.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <div>{importReport.summary?.acceptedExpenses || 0} expenses</div>
                        <div>{importReport.summary?.settlements || 0} settlements</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                      {[
                        ['Rows', importReport.summary?.totalRows || 0],
                        ['Anomalies', importReport.summary?.anomalyCount || 0],
                        ['Skipped', importReport.summary?.skippedRows || 0],
                        ['Rejected', importReport.summary?.rejectedRows || 0],
                        ['Accepted', importReport.summary?.acceptedExpenses || 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-slate-950/30 border border-slate-800/60 p-3">
                          <div className="text-slate-500">{label}</div>
                          <div className="text-white font-extrabold mt-1">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {importReport.rows?.map((row) => (
                      <div key={row.rowNumber} className="glass-card p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs text-slate-500">Row {row.rowNumber}</div>
                            <h4 className="font-bold text-sm text-white">{row.description}</h4>
                            <p className="text-xs text-slate-400 mt-1">{row.action}</p>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${
                            row.status === 'accepted' ? 'bg-green-600/15 text-green-400' :
                            row.status === 'adjusted' ? 'bg-amber-500/15 text-amber-300' :
                            row.status === 'settlement' ? 'bg-sky-500/15 text-sky-300' :
                            row.status === 'rejected' ? 'bg-red-500/15 text-red-300' :
                            'bg-slate-700/60 text-slate-300'
                          }`}>
                            {row.status}
                          </span>
                        </div>

                        {row.anomalies?.length > 0 && (
                          <div className="space-y-2">
                            {row.anomalies.map((item, idx) => (
                              <div key={`${row.rowNumber}-${item.code}-${idx}`} className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3 text-xs">
                                <div className="font-bold text-slate-200">{item.code}</div>
                                <div className="text-slate-400 mt-1">{item.message}</div>
                                <div className="text-green-300 mt-1">{item.action}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Column: Sidebar (Invite form and member list) */}
        <div className="space-y-6">
          {/* Invite Member form */}
          <div className="glass-card p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserPlus size={14} className="text-green-600" />
              <span>Invite Member</span>
            </h4>

            {inviteError && (
              <div className="text-xxs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="text-xxs text-green-400 bg-green-600/10 border border-green-600/20 p-2 rounded-lg">
                Member added successfully!
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@email.com"
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-green-600 focus:ring-0 outline-none"
              />
              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="btn-primary text-xs py-2 px-3 shadow-none flex items-center justify-center"
              >
                {inviteMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Add</span>
                )}
              </button>
            </form>
          </div>

          {/* Members list */}
          <div className="glass-card p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users size={14} className="text-green-600" />
              <span>Group Members ({group.members.length})</span>
            </h4>

            <div className="space-y-3">
              {group.members.map((member) => (
                <div key={member.user._id} className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50 flex-shrink-0">
                    <span className="text-xs font-bold font-display uppercase">{member.user.name[0]}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white truncate block">
                      {member.user.name} {(member.user._id || member.user) === currentUser?._id ? '(You)' : ''}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Modals instances */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        groupId={groupId}
        groupMembers={group.members}
        expenseToEdit={expenseToEdit}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        groupId={groupId}
        groupMembers={group.members}
        defaultPayerId={settlePayer}
        defaultPayeeId={settlePayee}
        defaultAmount={settleAmount}
      />

      <ExpenseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        expense={selectedExpense}
        groupId={groupId}
      />
    </div>
  );
}
