'use client';

import React, { useState } from 'react';
import { Search, Filter, LifeBuoy, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { INITIAL_TICKETS } from '../../lib/mock-data';
import { SupportTicket, TicketStatus } from '../../lib/types';
import { TicketReplyModal } from '../../components/modals/TicketReplyModal';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function SupportTicketsPage() {
  const { canHandleSupport } = useAdminAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const handleUpdateTicket = async (
    ticketId: string,
    replyText: string,
    newStatus: TicketStatus,
    internalNotes?: string
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedReplies = [...t.replies];
          if (replyText.trim()) {
            updatedReplies.push({
              id: `rep_${Date.now()}`,
              sender: 'ADMIN',
              senderName: 'Admin Team',
              message: replyText,
              createdAt: new Date().toISOString(),
            });
          }
          return {
            ...t,
            status: newStatus,
            internalNotes: internalNotes || t.internalNotes,
            replies: updatedReplies,
            updatedAt: new Date().toISOString(),
            resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : t.resolvedAt,
          };
        }
        return t;
      })
    );
  };

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<SupportTicket>[] = [
    {
      header: 'Ticket # & Priority',
      cell: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-stone-900 block">{item.ticketNumber}</span>
          <Badge status={item.priority} className="mt-1" />
        </div>
      ),
    },
    {
      header: 'User & Type',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900">{item.userName}</p>
          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded font-medium">
            {item.userType === 'SALON_OWNER' ? 'Salon Merchant' : 'Customer'}
          </span>
          {item.salonName && <p className="text-[11px] text-stone-400 mt-0.5">{item.salonName}</p>}
        </div>
      ),
    },
    {
      header: 'Subject & Message',
      cell: (item) => (
        <div className="max-w-md">
          <p className="font-semibold text-stone-800 text-xs truncate">{item.subject}</p>
          <p className="text-stone-500 text-xs truncate mt-0.5">{item.message}</p>
          {item.replies.length > 0 && (
            <span className="text-[10px] text-[#4A154B] font-semibold mt-1 inline-block">
              {item.replies.length} replies logged
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Assigned Agent',
      cell: (item) => (
        <span className="text-xs text-stone-600 font-medium">{item.assignedToAdminName || 'Unassigned'}</span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <Badge status={item.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedTicket(item)}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1" />
          Reply
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Support & Complaint Tickets</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Resolve merchant onboarding queries, customer payment issues, and appointment disputes.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, user name or keyword..."
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
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          emptyMessage="No support tickets match your filter criteria."
        />
      </div>

      {selectedTicket && (
        <TicketReplyModal
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          onSave={handleUpdateTicket}
        />
      )}
    </AdminLayout>
  );
}

