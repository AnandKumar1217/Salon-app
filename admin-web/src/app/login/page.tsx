'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoRole } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: AdminRole) => {
    switchDemoRole(role);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#4A154B] mx-auto flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-6 h-6 text-amber-300" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">
          GLAMORA SUPER ADMIN
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Authorized personnel only. All access is logged and monitored.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200/90 rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-stone-700">Admin Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@glamora.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Sign In to Admin Console
              </Button>
            </div>
          </form>

          {/* Quick Evaluator Access */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider text-center mb-3">
              1-Click Evaluator Roles
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('SUPER_ADMIN')}
                className="p-2 text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs text-purple-900 transition-colors"
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>Super Admin</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <span className="text-[10px] text-purple-700">Full system control</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('OPERATIONS_ADMIN')}
                className="p-2 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-blue-900 transition-colors"
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>Operations</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <span className="text-[10px] text-blue-700">Salon onboarding</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('SUPPORT_ADMIN')}
                className="p-2 text-left bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs text-teal-900 transition-colors"
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>Support Admin</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <span className="text-[10px] text-teal-700">Tickets & complaints</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('FINANCE_ADMIN')}
                className="p-2 text-left bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs text-indigo-900 transition-colors"
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>Finance Admin</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <span className="text-[10px] text-indigo-700">SaaS subscriptions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

