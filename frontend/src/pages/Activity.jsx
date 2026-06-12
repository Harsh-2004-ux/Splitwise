import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';

export default function Activity() {
  const navigate = useNavigate();

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: api.groups.list,
  });

  const { data: allActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['allActivities', groups.length],
    queryFn: async () => {
      if (!groups || groups.length === 0) return [];
      
      const allExpenses = [];
      const allSettlements = [];
      
      for (const group of groups) {
        try {
          const groupExpenses = await api.expenses.list(group._id);
          const groupSettlements = await api.settlements.list(group._id);
          allExpenses.push(...groupExpenses.map(e => ({
            type: 'expense',
            id: e._id,
            title: e.title,
            amount: e.amount,
            group: group.name,
            groupId: group._id,
            user: e.paidBy?.name || e.paidBy,
            createdAt: e.createdAt,
          })));
          allSettlements.push(...groupSettlements.map(s => ({
            type: 'settlement',
            id: s._id,
            amount: s.amount,
            group: group.name,
            groupId: group._id,
            from: s.payerId?.name || s.payerId,
            to: s.payeeId?.name || s.payeeId,
            createdAt: s.settledAt,
          })));
        } catch (err) {
          console.error(`Failed to fetch group ${group._id} activities:`, err);
        }
      }
      
      return [...allExpenses, ...allSettlements]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    enabled: groups.length > 0,
  });

  const isLoading = groupsLoading || (groups.length > 0 && activitiesLoading);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 glass-card animate-pulse rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-160px)] space-y-6 pb-10">
      {/* Header */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-extrabold text-white font-display">Activity</h2>
        <p className="text-slate-400 text-sm mt-1">Track all expenses and settlements across your groups</p>
      </div>

      {/* Activity List */}
      {allActivities.length > 0 ? (
        <div className="space-y-3">
          {allActivities.map((activity) => (
            <div
              key={`${activity.type}-${activity.id}`}
              onClick={() => activity.groupId && navigate(`/group/${activity.groupId}`)}
              className="glass-card p-4 flex items-center justify-between cursor-pointer group hover:bg-slate-900/60 hover:border-green-600/15 transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'expense' 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'bg-green-600/20 text-green-400'
                }`}>
                  {activity.type === 'expense' ? (
                    <TrendingUp size={18} />
                  ) : (
                    <DollarSign size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {activity.type === 'expense' ? (
                    <>
                      <p className="font-medium text-white truncate">{activity.title}</p>
                      <p className="text-xs text-slate-400">
                        {activity.user} paid in {activity.group}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-white">Payment Settled</p>
                      <p className="text-xs text-slate-400">
                        {activity.from} paid {activity.to} in {activity.group}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-semibold text-white">${activity.amount.toFixed(2)}</p>
                <p className="text-xs text-slate-400">
                  {new Date(activity.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[#3b3f45] p-6 text-center md:glass-card md:p-12">
          <Calendar size={28} className="mx-auto text-slate-300 mb-3 md:size-12 md:text-slate-600" />
          <h3 className="font-semibold text-slate-100 text-sm md:text-base">You have no activity yet.</h3>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(groups[0]?._id ? `/group/${groups[0]._id}` : '/create-group')}
        className="fixed bottom-24 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-[#1cc29f] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#19ad90] md:hidden"
      >
        <Plus size={18} />
        Add expense
      </button>
    </div>
  );
}
