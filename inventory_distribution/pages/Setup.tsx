
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

export const SetupPage = () => {
  const location = useLocation();
  const [name, setName] = useState(location.state?.prefilledName || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If company already exists, skip setup (unless we are explicitly creating a new one which is what this page is for now)
    // The previous logic auto-redirected if ANY company existed. We want to avoid that if we are creating a NEW company.
    // However, for now, let's just remove the auto-check because LandingPage handles the entry.
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setLoading(true);
      try {
        await dataService.setupCompany(name.trim());
        navigate('/login');
      } catch (err) {
        console.error(err);
        alert('Failed to initialize company. Check your network.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 transform transition-all">
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-50 p-5 rounded-3xl text-indigo-600 shadow-inner">
            <Building2 size={48} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Enterprise Setup</h1>
          <p className="text-slate-500 font-medium">Define your organization identity to begin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Name</label>
            <input
              type="text"
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none font-bold text-lg text-slate-900 placeholder-slate-300"
              placeholder="e.g. Reliance Logistics"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200/50 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span>Launch Application</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
