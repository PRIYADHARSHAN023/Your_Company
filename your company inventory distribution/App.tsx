
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { SetupPage } from './pages/Setup';
import { LoginPage, RegisterPage } from './pages/Auth';
import { DashboardPage } from './pages/Dashboard';
import { StockEntryPage } from './pages/StockEntry';
import { DistributionPage } from './pages/Distribution';
import { ReportsPage } from './pages/Reports';
import { AnalyticsPage } from './pages/Analytics';
import { dataService } from './services/dataService';
import { User, Company } from './types';
import { Loader2, ShieldCheck } from 'lucide-react';

const PrivateRoute = ({ children, roles }: { children?: React.ReactNode; roles?: string[] }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = dataService.getCurrentUser();
        const c = await dataService.getCompany();
        setUser(u);
        setCompany(c);
      } catch (err) {
        console.error("Critical Auth Error:", err);
      } finally {
        // Minimum loading time for aesthetic smooth transition
        setTimeout(() => setLoading(false), 800);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-6 text-white overflow-hidden">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-500 opacity-20" size={120} strokeWidth={1} />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="text-indigo-500 animate-pulse" size={40} />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Security Terminal</p>
          <p className="text-slate-500 text-xs font-bold">Verifying System Integrity...</p>
        </div>
      </div>
    );
  }

  // If no company, we must go to setup
  if (!company) return <Navigate to="/" />;
  
  // If no user but company exists, we must login
  if (!user) return <Navigate to="/login" />;
  
  // Role check
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;

  return <AppLayout>{children}</AppLayout>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Terminal Entrance */}
        <Route path="/" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Operational Routes */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        
        <Route path="/stock" element={
          <PrivateRoute roles={['Admin', 'Manager']}>
            <StockEntryPage />
          </PrivateRoute>
        } />
        
        <Route path="/distribution" element={
          <PrivateRoute roles={['Admin', 'Manager']}>
            <DistributionPage />
          </PrivateRoute>
        } />
        
        <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />

        {/* Global Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
