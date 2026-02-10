
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Loader2, PlusCircle } from 'lucide-react';
import { dataService } from '../services/dataService';

export const LandingPage = () => {
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Clear any existing session to ensure clean slate
        dataService.logout();
    }, []);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) return;

        setLoading(true);
        setError('');

        try {
            const company = await dataService.checkCompany(companyName.trim());

            if (company) {
                // Company exists, go to login
                navigate('/login');
            } else {
                // Company doesn't exist
                const confirmCreate = window.confirm(`Company "${companyName}" not found. Do you want to create it?`);
                if (confirmCreate) {
                    navigate('/setup', { state: { prefilledName: companyName } });
                } else {
                    setError('Company not found. Please check the name or create a new one.');
                }
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2.5rem] shadow-2xl p-10 relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center bg-white/20 p-5 rounded-3xl text-white mb-6 shadow-inner ring-1 ring-white/30">
                        <Building2 size={48} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Welcome</h1>
                    <p className="text-indigo-200 font-medium text-lg">Enter your organization to continue</p>
                </div>

                <form onSubmit={handleCheck} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest ml-4">Company Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                required
                                autoFocus
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-white/20 focus:bg-white/10 transition-all outline-none font-bold text-xl text-white placeholder-indigo-300/50"
                                placeholder="e.g. Zeno Tech"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 opacity-50 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                                <Building2 size={24} />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-200 text-sm font-bold text-center animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-indigo-900 py-5 rounded-2xl font-black text-xl flex items-center justify-center space-x-3 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={28} />
                        ) : (
                            <>
                                <span>Continue</span>
                                <ArrowRight size={24} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <button
                        onClick={() => navigate('/setup')}
                        className="text-indigo-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                        <PlusCircle size={16} />
                        <span>Register New Organization</span>
                    </button>
                </div>
            </div>

            <div className="mt-8 text-indigo-300/60 font-medium text-sm">
                InventiFlow v2.0 &bull; Secure Enterprise Gateway
            </div>
        </div>
    );
};
