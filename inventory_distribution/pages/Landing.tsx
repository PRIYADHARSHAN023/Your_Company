import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, LayoutDashboard, Database, ShieldCheck, Sparkles, ChevronRight, Globe, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

export const LandingPage = () => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            const company = await dataService.checkCompany(name.trim());
            if (company) navigate('/login');
            else navigate('/setup');
        } catch (err) {
            alert("Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white relative overflow-hidden font-inter">
            {/* SaaS Background Magic */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[160px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>

            <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-5xl mx-auto">
                    {/* Header Tag */}
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-1000">
                            <Sparkles className="text-indigo-400" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Next-Gen Inventory OS</span>
                        </div>
                    </div>

                    <div className="text-center space-y-12">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">
                            Manage your empire <br /> from one terminal.
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
                            State-of-the-art inventory distribution for modern logistics. Premium isolation, real-time analytics, and hyper-fast execution.
                        </p>

                        {/* Terminal Entrance Form */}
                        <div className="max-w-2xl mx-auto mt-16 bg-white/5 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2">
                                <div className="relative flex-1 w-full">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Globe size={24} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-transparent border-none pl-16 pr-6 py-6 text-xl font-bold placeholder-slate-600 outline-none"
                                        placeholder="Enter Company Identifier"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full md:w-auto px-10 py-5 bg-indigo-600 rounded-[2rem] font-black text-lg hover:bg-white hover:text-indigo-600 transition-all duration-500 flex items-center justify-center gap-3 group shadow-2xl shadow-indigo-500/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={24} /> : <>Access Console <ChevronRight className="group-hover:translate-x-1" /> </>}
                                </button>
                            </form>
                        </div>

                        {/* Feature Badges */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24">
                            <StatBadge icon={<Database size={24} />} label="Encrypted" sub="Data Isolation" />
                            <StatBadge icon={<LayoutDashboard size={24} />} label="Premium" sub="SaaS Analytics" />
                            <StatBadge icon={<ShieldCheck size={24} />} label="Secure" sub="Role-based Access" />
                            <StatBadge icon={<Building2 size={24} />} label="Scalable" sub="Unlimited Assets" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatBadge = ({ icon, label, sub }: any) => (
    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-white/10 transition-colors transform hover:-translate-y-2 duration-500">
        <div className="text-indigo-400 p-4 bg-white/5 rounded-2xl border border-white/5">{icon}</div>
        <div className="text-center">
            <p className="font-black text-lg text-white leading-tight">{label}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{sub}</p>
        </div>
    </div>
);
