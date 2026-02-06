
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, History, Search, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Product, Company } from '../types';
import * as XLSX from 'xlsx';

export const StockEntryPage = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'excel' | 'previous'>('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ productName: '', category: '', totalStock: 0 });
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
        totalStock: Number(formData.totalStock)
      });
      setFormData({ productName: '', category: '', totalStock: 0 });
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
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const currentCompany = await dataService.getCompany();
        if (!currentCompany) throw new Error("No company setup found");

        const items = data.map((row: any) => {
          const findKey = (patterns: string[]) => {
            const keys = Object.keys(row);
            return keys.find(k => patterns.some(p => k.toLowerCase().includes(p.toLowerCase())));
          };

          const nameKey = findKey(['product', 'name', 'item', 'description']);
          const catKey = findKey(['category', 'group', 'type', 'dept']);
          const qtyKey = findKey(['quantity', 'qty', 'count', 'stock', 'amount']);

          const productName = nameKey ? String(row[nameKey]).trim() : '';
          const category = catKey ? String(row[catKey]).trim() : 'General';
          const totalStock = qtyKey ? Number(row[qtyKey]) : 0;

          return { companyId: currentCompany.id, productName, category, totalStock };
        }).filter(i => i.productName && !isNaN(i.totalStock) && i.totalStock >= 0);

        if (items.length === 0) {
          alert("No valid data found in the Excel sheet.");
          return;
        }

        await dataService.bulkAddProducts(items);
        const updatedProducts = await dataService.getProducts();
        setProducts(updatedProducts);
        setUploadStats({ total: data.length, success: items.length });
        setTimeout(() => setUploadStats(null), 5000);
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-fit">
        <TabBtn active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} icon={<Plus size={18} />} label="Single Entry" />
        <TabBtn active={activeTab === 'excel'} onClick={() => setActiveTab('excel')} icon={<FileSpreadsheet size={18} />} label="Bulk Excel Sync" />
        <TabBtn active={activeTab === 'previous'} onClick={() => setActiveTab('previous')} icon={<History size={18} />} label="Master Stock List" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4 sticky top-24">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-6 relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Manual Stock Entry</h3>
                  <p className="text-slate-500 font-medium">Add or update individual product inventory.</p>
                </div>
                <Input label="Product Name" value={formData.productName} onChange={v => setFormData({...formData, productName: v})} required placeholder="e.g. Safety Helmets" />
                <Input label="Category" value={formData.category} onChange={v => setFormData({...formData, category: v})} required placeholder="e.g. PPE Gear" />
                <Input label="Quantity to Add" type="number" value={formData.totalStock} onChange={v => setFormData({...formData, totalStock: parseInt(v) || 0})} required />
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 transform active:scale-95 mt-4">
                  Update Inventory
                </button>
              </form>
            )}

            {activeTab === 'excel' && (
              <div className="text-center py-8 space-y-8 relative z-10">
                <div className="bg-indigo-50 w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                  {isUploading ? <Loader2 className="animate-spin" size={48} /> : <Upload size={48} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Bulk Data Sync</h3>
                  <p className="text-slate-500 font-medium mt-2">Perfect for 1,000+ items.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className={`w-full py-12 border-3 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <FileSpreadsheet className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:scale-110" size={48} />
                  <div className="space-y-1">
                    <span className="text-slate-900 font-black text-lg block">Drop your Excel here</span>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">or click to browse</span>
                  </div>
                </button>
                {uploadStats && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 size={24} />
                    <div className="text-left">
                      <p className="font-black">Import Successful!</p>
                      <p className="text-xs font-bold opacity-80">{uploadStats.success} records added.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'previous' && (
              <div className="space-y-8 relative z-10">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Inventory Health</h3>
                  <p className="text-slate-500 font-medium">Summary of your current stock status.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <StatSummaryCard label="Out of Stock" value={products.filter(p => p.totalStock === 0).length} color="text-rose-600" bg="bg-rose-50" icon={<AlertCircle size={20}/>} />
                  <StatSummaryCard label="Low Inventory" value={products.filter(p => p.totalStock > 0 && p.totalStock < 20).length} color="text-amber-600" bg="bg-amber-50" icon={<AlertCircle size={20}/>} />
                  <StatSummaryCard label="Healthy Stock" value={products.filter(p => p.totalStock >= 20).length} color="text-emerald-600" bg="bg-emerald-50" icon={<CheckCircle2 size={20}/>} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
              <div>
                <h3 className="text-3xl font-black text-slate-900">Current Inventory</h3>
                <p className="text-slate-500 font-medium mt-1">Live overview of all items in {company?.name}.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl text-base font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  placeholder="Search products..."
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Product Information</th>
                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Classification</th>
                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="group hover:bg-slate-50/80 transition-all">
                      <td className="px-10 py-7 font-black text-slate-800 text-lg">{p.productName}</td>
                      <td className="px-10 py-7">
                        <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest">{p.category}</span>
                      </td>
                      <td className="px-10 py-7">
                        <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-2xl font-black text-sm ${p.totalStock === 0 ? 'bg-rose-100 text-rose-700' : p.totalStock < 20 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${p.totalStock === 0 ? 'bg-rose-500' : p.totalStock < 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {p.totalStock.toLocaleString()} UNITS
                        </div>
                      </td>
                      <td className="px-10 py-7 text-slate-400 text-xs font-black uppercase tracking-widest text-right">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center space-x-3 px-8 py-4 rounded-2xl text-base font-black transition-all ${active ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

const Input = ({ label, value, onChange, required, type = "text", placeholder }: any) => (
  <div className="space-y-2">
    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      required={required}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-900 transition-all placeholder-slate-400"
      placeholder={placeholder}
    />
  </div>
);

const StatSummaryCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`flex items-center justify-between p-6 ${bg} rounded-[2rem] border border-white shadow-sm`}>
    <div className="flex items-center gap-3">
      <div className={`${color}`}>{icon}</div>
      <span className="text-sm font-black uppercase tracking-widest opacity-70">{label}</span>
    </div>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);
