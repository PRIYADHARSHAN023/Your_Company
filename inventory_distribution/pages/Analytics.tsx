
import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, BarChart, Bar
} from 'recharts';
import { dataService } from '../services/dataService';
import { TrendingUp, Award, Box, Zap } from 'lucide-react';
import { Distribution } from '../types';

const PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e'];

export const AnalyticsPage = () => {
  // Fix: dataService.getDistributions() is asynchronous.
  const [dists, setDists] = useState<Distribution[]>([]);

  useEffect(() => {
    const fetchDists = async () => {
      const data = await dataService.getDistributions();
      setDists(data);
    };
    fetchDists();
  }, []);

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    dists.forEach(d => {
      const date = d.distributedAt.split('T')[0];
      map[date] = (map[date] || 0) + d.quantity;
    });
    return Object.entries(map)
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [dists]);

  const productShare = useMemo(() => {
    const map: Record<string, number> = {};
    dists.forEach(d => {
      map[d.productName] = (map[d.productName] || 0) + d.quantity;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [dists]);

  const workerImpact = useMemo(() => {
    const map: Record<string, number> = {};
    dists.forEach(d => {
      map[d.workerName] = (map[d.workerName] || 0) + d.quantity;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [dists]);

  const totalValue = useMemo(() => {
    return dists.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [dists]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-2xl">
            <Zap size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">Visual Insights</h2>
            <p className="text-slate-500 font-medium">Real-time performance metrics and distribution intelligence.</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-[2rem] text-white shadow-xl flex items-center gap-6 pr-10">
          <div className="p-3 bg-white/20 rounded-2xl">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Total Value Distributed</p>
            <p className="text-3xl font-black">₹{totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Flow Chart */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="text-indigo-600" /> Inventory Flow
              </h3>
              <p className="text-slate-400 text-sm font-bold mt-1">Stock distribution trends (14 days)</p>
            </div>
          </div>
          <div className="h-[400px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date" axisLine={false} tickLine={false} dy={10}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    tickFormatter={(s) => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }}
                  />
                  <Area type="monotone" dataKey="quantity" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#flowGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>

        {/* Product Share Pie */}
        <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Box className="text-pink-500" /> Top Pool
          </h3>
          <p className="text-slate-400 text-xs font-bold mb-8">Most frequently requested items</p>
          <div className="flex-1 min-h-[300px]">
            {productShare.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productShare} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} stroke="none">
                    {productShare.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
          <div className="space-y-3 mt-8">
            {productShare.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                  <span className="text-sm font-bold text-slate-600 truncate max-w-[120px]">{p.name}</span>
                </div>
                <span className="font-black text-slate-900">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Performance Bar Chart */}
        <div className="lg:col-span-12 bg-slate-900 p-10 rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Award className="text-amber-400" size={32} /> Staff Consumption Lead
              </h3>
              <p className="text-slate-500 font-bold mt-1">Quantity distributed per worker (Top Performers)</p>
            </div>
            <div className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/50">Leaderboard Analytics</div>
          </div>

          <div className="h-96">
            {workerImpact.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workerImpact} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name" type="category" axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                    {workerImpact.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
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
  <div className="h-full flex flex-col items-center justify-center text-slate-200">
    <TrendingUp size={64} strokeWidth={1} />
    <p className="font-black uppercase tracking-widest text-xs mt-4">Generating Data Points...</p>
  </div>
);
