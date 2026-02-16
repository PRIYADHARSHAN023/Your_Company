import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User as UserIcon, Lock, Sparkles, ArrowRight, Building2, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Company } from '../types';

export const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompany = async () => {
      const c = await dataService.getCompany();
      setCompany(c);
      if (!c) navigate('/');
    };
    fetchCompany();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);
    setError('');
    try {
      const u = await dataService.login(company.name, userId, password);
      if (u) navigate('/dashboard');
      else setError('Invalid credentials');
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Operational Terminal V2.0" companyName={company?.name}>
      <form onSubmit={handleLogin} className="space-y-8">
        <AuthInput label="Personnel ID" value={userId} onChange={setUserId} icon={<UserIcon size={18} />} placeholder="Enter terminal ID" />
        <AuthInput label="Secure Cipher" value={password} onChange={setPassword} icon={<Lock size={18} />} type="password" placeholder="••••••••" />
        {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-2 font-bold text-sm border border-rose-100"><AlertCircle size={16} />{error}</div>}
        <button disabled={loading} type="submit" className="premium-btn-primary w-full py-6 text-xl flex items-center justify-center gap-3">
          {loading ? <Loader2 className="animate-spin" size={24} /> : <>Access System <ArrowRight size={20} /></>}
        </button>
      </form>
      <div className="mt-8 text-center">
        <p className="text-slate-500 font-bold text-sm">Need enrollment? <Link to="/register" className="text-indigo-600 hover:underline">Create Account</Link></p>
      </div>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompany = async () => {
      const c = await dataService.getCompany();
      setCompany(c);
      if (!c) navigate('/');
    };
    fetchCompany();
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);
    setError('');
    try {
      await dataService.registerUser({ companyId: company.id, name, userId, password, role: 'Admin' });
      const u = await dataService.login(company.name, userId, password);
      if (u) navigate('/dashboard');
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Enrollment" subtitle="Establish Administrative Authority" companyName={company?.name}>
      <form onSubmit={handleRegister} className="space-y-6">
        <AuthInput label="Full Name" value={name} onChange={setName} icon={<UserIcon size={18} />} placeholder="John Doe" />
        <AuthInput label="Personnel ID" value={userId} onChange={setUserId} icon={<Building2 size={18} />} placeholder="terminal-admin-01" />
        <AuthInput label="Create Cipher" value={password} onChange={setPassword} icon={<Lock size={18} />} type="password" placeholder="••••••••" />
        {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-2 font-bold text-sm border border-rose-100"><AlertCircle size={16} />{error}</div>}
        <button disabled={loading} type="submit" className="premium-btn-primary w-full py-6 text-xl flex items-center justify-center gap-3">
          {loading ? <Loader2 className="animate-spin" size={24} /> : <>Complete Enrollment <ArrowRight size={20} /></>}
        </button>
      </form>
      <div className="mt-8 text-center">
        <p className="text-slate-500 font-bold text-sm">Existing authority? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link></p>
      </div>
    </AuthLayout>
  );
};

const AuthLayout = ({ children, title, subtitle, companyName }: any) => (
  <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
    </div>

    <div className="w-full max-w-xl relative z-10">
      <div className="bg-white/70 backdrop-blur-2xl border border-white p-12 rounded-[3.5rem] shadow-2xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-6 border border-indigo-100 shadow-inner">
            <Layers size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-slate-400 font-medium text-sm italic">{subtitle}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">{companyName}</span>
          </div>
        </div>
        {children}
      </div>
      <div className="mt-8 flex items-center justify-center gap-3">
        <ShieldCheck className="text-indigo-400" size={16} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Encryption: Active | 256-bit AES</span>
      </div>
    </div>
  </div>
);

const AuthInput = ({ label, value, onChange, icon, type = "text", placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{label}</label>
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
        {icon}
      </div>
      <input
        type={type}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-base font-black text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 placeholder-slate-200"
        placeholder={placeholder}
      />
    </div>
  </div>
);
