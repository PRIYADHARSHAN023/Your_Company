import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, Search, Users, Package, FileSpreadsheet, File as FileIcon, X, Loader2, Zap, Target, ArrowDown } from 'lucide-react';
import { dataService } from '../services/dataService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage = () => {
  const [dateFilter, setDateFilter] = useState('all');
  const [personSearch, setPersonSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getDistributions().then(data => {
      setDistributions(data);
      setLoading(false);
    });
  }, []);

  const filteredData = useMemo(() => {
    let data = [...distributions];
    const user = dataService.getCurrentUser();
    if (user && user.role === 'Worker') {
      data = data.filter(d => d.workerName === user.name);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateFilter === 'today') {
      data = data.filter(d => new Date(d.distributedAt) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      data = data.filter(d => new Date(d.distributedAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      data = data.filter(d => new Date(d.distributedAt) >= monthAgo);
    }
    if (personSearch) data = data.filter(d => d.workerName.toLowerCase().includes(personSearch.toLowerCase()));
    if (productSearch) data = data.filter(d => d.productName.toLowerCase().includes(productSearch.toLowerCase()));
    data = data.filter(d => d.workerName && d.productName);
    return data.sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());
  }, [distributions, dateFilter, personSearch, productSearch]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(d => ({
      'Date': new Date(d.distributedAt).toLocaleDateString(),
      'Time': new Date(d.distributedAt).toLocaleTimeString(),
      'Worker': d.workerName,
      'Product': d.productName,
      'Quantity': d.quantity,
      'Price': d.pricePerUnit || 0,
      'Amount': d.totalAmount || 0,
      'Admin': d.distributedBy
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `Audit_Digest_${Date.now()}.xlsx`);
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const company = await dataService.getCompany();
      const companyName = company?.name || 'Your Company';
      doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.text(companyName.toUpperCase(), 14, 20);
      doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text("OFFICIAL DISTRIBUTION AUDIT LOG", 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
      const body = filteredData.map(d => [
        new Date(d.distributedAt).toLocaleString(), d.workerName, d.productName, d.quantity.toString(),
        `₹${d.pricePerUnit || 0}`, `₹${(d.totalAmount || 0).toLocaleString()}`, d.distributedBy
      ]);
      autoTable(doc, {
        startY: 45, head: [['TIMESTAMP', 'STAFF', 'ASSET', 'QTY', 'UNIT', 'TOTAL', 'AUTHORIZER']],
        body: body as any, theme: 'striped', headStyles: { fillColor: [15, 23, 42], fontSize: 7, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
      });
      doc.save(`Audit_Secure_${Date.now()}.pdf`);
    } catch (err) {
      alert("PDF synthesis failed.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      <p className="font-black text-slate-400 uppercase tracking-[0.4em] text-[10px]">Accessing Secure Vault</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4 text-left">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Data Archive</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Immutable Intelligence Ledger</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportToExcel} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-xs tracking-widest uppercase shadow-xl shadow-slate-100/50">
            <FileSpreadsheet size={18} className="text-emerald-500" />
            <span>Generate XLSX</span>
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-2xl text-xs tracking-widest uppercase">
            <FileIcon size={18} />
            <span>Secure PDF</span>
          </button>
        </div>
      </header>

      <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white shadow-2xl flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <FilterSelect label="Time Period" value={dateFilter} onChange={setDateFilter}>
            <option value="all">Full Temporal History</option>
            <option value="today">Today's Release</option>
            <option value="week">Past 168 Hours</option>
            <option value="month">Monthly Overview</option>
          </FilterSelect>
          <FilterInput icon={<Package size={18} />} label="Asset Search" value={productSearch} onChange={setProductSearch} placeholder="Filter items..." />
          <FilterInput icon={<Users size={18} />} label="Staff Lookup" value={personSearch} onChange={setPersonSearch} placeholder="Search name..." />
          <div className="flex items-end pb-2">
            <button onClick={() => { setPersonSearch(''); setProductSearch(''); setDateFilter('all'); }} className="group px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-black text-[10px] uppercase hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-3 w-full border-dashed">
              <X size={14} className="group-hover:rotate-90 transition-transform" /> Clear Filter Protocols
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100 shadow-inner bg-slate-50/20 text-left">
          <table className="w-full">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-8 py-8 text-[9px] font-black uppercase tracking-[0.3em]">Temporal Event</th>
                <th className="px-8 py-8 text-[9px] font-black uppercase tracking-[0.3em]">Recipient</th>
                <th className="px-8 py-8 text-[9px] font-black uppercase tracking-[0.3em]">Asset Class</th>
                <th className="px-8 py-8 text-[9px] font-black uppercase tracking-[0.3em] text-center">Load</th>
                <th className="px-8 py-8 text-[9px] font-black uppercase tracking-[0.3em]">Unit Cost</th>
                <th className="px-8 py-8 text-[9px] font-black uppercase tracking-[0.3em]">Total Value</th>
                <th className="px-8 py-8 text-[9px] font-black uppercase tracking-[0.3em] text-right">Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(d => (
                <tr key={d.id} className="hover:bg-white transition-all group">
                  <td className="px-8 py-6 text-xs font-black text-slate-400 uppercase">{new Date(d.distributedAt).toLocaleString()}</td>
                  <td className="px-8 py-6 font-black text-slate-800 tracking-tight uppercase">{d.workerName}</td>
                  <td className="px-8 py-6 font-black text-indigo-600 uppercase text-xs">{d.productName}</td>
                  <td className="px-8 py-6 text-center"><span className="px-4 py-1.5 bg-slate-100 rounded-2xl font-black text-[10px] text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">{d.quantity}</span></td>
                  <td className="px-8 py-6 text-xs font-black text-slate-400">₹{(d.pricePerUnit || 0).toLocaleString()}</td>
                  <td className="px-8 py-6 text-lg font-black text-slate-900 tracking-tighter">₹{(d.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-8 py-6 font-black text-[9px] text-slate-300 uppercase tracking-widest text-right">{d.distributedBy}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-32 text-center grayscale opacity-30">
                    <Target size={64} className="mx-auto mb-6" />
                    <p className="font-black text-[10px] uppercase tracking-[0.4em]">No archive records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, children }: any) => (
  <div className="space-y-3 text-left">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 leading-none">{label}</label>
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 px-6 py-5 rounded-[1.5rem] border border-slate-100 font-black text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none cursor-pointer">
        {children}
      </select>
      <ArrowDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
    </div>
  </div>
);

const FilterInput = ({ icon, label, value, onChange, placeholder }: any) => (
  <div className="space-y-3 text-left">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 leading-none">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600">{icon}</div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 pl-14 pr-6 py-5 rounded-[1.5rem] border border-slate-100 font-black text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder-slate-200" placeholder={placeholder} />
    </div>
  </div>
);
