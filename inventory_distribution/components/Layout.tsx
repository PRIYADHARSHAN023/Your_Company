import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  FileBarChart,
  PieChart,
  LogOut,
  Building2,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Company } from '../types';

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${isActive
        ? 'bg-slate-900 text-white shadow-2xl shadow-indigo-200'
        : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-lg hover:shadow-slate-100'
      }`
    }
  >
    <Icon size={22} className="relative z-10" />
    <span className="font-black text-sm tracking-tight relative z-10">{label}</span>
    <ChevronRight className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1 relative z-10" size={16} />
  </NavLink>
);

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = dataService.getCurrentUser();
  const [company, setCompany] = useState<Company | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      const data = await dataService.getCompany();
      setCompany(data);
    };
    fetchCompany();
  }, []);

  const handleLogout = () => {
    dataService.logout();
    navigate('/login');
  };

  if (!user || !company) return <>{children}</>;

  const isAdmin = user.role === 'Admin';
  const isManager = user.role === 'Manager';

  const Navigation = ({ onSelect = () => { } }) => (
    <nav className="flex-1 space-y-3">
      <NavItem to="/dashboard" icon={LayoutDashboard} label="Terminal Feed" onClick={onSelect} />

      {(isAdmin || isManager) && (
        <>
          <NavItem to="/stock" icon={Package} label="Inventory Node" onClick={onSelect} />
          <NavItem to="/distribution" icon={Truck} label="Distribution Hub" onClick={onSelect} />
        </>
      )}

      <NavItem to="/reports" icon={FileBarChart} label="Data Ledger" onClick={onSelect} />
      <NavItem to="/analytics" icon={PieChart} label="Visual Insights" onClick={onSelect} />
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc] relative overflow-hidden font-inter selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Decorative Blob */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-80 bg-white/80 backdrop-blur-3xl border-r border-slate-200/50 flex-col sticky top-0 h-screen shrink-0 z-30 transform-gpu transition-all">
        <div className="p-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
              <Building2 size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-xl tracking-tighter text-slate-900 truncate">
                {company.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles size={10} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Enterprise Cloud</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 overflow-y-auto custom-scrollbar">
          <Navigation />
        </div>

        <div className="p-8 border-t border-slate-100/50">
          <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-2xl shadow-indigo-200 border-2 border-white">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-slate-900 truncate tracking-tight uppercase leading-none">{user.name}</p>
                <div className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full mt-2 text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                  {user.role}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-3 w-full py-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-lg hover:shadow-rose-100 border border-transparent hover:border-rose-100"
            >
              <LogOut size={16} />
              <span>Terminate Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar & Header handled with identical premium aesthetics */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 w-full min-w-0">
        <header className="h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-4 bg-white rounded-2xl shadow-xl shadow-slate-100 text-slate-600 border border-slate-100 active:scale-95 transition-transform"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter capitalize truncate max-w-[200px] md:max-w-none">
                {location.pathname.split('/').pop()?.replace(/^\w/, (c) => c.toUpperCase()) || 'Terminal'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 hidden sm:block">Operational Node Protocol Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center px-6 py-3 bg-white/50 backdrop-blur-xl border border-white rounded-2xl shadow-xl shadow-slate-100 gap-3 text-xs font-black text-slate-600 uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200" />
              Live Sync
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400">
              <UserIcon size={20} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-12">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {children}
          </div>
        </main>
      </div>

      {/* Premium Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] transition-opacity duration-500" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed top-4 left-4 bottom-4 w-80 bg-white/95 backdrop-blur-2xl z-[101] rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in slide-in-from-left duration-500 border border-white flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-900 rounded-xl text-white">
                  <Building2 size={20} />
                </div>
                <h1 className="font-black text-lg text-slate-900 truncate">{company.name}</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-6">
              <Navigation onSelect={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
              {/* Reuse user profile card for mobile */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl text-white flex items-center justify-center font-black">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.role}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-4 bg-white text-rose-600 font-black rounded-2xl border border-rose-100 shadow-xl shadow-rose-100 text-xs tracking-widest active:scale-95 transition-all">
                TERMINATE SESSION
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
