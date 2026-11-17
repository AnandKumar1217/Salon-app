'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldAlert,
  RotateCcw,
  Eye,
  Store,
  MapPin,
  Phone,
  Mail,
  FileCheck,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_SALONS, INITIAL_OWNER_APPLICATIONS } from '../../lib/mock-data';
import { Salon, OwnerApplication, SalonStatus, ActivityRequest } from '../../lib/types';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ApproveSalonModal } from '../../components/modals/ApproveSalonModal';
import { RejectSalonModal } from '../../components/modals/RejectSalonModal';
import { SuspendSalonModal } from '../../components/modals/SuspendSalonModal';

export default function SalonsManagementPage() {
  const { canManageSalons } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'APPROVED' | 'APPLICATIONS' | 'ACTIVITIES'>('APPROVED');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [activityRequests, setActivityRequests] = useState<ActivityRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modal states
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'SUSPEND' | null>(null);

  const isMockMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';

  const loadData = useCallback(async () => {
    try {
      const [salonsRes, appsRes, actRes] = await Promise.all([
        fetch('/api/salons').catch(() => null),
        fetch('/api/owner-applications').catch(() => null),
        fetch('/api/activity-requests').catch(() => null),
      ]);

      if (salonsRes && salonsRes.ok) {
        const data = await salonsRes.json();
        setSalons(data.salons || []);
      } else if (isMockMode) {
        setSalons(INITIAL_SALONS);
      }

      if (appsRes && appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      } else if (isMockMode) {
        setApplications(INITIAL_OWNER_APPLICATIONS);
      }

      if (actRes && actRes.ok) {
        const data = await actRes.json();
        setActivityRequests(data.requests || []);
      }
    } catch {
      if (isMockMode) {
        setSalons(INITIAL_SALONS);
        setApplications(INITIAL_OWNER_APPLICATIONS);
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [isMockMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approve application
  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      await fetch(`/api/salons/${selectedApp.id}/approve`, { method: 'POST' });
    } catch (e) {
      console.warn('API approve call error:', e);
    }

    setApplications((prev) =>
      prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'APPROVED' as SalonStatus } : a))
    );

    // Add to approved salons list if new
    const newSalon: Salon = {
      id: `salon_${Date.now()}`,
      slug: selectedApp.salonName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: selectedApp.salonName,
      tagline: 'Premium Grooming Experience',
      description: selectedApp.businessDescription,
      ownerId: selectedApp.ownerId,
      ownerName: selectedApp.ownerName,
      ownerPhone: selectedApp.ownerPhone,
      ownerEmail: selectedApp.ownerEmail,
      coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      images: [],
      rating: 5.0,
      reviewCount: 0,
      address: selectedApp.salonAddress,
      city: selectedApp.city,
      postalCode: selectedApp.postalCode,
      phone: selectedApp.salonContact,
      whatsappNumber: selectedApp.salonContact,
      status: 'APPROVED',
      operatingHours: {
        monday: { open: '09:00', close: '21:00', isOpen: true },
        tuesday: { open: '09:00', close: '21:00', isOpen: true },
        wednesday: { open: '09:00', close: '21:00', isOpen: true },
        thursday: { open: '09:00', close: '21:00', isOpen: true },
        friday: { open: '09:00', close: '21:00', isOpen: true },
        saturday: { open: '09:00', close: '21:00', isOpen: true },
        sunday: { open: '10:00', close: '20:00', isOpen: true },
      },
      bufferMinutes: 10,
      cancellationWindowHours: 2,
      categories: [selectedApp.salonCategory],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSalons((prev) => [newSalon, ...prev]);
  };

  // Reject application with mandatory reason
  const handleReject = async (reason: string) => {
    if (!selectedApp) return;

    try {
      await fetch(`/api/salons/${selectedApp.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch (e) {
      console.warn('API reject call error:', e);
    }

    setApplications((prev) =>
      prev.map((a) =>
        a.id === selectedApp.id
          ? { ...a, status: 'REJECTED' as SalonStatus, rejectionReason: reason }
          : a
      )
    );
  };

  // Suspend salon with mandatory reason
  const handleSuspend = async (reason: string) => {
    if (!selectedSalon) return;

    try {
      await fetch(`/api/salons/${selectedSalon.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch (e) {
      console.warn('API suspend call error:', e);
    }

    setSalons((prev) =>
      prev.map((s) =>
        s.id === selectedSalon.id
          ? { ...s, status: 'SUSPENDED' as SalonStatus, suspensionReason: reason, isOnlineBookingPaused: true }
          : s
      )
    );
  };

  // Reactivate salon
  const handleReactivate = async (salon: Salon) => {
    try {
      await fetch(`/api/salons/${salon.id}/reactivate`, { method: 'POST' });
    } catch (e) {
      console.warn('API reactivate call error:', e);
    }

    setSalons((prev) =>
      prev.map((s) =>
        s.id === salon.id ? { ...s, status: 'APPROVED' as SalonStatus, isOnlineBookingPaused: false } : s
      )
    );
  };

  // Filtered salons
  const filteredSalons = salons.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered applications
  const filteredApplications = applications.filter((a) => {
    const matchesSearch =
      a.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const salonColumns: Column<Salon>[] = [
    {
      header: 'Salon & Location',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900">{item.name}</p>
          <div className="flex items-center space-x-1 text-xs text-stone-500 mt-0.5">
            <MapPin className="w-3 h-3 text-stone-400" />
            <span>{item.address}, {item.city}</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">slug: {item.slug}</span>
        </div>
      ),
    },
    {
      header: 'Owner Contact',
      cell: (item) => (
        <div>
          <p className="font-medium text-stone-800">{item.ownerName}</p>
          <p className="text-xs text-stone-500">{item.phone}</p>
          <p className="text-[11px] text-stone-400">{item.ownerEmail}</p>
        </div>
      ),
    },
    {
      header: 'Rating & Activity',
      cell: (item) => (
        <div>
          <div className="flex items-center space-x-1">
            <span className="font-bold text-amber-600">★ {item.rating}</span>
            <span className="text-xs text-stone-400">({item.reviewCount} reviews)</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {item.totalBookingsCount ? `${item.totalBookingsCount} bookings` : 'New listing'}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <div>
          <Badge status={item.status} />
          {item.status === 'SUSPENDED' && item.suspensionReason && (
            <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={item.suspensionReason}>
              Reason: {item.suspensionReason}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {item.status === 'APPROVED' && canManageSalons && (
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => {
                setSelectedSalon(item);
                setActionType('SUSPEND');
              }}
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Suspend
            </Button>
          )}
          {item.status === 'SUSPENDED' && canManageSalons && (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleReactivate(item)}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  const appColumns: Column<OwnerApplication>[] = [
    {
      header: 'Salon & Business',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900">{item.salonName}</p>
          <p className="text-xs text-stone-500">{item.salonAddress}, {item.city}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">{item.businessDescription}</p>
        </div>
      ),
    },
    {
      header: 'Applicant Details',
      cell: (item) => (
        <div>
          <p className="font-medium text-stone-800">{item.ownerName}</p>
          <p className="text-xs text-stone-500">{item.ownerPhone}</p>
          <p className="text-[11px] text-stone-400">{item.ownerEmail}</p>
        </div>
      ),
    },
    {
      header: 'Verification Docs',
      cell: (item) => (
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-stone-700">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Category: {item.salonCategory}</span>
          </div>
          {item.taxOrRegNumber ? (
            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded mt-1 inline-block">
              GST: {item.taxOrRegNumber}
            </span>
          ) : (
            <span className="text-[10px] text-amber-600 font-medium">No GST Number</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status & Date',
      cell: (item) => (
        <div>
          <Badge status={item.status} />
          <p className="text-[10px] text-stone-400 mt-1">
            Submitted: {new Date(item.submittedAt).toLocaleDateString()}
          </p>
          {item.status === 'REJECTED' && item.rejectionReason && (
            <p className="text-[10px] text-rose-600 mt-0.5 max-w-xs truncate" title={item.rejectionReason}>
              Reason: {item.rejectionReason}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Decision',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {item.status === 'PENDING_APPROVAL' && canManageSalons && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedApp(item);
                  setActionType('REJECT');
                }}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setSelectedApp(item);
                  setActionType('APPROVE');
                }}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleApproveActivity = async (reqItem: ActivityRequest) => {
    try {
      await fetch(`/api/activity-requests/${reqItem.id}/approve`, { method: 'POST' });
      setActivityRequests((prev) =>
        prev.map((r) => (r.id === reqItem.id ? { ...r, status: 'APPROVED' } : r))
      );
    } catch (e) {
      console.warn('API activity approve error:', e);
    }
  };

  const handleRejectActivity = async (reqItem: ActivityRequest) => {
    const reason = window.prompt('Enter reason for rejecting this activity request:') || '';
    if (!reason || reason.trim().length < 5) {
      alert('A reason of at least 5 characters is required to reject.');
      return;
    }

    try {
      await fetch(`/api/activity-requests/${reqItem.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      setActivityRequests((prev) =>
        prev.map((r) => (r.id === reqItem.id ? { ...r, status: 'REJECTED', rejectionReason: reason } : r))
      );
    } catch (e) {
      console.warn('API activity reject error:', e);
    }
  };

  const activityColumns: Column<ActivityRequest>[] = [
    {
      header: 'Salon & Request Title',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900">{item.title}</p>
          <p className="text-xs text-stone-500">{item.salonName}</p>
          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">
            {item.requestType.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Description & Scope',
      cell: (item) => (
        <div>
          <p className="text-xs text-stone-700 max-w-sm line-clamp-2">{item.description}</p>
          <p className="text-[11px] text-stone-400 mt-1">Submitted by: {item.ownerName} ({item.ownerEmail || 'N/A'})</p>
        </div>
      ),
    },
    {
      header: 'Status & Date',
      cell: (item) => (
        <div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              item.status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : item.status === 'REJECTED'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {item.status}
          </span>
          <p className="text-[10px] text-stone-400 mt-1">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
          {item.rejectionReason && (
            <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
              Reason: {item.rejectionReason}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center space-x-1.5">
          {item.status === 'PENDING' && canManageSalons && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => handleRejectActivity(item)}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleApproveActivity(item)}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filteredActivities = activityRequests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Salon Directory & Onboarding</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Review establishment credentials, manage approval workflows, and govern salon status.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'APPROVED' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Active Salons ({salons.length})
            </button>
            <button
              onClick={() => setActiveTab('APPLICATIONS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'APPLICATIONS' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Onboarding Applications</span>
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {applications.filter((a) => a.status === 'PENDING_APPROVAL').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ACTIVITIES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'ACTIVITIES' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Activity Requests</span>
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activityRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Filter Dock */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by salon name, owner or city..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_APPROVAL">Pending Review</option>
              <option value="PENDING">Pending Request</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {activeTab === 'APPROVED' && (
          <DataTable
            columns={salonColumns}
            data={filteredSalons}
            keyExtractor={(item) => item.id}
            emptyMessage="No approved salons match your search criteria."
          />
        )}
        {activeTab === 'APPLICATIONS' && (
          <DataTable
            columns={appColumns}
            data={filteredApplications}
            keyExtractor={(item) => item.id}
            emptyMessage="No onboarding applications match your filter."
          />
        )}
        {activeTab === 'ACTIVITIES' && (
          <DataTable
            columns={activityColumns}
            data={filteredActivities}
            keyExtractor={(item) => item.id}
            emptyMessage="No activity approval requests found."
          />
        )}
      </div>

      {/* Modals */}
      {selectedApp && actionType === 'APPROVE' && (
        <ApproveSalonModal
          isOpen={true}
          onClose={() => {
            setSelectedApp(null);
            setActionType(null);
          }}
          salonName={selectedApp.salonName}
          applicantName={selectedApp.ownerName}
          onConfirm={handleApprove}
        />
      )}

      {selectedApp && actionType === 'REJECT' && (
        <RejectSalonModal
          isOpen={true}
          onClose={() => {
            setSelectedApp(null);
            setActionType(null);
          }}
          salonName={selectedApp.salonName}
          onConfirm={handleReject}
        />
      )}

      {selectedSalon && actionType === 'SUSPEND' && (
        <SuspendSalonModal
          isOpen={true}
          onClose={() => {
            setSelectedSalon(null);
            setActionType(null);
          }}
          salonName={selectedSalon.name}
          onConfirm={handleSuspend}
        />
      )}
    </AdminLayout>
  );
}

