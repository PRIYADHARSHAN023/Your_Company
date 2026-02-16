import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Plus, History, Search, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, ChevronRight, Zap, Target } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Product, Company } from '../types';
import * as XLSX from 'xlsx';

export const StockEntryPage = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'excel' | 'previous'>('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ productName: '', category: '', itemCode: '', stockType: 'Regular', totalStock: 0, dealerPrice: 0, totalValue: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number, success: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [prodData, compData] = await Promise.all([
        dataService.getProducts(),
        dataService.getCompany()
      ]);
      setProducts(prodData);
      setCompany(compData);
    };
    fetchData();
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentCompany = await dataService.getCompany();
    if (currentCompany && formData.productName) {
      await dataService.addOrUpdateProduct({
        companyId: currentCompany.id,
        productName: formData.productName,
        category: formData.category,
        itemCode: formData.itemCode,
        stockType: formData.stockType,
        totalStock: Number(formData.totalStock),
        dealerPrice: Number(formData.dealerPrice),
        totalValue: Number(formData.totalValue)
      });
      setFormData({ productName: '', category: '', itemCode: '', stockType: 'Regular', totalStock: 0, dealerPrice: 0, totalValue: 0 });
      const updatedProducts = await dataService.getProducts();
      setProducts(updatedProducts);
      alert('Stock updated successfully!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStats(null);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const currentCompany = await dataService.getCompany();
        if (!currentCompany) throw new Error("No company setup found");

        let allItems: any[] = [];
        for (const wsname of wb.SheetNames) {
          const ws = wb.Sheets[wsname];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          if (!rows || rows.length === 0) continue;

          let headerRowIdx = -1;
          let colMap = { product: -1, code: -1, desc: -1, type: -1, qty: -1, price: -1, val: -1 };

          // Neural Scan: Scan top 15 rows for header patterns
          for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const row = rows[i].map(c => String(c || '').toLowerCase().trim());

            // Flexible Detection Matrix
            const pIdx = row.findIndex(c => /product|group|category|dept|class/i.test(c));
            const cIdx = row.findIndex(c => /code|id|sku|part|ref/i.test(c));
            const dIdx = row.findIndex(c => /item desc|description|name|model|title/i.test(c));
            const tIdx = row.findIndex(c => /stock type|type|classification/i.test(c));
            const qIdx = row.findIndex(c => /qty|quantity|stock|count|good qua|load|total/i.test(c));
            const prIdx = row.findIndex(c => /price|dealer|rate|cost|unit/i.test(c));
            const vIdx = row.findIndex(c => /value|amount|agg/i.test(c));

            // Heuristic Validation: Need at least a name or stock column
            if (dIdx !== -1 || qIdx !== -1 || pIdx !== -1) {
              headerRowIdx = i;
              colMap = { product: pIdx, code: cIdx, desc: dIdx, type: tIdx, qty: qIdx, price: prIdx, val: vIdx };
              break;
            }
          }

          if (headerRowIdx === -1) headerRowIdx = 0; // Default fallback

          const sheetItems = rows.slice(headerRowIdx + 1).map((row: any[]) => {
            // Intelligent Mapping with smarter fallbacks
            let category = 'General';
            if (colMap.product !== -1) category = String(row[colMap.product] || '').trim();
            else if (colMap.desc === 0 && row[1]) category = 'General'; // Just a guess

            const itemCode = colMap.code !== -1 ? String(row[colMap.code] || '').trim() : '';

            let productName = '';
            if (colMap.desc !== -1) productName = String(row[colMap.desc] || '').trim();
            else if (colMap.product !== -1 && colMap.desc === -1) productName = String(row[colMap.product] || '').trim(); // "Product N" fallback

            const stockType = colMap.type !== -1 ? String(row[colMap.type] || '').trim() : 'Regular';

            const rawQty = colMap.qty !== -1 ? row[colMap.qty] : 0;
            const totalStock = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty || 0).replace(/[^0-9.]/g, '')) || 0;

            const rawPrice = colMap.price !== -1 ? row[colMap.price] : 0;
            const dealerPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || 0).replace(/[^0-9.]/g, '')) || 0;

            const rawVal = colMap.val !== -1 ? row[colMap.val] : 0;
            const totalValue = typeof rawVal === 'number' ? rawVal : (parseFloat(String(rawVal || 0).replace(/[^0-9.]/g, '')) || (totalStock * dealerPrice));

            return {
              companyId: currentCompany.id,
              category: category || 'General',
              itemCode,
              productName: productName || 'Unnamed Asset',
              stockType,
              totalStock,
              dealerPrice,
              totalValue
            };
          }).filter(i => (i.productName !== 'Unnamed Asset' || i.itemCode) && !isNaN(i.totalStock));
          allItems = [...allItems, ...sheetItems];
        }

        if (allItems.length === 0) {
          alert("No valid data found. Ensure columns include Product Name and Quantity.");
          return;
        }

        await dataService.bulkAddProducts(allItems);
        const updatedProducts = await dataService.getProducts();
        setProducts(updatedProducts);
        setUploadStats({ total: allItems.length, success: allItems.length });
        setTimeout(() => setUploadStats(null), 5000);
      } catch (err) {
        alert("Failed to parse Excel file.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-10 pb-12">
      <div className="flex bg-white/70 backdrop-blur-xl p-2 rounded-3xl border border-white shadow-xl shadow-slate-100 w-fit">
        <TabBtn active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} icon={<Plus size={18} />} label="Manual Injection" />
        <TabBtn active={activeTab === 'excel'} onClick={() => setActiveTab('excel')} icon={<FileSpreadsheet size={18} />} label="Neural Excel Sync" />
        <TabBtn active={activeTab === 'previous'} onClick={() => setActiveTab('previous')} icon={<History size={18} />} label="Master Ledger" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <div className="xl:col-span-4 sticky top-36">
          <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[3rem] border border-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-8 relative z-10 text-left">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Manual Portal</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Single asset synchronization</p>
                </div>
                <Input label="Item Code" value={formData.itemCode} onChange={v => setFormData({ ...formData, itemCode: v })} required placeholder="e.g. CD221MN" />
                <Input label="Item Description" value={formData.productName} onChange={v => setFormData({ ...formData, productName: v })} required placeholder="e.g. BEARING" />
                <Input label="Category" value={formData.category} onChange={v => setFormData({ ...formData, category: v })} required placeholder="e.g. Dryer" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Quantity" type="number" value={formData.totalStock} onChange={v => setFormData({ ...formData, totalStock: parseInt(v) || 0 })} required />
                  <Input label="Dealer Price" type="number" value={formData.dealerPrice} onChange={v => setFormData({ ...formData, dealerPrice: parseFloat(v) || 0 })} required />
                </div>
                <Input label="Total Value" type="number" value={formData.totalValue} onChange={v => setFormData({ ...formData, totalValue: parseFloat(v) || (formData.totalStock * formData.dealerPrice) })} required />
                <button type="submit" className="premium-btn-primary w-full py-6 text-lg flex items-center justify-center gap-2 mt-4">
                  <Zap size={20} />
                  <span>Initiate Sync</span>
                </button>
              </form>
            )}

            {activeTab === 'excel' && (
              <div className="text-center py-6 space-y-10 relative z-10">
                <div className="bg-slate-900 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl shadow-slate-200">
                  {isUploading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Bulk Synthesis</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">High-throughput data ingestion</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className={`w-full py-16 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 hover:border-indigo-400 hover:bg-slate-50 transition-all group ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <FileSpreadsheet className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:scale-125" size={48} />
                  <div className="space-y-1">
                    <span className="text-slate-900 font-black text-sm block">Uplink Excel Source</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">Protocol: XLSX / 256-bit Sync</span>
                  </div>
                </button>
                {uploadStats && (
                  <div className="flex items-center gap-4 p-5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 animate-in zoom-in">
                    <CheckCircle2 size={24} />
                    <div className="text-left">
                      <p className="font-black text-sm uppercase">Uplink Verified</p>
                      <p className="text-[10px] font-bold opacity-70">{uploadStats.success} assets integrated.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'previous' && (
              <div className="space-y-10 relative z-10 text-left">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Inventory Vitality</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time node health metrics</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform"><Target size={80} /></div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Aggregate Valuation</p>
                    <p className="text-4xl font-black tracking-tighter">₹{products.reduce((s, p) => s + (p.totalValue || 0), 0).toLocaleString()}</p>
                  </div>
                  <StatSummaryCard label="Critical Exhaust" value={products.filter(p => p.totalStock === 0).length} color="text-rose-600" bg="bg-rose-50" icon={<AlertCircle size={18} />} />
                  <StatSummaryCard label="Diminished Load" value={products.filter(p => p.totalStock > 0 && p.totalStock < 20).length} color="text-amber-600" bg="bg-amber-50" icon={<AlertCircle size={18} />} />
                  <StatSummaryCard label="Full Capacity" value={products.filter(p => p.totalStock >= 20).length} color="text-emerald-600" bg="bg-emerald-50" icon={<CheckCircle2 size={18} />} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-8">
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="text-left">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Global Ledger</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Node Cluster: {company?.name}</p>
              </div>
              <div className="relative w-full md:w-96 text-left">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-black text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-xl shadow-slate-200/50"
                  placeholder="Neural Sync Filter..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(products.reduce<Record<string, Product[]>>((acc, p) => {
                if (!acc[p.category]) acc[p.category] = [];
                acc[p.category].push(p);
                return acc;
              }, {} as Record<string, Product[]>))
                .filter(([cat]) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(([category, items]) => (
                  <CategoryCard key={category} category={category} items={items} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryCard = ({ category, items }: { category: string, items: Product[] }) => {
  const [showModels, setShowModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const totalStock = items.reduce((s, i) => s + i.totalStock, 0);
  const totalVal = items.reduce((s, i) => s + (i.totalValue || 0), 0);

  const filteredModels = items.filter(m =>
    m.productName.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.itemCode?.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <>
      <button onClick={() => setShowModels(true)} className="group bg-white/80 backdrop-blur-2xl p-8 rounded-[3.5rem] border-2 border-slate-50 hover:border-indigo-500 transition-all text-left shadow-xl hover:shadow-2xl hover:shadow-indigo-100 flex flex-col h-full active:scale-95 transform-gpu">
        <div className="flex justify-between items-start mb-8 w-full">
          <div className="p-4 bg-slate-900 rounded-3xl text-white group-hover:bg-indigo-600 transition-colors shadow-lg">
            <Zap size={24} />
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{items.length} MODELS</p>
            <p className="text-sm font-black text-indigo-600">₹{totalVal.toLocaleString()}</p>
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">{category}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Asset Group Protocol</p>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 w-full">
          <div className="flex flex-col">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL LOAD</p>
            <p className="text-lg font-black text-slate-900 leading-none">{totalStock.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <ChevronRight size={18} />
          </div>
        </div>
      </button>

      {showModels && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModels(false)} />
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-white animate-in zoom-in duration-500">
            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/20">
              <div className="text-left">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{category}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Model Variant Inspection</p>
              </div>
              <div className="relative w-full md:w-96 text-left">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-black text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-xl shadow-slate-200/50"
                  placeholder="Filter Models..." autoFocus
                />
              </div>
              <button onClick={() => setShowModels(false)} className="p-5 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-3xl transition-all shadow-sm">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredModels.map(item => (
                  <div key={item.id} className="p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-white hover:border-indigo-100 hover:bg-white transition-all group flex flex-col text-left">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{item.itemCode || 'NO CODE'}</p>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">{item.productName}</h4>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.totalStock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {item.stockType || 'REGULAR'}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100/50 mt-auto">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">UNITS</p>
                        <p className="font-black text-slate-900">{item.totalStock.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PRICE</p>
                        <p className="font-black text-slate-900">₹{(item.dealerPrice || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">VALUATION</p>
                        <p className="font-black text-indigo-600">₹{(item.totalValue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10 bg-slate-900 text-white flex justify-between items-center rounded-t-[3rem]">
              <div className="flex gap-10">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL ASSETS</p>
                  <p className="text-2xl font-black text-white">{filteredModels.length}</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">CLUSTER LOAD</p>
                  <p className="text-2xl font-black text-white">{filteredModels.reduce((s, i) => s + i.totalStock, 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">CUMULATIVE VALUE</p>
                <p className="text-3xl font-black text-indigo-400 tracking-tighter">₹{filteredModels.reduce((s, i) => s + (i.totalValue || 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center space-x-3 px-8 py-4 rounded-2xl text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-500 ${active ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

const Input = ({ label, value, onChange, required, type = "text", placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 leading-none">{label}</label>
    <input
      type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[2.2rem] focus:border-indigo-500 outline-none font-black text-slate-900 transition-all placeholder-slate-200 text-base shadow-lg shadow-slate-100"
      placeholder={placeholder}
    />
  </div>
);

const StatSummaryCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`flex items-center justify-between p-6 ${bg} rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/20 group hover:scale-105 transition-transform`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-white rounded-2xl ${color} shadow-sm group-hover:rotate-12 transition-transform`}>{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</span>
    </div>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);
