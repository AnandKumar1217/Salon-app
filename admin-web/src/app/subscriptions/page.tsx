'use client';

import React, { useState } from 'react';
import { Crown, Check, Store, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_SUBSCRIPTIONS } from '../../lib/mock-data';
import { PlatformSubscription, SubscriptionPlanId } from '../../lib/types';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function SubscriptionsManagementPage() {
  const { canManageFinances } = useAdminAuth();
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>(INITIAL_SUBSCRIPTIONS);

  const plans = [
    {
      id: 'FREE',
      name: 'Free Trial',
      price: '₹0',
      period: '14-day trial',
      features: ['Basic salon discovery profile', 'Up to 20 customer bookings', 'Single staff account', 'Standard email support'],
    },
    {
      id: 'STARTER',
      name: 'Starter Plan',
      price: '₹999',
      period: 'per month',
      features: ['Up to 3 staff specialists', 'Unified app & walk-in calendar', 'Daily collection reports', 'Direct customer phone booking'],
    },
    {
      id: 'GROWTH',
      name: 'Growth Plan',
      price: '₹1,999',
      period: 'per month',
      features: [
        'Unlimited staff profiles',
        'Official WhatsApp booking channel',
        'Standalone public web booking link & QR',
        'Automated delay alerts & reminders',
        'Priority phone & chat support',
      ],
      recommended: true,
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise Multi-Branch',
      price: '₹4,999',
      period: 'per month',
      features: [
        'Multi-salon chain centralized dashboard',
        'Dedicated account manager',
        'Custom franchise reporting',
        'REST API & webhook integrations',
      ],
    },
  ];

  const columns: Column<PlatformSubscription>[] = [
    {
      header: 'Salon & Owner',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900">{item.salonName}</p>
          <p className="text-xs text-stone-500">Owner: {item.ownerName}</p>
        </div>
      ),
    },
    {
      header: 'Active Tier',
      cell: (item) => (
        <div className="flex items-center space-x-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <Badge status={item.planId} />
        </div>
      ),
    },
    {
      header: 'Monthly Fee',
      cell: (item) => (
        <span className="font-bold text-stone-900 text-sm">
          {item.monthlyFee === 0 ? 'Free' : `₹${item.monthlyFee.toLocaleString()}/mo`}
        </span>
      ),
    },
    {
      header: 'Billing Cycle',
      cell: (item) => (
        <div className="text-xs">
          <p className="text-stone-700">Next: {new Date(item.nextBillingDate).toLocaleDateString()}</p>
          <p className="text-[11px] text-stone-400">
            {item.autoRenew ? 'Auto-renew enabled' : 'Manual invoice'}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <Badge status={item.status} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Glamora SaaS Subscriptions</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Merchant tier definitions, salon billing cycles, and platform revenue generation.
          </p>
        </div>

        {/* Plan Definition Cards */}
        <div>
          <h3 className="text-sm font-bold text-stone-900 mb-3">Platform Subscription Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-xl p-5 border flex flex-col justify-between ${
                  p.recommended ? 'border-[#4A154B] ring-1 ring-[#4A154B] shadow-sm' : 'border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">{p.name}</h4>
                    {p.recommended && (
                      <span className="text-[10px] bg-[#4A154B] text-white px-2 py-0.5 rounded-full font-bold">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline space-x-1 mb-4">
                    <span className="text-2xl font-bold text-stone-900">{p.price}</span>
                    <span className="text-xs text-stone-400">/{p.period}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-stone-600 mb-6">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-3 border-t border-stone-100 text-center">
                  <span className="text-[11px] font-mono text-stone-400 uppercase">TIER_{p.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Merchant Subscriptions Table */}
        <div>
          <h3 className="text-sm font-bold text-stone-900 mb-3">Active Salon Subscriptions</h3>
          <DataTable
            columns={columns}
            data={subscriptions}
            keyExtractor={(item) => item.id}
            emptyMessage="No salon subscriptions found."
          />
        </div>
      </div>
    </AdminLayout>
  );
}

