import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, BarChart, Bar
} from 'recharts';
import { dataService } from '../services/dataService';
import { TrendingUp, Award, Box, Zap, Sparkles, Activity, Target, Layers } from 'lucide-react';
import { Distribution } from '../types';

const PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export const AnalyticsPage = () => {
  const [dists, setDists] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getDistributions().then(data => {
      setDists(data);
      setLoading(false);
    });
  }, []);

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    dists.forEach(d => {
      const date = d.distributedAt.split('T')[0];
      map[date] = (map[date] || 0) + d.quantity;
    });
    return Object.entries(map).map(([date, quantity]) => ({ date, quantity })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [dists]);

  const productShare = useMemo(() => {
    const map: Record<string, number> = {};
    dists.forEach(d => { map[d.productName] = (map[d.productName] || 0) + d.quantity; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [dists]);

  const workerImpact = useMemo(() => {
    const map: Record<string, number> = {};
    dists.forEach(d => { map[d.workerName] = (map[d.workerName] || 0) + d.quantity; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [dists]);

  const totalValue = useMemo(() => dists.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0), [dists]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
      <p className="font-black text-slate-400 uppercase tracking-[0.4em] text-[10px]">Processing Neural Insights</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col lg:flex-row items-center justify-between gap-10 px-4 text-left">
        <div className="flex items-center gap-8">
          <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-2xl rotate-3">
            <Activity size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Neural Insights</h2>
            <div className="flex items-center gap-3 mt-4">
              <Sparkles className="text-indigo-600" size={14} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Real-time Performance Metrics Active</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] flex items-center gap-8 min-w-[350px] relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
          <div className="p-4 bg-white/10 rounded-[1.5rem] border border-white/5 relative z-10 shadow-inner">
            <TrendingUp size={28} className="text-emerald-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Cumulative Release Value</p>
            <p className="text-4xl font-black tracking-tight">₹{totalValue.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white/80 backdrop-blur-3xl p-12 rounded-[4rem] border border-white shadow-2xl relative overflow-hidden group text-left">
          <div className="absolute top-0 right-0 p-8 text-indigo-100"><Layers size={100} strokeWidth={0.5} /></div>
          <div className="mb-12 relative z-10">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={20} /></div>
              Inventory Trajectory
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-14">Temporal Flow Analytics: 14 Day Window</p>
          </div>
          <div className="h-[450px] relative z-10 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} tickFormatter={(s) => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} dy={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <Tooltip contentStyle={{ borderRadius: '32px', border: 'none', shadow: '0 40px 80px rgba(0,0,0,0.1)', padding: '24px', background: '#0f172a', color: '#fff' }} itemStyle={{ fontWeight: 900, color: '#818cf8' }} labelStyle={{ fontWeight: 900, color: '#fff', marginBottom: '8px' }} />
                  <Area type="monotone" dataKey="quantity" stroke="#6366f1" strokeWidth={6} fillOpacity={1} fill="url(#flowGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white/80 backdrop-blur-3xl p-12 rounded-[4rem] border border-white shadow-2xl flex flex-col text-left">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-50 text-pink-600 rounded-xl"><Box size={20} /></div>
            Asset Concentration
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-14 mb-10">High-Traffic SKU Distribution</p>
          <div className="flex-1 min-h-[350px]">
            {productShare.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productShare} dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={12} stroke="none">
                    {productShare.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} className="focus:outline-none" />)}
                  </Pie>
                  <Tooltip cursor={{ fill: 'transparent' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
          <div className="grid grid-cols-1 gap-4 mt-10">
            {productShare.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight truncate max-w-[140px]">{p.name}</span>
                </div>
                <span className="font-black text-slate-900 text-lg">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-12 bg-slate-100/50 p-16 rounded-[4.5rem] border border-white shadow-inner overflow-hidden text-left relative">
          <div className="absolute bottom-[-10%] right-[-5%] text-white/50 opacity-10"><Target size={300} strokeWidth={0.5} /></div>
          <div className="flex items-center justify-between mb-16 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white rounded-[1.5rem] text-amber-500 shadow-xl border border-slate-100"><Award size={32} /></div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personnel Rankings</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Distribution Throughput Leadership Board</p>
              </div>
            </div>
          </div>

          <div className="h-[450px] relative z-10 w-full mb-10">
            {workerImpact.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workerImpact} layout="vertical" margin={{ left: 60, right: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontSize: 13, fontWeight: 900 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.4)', radius: [0, 20, 20, 0] }} contentStyle={{ borderRadius: '24px', border: 'none', shadow: 'none', background: '#0f172a', color: '#fff' }} />
                  <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={45}>
                    {workerImpact.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} className="hover:opacity-80 transition-opacity" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-slate-300">
    <div className="p-10 bg-slate-50 rounded-full border border-slate-100 animate-pulse"><TrendingUp size={80} strokeWidth={1} /></div>
    <p className="font-black uppercase tracking-[0.4em] text-[10px] mt-8">Generating Neural Map...</p>
  </div>
);
