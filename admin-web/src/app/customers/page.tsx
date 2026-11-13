'use client';

import React, { useState } from 'react';
import { Search, ShieldAlert, RotateCcw, Calendar, Heart, User, CheckCircle } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_CUSTOMERS } from '../../lib/mock-data';
import { CustomerUser, UserStatus } from '../../lib/types';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function CustomersManagementPage() {
  const { canManageSalons } = useAdminAuth();
  const [customers, setCustomers] = useState<CustomerUser[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStatus = (id: string, current: UserStatus) => {
    const nextStatus: UserStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: Column<CustomerUser>[] = [
    {
      header: 'Customer Details',
      cell: (item) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#4A154B]/10 text-[#4A154B] flex items-center justify-center font-bold text-xs">
            {item.name[0]}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{item.name}</p>
            <p className="text-xs text-stone-500">{item.phone}</p>
            {item.email && <p className="text-[11px] text-stone-400">{item.email}</p>}
          </div>
        </div>
      ),
    },
    {
      header: 'Booking History',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-800">{item.totalBookings} appointments</p>
          <p className="text-xs text-stone-500">₹{item.totalSpent.toLocaleString()} lifetime spend</p>
        </div>
      ),
    },
    {
      header: 'Saved Salons',
      cell: (item) => (
        <div className="flex items-center space-x-1.5 text-xs text-stone-600">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>{item.savedSalonIds.length} bookmarks</span>
        </div>
      ),
    },
    {
      header: 'Registered',
      cell: (item) => (
        <div>
          <p className="text-xs text-stone-700">{new Date(item.createdAt).toLocaleDateString()}</p>
          {item.lastActiveAt && (
            <p className="text-[10px] text-stone-400">
              Active: {new Date(item.lastActiveAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Account Status',
      cell: (item) => <Badge status={item.status} />,
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (item) => (
        <div className="flex justify-end">
          {canManageSalons && (
            <Button
              size="sm"
              variant="outline"
              className={
                item.status === 'ACTIVE'
                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
              }
              onClick={() => toggleStatus(item.id, item.status)}
            >
              {item.status === 'ACTIVE' ? (
                <>
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Suspend
                </>
              ) : (
                <>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reactivate
                </>
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Customer Accounts</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor client engagement, verify account activity, and govern customer account statuses.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 rounded-xl border border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone or email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          emptyMessage="No customer accounts match your search."
        />
      </div>
    </AdminLayout>
  );
}

