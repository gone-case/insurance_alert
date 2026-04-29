import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, RefreshCw, Bell, Shield, LogOut, Menu, X, ChevronRight, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/renewals', icon: RefreshCw, label: 'Renewals' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/users', icon: Shield, label: 'Users', adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const filteredNav = NAV.filter(n => !n.adminOnly || user?.role === 'admin');
  const currentPage = filteredNav.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-30 flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Smart Insurance</div>
            <div className="text-xs text-slate-500">Reminder System</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center text-sm font-bold text-brand-200">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate capitalize">{user?.role}</div>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">{currentPage}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
            <span className="text-xs text-slate-500">Live</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
