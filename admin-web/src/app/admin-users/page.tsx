'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, ShieldCheck, Mail, Calendar, Lock } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_ADMIN_USERS } from '../../lib/mock-data';
import { AdminUser, AdminRole } from '../../lib/types';
import { InviteAdminModal } from '../../components/modals/InviteAdminModal';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminUsersManagementPage() {
  const { canManageAdmins } = useAdminAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const isMockMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';

  React.useEffect(() => {
    fetch('/api/admin-users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.admins) {
          setAdminUsers(data.admins);
        } else if (isMockMode) {
          setAdminUsers(INITIAL_ADMIN_USERS);
        }
      })
      .catch(() => {
        if (isMockMode) setAdminUsers(INITIAL_ADMIN_USERS);
      });
  }, [isMockMode]);

  const handleInvite = async (data: { email: string; name: string; role: AdminRole }) => {
    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        setAdminUsers((prev) => [...prev, resData.admin]);
        return;
      }
    } catch (e) {
      console.warn('API invite error:', e);
    }

    const newAdmin: AdminUser = {
      id: `adm_${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setAdminUsers((prev) => [...prev, newAdmin]);
  };

  const columns: Column<AdminUser>[] = [
    {
      header: 'Admin Name & Email',
      cell: (item) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#4A154B] text-white flex items-center justify-center font-bold text-xs">
            {item.name[0]}
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-xs">{item.name}</p>
            <p className="text-[11px] text-stone-500">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Security Role (Custom Claim)',
      cell: (item) => (
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4A154B]" />
          <Badge status={item.role} />
        </div>
      ),
    },
    {
      header: 'Account Status',
      cell: (item) => <Badge status={item.isActive ? 'ACTIVE' : 'SUSPENDED'} />,
    },
    {
      header: 'Provisioned On',
      cell: (item) => (
        <span className="text-xs text-stone-600">{new Date(item.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      header: 'Last Session Activity',
      cell: (item) => (
        <span className="text-xs text-stone-500">
          {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : 'Never'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Administrator Governance</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Super Admin authority to provision roles, configure custom claims, and manage team access.
            </p>
          </div>

          {canManageAdmins && (
            <Button size="sm" variant="primary" onClick={() => setIsInviteOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Administrator
            </Button>
          )}
        </div>

        {/* Role Permissions Reference Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs space-y-2">
          <h4 className="font-bold text-stone-800 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-[#4A154B]" />
            <span>Platform Role Privilege Matrix</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="bg-white p-3 rounded-lg border border-stone-200">
              <Badge status="SUPER_ADMIN" />
              <p className="text-[11px] text-stone-600 mt-1.5">Full unrestricted platform authority, admin management & system config.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-stone-200">
              <Badge status="OPERATIONS_ADMIN" />
              <p className="text-[11px] text-stone-600 mt-1.5">Salon verification & onboarding, user suspension, and booking auditing.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-stone-200">
              <Badge status="SUPPORT_ADMIN" />
              <p className="text-[11px] text-stone-600 mt-1.5">Customer & salon inquiries, complaints, and ticket resolution.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-stone-200">
              <Badge status="FINANCE_ADMIN" />
              <p className="text-[11px] text-stone-600 mt-1.5">SaaS subscription billing, platform financial reporting & reconciliation.</p>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={adminUsers}
          keyExtractor={(item) => item.id}
          emptyMessage="No administrators configured."
        />
      </div>

      <InviteAdminModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
      />
    </AdminLayout>
  );
}

