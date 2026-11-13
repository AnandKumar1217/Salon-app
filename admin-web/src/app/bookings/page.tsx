'use client';

import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock, User, Store, CreditCard, Eye, X } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { INITIAL_BOOKINGS } from '../../lib/mock-data';
import { Booking, BookingStatus, BookingSource } from '../../lib/types';

export default function BookingsMonitoringPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const isMockMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';

  React.useEffect(() => {
    fetch('/api/bookings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.bookings) {
          setBookings(data.bookings);
        } else if (isMockMode) {
          setBookings(INITIAL_BOOKINGS);
        }
      })
      .catch(() => {
        if (isMockMode) setBookings(INITIAL_BOOKINGS);
      });
  }, [isMockMode]);

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || b.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const columns: Column<Booking>[] = [
    {
      header: 'Booking Code & Source',
      cell: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-stone-900 block">{item.bookingCode}</span>
          <span className="inline-block mt-0.5 text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-semibold uppercase">
            {item.source}
          </span>
        </div>
      ),
    },
    {
      header: 'Salon & Stylist',
      cell: (item) => (
        <div>
          <p className="font-semibold text-stone-900">{item.salonName}</p>
          <p className="text-xs text-stone-500">Stylist: {item.staffName}</p>
        </div>
      ),
    },
    {
      header: 'Customer Details',
      cell: (item) => (
        <div>
          <p className="font-medium text-stone-800">{item.customerName}</p>
          <p className="text-xs text-stone-500">{item.customerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Schedule & Duration',
      cell: (item) => (
        <div>
          <p className="text-xs font-medium text-stone-800">{item.date}</p>
          <p className="text-xs text-stone-500">{item.startTime} - {item.endTime} ({item.totalDurationMinutes} mins)</p>
        </div>
      ),
    },
    {
      header: 'Payment Status',
      cell: (item) => (
        <div>
          <Badge status={item.paymentStatus} />
          <p className="text-xs font-semibold text-stone-900 mt-0.5">₹{item.totalAmount}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <div>
          <Badge status={item.status} />
          {item.cancellationReason && (
            <p className="text-[10px] text-rose-600 mt-1 max-w-[150px] truncate" title={item.cancellationReason}>
              {item.cancellationReason}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedBooking(item)}
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          Details
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Unified Booking Monitor</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Platform-wide cross-channel appointment monitoring (Mobile App, WhatsApp, Web, and Walk-ins).
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. GLM-84920), client, phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            >
              <option value="ALL">All Sources</option>
              <option value="APP">Mobile App</option>
              <option value="WEB">Public Web</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WALK_IN">Walk-In</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          emptyMessage="No bookings match your current filter parameters."
        />
      </div>

      {/* Booking Details Drawer / Modal */}
      {selectedBooking && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBooking(null)}
          title={`Booking ${selectedBooking.bookingCode}`}
          subtitle={`${selectedBooking.date} • ${selectedBooking.startTime} - ${selectedBooking.endTime}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <p className="text-stone-400 text-[10px] uppercase font-semibold">Salon</p>
                <p className="font-semibold text-stone-900 mt-0.5">{selectedBooking.salonName}</p>
                <p className="text-stone-500 text-[11px]">{selectedBooking.salonAddress}</p>
              </div>
              <div>
                <p className="text-stone-400 text-[10px] uppercase font-semibold">Assigned Staff</p>
                <p className="font-semibold text-stone-900 mt-0.5">{selectedBooking.staffName}</p>
                <p className="text-stone-500 text-[11px]">Staff ID: {selectedBooking.staffId}</p>
              </div>
              <div>
                <p className="text-stone-400 text-[10px] uppercase font-semibold">Customer</p>
                <p className="font-semibold text-stone-900 mt-0.5">{selectedBooking.customerName}</p>
                <p className="text-stone-500 text-[11px]">{selectedBooking.customerPhone}</p>
              </div>
              <div>
                <p className="text-stone-400 text-[10px] uppercase font-semibold">Booking Channel</p>
                <p className="font-semibold text-stone-900 mt-0.5">{selectedBooking.source}</p>
                <p className="text-stone-500 text-[11px]">Method: {selectedBooking.paymentMethod}</p>
              </div>
            </div>

            {/* Services List */}
            <div>
              <p className="font-semibold text-stone-800 mb-1.5">Booked Treatments</p>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                {selectedBooking.services.map((s) => (
                  <div key={s.id} className="p-2.5 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-medium text-stone-900">{s.name}</p>
                      <p className="text-[11px] text-stone-400">{s.durationMinutes} mins</p>
                    </div>
                    <span className="font-semibold text-stone-900">₹{s.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span>₹{selectedBooking.subtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST (5%):</span>
                <span>₹{selectedBooking.tax}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 text-sm pt-1 border-t border-stone-200">
                <span>Total Amount:</span>
                <span>₹{selectedBooking.totalAmount}</span>
              </div>
            </div>

            {/* Cancellation info if applicable */}
            {selectedBooking.cancellationReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <p className="font-semibold">Cancellation Log</p>
                <p className="mt-0.5 text-[11px]">{selectedBooking.cancellationReason}</p>
                {selectedBooking.cancelledAt && (
                  <p className="text-[10px] text-rose-600 mt-1 font-mono">
                    Time: {new Date(selectedBooking.cancelledAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

