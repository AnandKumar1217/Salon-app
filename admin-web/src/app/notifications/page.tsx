'use client';

import React, { useState } from 'react';
import { BellRing, Send, Plus, CheckCircle2, Users, Store, Smartphone } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { BroadcastNotificationModal } from '../../components/modals/BroadcastNotificationModal';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  target: string;
  sentBy: string;
  deliveredCount: number;
  sentAt: string;
}

const INITIAL_BROADCASTS: BroadcastRecord[] = [
  {
    id: 'bc_1',
    title: 'Festive Season Salon Rush Preparation ✨',
    message: 'Diwali and festive rush is coming! Update your stylist shifts and holiday hours in Owner Mode now.',
    target: 'SALON_OWNERS',
    sentBy: 'admin@glamora.com',
    deliveredCount: 4,
    sentAt: '2026-11-08T10:00:00Z',
  },
  {
    id: 'bc_2',
    title: 'New Salons Live in Bengaluru! 💇‍♀️',
    message: 'Explore award-winning luxury spas and grooming salons now open on Glamora.',
    target: 'CUSTOMERS',
    sentBy: 'operations@glamora.com',
    deliveredCount: 4,
    sentAt: '2026-11-05T14:30:00Z',
  },
];

export default function NotificationsBroadcastPage() {
  const { canManageSalons } = useAdminAuth();
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>(INITIAL_BROADCASTS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSend = async (data: {
    target: 'ALL' | 'CUSTOMERS' | 'SALON_OWNERS' | 'SPECIFIC_SALON';
    title: string;
    message: string;
  }) => {
    const newBroadcast: BroadcastRecord = {
      id: `bc_${Date.now()}`,
      title: data.title,
      message: data.message,
      target: data.target,
      sentBy: 'admin@glamora.com',
      deliveredCount: data.target === 'ALL' ? 8 : 4,
      sentAt: new Date().toISOString(),
    };
    setBroadcasts((prev) => [newBroadcast, ...prev]);
  };

  const columns: Column<BroadcastRecord>[] = [
    {
      header: 'Notification Title & Message',
      cell: (item) => (
        <div className="max-w-md">
          <p className="font-semibold text-stone-900 text-xs">{item.title}</p>
          <p className="text-stone-500 text-xs mt-0.5">{item.message}</p>
        </div>
      ),
    },
    {
      header: 'Target Audience',
      cell: (item) => (
        <div className="flex items-center space-x-1.5">
          <Smartphone className="w-3.5 h-3.5 text-[#4A154B]" />
          <Badge status={item.target} />
        </div>
      ),
    },
    {
      header: 'Delivery Stats',
      cell: (item) => (
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          {item.deliveredCount} devices alerted
        </span>
      ),
    },
    {
      header: 'Dispatched By & Date',
      cell: (item) => (
        <div>
          <p className="text-xs text-stone-700">{item.sentBy}</p>
          <p className="text-[10px] text-stone-400">{new Date(item.sentAt).toLocaleString()}</p>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Platform Push & Notifications</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Send system announcements via push notifications and mobile notification feeds.
            </p>
          </div>

          {canManageSalons && (
            <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Compose Broadcast
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={broadcasts}
          keyExtractor={(item) => item.id}
          emptyMessage="No broadcast notifications have been dispatched yet."
        />
      </div>

      <BroadcastNotificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={handleSend}
      />
    </AdminLayout>
  );
}

