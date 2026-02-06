
import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, Search, Users, Package, FileSpreadsheet, File as FileIcon, X, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
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
    const today = new Date();
    today.setHours(0,0,0,0);

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

    return data.sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());
  }, [distributions, dateFilter, personSearch, productSearch]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(d => ({
      'Date': new Date(d.distributedAt).toLocaleDateString(),
      'Time': new Date(d.distributedAt).toLocaleTimeString(),
      'Worker Name': d.workerName,
      'Product Name': d.productName,
      'Quantity': d.quantity,
      'Distributed By': d.distributedBy
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Distributions");
    XLSX.writeFile(wb, `Audit_Report_${Date.now()}.xlsx`);
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const company = await dataService.getCompany();
      const companyName = company?.name || 'Your Company';
      
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text(companyName, 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Distribution Audit Log", 14, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
      doc.text(`Period: ${dateFilter.toUpperCase()}`, 14, 43);
      
      const body = filteredData.map(d => [
        new Date(d.distributedAt).toLocaleString(),
        d.workerName,
        d.productName,
        d.quantity.toString(),
        d.distributedBy
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['Timestamp', 'Staff', 'Product', 'Qty', 'Admin']],
        body,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
      });
      
      doc.save(`Audit_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF Error: Please ensure jspdf-autotable is loaded.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Accessing Data Vault...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Archive & Reports</h2>
          <p className="text-slate-500 font-medium">Export and audit distribution intelligence.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportToExcel} className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all shadow-xl">
            <FileSpreadsheet size={20} className="text-emerald-500" />
            <span>XLSX</span>
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl">
            <FileIcon size={20} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FilterSelect label="Period" value={dateFilter} onChange={setDateFilter}>
            <option value="all">Full History</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Current Month</option>
          </FilterSelect>
          <FilterInput icon={<Package size={16}/>} label="Product" value={productSearch} onChange={setProductSearch} placeholder="Item..." />
          <FilterInput icon={<Users size={16}/>} label="Staff" value={personSearch} onChange={setPersonSearch} placeholder="Name..." />
          <div className="flex items-end pb-1">
             <button onClick={() => { setPersonSearch(''); setProductSearch(''); setDateFilter('all'); }} className="text-slate-400 font-black text-xs uppercase hover:text-rose-500 flex items-center gap-2">
               <X size={14} /> Clear All
             </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-50 custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Worker</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Item</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Qty</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(d => (
                <tr key={d.id} className="hover:bg-indigo-50/10 transition-colors">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(d.distributedAt).toLocaleString()}</td>
                  <td className="px-8 py-6 font-bold text-slate-700">{d.workerName}</td>
                  <td className="px-8 py-6 font-bold text-slate-800">{d.productName}</td>
                  <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 rounded-full font-black text-xs">{d.quantity}</span></td>
                  <td className="px-8 py-6 font-black text-xs text-slate-400 uppercase">{d.distributedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, children }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold outline-none">
      {children}
    </select>
  </div>
);

const FilterInput = ({ icon, label, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-2xl border border-slate-100 font-bold outline-none" placeholder={placeholder} />
    </div>
  </div>
);
