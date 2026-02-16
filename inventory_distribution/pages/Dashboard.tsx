import React, { useMemo, useEffect, useState } from 'react';
import {
  Package,
  Truck,
  Users,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  ShieldAlert,
  Target,
  ChevronRight,
  TrendingDown,
  PieChart
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { dataService } from '../services/dataService';
import { Product, Distribution, Worker } from '../types';

export const DashboardPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [dists, setDists] = useState<Distribution[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const user = dataService.getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      const [p, d, w] = await Promise.all([
        dataService.getProducts(),
        dataService.getDistributions(),
        dataService.getWorkers()
      ]);
      setProducts(p);
      setDists(d);
      setWorkers(w);
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (!user) return null;
    const isWorker = user.role === 'Worker';
    const myDists = isWorker ? dists.filter(d => d.workerName === user.name) : dists;

    const prodMap: Record<string, number> = {};
    dists.forEach(d => { prodMap[d.productName] = (prodMap[d.productName] || 0) + d.quantity; });
    const topProducts = Object.entries(prodMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

    const outOfStock = products.filter(p => p.totalStock === 0);
    const lowStock = products.filter(p => p.totalStock > 0 && p.totalStock <= 5);

    const timelineMap: Record<string, number> = {};
    myDists.forEach(d => {
      const date = new Date(d.distributedAt).toLocaleDateString();
      timelineMap[date] = (timelineMap[date] || 0) + d.quantity;
    });
    const timeline = Object.entries(timelineMap).map(([date, quantity]) => ({ date, quantity })).slice(-7);

    return {
      totalProducts: products.length,
      totalInventory: products.reduce((sum, p) => sum + p.totalStock, 0),
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      totalDistributed: myDists.reduce((sum, d) => sum + d.quantity, 0),
      totalWorkers: workers.length,
      topProducts,
      timeline,
      outOfStockList: outOfStock,
      lowStockList: lowStock
    };
  }, [products, dists, workers, user]);

  if (!stats) return null;

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          label="Total Inventory"
          value={stats.totalInventory.toLocaleString()}
          icon={<Package className="text-white" size={24} />}
          trend="+12% from last node"
          gradient="from-slate-900 to-slate-800"
        />
        <MetricCard
          label="System Throughput"
          value={stats.totalDistributed.toLocaleString()}
          icon={<Zap className="text-white" size={24} />}
          trend="+5.4% efficiency"
          gradient="from-indigo-600 to-indigo-500"
        />
        <MetricCard
          label="Active Personnel"
          value={stats.totalWorkers.toString()}
          icon={<Users className="text-white" size={24} />}
          trend="Stationary overhead"
          gradient="from-purple-600 to-purple-500"
        />
        <MetricCard
          label="Critical Alerts"
          value={(stats.outOfStock + stats.lowStock).toString()}
          icon={<ShieldAlert className="text-white" size={24} />}
          trend="Immediate attention"
          gradient="from-rose-600 to-rose-500"
          isAlert
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Main Chart Section */}
        <div className="xl:col-span-2 space-y-10">
          <ChartBox title="Operational Throughput" subtitle="Real-time distribution analytics (7-day window)" icon={<Activity className="text-indigo-500" size={20} />}>
            <div className="h-[400px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline}>
                  <defs>
                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', background: '#fff' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="quantity" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorQty)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartBox>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <ChartBox title="High Rank Assets" subtitle="Top performing distribution units" icon={<Target className="text-indigo-500" size={20} />}>
              <div className="mt-8 space-y-4">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white transition-all hover:shadow-xl hover:shadow-slate-100 group">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-slate-400 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <span className="font-black text-sm text-slate-700">{p.name}</span>
                    </div>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full text-[10px] uppercase tracking-widest">{p.value} UNIT</span>
                  </div>
                ))}
              </div>
            </ChartBox>

            <ChartBox title="Inventory Health" subtitle="Operational stock distribution" icon={<PieChart className="text-indigo-500" size={20} />}>
              <div className="h-[250px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Healthy', value: stats.totalProducts - stats.outOfStock - stats.lowStock, color: '#10b981' },
                        { name: 'Critical', value: stats.outOfStock, color: '#f43f5e' },
                        { name: 'Low', value: stats.lowStock, color: '#f59e0b' }
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value" stroke="none"
                    >
                      {(entry: any, index: number) => <Cell key={index} fill={entry.color} />}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <LegendItem color="bg-emerald-500" label="Healthy" />
                <LegendItem color="bg-rose-500" label="Critical" />
                <LegendItem color="bg-amber-500" label="Low" />
              </div>
            </ChartBox>
          </div>
        </div>

        {/* Operational Feed Sidebar */}
        <div className="space-y-10">
          <div className="p-8 bg-white/70 backdrop-blur-3xl border border-white rounded-[3rem] shadow-2xl">
            <div className="flex items-center justify-between mb-8 text-left">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Incident Feed</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Monitoring</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {stats.outOfStockList.map(p => (
                <DetailRow key={p.id} item={p.productName} qty={0} label="OUT OF STOCK" color="rose" />
              ))}
              {stats.lowStockList.map(p => (
                <DetailRow key={p.id} item={p.productName} qty={p.totalStock} label="LOW STOCK" color="amber" />
              ))}
              {stats.outOfStockList.length === 0 && stats.lowStockList.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center border border-emerald-100 shadow-xl shadow-emerald-50">
                    <Zap size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">System Nominal</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, trend, gradient, isAlert }: any) => (
  <div className={`p-8 bg-gradient-to-br ${gradient} rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden transform hover:-translate-y-1 transition-all duration-300 group`}>
    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
    <div className="flex justify-between items-start relative z-10 mb-6">
      <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/5">
        {icon}
      </div>
      {isAlert && <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-tighter text-white animate-pulse">Critical</div>}
    </div>
    <div className="relative z-10 space-y-2 text-left">
      <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">{label}</p>
    </div>
    <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-left relative z-10">
      <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{trend}</span>
    </div>
  </div>
);

const ChartBox = ({ children, title, subtitle, icon }: any) => (
  <div className="bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[3rem] shadow-2xl text-left">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            {icon}
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{title}</h3>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-12">{subtitle}</p>
      </div>
      <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
        <ArrowUpRight size={20} />
      </button>
    </div>
    {children}
  </div>
);

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const DetailRow = ({ item, qty, label, color }: any) => (
  <div className={`p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-indigo-200 hover:shadow-2xl transition-all`}>
    <div className="flex items-center gap-4 text-left">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${color === 'rose' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}>
        {qty}
      </div>
      <div>
        <h4 className="font-black text-sm text-slate-800 tracking-tight">{item}</h4>
        <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block ${color === 'rose' ? 'text-rose-400' : 'text-amber-400'}`}>{label}</span>
      </div>
    </div>
    <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" size={20} />
  </div>
);
