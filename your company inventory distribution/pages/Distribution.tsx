import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, Users, Search, PackageCheck, CheckCircle2, ChevronRight, Plus, Minus, Trash2, ListChecks, Hash, UserCheck, XCircle, LayoutDashboard, FileBarChart, Loader2 } from 'lucide-react';
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
        console.error("Failed to fetch data:", err);
        alert("Failed to load inventory data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [step]);

  const filteredProducts = useMemo(() =>
    products.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  const resetLocalState = () => {
    setStep(1);
    setSessionMode(null);
    setBatchCount(0);
    setProcessedCount(0);
    setSelectedWorker(null);
    setCart([]);
    setSearchTerm('');
  };

  const startWorkerSession = (w: Worker) => {
    setSelectedWorker(w);
    setCart([]);
    setStep(2);
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
      const existingItemIndex = prevCart.findIndex(item => item.product.id === p.id);
      if (existingItemIndex > -1) {
        return prevCart; // Already matches logic below
      } else {
        return [...prevCart, { product: p, quantity: 1, pricePerUnit: 0 }];
      }
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
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id === id) {
        return { ...item, pricePerUnit: price };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== id));
  };

  const handleFinishDistribution = async () => {
    if (selectedWorker && cart.length > 0) {
      const res = await dataService.createBatchDistribution(
        selectedWorker,
        cart.map(c => ({
          productId: c.product.id,
          quantity: c.quantity,
          pricePerUnit: c.pricePerUnit
        }))
      );
      if (res === "success") {
        setStep(4);
      } else {
        alert(res);
      }
    }
  };

  const handleNextWorker = () => {
    setProcessedCount(prev => prev + 1);
    setSelectedWorker(null);
    setCart([]);
    setStep(1);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing Terminal...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 pb-20">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8 px-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Distribution Terminal</h2>
            {sessionMode === 'batch' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                  Batch Session: {processedCount + 1} of {batchCount}
                </span>
              </div>
            )}
          </div>
          {step < 4 && sessionMode && (
            <button
              onClick={() => { if (confirm("End current distribution session?")) { resetLocalState(); } }}
              className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all text-sm"
            >
              <XCircle size={18} />
              Reset Terminal
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-12 relative">
          <div className="absolute top-7 left-20 right-20 h-1 bg-slate-100 -z-10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          </div>
          <StepNode active={step >= 1} current={step === 1} label="Identity" icon={<Users size={20} />} step={1} />
          <StepNode active={step >= 2} current={step === 2} label="Selection" icon={<PackageCheck size={20} />} step={2} />
          <StepNode active={step >= 3} current={step === 3} label="Audit" icon={<ListChecks size={20} />} step={3} />
          <StepNode active={step >= 4} current={step === 4} label="Success" icon={<CheckCircle2 size={20} />} step={4} />
        </div>
      </div>

      {!sessionMode && step === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 animate-in fade-in zoom-in duration-300">
          <SessionCard title="Standard Entry" desc="Process distributions for workers one by one." icon={<UserCheck size={40} />} onClick={() => setSessionMode('single')} />
          <SessionCard title="Batch Entry" desc="Sequential loop for rapid worker registration." icon={<Hash size={40} />} onClick={() => {
            const countInput = prompt("Enter number of workers for this batch:", "5");
            const count = parseInt(countInput || "0");
            if (count > 0) {
              setBatchCount(count);
              setSessionMode('batch');
            }
          }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {step === 1 && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <Users className="text-indigo-600" /> Recent Staff
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scroll-smooth custom-scrollbar">
                  {workers.length > 0 ? workers.slice().reverse().map(w => (
                    <button key={w.id} onClick={() => startWorkerSession(w)} className="group w-full p-6 rounded-[2rem] border-2 border-slate-50 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all flex justify-between items-center bg-white shadow-sm">
                      <div>
                        <p className="font-black text-slate-800 text-lg">{w.name}</p>
                        <p className="text-sm text-slate-400 font-bold">{w.mobile || 'No Contact Info'}</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  )) : (
                    <div className="text-center py-20 text-slate-300">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-bold">No previous workers in registry.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <h3 className="text-2xl font-black mb-10 flex items-center gap-3 uppercase tracking-tight relative z-10">
                  <UserPlus className="text-indigo-400" /> Enrollment
                </h3>
                <form onSubmit={handleCreateWorker} className="space-y-6 relative z-10">
                  <Input label="Worker Name" value={workerForm.name} onChange={v => setWorkerForm({ ...workerForm, name: v })} required dark placeholder="Enter full name..." />
                  <Input label="Mobile (Optional)" value={workerForm.mobile} onChange={v => setWorkerForm({ ...workerForm, mobile: v })} dark placeholder="e.g. 555-0101" />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Gender</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['Male', 'Female', 'Other'].map(g => (
                        <button key={g} type="button" onClick={() => setWorkerForm({ ...workerForm, gender: g as any })} className={`py-4 rounded-2xl font-black transition-all ${workerForm.gender === g ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-400 hover:text-white transition-all shadow-2xl mt-8">
                    Start Distribution
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-6">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">Select Items</h3>
                      <p className="text-slate-500 font-medium mt-1">Assigning items for <span className="text-indigo-600 font-black">{selectedWorker?.name}</span></p>
                    </div>
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        placeholder="Search inventory..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 scroll-smooth custom-scrollbar">
                    {filteredProducts.map(p => {
                      const itemInCart = cart.find(c => c.product.id === p.id);
                      return (
                        <button key={p.id} disabled={p.totalStock === 0} onClick={() => addToCart(p)} className={`p-6 rounded-[2rem] border-3 text-left relative transition-all group ${p.totalStock === 0 ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50 border-slate-50' : itemInCart ? 'border-indigo-600 bg-indigo-50/50 ring-8 ring-indigo-50' : 'border-slate-50 hover:border-indigo-200 bg-white shadow-sm'}`}>
                          {itemInCart && (
                            <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[11px] font-black w-10 h-10 flex items-center justify-center rounded-2xl shadow-xl shadow-indigo-600/30 animate-in zoom-in">
                              {itemInCart.quantity}
                            </div>
                          )}
                          <div className="flex flex-col h-full">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.category}</span>
                            <p className="font-black text-slate-800 text-lg leading-tight mb-4 flex-1">{p.productName}</p>
                            <div className="flex items-center justify-between mt-auto">
                              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase ${p.totalStock > 20 ? 'bg-emerald-100 text-emerald-700' : p.totalStock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {p.totalStock} left
                              </span>
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Plus size={16} />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 sticky top-24 animate-in fade-in slide-in-from-right-4">
                <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl text-white flex flex-col min-h-[600px] max-h-[85vh]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <PackageCheck className="text-indigo-400" /> Worker Bundle
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-6 opacity-60">
                        <div className="p-8 bg-white/5 rounded-full border border-white/5">
                          <Plus size={64} strokeWidth={1} />
                        </div>
                        <p className="font-black text-center text-lg max-w-[200px]">Select items from the inventory list.</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.product.id} className="p-5 bg-white/5 rounded-3xl border border-white/10 group animate-in slide-in-from-right-4 duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-black text-sm text-indigo-300 uppercase tracking-tight truncate max-w-[150px]">{item.product.productName}</p>
                              <p className="text-[10px] font-bold text-slate-500">{item.product.category}</p>
                            </div>
                            <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center bg-white/10 rounded-2xl p-1.5 border border-white/5 shadow-inner">
                                <button onClick={() => updateCartQty(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all"><Minus size={14} /></button>
                                <span className="w-12 text-center font-black text-xl text-white">{item.quantity}</span>
                                <button onClick={() => updateCartQty(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all"><Plus size={14} /></button>
                              </div>
                              <div className="flex flex-col">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price/Unit</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black">₹</span>
                                  <input
                                    type="number"
                                    value={item.pricePerUnit || ''}
                                    onChange={(e) => updateCartPrice(item.product.id, parseFloat(e.target.value))}
                                    className="w-24 bg-white/5 border border-white/10 rounded-xl py-2 pl-6 pr-2 text-white font-bold text-sm outline-none focus:bg-white/10 transition-all"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                              <p className="font-black text-emerald-400 text-lg">₹{(item.quantity * (item.pricePerUnit || 0)).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-8 border-t border-white/10 mt-8">
                    <button disabled={cart.length === 0} onClick={() => setStep(3)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:grayscale text-white py-6 rounded-3xl font-black text-lg transition-all shadow-2xl shadow-indigo-900/40 transform active:scale-95">
                      Audit Distribution ({cart.length})
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="lg:col-span-12 flex flex-col items-center justify-center py-10 animate-in zoom-in duration-500">
              <div className="max-w-2xl w-full bg-white p-14 rounded-[4rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600" />
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <ListChecks size={48} />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-2">Final Review</h3>
                <p className="text-slate-500 font-medium mb-12">Confirming items for <span className="text-indigo-600 font-black px-2 py-1 bg-indigo-50 rounded-lg">{selectedWorker?.name}</span></p>
                <div className="space-y-4 text-left mb-12 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white transition-all hover:shadow-lg">
                      <div>
                        <p className="font-black text-slate-800 text-lg">{item.product.productName}</p>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{item.product.category}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">Qty: {item.quantity}</span>
                          <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">@ ₹{item.pricePerUnit || 0}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Amount</span>
                        <div className="text-2xl font-black text-indigo-600">
                          ₹{(item.quantity * (item.pricePerUnit || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => setStep(2)} className="py-5 rounded-3xl border-2 border-slate-100 font-black text-slate-500 hover:bg-slate-50 transition-all text-lg">Edit Bundle</button>
                  <button onClick={handleFinishDistribution} className="py-5 rounded-3xl bg-slate-900 text-white font-black shadow-2xl hover:bg-indigo-600 transition-all text-lg">Confirm & Sync</button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="lg:col-span-12 flex flex-col items-center justify-center py-20 animate-in zoom-in duration-700">
              <div className="w-40 h-40 bg-emerald-100 text-emerald-600 rounded-[3rem] flex items-center justify-center mb-10 shadow-xl shadow-emerald-500/10 rotate-6 scale-110">
                <CheckCircle2 size={80} />
              </div>
              <h3 className="text-5xl font-black text-slate-900 text-center tracking-tight">Success</h3>
              <p className="text-slate-500 text-xl text-center mt-6 font-medium max-w-xl leading-relaxed">The distribution for <span className="text-indigo-600 font-black">{selectedWorker?.name}</span> is complete.</p>
              <div className="flex flex-col sm:flex-row gap-6 mt-16">
                {(sessionMode === 'single' || (sessionMode === 'batch' && processedCount + 1 < batchCount)) ? (
                  <button onClick={handleNextWorker} className="flex items-center justify-center gap-3 px-14 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-700 transition-all transform active:scale-95">
                    <UserPlus size={24} /> <span>Next Staff Member</span>
                  </button>
                ) : null}
                <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center gap-3 px-14 py-6 bg-white border-2 border-slate-200 text-slate-800 rounded-[2rem] font-black text-xl hover:bg-slate-50 transition-all shadow-xl">
                  <LayoutDashboard size={24} /> <span>Dashboard</span>
                </button>
                <button onClick={() => navigate('/reports')} className="flex items-center justify-center gap-3 px-14 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all shadow-xl">
                  <FileBarChart size={24} /> <span>Audit Logs</span>
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
  <div className="flex flex-col items-center gap-4 relative">
    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 transform border-4 ${current ? 'bg-indigo-600 text-white shadow-2xl border-indigo-100 scale-125 z-10' : active ? 'bg-emerald-500 text-white shadow-xl border-emerald-50 scale-100' : 'bg-slate-100 text-slate-400 border-white scale-90'}`}>
      {icon}
    </div>
    <span className={`text-xs font-black uppercase tracking-[0.2em] transition-colors duration-700 ${current ? 'text-indigo-600' : active ? 'text-emerald-600' : 'text-slate-300'}`}>
      {label}
    </span>
  </div>
);

const Input = ({ label, value, onChange, required, dark, type = "text", placeholder }: any) => (
  <div className="space-y-2">
    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
    <input
      type={type} required={required} value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-6 py-5 rounded-[1.5rem] outline-none font-bold transition-all text-lg ${dark ? 'bg-white/5 border border-white/10 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/20 text-white placeholder-slate-600'
        : 'bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 text-slate-900 placeholder-slate-300'
        }`}
      placeholder={placeholder}
    />
  </div>
);

const SessionCard = ({ title, desc, icon, onClick }: any) => (
  <button onClick={onClick} className="p-10 bg-white rounded-[3rem] border-3 border-slate-50 hover:border-indigo-600 hover:shadow-2xl transition-all text-left group flex flex-col items-start gap-8 transform active:scale-95">
    <div className="p-6 bg-slate-50 rounded-[2rem] text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
      {icon}
    </div>
    <div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <div className="mt-auto w-full flex justify-end">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
        <ChevronRight size={24} />
      </div>
    </div>
  </button>
);
