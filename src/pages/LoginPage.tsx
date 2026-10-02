import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Role } from '../types/index.js';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickLogin = async (role: Role) => {
    setError(null);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl mb-4 shadow-lg shadow-indigo-500/30">
          PX
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          PARxCON Ops
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Operations, CRM, Pipeline & Command Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@parxcon.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Ops</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              1-Click Developer Test Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="p-2 text-center rounded-lg bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <div className="font-bold text-white text-xs">Admin</div>
                <div className="text-[10px] text-slate-500">Full Access</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('MANAGER')}
                className="p-2 text-center rounded-lg bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <div className="font-bold text-white text-xs">Manager</div>
                <div className="text-[10px] text-slate-500">Sales/Reports</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('EMPLOYEE')}
                className="p-2 text-center rounded-lg bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <div className="font-bold text-white text-xs">Employee</div>
                <div className="text-[10px] text-slate-500">Assigned Only</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Compliance Banner */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bcrypt hashed auth • Zero plaintext external secrets</span>
        </div>
      </div>
    </div>
  );
};
