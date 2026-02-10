
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Lock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Company } from '../types';

export const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify we have a company context
    dataService.getCompany().then(c => {
      if (!c) navigate('/'); // Go back to landing if no company selected
      else setCompany(c);
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Company name comes from the valid context we established
    if (!company) return;

    const user = await dataService.login(company.name, userId, password);
    setLoading(false);

    if (user) navigate('/dashboard');
    else setError('Invalid Identity or Access Key');
  };

  if (!company) return null; // Or a loader

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />

        {/* Switch Company / Back */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest flex items-center gap-1"
        >
          Switch
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-indigo-50 p-4 rounded-2xl text-indigo-600 mb-4 animate-in zoom-in">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{company.name}</h1>
          <p className="text-slate-500 font-medium">Authenticate Identity</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">User Identity</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text" required value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-black text-slate-900"
                  placeholder="Enter User ID"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-black text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 text-rose-600 font-bold text-sm"><AlertCircle size={16} />{error}</div>}

          <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center space-x-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            {loading ? <Loader2 className="animate-spin" /> : <span>Access Terminal</span>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 font-medium">New user? <Link to="/register" className="text-indigo-600 font-black hover:underline">Create Account</Link></p>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', userId: '', password: '', confirmPassword: '', role: 'Worker' as any });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const data = await dataService.getCompany();
      if (!data) navigate('/');
      else setCompany(data);
    };
    fetchCompany();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const currentCompany = await dataService.getCompany();
    if (currentCompany) {
      await dataService.registerUser({
        name: formData.name,
        userId: formData.userId,
        password: formData.password,
        role: formData.role,
        companyId: currentCompany.id
      });
      alert('Registration successful!');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900">Create Account</h1>
          <p className="text-slate-500 font-medium">Join {company?.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required placeholder="John Doe" />
          <Input label="Desired User ID" value={formData.userId} onChange={v => setFormData({ ...formData, userId: v })} required placeholder="johndoe123" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Password</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-black text-slate-900" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Confirm</label>
              <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-black text-slate-900" placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Select Role</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-black text-slate-900">
              <option>Admin</option><option>Manager</option><option>Worker</option>
            </select>
          </div>
          {error && <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold"><AlertCircle size={16} /><span>{error}</span></div>}
          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-6">Register Now</button>
        </form>
        <div className="mt-8 text-center"><Link to="/login" className="text-slate-500 font-black hover:text-indigo-600 transition-colors">Already have an account? Log In</Link></div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, required = false, placeholder = "" }: any) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">{label}</label>
    <input type="text" required={required} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-black text-slate-900" placeholder={placeholder} />
  </div>
);
