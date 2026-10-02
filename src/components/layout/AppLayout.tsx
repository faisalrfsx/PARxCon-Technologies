import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bot,
  Bell,
  LogOut,
  X,
  ChevronDown,
  Building2,
  TrendingUp,
  UserCheck,
  CheckSquare,
  KeyRound,
  Shield,
  Loader2,
} from 'lucide-react';
import { Sidebar } from './Sidebar.js';
import { useAuth } from '../../context/AuthContext.js';
import { QuickAIAssistantModal } from '../ai/QuickAIAssistantModal.js';
import { api } from '../../services/api.js';
import { Role, Notification } from '../../types/index.js';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { user, logout, quickLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut listener (Cmd/Ctrl + K for Search, Cmd/Ctrl + J for AI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAiModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { notifications } = await api.settings.getNotifications();
        setNotifications(notifications);
      } catch (_) {}
    };
    fetchNotifs();
  }, []);

  // Handle global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.search.query(searchQuery);
        setSearchResults(res);
      } catch (_) {}
      finally {
        setSearchLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search leads, deals, clients, tasks, accounts... (⌘K)"
                  className="w-full pl-9 pr-14 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                  ⌘K
                </kbd>
              </div>

              {/* Search Results Dropdown */}
              {searchOpen && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-2 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                    <span>SEARCH RESULTS</span>
                    <button
                      onClick={() => setSearchOpen(false)}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {searchLoading ? (
                    <div className="p-4 flex items-center justify-center text-xs text-slate-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching across PARxCON records...</span>
                    </div>
                  ) : searchResults && (
                    <div className="space-y-3">
                      {searchResults.clients?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" /> Clients
                          </p>
                          {searchResults.clients.map((c: any) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                onNavigate(`/clients/${c.id}`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs flex justify-between"
                            >
                              <span className="font-medium text-slate-900 dark:text-white">{c.companyName}</span>
                              <span className="text-slate-400">{c.contactPerson}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.deals?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Deals
                          </p>
                          {searchResults.deals.map((d: any) => (
                            <div
                              key={d.id}
                              onClick={() => {
                                onNavigate(`/deals`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs flex justify-between"
                            >
                              <span className="font-medium text-slate-900 dark:text-white">{d.dealName}</span>
                              <span className="font-semibold text-emerald-600">₹{d.dealValue.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.leads?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Leads
                          </p>
                          {searchResults.leads.map((l: any) => (
                            <div
                              key={l.id}
                              onClick={() => {
                                onNavigate(`/leads`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs flex justify-between"
                            >
                              <span className="font-medium text-slate-900 dark:text-white">{l.companyName}</span>
                              <span className="text-slate-400">{l.status}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.tasks?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-amber-500" /> Tasks
                          </p>
                          {searchResults.tasks.map((t: any) => (
                            <div
                              key={t.id}
                              onClick={() => {
                                onNavigate(`/tasks`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs flex justify-between"
                            >
                              <span className="font-medium text-slate-900 dark:text-white">{t.title}</span>
                              <span className="text-slate-400">{t.status}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.accounts?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-rose-500" /> Accounts
                          </p>
                          {searchResults.accounts.map((a: any) => (
                            <div
                              key={a.id}
                              onClick={() => {
                                onNavigate(`/accounts`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs flex justify-between"
                            >
                              <span className="font-medium text-slate-900 dark:text-white">{a.serviceName}</span>
                              <span className="text-slate-400 font-mono text-[10px]">{a.credentialManager}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Ops Assistant Button */}
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              title="Open Ops Assistant (⌘J)"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Ops Assistant</span>
              <kbd className="hidden md:inline px-1 py-0.2 rounded bg-indigo-700 text-[10px] font-mono">
                ⌘J
              </kbd>
            </button>

            {/* Role Switcher Chip (Instant Dev Testing) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-semibold text-slate-900 dark:text-white">{user?.role || 'Admin'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Test Role
                  </div>
                  {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        quickLogin(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        user?.role === r ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                    <button
                      onClick={async () => {
                        await api.settings.markAllNotificationsRead();
                        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs ${
                            n.isRead
                              ? 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                              : 'bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-900 dark:text-slate-200 font-medium border border-indigo-100 dark:border-indigo-900/40'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Ops Assistant Modal */}
      <QuickAIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onActionCompleted={() => {
          // Trigger custom refresh event if pages listen to it
          window.dispatchEvent(new Event('ops_record_updated'));
        }}
      />
    </div>
  );
};
