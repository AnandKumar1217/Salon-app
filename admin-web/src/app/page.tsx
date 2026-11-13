'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Store,
  CalendarCheck,
  CreditCard,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  INITIAL_DASHBOARD_STATS,
  INITIAL_OWNER_APPLICATIONS,
  INITIAL_BOOKINGS,
  INITIAL_AUDIT_LOGS,
} from '../lib/mock-data';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ApproveSalonModal } from '../components/modals/ApproveSalonModal';
import { RejectSalonModal } from '../components/modals/RejectSalonModal';

export default function AdminDashboardPage() {
  const { canManageSalons } = useAdminAuth();
  const [stats, setStats] = useState(INITIAL_DASHBOARD_STATS);
  const [pendingApplications, setPendingApplications] = useState(
    INITIAL_OWNER_APPLICATIONS.filter((a) => a.status === 'PENDING_APPROVAL')
  );
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'APPROVE' | 'REJECT' | null>(null);

  const handleApprove = async () => {
    if (!selectedApp) return;
    setPendingApplications((prev) => prev.filter((a) => a.id !== selectedApp.id));
    setStats((prev) => ({
      ...prev,
      pendingSalons: Math.max(0, prev.pendingSalons - 1),
      approvedSalons: prev.approvedSalons + 1,
    }));
  };

  const handleReject = async (reason: string) => {
    if (!selectedApp) return;
    setPendingApplications((prev) => prev.filter((a) => a.id !== selectedApp.id));
    setStats((prev) => ({
      ...prev,
      pendingSalons: Math.max(0, prev.pendingSalons - 1),
      rejectedSalons: prev.rejectedSalons + 1,
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              Operations & Platform Overview
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Live metrics across Glamora Mobile, WhatsApp & Public Web booking systems.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-400">Date Range:</span>
            <select className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B]">
              <option>Today (11 Nov 2026)</option>
              <option>Past 7 Days</option>
              <option>This Month (Nov 2026)</option>
              <option>All Time</option>
            </select>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Registered Salons"
            value={stats.totalSalons}
            subtitle={`${stats.approvedSalons} Approved • ${stats.pendingSalons} Pending`}
            change="14%"
            isPositive={true}
            icon={<Store className="w-4 h-4 text-[#4A154B]" />}
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            subtitle={`${stats.todayBookings} Scheduled for Today`}
            change="22%"
            isPositive={true}
            icon={<CalendarCheck className="w-4 h-4 text-emerald-600" />}
          />
          <StatCard
            title="Platform SaaS Revenue"
            value={`₹${stats.monthlySubscriptionRevenue.toLocaleString()}`}
            subtitle="Glamora Merchant Subscriptions"
            change="18%"
            isPositive={true}
            icon={<CreditCard className="w-4 h-4 text-indigo-600" />}
          />
          <StatCard
            title="Customer Base"
            value={stats.totalCustomers}
            subtitle={`${stats.totalOwners} Salon Merchant Profiles`}
            change="9%"
            isPositive={true}
            icon={<Users className="w-4 h-4 text-amber-600" />}
          />
        </div>

        {/* Pending Salons Verification Section */}
        {pendingApplications.length > 0 && (
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-stone-900">
                  Pending Salon Applications Requiring Verification ({pendingApplications.length})
                </h3>
              </div>
              <Link
                href="/salons"
                className="text-xs font-semibold text-[#4A154B] hover:underline flex items-center space-x-1"
              >
                <span>View Salons Tab</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-900">{app.salonName}</h4>
                      <Badge status={app.status} />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">{app.salonAddress}, {app.city}</p>
                    <div className="mt-2 text-[11px] text-stone-600 space-y-0.5">
                      <p>Applicant: <strong>{app.ownerName}</strong> ({app.ownerPhone})</p>
                      <p>Category: <span className="text-stone-800">{app.salonCategory}</span></p>
                      {app.taxOrRegNumber && (
                        <p className="font-mono text-[10px] text-stone-500">GST: {app.taxOrRegNumber}</p>
                      )}
                    </div>
                  </div>

                  {canManageSalons && (
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApp(app);
                          setModalMode('REJECT');
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedApp(app);
                          setModalMode('APPROVE');
                        }}
                      >
                        Approve Salon
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operational Grid: Today's Bookings & Live Audit Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Bookings Activity */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-stone-400" />
                <h3 className="text-sm font-semibold text-stone-900">Today's Booking Stream</h3>
              </div>
              <Link href="/bookings" className="text-xs font-semibold text-[#4A154B] hover:underline">
                View All Bookings
              </Link>
            </div>

            <div className="space-y-3">
              {INITIAL_BOOKINGS.slice(0, 4).map((bk) => (
                <div
                  key={bk.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-stone-100 hover:bg-stone-50/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-stone-800">{bk.bookingCode}</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-semibold uppercase">
                        {bk.source}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{bk.customerName} • {bk.salonName}</p>
                    <p className="text-[11px] text-stone-400">{bk.startTime} - {bk.endTime} • Stylist: {bk.staffName}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge status={bk.status} />
                    <p className="text-xs font-semibold text-stone-900">₹{bk.totalAmount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Security & Audit Trail */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-stone-400" />
                <h3 className="text-sm font-semibold text-stone-900">Security & Action Audit Log</h3>
              </div>
              <Link href="/audit-logs" className="text-xs font-semibold text-[#4A154B] hover:underline">
                View Immutable Logs
              </Link>
            </div>

            <div className="space-y-3">
              {INITIAL_AUDIT_LOGS.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-stone-100 bg-stone-50/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-stone-600 text-[11px]">{log.reason || 'Admin action executed successfully'}</p>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                    <span>By: {log.adminEmail}</span>
                    <Badge status={log.adminRole} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedApp && modalMode === 'APPROVE' && (
        <ApproveSalonModal
          isOpen={true}
          onClose={() => {
            setSelectedApp(null);
            setModalMode(null);
          }}
          salonName={selectedApp.salonName}
          applicantName={selectedApp.ownerName}
          onConfirm={handleApprove}
        />
      )}

      {selectedApp && modalMode === 'REJECT' && (
        <RejectSalonModal
          isOpen={true}
          onClose={() => {
            setSelectedApp(null);
            setModalMode(null);
          }}
          salonName={selectedApp.salonName}
          onConfirm={handleReject}
        />
      )}
    </AdminLayout>
  );
}

