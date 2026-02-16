import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, Users, Search, PackageCheck, CheckCircle2, ChevronRight, Plus, Minus, Trash2, ListChecks, Hash, UserCheck, XCircle, LayoutDashboard, FileBarChart, Loader2, Zap, Target, ArrowRight } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Worker, Product } from '../types';
import { useNavigate } from 'react-router-dom';

export const DistributionPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sessionMode, setSessionMode] = useState<'single' | 'batch' | null>(null);
  const [batchCount, setBatchCount] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number; pricePerUnit: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [workerForm, setWorkerForm] = useState({ name: '', mobile: '', gender: 'Male' as any });
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workerData, productData] = await Promise.all([
          dataService.getWorkers(),
          dataService.getProducts()
        ]);
        setWorkers(workerData || []);
        setProducts(productData || []);
      } catch (err) {
        alert("Failed to load terminal data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [step]);

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  const resetLocalState = () => {
    setStep(1); setSessionMode(null); setBatchCount(0); setProcessedCount(0);
    setSelectedWorker(null); setCart([]); setSearchTerm('');
  };

  const startWorkerSession = (w: Worker) => {
    setSelectedWorker(w); setCart([]); setStep(2);
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workerForm.name) {
      const company = await dataService.getCompany();
      const newWorker = await dataService.addWorker({
        companyId: company?.id,
        name: workerForm.name,
        mobile: workerForm.mobile,
        gender: workerForm.gender
      });
      startWorkerSession(newWorker);
      setWorkerForm({ name: '', mobile: '', gender: 'Male' });
    }
  };

  const addToCart = (p: Product) => {
    if (p.totalStock <= 0) return;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === p.id);
      if (existing) return prevCart;
      return [...prevCart, { product: p, quantity: 1, pricePerUnit: 0 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(1, Math.min(item.product.totalStock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateCartPrice = (id: string, price: number) => {
    setCart(prevCart => prevCart.map(item => item.product.id === id ? { ...item, pricePerUnit: price } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== id));
  };

  const handleFinishDistribution = async () => {
    if (selectedWorker && cart.length > 0) {
      const res = await dataService.createBatchDistribution(selectedWorker, cart.map(c => ({
        productId: c.product.id, quantity: c.quantity, pricePerUnit: c.pricePerUnit
      })));
      if (res === "success") setStep(4);
      else alert(res);
    }
  };

  const handleNextWorker = () => {
    setProcessedCount(prev => prev + 1); setSelectedWorker(null); setCart([]); setStep(1);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={20} />
      </div>
      <p className="font-black text-slate-400 uppercase tracking-[0.4em] text-[10px]">Neural Syncing Active</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4 text-left">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Distribution Hub</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol V3.0</span>
            {sessionMode === 'batch' && (
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                Batch Session: {processedCount + 1} / {batchCount}
              </span>
            )}
          </div>
        </div>
        {step < 4 && sessionMode && (
          <button onClick={() => { if (confirm("Terminate current session?")) resetLocalState(); }} className="flex items-center gap-2.5 px-6 py-3 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-xl shadow-slate-100/50 bg-white">
            <XCircle size={16} />
            Reset Node
          </button>
        )}
      </header>

      <div className="flex items-center justify-between px-16 relative py-10 bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white shadow-xl">
        <div className="absolute top-1/2 left-24 right-24 h-1.5 bg-slate-100 -translate-y-1/2 -z-10 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-lg shadow-indigo-200" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>
        <StepNode active={step >= 1} current={step === 1} label="Identity" icon={<Users size={24} />} />
        <StepNode active={step >= 2} current={step === 2} label="Assets" icon={<PackageCheck size={24} />} />
        <StepNode active={step >= 3} current={step === 3} label="Audit" icon={<ListChecks size={24} />} />
        <StepNode active={step >= 4} current={step === 4} label="Release" icon={<CheckCircle2 size={24} />} />
      </div>

      {!sessionMode && step === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <SessionCard title="Single Release" desc="Standard sequential asset distribution protocol." icon={<UserCheck size={40} />} onClick={() => setSessionMode('single')} gradient="from-indigo-50 to-white" />
          <SessionCard title="Batch Release" desc="High-speed sequential processing for massive teams." icon={<Hash size={40} />} onClick={() => {
            const c = prompt("Batch Count:", "5");
            if (parseInt(c || "0") > 0) { setBatchCount(parseInt(c!)); setSessionMode('batch'); }
          }} gradient="from-purple-50 to-white" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {step === 1 && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in zoom-in duration-500">
              <div className="bg-white/80 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white shadow-2xl text-left">
                <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tighter uppercase font-inter">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>
                  Active Personnel
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {workers.length > 0 ? workers.slice().reverse().map(w => (
                    <button key={w.id} onClick={() => startWorkerSession(w)} className="group w-full p-8 rounded-[2.5rem] border-2 border-slate-50 hover:border-indigo-500 hover:bg-white text-left transition-all flex justify-between items-center bg-slate-50/50 hover:shadow-2xl hover:shadow-indigo-100">
                      <div>
                        <p className="font-black text-slate-900 text-xl tracking-tight uppercase leading-none">{w.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{w.mobile || 'No Uplink'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </button>
                  )) : (
                    <div className="text-center py-24 text-slate-300 grayscale opacity-50">
                      <Users size={64} className="mx-auto mb-6" />
                      <p className="font-black text-xs uppercase tracking-widest">Registry Empty</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] text-white relative overflow-hidden group">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] group-hover:scale-125 transition-transform" />
                <h3 className="text-2xl font-black mb-12 flex items-center gap-4 tracking-tighter uppercase relative z-10 text-left">
                  <div className="p-3 bg-white/10 rounded-2xl text-indigo-400 border border-white/5"><UserPlus size={24} /></div>
                  Rapid Enrollment
                </h3>
                <form onSubmit={handleCreateWorker} className="space-y-8 relative z-10 text-left">
                  <Input label="Staff Identifier" value={workerForm.name} onChange={v => setWorkerForm({ ...workerForm, name: v })} required dark placeholder="Enter identity..." />
                  <Input label="Uplink Mobile" value={workerForm.mobile} onChange={v => setWorkerForm({ ...workerForm, mobile: v })} dark placeholder="+91 XXX-XXXX" />
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Type Classification</label>
                    <div className="grid grid-cols-3 gap-6">
                      {['Male', 'Female', 'Other'].map(g => (
                        <button key={g} type="button" onClick={() => setWorkerForm({ ...workerForm, gender: g as any })} className={`py-5 rounded-[1.5rem] font-black text-xs tracking-widest uppercase transition-all ${workerForm.gender === g ? 'bg-white text-slate-900 shadow-2xl scale-105' : 'bg-white/5 text-slate-500 hover:bg-white/10 border border-white/5'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-7 rounded-[2.5rem] font-black text-xl hover:bg-white hover:text-slate-900 transition-all shadow-2xl mt-8 flex items-center justify-center gap-3 active:scale-95 transform-gpu">
                    <span>Initiate releasing</span> <ChevronRight size={24} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="lg:col-span-8 space-y-10 animate-in slide-in-from-left-6 duration-1000">
                <div className="bg-white/80 backdrop-blur-3xl p-12 rounded-[4rem] border border-white shadow-2xl text-left">
                  <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-8">
                    <div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Asset Selection</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        Target Personnel: <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{selectedWorker?.name}</span>
                      </p>
                    </div>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-black text-slate-900 focus:border-indigo-500 outline-none shadow-xl shadow-slate-100/50"
                        placeholder="Neural Filter..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar pb-10">
                    {filteredProducts.map(p => {
                      const itemInCart = cart.find(c => c.product.id === p.id);
                      return (
                        <button key={p.id} disabled={p.totalStock === 0} onClick={() => addToCart(p)} className={`p-8 rounded-[3rem] border-4 text-left relative transition-all duration-500 group flex flex-col h-full ${p.totalStock === 0 ? 'opacity-30 grayscale cursor-not-allowed bg-slate-50 border-slate-50' : itemInCart ? 'border-indigo-600 bg-indigo-50/30 scale-[1.02] shadow-2xl shadow-indigo-100' : 'border-slate-50 hover:border-indigo-200 bg-white hover:shadow-2xl hover:shadow-slate-100 hover:-translate-y-2'}`}>
                          {itemInCart && (
                            <div className="absolute -top-4 -right-4 bg-indigo-600 text-white text-[12px] font-black w-12 h-12 flex items-center justify-center rounded-[1.5rem] shadow-2xl shadow-indigo-600/40 animate-in zoom-in ring-4 ring-white">
                              {itemInCart.quantity}
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{p.category}</span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{p.itemCode}</span>
                          </div>
                          <p className="font-black text-slate-900 text-xl tracking-tight leading-tight mb-6 flex-1">{p.productName}</p>
                          <div className="flex items-center justify-between mt-auto">
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.totalStock > 20 ? 'bg-emerald-50 text-emerald-600' : p.totalStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              {p.totalStock} Load
                            </div>
                            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:rotate-90">
                              <Plus size={18} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 sticky top-36 animate-in slide-in-from-right-6 duration-1000">
                <div className="bg-slate-900 p-10 rounded-[4rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] text-white flex flex-col min-h-[700px] max-h-[85vh] relative overflow-hidden group">
                  <div className="absolute top-[-5%] right-[-5%] w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                  <div className="flex items-center justify-between mb-10 relative z-10 text-left">
                    <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                      <div className="p-2.5 bg-white/10 rounded-2xl text-indigo-400 border border-white/5"><PackageCheck size={24} /></div>
                      Release Manifest
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar relative z-10">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-8 py-20 opacity-40">
                        <div className="p-10 bg-white/5 rounded-full border border-white/5">
                          <Plus size={80} strokeWidth={1} />
                        </div>
                        <p className="font-black text-center text-lg max-w-[200px] tracking-tight">Synchronize assets to begin distribution process.</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.product.id} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 group animate-in slide-in-from-right-4 text-left">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{item.product.category}</p>
                              <p className="font-black text-base text-white tracking-tight leading-none uppercase">{item.product.productName}</p>
                            </div>
                            <button onClick={() => removeFromCart(item.product.id)} className="p-3 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-lg hover:shadow-rose-900/40">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center bg-white/10 rounded-2xl p-2 border border-white/5">
                              <button onClick={() => updateCartQty(item.product.id, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl transition-all"><Minus size={16} /></button>
                              <span className="w-12 text-center font-black text-2xl text-white">{item.quantity}</span>
                              <button onClick={() => updateCartQty(item.product.id, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl transition-all"><Plus size={16} /></button>
                            </div>
                            <div className="flex flex-col flex-1">
                              <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-1">Valuation</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">₹</span>
                                <input type="number" value={item.pricePerUnit || ''} onChange={e => updateCartPrice(item.product.id, parseFloat(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-8 pr-4 text-white font-black text-sm outline-none focus:bg-white/10 focus:border-indigo-500 transition-all" placeholder="0.00" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-10 border-t border-white/10 mt-10 relative z-10">
                    <div className="flex justify-between items-end mb-8 px-4 text-left">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate Value</p>
                        <p className="text-3xl font-black text-indigo-400">₹{cart.reduce((s, c) => s + (c.quantity * (c.pricePerUnit || 0)), 0).toLocaleString()}</p>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{cart.length} LOAD</p>
                    </div>
                    <button disabled={cart.length === 0} onClick={() => setStep(3)} className="w-full bg-white text-slate-900 hover:bg-indigo-500 hover:text-white disabled:opacity-20 disabled:grayscale py-7 rounded-[2.5rem] font-black text-xl transition-all shadow-2xl active:scale-95 transform-gpu flex items-center justify-center gap-3">
                      <span>Audit Distribution</span> <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="lg:col-span-12 flex flex-col items-center justify-center py-10 animate-in zoom-in duration-700">
              <div className="max-w-3xl w-full bg-white/90 backdrop-blur-3xl p-16 rounded-[4.5rem] shadow-2xl border border-white relative overflow-hidden group text-left">
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-indigo-600 to-purple-600" />
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                      <ListChecks size={40} />
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Manifest Audit</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Personnel Verified: <span className="text-indigo-600 font-extrabold">{selectedWorker?.name}</span></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-16 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.product.id} className="p-8 bg-slate-50/50 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white hover:shadow-2xl hover:shadow-slate-100 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-slate-400 shadow-sm border border-slate-100">{item.quantity}</div>
                        <div>
                          <p className="font-black text-slate-900 text-xl tracking-tight uppercase leading-none">{item.product.productName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{item.product.category}</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-10">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Valuation</p>
                          <p className="font-black text-slate-600">₹{(item.pricePerUnit || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right border-l border-slate-200 pl-10">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aggregate</p>
                          <p className="text-3xl font-black text-indigo-600 tracking-tighter">₹{(item.quantity * (item.pricePerUnit || 0)).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button onClick={() => setStep(2)} className="py-7 rounded-[2.5rem] border-3 border-slate-100 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all text-sm active:scale-95">Re-edit Manifest</button>
                  <button onClick={handleFinishDistribution} className="py-7 rounded-[2.5rem] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all text-sm active:scale-95 flex items-center justify-center gap-3">
                    <CheckCircle2 size={24} /> <span>Authorize Release</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="lg:col-span-12 flex flex-col items-center justify-center py-24 animate-in zoom-in duration-1000">
              <div className="relative mb-20">
                <div className="absolute inset-[-40px] bg-emerald-500/10 rounded-full blur-[60px] animate-pulse" />
                <div className="w-48 h-48 bg-emerald-500 text-white rounded-[4rem] flex items-center justify-center shadow-[0_32px_64px_-12px_rgba(16,185,129,0.4)] rotate-6 scale-110 border-8 border-white">
                  <CheckCircle2 size={96} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-6xl font-black text-slate-900 text-center tracking-tighter uppercase leading-none">Sync Perfected</h3>
              <p className="text-slate-500 text-xl text-center mt-10 font-medium max-w-2xl leading-relaxed">
                The distribution protocol for <span className="text-indigo-600 font-black underline underline-offset-8">{selectedWorker?.name}</span> has been securely written to the ledger.
              </p>

              <div className="flex flex-col sm:flex-row gap-8 mt-24">
                {(sessionMode === 'single' || (sessionMode === 'batch' && processedCount + 1 < batchCount)) ? (
                  <button onClick={handleNextWorker} className="flex items-center justify-center gap-4 px-16 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-slate-900 transition-all group active:scale-95 transform-gpu ring-8 ring-indigo-50">
                    <UserPlus size={28} className="group-hover:rotate-12 transition-transform" />
                    <span className="uppercase tracking-tighter text-2xl">Next Personnel</span>
                  </button>
                ) : null}
                <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center gap-4 px-16 py-8 bg-white border-3 border-slate-100 text-slate-900 rounded-[2.5rem] font-black text-xl hover:bg-slate-50 transition-all shadow-xl active:scale-95 group">
                  <LayoutDashboard size={28} className="text-slate-300 group-hover:text-slate-900 transition-all" />
                  <span className="uppercase tracking-tighter">Terminal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StepNode = ({ active, current, label, icon }: any) => (
  <div className="flex flex-col items-center gap-6 relative">
    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-1000 transform-gpu border-4 ${current ? 'bg-indigo-600 text-white shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] border-white scale-125 z-10' : active ? 'bg-emerald-500 text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] border-white scale-100' : 'bg-slate-100 text-slate-300 border-white scale-90'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-1000 ${current ? 'text-indigo-600 translate-y-2' : active ? 'text-emerald-600' : 'text-slate-300'}`}>
      {label}
    </span>
  </div>
);

const Input = ({ label, value, onChange, required, dark, type = "text", placeholder }: any) => (
  <div className="space-y-3">
    <label className={`text-[9px] font-black uppercase tracking-[0.4em] ml-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
    <input
      type={type} required={required} value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-8 py-6 rounded-[2.2rem] outline-none font-black transition-all text-lg shadow-2xl ${dark ? 'bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-500 text-white placeholder-slate-700 shadow-none' : 'bg-white border-2 border-slate-100 focus:border-indigo-500 text-slate-900 placeholder-slate-200'}`}
      placeholder={placeholder}
    />
  </div>
);

const SessionCard = ({ title, desc, icon, onClick, gradient }: any) => (
  <button onClick={onClick} className={`p-12 bg-gradient-to-br ${gradient} rounded-[4rem] border-3 border-white hover:border-indigo-600 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all text-left group flex flex-col items-start gap-10 transform-gpu active:scale-[0.98]`}>
    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white group-hover:bg-indigo-600 transition-all shadow-2xl rotate-3 group-hover:rotate-0">
      {icon}
    </div>
    <div className="space-y-3">
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed text-lg">{desc}</p>
    </div>
    <div className="mt-auto w-full flex justify-end">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl group-hover:shadow-indigo-200 border border-slate-50">
        <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </button>
);
