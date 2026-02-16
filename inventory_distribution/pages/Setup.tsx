import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, ShieldCheck, Sparkles, Globe, Zap } from 'lucide-react';
import { dataService } from '../services/dataService';

export const SetupPage = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await dataService.setupCompany(name.trim());
      navigate('/register');
    } catch (err: any) {
      alert(err.message || "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-white rounded-3xl shadow-2xl shadow-indigo-100 mb-6 border border-white transform transition-transform hover:scale-105 duration-500">
            <Building2 className="text-indigo-600" size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Enterprise Setup</h1>
          <p className="text-slate-500 font-medium">Define your organization's digital identity to begin.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-2xl border border-white p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-200/50">
          <form onSubmit={handleSetup} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Official Organization Name</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                  <Globe size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-lg font-black text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 placeholder-slate-300"
                  placeholder="e.g. Acme Corporation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureItem icon={<ShieldCheck size={18} />} text="End-to-end Encryption" />
              <FeatureItem icon={<Zap size={18} />} text="Instant Activation" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-600 transition-all duration-500 shadow-2xl shadow-slate-200 transform active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Launch Application</span>
                  <ArrowRight size={24} className="transition-transform group-hover:translate-x-2" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 opacity-40">
          <Sparkles className="text-indigo-600" size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Powered by YourCompany Cloud</span>
          <Sparkles className="text-indigo-600" size={16} />
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, text }: any) => (
  <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
    <div className="text-indigo-600">{icon}</div>
    <span className="text-xs font-bold text-slate-600">{text}</span>
  </div>
);
