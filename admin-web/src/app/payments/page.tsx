'use client';

import React, { useState } from 'react';
import { Search, Filter, CreditCard, DollarSign, ArrowDownLeft, ArrowUpRight, Receipt, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_PAYMENTS } from '../../lib/mock-data';
import { PaymentTransaction, PaymentStatus } from '../../lib/types';

export default function PaymentsFinancePage() {
  const [activeCategory, setActiveCategory] = useState<'SUBSCRIPTIONS' | 'CUSTOMER_SERVICES'>('SUBSCRIPTIONS');
  const [payments, setPayments] = useState<PaymentTransaction[]>(INITIAL_PAYMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Compute separated financial aggregates
  const platformRevenue = payments
    .filter((p) => p.type === 'SALON_SUBSCRIPTION' && p.status === 'PAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const salonVolume = payments
    .filter((p) => p.type === 'CUSTOMER_SERVICE' && p.status === 'PAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const refundedVolume = payments
    .filter((p) => p.status === 'REFUNDED')
    .reduce((acc, curr) => acc + (curr.refundedAmount || curr.amount), 0);

  const currentCategoryType = activeCategory === 'SUBSCRIPTIONS' ? 'SALON_SUBSCRIPTION' : 'CUSTOMER_SERVICES';

  const filtered = payments.filter((p) => {
    const matchesCategory =
      activeCategory === 'SUBSCRIPTIONS'
        ? p.type === 'SALON_SUBSCRIPTION'
        : p.type === 'CUSTOMER_SERVICE';
    const matchesSearch =
      p.transactionRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.salonName && p.salonName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesCategory && matchesSearch && matchesStatus;
  });

  const columns: Column<PaymentTransaction>[] = [
    {
      header: 'Reference & Date',
      cell: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-stone-900 block">{item.transactionRef}</span>
          <span className="text-[11px] text-stone-400">{new Date(item.createdAt).toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Payee / Payer',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900">{item.userName}</p>
          {item.salonName && (
            <p className="text-xs text-stone-500">Salon: {item.salonName}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Description & Method',
      cell: (item) => (
        <div>
          <p className="text-xs font-medium text-stone-800">{item.description}</p>
          <span className="text-[10px] text-stone-400 font-mono">{item.paymentMethod}</span>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (item) => (
        <div>
          <span className="font-bold text-sm text-stone-900">₹{item.amount.toLocaleString()}</span>
          {item.status === 'REFUNDED' && (
            <p className="text-[10px] text-rose-600 font-medium">Refunded: ₹{item.refundedAmount}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Payment Status',
      cell: (item) => <Badge status={item.status} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Payments & Platform Finance</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Strict separation of Glamora SaaS Platform Collections and Salon Merchant Service Volume.
          </p>
        </div>

        {/* Separated Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Glamora SaaS Subscription Revenue"
            value={`₹${platformRevenue.toLocaleString()}`}
            subtitle="Platform fees collected from salon owners"
            change="18%"
            isPositive={true}
            icon={<CreditCard className="w-4 h-4 text-[#4A154B]" />}
          />
          <StatCard
            title="Salon Customer Service Volume"
            value={`₹${salonVolume.toLocaleString()}`}
            subtitle="Total haircuts & treatments paid to salons"
            change="24%"
            isPositive={true}
            icon={<Receipt className="w-4 h-4 text-emerald-600" />}
          />
          <StatCard
            title="Settled Customer Refunds"
            value={`₹${refundedVolume.toLocaleString()}`}
            subtitle="Provider-verified customer refunds"
            change="2%"
            isPositive={false}
            icon={<ArrowDownLeft className="w-4 h-4 text-rose-600" />}
          />
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveCategory('SUBSCRIPTIONS')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeCategory === 'SUBSCRIPTIONS'
                  ? 'bg-[#4A154B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Category B: Glamora SaaS Subscriptions
            </button>
            <button
              onClick={() => setActiveCategory('CUSTOMER_SERVICES')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeCategory === 'CUSTOMER_SERVICES'
                  ? 'bg-[#4A154B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Category A: Salon Service Bookings
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction reference or payee..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          emptyMessage="No financial transactions match your selected category and filters."
        />
      </div>
    </AdminLayout>
  );
}

