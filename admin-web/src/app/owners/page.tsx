'use client';

import React, { useState } from 'react';
import { Search, Store, ShieldCheck, ShieldAlert, RotateCcw, Crown } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_OWNERS } from '../../lib/mock-data';
import { SalonOwnerUser, UserStatus } from '../../lib/types';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function SalonOwnersPage() {
  const { canManageSalons } = useAdminAuth();
  const [owners, setOwners] = useState<SalonOwnerUser[]>(INITIAL_OWNERS);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleOwnerStatus = (id: string, current: UserStatus) => {
    const nextStatus: UserStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
    );
  };

  const filtered = owners.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.salonName && o.salonName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: Column<SalonOwnerUser>[] = [
    {
      header: 'Owner Details',
      cell: (item) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs">
            {item.name[0]}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{item.name}</p>
            <p className="text-xs text-stone-500">{item.phone}</p>
            <p className="text-[11px] text-stone-400">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Associated Salon',
      cell: (item) => (
        <div>
          {item.salonName ? (
            <div className="flex items-center space-x-1.5">
              <Store className="w-3.5 h-3.5 text-[#4A154B]" />
              <span className="font-semibold text-stone-800">{item.salonName}</span>
            </div>
          ) : (
            <span className="text-xs text-stone-400">No approved salon assigned</span>
          )}
          <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
            ID: {item.salonId || 'None'}
          </span>
        </div>
      ),
    },
    {
      header: 'SaaS Subscription',
      cell: (item) => (
        <div className="flex items-center space-x-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <Badge status={item.subscriptionPlan} />
        </div>
      ),
    },
    {
      header: 'Application Status',
      cell: (item) => <Badge status={item.applicationStatus} />,
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
              onClick={() => toggleOwnerStatus(item.id, item.status)}
            >
              {item.status === 'ACTIVE' ? (
                <>
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Suspend Owner
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
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Salon Owners Directory</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Verified salon merchants, salon access rights, and SaaS subscription tiers.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded-xl border border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by owner name, salon or phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          emptyMessage="No salon owners match your search."
        />
      </div>
    </AdminLayout>
  );
}

