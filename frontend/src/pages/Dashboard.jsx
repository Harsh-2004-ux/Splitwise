import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  Users, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: api.groups.list,
  });

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['overallBalances'],
    queryFn: api.balances.overallBalances,
  });

  const isLoading = groupsLoading || balancesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 glass-card animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 glass-card animate-pulse"></div>
          <div className="h-32 glass-card animate-pulse"></div>
        </div>
      </div>
    );
  }

  const { netBalance = 0, totalOwed = 0, totalOwedToMe = 0, groupSummaries = [] } = balances || {};

  return (
    <div className="space-y-8">
      {/* Welcome & Stats Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden bg-slate-900/30 border-slate-800/80">
        <div className="absolute top-0 right-0 p-8 text-green-600/10 pointer-events-none">
          <Sparkles size={160} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-600/10 px-3 py-1 rounded-full">
              Overview
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3 font-display">
              Overall Balance
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Your aggregated account balances across all active groups.
            </p>
          </div>
          
          <div className="flex items-baseline gap-1 bg-slate-950/40 border border-slate-800/40 px-6 py-4 rounded-2xl">
            <span className="text-sm font-semibold text-slate-500">$</span>
            <span className={`text-4xl font-black ${netBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Credit & Debt Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* You owe */}
        <div className="glass-card p-6 flex items-center justify-between hover:border-red-500/25 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">You Owe</span>
            <h3 className="text-2xl font-bold text-white">${totalOwed.toFixed(2)}</h3>
            <p className="text-xs text-slate-400">Total balance you need to pay back</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* You are owed */}
        <div className="glass-card p-6 flex items-center justify-between hover:border-green-600/25 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">You Are Owed</span>
            <h3 className="text-2xl font-bold text-white">${totalOwedToMe.toFixed(2)}</h3>
            <p className="text-xs text-slate-400">Total balance you expect to receive</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-600/10 text-green-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white font-display">My Active Groups</h3>
            <p className="text-xs text-slate-400">Select a group workspace to view splits and settle up</p>
          </div>
          
          <Link to="/create-group" className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus size={16} />
            <span>Create Group</span>
          </Link>
        </div>

        {groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => {
              const summary = groupSummaries.find((s) => s.groupId === group._id);
              const balance = summary ? summary.balance : 0;

              return (
                <Link
                  key={group._id}
                  to={`/group/${group._id}`}
                  className="glass-card p-5 block group hover:bg-slate-900/60 hover:border-green-600/20 hover:shadow-lg hover:shadow-green-600/5 transition-all duration-300"
                >
                  <div className="flex flex-col h-full justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50">
                          <Users size={16} />
                        </div>
                        <ChevronRight 
                          size={16} 
                          className="text-slate-500 group-hover:translate-x-1 transition-transform" 
                        />
                      </div>
                      <h4 className="font-bold text-white group-hover:text-green-400 transition-colors text-base truncate">
                        {group.name}
                      </h4>
                      {group.description && (
                        <p className="text-xs text-slate-400 truncate line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Your Status</span>
                      {balance > 0 ? (
                        <span className="text-green-600 font-semibold bg-green-600/10 px-2 py-0.5 rounded-md">
                          Owed: ${balance.toFixed(2)}
                        </span>
                      ) : balance < 0 ? (
                        <span className="text-red-500 font-semibold bg-red-500/10 px-2 py-0.5 rounded-md">
                          Owes: ${Math.abs(balance).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-md">
                          Settled Up
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center space-y-4 max-w-md mx-auto border-dashed">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white">No Groups Found</h4>
              <p className="text-xs text-slate-400 mt-1">
                You aren't associated with any expense sharing groups yet. Get started by creating one!
              </p>
            </div>
            <Link to="/create-group" className="btn-primary inline-flex items-center gap-2 text-sm mx-auto">
              <Plus size={16} />
              <span>Create New Group</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
