
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Package, Truck, AlertTriangle, TrendingUp, Search, ChevronRight, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export const DashboardPage = () => {
  const [activeMetric, setActiveMetric] = useState<'inventory' | 'dist' | 'stockout' | 'workers' | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [dists, setDists] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, d, w] = await Promise.all([
          dataService.getProducts(),
          dataService.getDistributions(),
          dataService.getWorkers()
        ]);
        setProducts(p);
        setDists(d);
        setWorkers(w);
      } catch (err) {
        console.error(err);
      } finally {
        // Minimal delay for smooth visual entry
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const outOfStock = products.filter(p => p.totalStock === 0);
    const prodMap: Record<string, number> = {};
    dists.forEach(d => { prodMap[d.productName] = (prodMap[d.productName] || 0) + d.quantity; });
    const topProducts = Object.entries(prodMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    const workerMap: Record<string, number> = {};
    dists.forEach(d => { workerMap[d.workerName] = (workerMap[d.workerName] || 0) + 1; });
    const workerStats = Object.entries(workerMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

    return { 
      outOfStock: outOfStock.length, 
      outOfStockList: outOfStock,
      topProducts, 
      workerStats, 
      totalProducts: products.length, 
      totalDist: dists.length,
      activeWorkers: workers.length
    };
  }, [products, dists, workers]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Initializing Terminal...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={<Package className="text-indigo-600" />} label="Total Stock" value={stats.totalProducts} color="bg-indigo-50" active={activeMetric === 'inventory'} onClick={() => setActiveMetric(activeMetric === 'inventory' ? null : 'inventory')} />
        <MetricCard icon={<Truck className="text-emerald-600" />} label="Total Distributions" value={stats.totalDist} color="bg-emerald-50" active={activeMetric === 'dist'} onClick={() => setActiveMetric(activeMetric === 'dist' ? null : 'dist')} />
        <MetricCard icon={<AlertTriangle className="text-rose-600" />} label="Critical Levels" value={stats.outOfStock} color="bg-rose-50" active={activeMetric === 'stockout'} onClick={() => setActiveMetric(activeMetric === 'stockout' ? null : 'stockout')} />
        <MetricCard icon={<TrendingUp className="text-amber-600" />} label="Active Personnel" value={stats.activeWorkers} color="bg-amber-50" active={activeMetric === 'workers'} onClick={() => setActiveMetric(activeMetric === 'workers' ? null : 'workers')} />
      </div>

      {activeMetric && (
        <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Operational Data</h3>
            <button onClick={() => setActiveMetric(null)} className="text-slate-400 font-bold hover:text-slate-900">Dismiss</button>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr><th className="p-4 text-[10px] font-black uppercase text-slate-400">Name</th><th className="p-4 text-[10px] font-black uppercase text-slate-400">Value</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeMetric === 'inventory' && products.map(p => <DetailRow key={p.id} n={p.productName} v={p.category} />)}
                {activeMetric === 'stockout' && stats.outOfStockList.map(p => <DetailRow key={p.id} n={p.productName} v="0 PCS" red />)}
                {activeMetric === 'dist' && dists.slice(-10).reverse().map(d => <DetailRow key={d.id} n={d.productName} v={`${d.quantity} PCS`} />)}
                {activeMetric === 'workers' && workers.map(w => <DetailRow key={w.id} n={w.name} v={w.mobile || 'No Contact'} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartBox title="Distribution Trends" icon={<Package className="text-indigo-400"/>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topProducts}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                {stats.topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Personnel Activity" icon={<TrendingUp className="text-amber-400"/>}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.workerStats} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8}>
                {stats.workerStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, color, active, onClick }: any) => (
  <div onClick={onClick} className={`p-8 rounded-[2rem] border transition-all cursor-pointer transform active:scale-95 ${active ? 'bg-slate-900 text-white border-slate-900 shadow-2xl' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}>
    <div className="flex items-start justify-between">
      <div className={`p-5 rounded-2xl ${active ? 'bg-white/10' : color}`}>{icon}</div>
      <div className={`text-3xl font-black ${active ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    </div>
    <div className={`mt-6 text-[10px] font-black uppercase tracking-widest ${active ? 'text-slate-500' : 'text-slate-400'}`}>{label}</div>
  </div>
);

const DetailRow = ({ n, v, red }: any) => (
  <tr className="group hover:bg-slate-50/50 transition-colors">
    <td className="p-4 font-bold text-slate-700">{n}</td>
    <td className={`p-4 font-black text-sm ${red ? 'text-rose-500' : 'text-slate-400'}`}>{v}</td>
  </tr>
);

const ChartBox = ({ title, children, icon }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
    <div className="flex items-center gap-3 mb-8">
      {icon}
      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="h-80">{children}</div>
  </div>
);
