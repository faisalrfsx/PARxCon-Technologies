import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  TrendingUp,
  Building2,
  Receipt,
  CheckSquare,
  CalendarClock,
  KeyRound,
  RotateCw,
  BarChart3,
  Bot,
  Settings,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onCloseMobile,
}) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: UserCheck },
    { name: 'Deals & Pipeline', path: '/deals', icon: TrendingUp },
    { name: 'Clients', path: '/clients', icon: Building2 },
    { name: 'Payments', path: '/payments', icon: Receipt },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Follow-ups', path: '/followups', icon: CalendarClock },
    { name: 'Account Registry', path: '/accounts', icon: KeyRound, badge: 'Vault Ref' },
    { name: 'Renewals', path: '/renewals', icon: RotateCw },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Ops Assistant', path: '/ai-assistant', icon: Bot, isHighlight: true },
    { name: 'Settings & Logs', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black tracking-wider shadow-md shadow-indigo-500/20">
            PX
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-base">PARxCON</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-mono font-semibold border border-indigo-500/30">
                OPS
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Command & Operations</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => {
                  onNavigate(item.path);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : item.isHighlight
                    ? 'text-indigo-300 hover:bg-slate-800/80 bg-indigo-950/20 border border-indigo-900/40'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : item.isHighlight ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {item.badge}
                  </span>
                )}
                {item.isHighlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Security Compliance Note */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-300 text-[10px]">Zero-Plaintext Policy</p>
            <p className="text-[10px] text-slate-500 leading-tight">
              External passwords strictly mapped to Bitwarden / 1Password refs.
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs border border-slate-700 shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Operator'}</p>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 inline-block">
                {user?.role || 'Employee'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
