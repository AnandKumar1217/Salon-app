'use client';

import React, { useState } from 'react';
import { Search, Bell, LogOut, ShieldCheck, ChevronDown, User } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminRole } from '../../lib/types';
import { Badge } from '../ui/Badge';

export const Topbar: React.FC = () => {
  const { admin, role, isMockMode, switchDemoRole, logout } = useAdminAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const availableRoles: { role: AdminRole; label: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin (Full Access)' },
    { role: 'OPERATIONS_ADMIN', label: 'Operations Admin (Salons & Onboarding)' },
    { role: 'SUPPORT_ADMIN', label: 'Support Admin (Helpdesk & Complaints)' },
    { role: 'FINANCE_ADMIN', label: 'Finance Admin (Billing & Settlements)' },
  ];

  return (
    <header className="h-16 bg-white border-b border-stone-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search salons, bookings, customers, transactions..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B] transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Environment Status Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-stone-50 text-stone-600 border-stone-200">
          <span
            className={`w-2 h-2 rounded-full ${
              isMockMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>{isMockMode ? 'Dev Mock Mode' : 'Live MongoDB'}</span>
        </div>

        {/* Evaluator Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors text-stone-700"
            title="Switch admin role to test permissions"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#4A154B]" />
            <span className="font-semibold">{role ? role.replace('_', ' ') : 'NO ROLE'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Evaluator Role Switcher
              </div>
              {availableRoles.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    switchDemoRole(item.role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 transition-colors ${
                    role === item.role ? 'bg-stone-50 text-[#4A154B] font-semibold' : 'text-stone-700'
                  }`}
                >
                  <span>{item.label}</span>
                  {role === item.role && <span className="w-1.5 h-1.5 rounded-full bg-[#4A154B]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
          title="Platform Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-3 border-l border-stone-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-stone-800 leading-tight">{admin?.name || 'Administrator'}</p>
            <p className="text-[10px] text-stone-400 leading-tight">{admin?.email || 'admin@glamora.com'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#4A154B]/10 border border-[#4A154B]/20 flex items-center justify-center text-[#4A154B] font-bold text-xs">
            {admin?.name ? admin.name[0].toUpperCase() : 'A'}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-50 transition-colors"
            title="Sign out of Admin Panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

