'use client';

import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Lock } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_AUDIT_LOGS } from '../../lib/mock-data';
import { AdminAuditLog } from '../../lib/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const isMockMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';

  React.useEffect(() => {
    fetch('/api/audit-logs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.logs) {
          setLogs(data.logs);
        } else if (isMockMode) {
          setLogs(INITIAL_AUDIT_LOGS);
        }
      })
      .catch(() => {
        if (isMockMode) setLogs(INITIAL_AUDIT_LOGS);
      });
  }, [isMockMode]);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const columns: Column<AdminAuditLog>[] = [
    {
      header: 'Timestamp (UTC)',
      cell: (item) => (
        <div>
          <span className="font-mono text-xs text-stone-800 block">
            {new Date(item.timestamp).toLocaleDateString()}
          </span>
          <span className="font-mono text-[10px] text-stone-400">
            {new Date(item.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Admin Actor',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900 text-xs">{item.adminEmail}</p>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <Badge status={item.adminRole} />
            {item.ipAddress && (
              <span className="text-[10px] font-mono text-stone-400">IP: {item.ipAddress}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Action & Target',
      cell: (item) => (
        <div>
          <span className="font-mono font-bold text-xs text-stone-800 block">{item.action}</span>
          <span className="text-[11px] text-stone-500">
            {item.targetCollection} • <code className="text-[10px] bg-stone-100 px-1 py-0.2 rounded">{item.targetId}</code>
          </span>
        </div>
      ),
    },
    {
      header: 'Reason / Justification',
      cell: (item) => (
        <div className="max-w-xs">
          <p className="text-xs text-stone-700">{item.reason || 'Standard operational verification'}</p>
        </div>
      ),
    },
    {
      header: 'Result',
      cell: (item) => <Badge status={item.result} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Security Audit Logs</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Append-only immutable record of all privileged administrator modifications and security events.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Tamper-evident MongoDB audit store</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by admin email, action or reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            >
              <option value="ALL">All Actions</option>
              <option value="SALON_APPROVE">SALON_APPROVE</option>
              <option value="SALON_REJECT">SALON_REJECT</option>
              <option value="SALON_SUSPEND">SALON_SUSPEND</option>
              <option value="ADMIN_ROLE_ASSIGN">ADMIN_ROLE_ASSIGN</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          emptyMessage="No audit logs match your search."
        />
      </div>
    </AdminLayout>
  );
}

