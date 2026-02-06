
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
  ChevronRight
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Company } from '../types';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
    <ChevronRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
  </NavLink>
);

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = dataService.getCurrentUser();
  // Fix: dataService.getCompany() is asynchronous, use state to handle it.
  const [company, setCompany] = useState<Company | null>(null);

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
  const isWorker = user.role === 'Worker';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3 text-indigo-600">
            <Building2 size={28} />
            <h1 className="font-bold text-xl tracking-tight text-slate-900 truncate">
              {company.name}
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          {/* Admins and Managers can see Stock Entry and Distribution */}
          {(isAdmin || isManager) && (
            <>
              <NavItem to="/stock" icon={Package} label="Stock Entry" />
              <NavItem to="/distribution" icon={Truck} label="Distribution" />
            </>
          )}

          {/* All roles can see Reports and Analytics */}
          <NavItem to="/reports" icon={FileBarChart} label="Reports" />
          <NavItem to="/analytics" icon={PieChart} label="Analytics" />
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3 px-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-700 capitalize">
            {location.pathname.split('/').pop()?.replace(/^\w/, (c) => c.toUpperCase()) || 'Overview'}
          </h2>
          <div className="text-sm text-slate-400 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
