'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Users,
  Briefcase,
  CalendarCheck,
  CreditCard,
  Crown,
  LifeBuoy,
  BellRing,
  BarChart3,
  ShieldAlert,
  UserCheck,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { role, canManageAdmins, canViewAuditLogs, canManageFinances } = useAdminAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'FINANCE_ADMIN'],
    },
    {
      label: 'Salons',
      href: '/salons',
      icon: Store,
      badge: '2', // 2 pending applications
      badgeColor: 'bg-amber-100 text-amber-800',
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'FINANCE_ADMIN'],
    },
    {
      label: 'Customers',
      href: '/customers',
      icon: Users,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'],
    },
    {
      label: 'Salon Owners',
      href: '/owners',
      icon: Briefcase,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'],
    },
    {
      label: 'Bookings',
      href: '/bookings',
      icon: CalendarCheck,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'FINANCE_ADMIN'],
    },
    {
      label: 'Payments',
      href: '/payments',
      icon: CreditCard,
      roles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN'],
    },
    {
      label: 'Subscriptions',
      href: '/subscriptions',
      icon: Crown,
      roles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN'],
    },
    {
      label: 'Support Tickets',
      href: '/support',
      icon: LifeBuoy,
      badge: '1',
      badgeColor: 'bg-rose-100 text-rose-800',
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'],
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: BellRing,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN'],
    },
    {
      label: 'Audit Logs',
      href: '/audit-logs',
      icon: ShieldAlert,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
    },
    {
      label: 'Admin Users',
      href: '/admin-users',
      icon: UserCheck,
      roles: ['SUPER_ADMIN'],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
    },
  ];

  const visibleItems = navItems.filter((item) => !role || item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-stone-200/80 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-stone-200/60 bg-stone-50/40">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4A154B] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-stone-900 tracking-tight text-lg">GLAMORA</span>
              <span className="text-[10px] font-semibold bg-[#4A154B]/10 text-[#4A154B] px-1.5 py-0.2 rounded uppercase">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-medium tracking-wide">ENTERPRISE CONTROL</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#4A154B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-stone-200/60 bg-stone-50/50">
        <div className="flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MongoDB Connected</span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};

