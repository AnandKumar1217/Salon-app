'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Scissors,
  Users,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  CalendarCheck,
  CreditCard,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { INITIAL_SALONS, INITIAL_BOOKINGS } from '../../../lib/mock-data';
import { Salon, SalonStatus } from '../../../lib/types';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { SuspendSalonModal } from '../../../components/modals/SuspendSalonModal';

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { canManageSalons } = useAdminAuth();
  const salonId = params?.id as string;

  const [salon, setSalon] = useState<Salon | undefined>(
    INITIAL_SALONS.find((s) => s.id === salonId || s.slug === salonId) || INITIAL_SALONS[0]
  );

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  if (!salon) {
    return (
      <AdminLayout>
        <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
          <p className="text-sm font-semibold text-stone-700">Salon not found</p>
          <Link href="/salons" className="text-xs text-[#4A154B] hover:underline mt-2 inline-block">
            ← Back to Salons Directory
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const salonBookings = INITIAL_BOOKINGS.filter((b) => b.salonId === salon.id);

  const handleSuspend = async (reason: string) => {
    setSalon((prev) =>
      prev
        ? {
            ...prev,
            status: 'SUSPENDED' as SalonStatus,
            suspensionReason: reason,
            isOnlineBookingPaused: true,
          }
        : prev
    );
  };

  const handleReactivate = () => {
    setSalon((prev) =>
      prev
        ? {
            ...prev,
            status: 'APPROVED' as SalonStatus,
            isOnlineBookingPaused: false,
            suspensionReason: undefined,
          }
        : prev
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Navigation Back */}
        <div>
          <Link
            href="/salons"
            className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Salons Directory
          </Link>
        </div>

        {/* Salon Header Profile Card */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="h-44 bg-stone-900 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={salon.coverImage}
              alt={salon.name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{salon.name}</h1>
                  <Badge status={salon.status} />
                </div>
                <p className="text-xs text-stone-200 mt-0.5">{salon.tagline}</p>
              </div>

              {canManageSalons && (
                <div className="flex items-center space-x-2">
                  {salon.status === 'APPROVED' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setIsSuspendModalOpen(true)}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                      Suspend Salon
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleReactivate}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Reactivate Salon
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="px-6 py-4 bg-stone-50/70 border-b border-stone-100 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-stone-400 font-semibold uppercase text-[10px]">Location</p>
              <p className="font-semibold text-stone-800 mt-0.5">{salon.address}, {salon.city}</p>
            </div>
            <div>
              <p className="text-stone-400 font-semibold uppercase text-[10px]">Contact</p>
              <p className="font-semibold text-stone-800 mt-0.5">{salon.phone}</p>
            </div>
            <div>
              <p className="text-stone-400 font-semibold uppercase text-[10px]">Ratings & Reviews</p>
              <p className="font-semibold text-stone-800 mt-0.5">★ {salon.rating} ({salon.reviewCount} reviews)</p>
            </div>
            <div>
              <p className="text-stone-400 font-semibold uppercase text-[10px]">Booking URL Slug</p>
              <p className="font-mono text-stone-800 font-semibold mt-0.5">/salon/{salon.slug}</p>
            </div>
          </div>

          {/* Detailed Content Tabs */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Operating Hours */}
            <div className="lg:col-span-2 space-y-6">
              {/* Suspension Banner if suspended */}
              {salon.status === 'SUSPENDED' && salon.suspensionReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Salon Account Suspended</span>
                  </div>
                  <p className="text-rose-700">Reason: {salon.suspensionReason}</p>
                </div>
              )}

              {/* Description */}
              <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">About Salon</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{salon.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {salon.categories.map((c) => (
                    <span key={c} className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Operating Hours & Buffer Rules</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(salon.operatingHours).map(([day, hours]) => (
                    <div key={day} className="p-2 bg-white rounded border border-stone-200">
                      <p className="font-semibold text-stone-800 capitalize text-[11px]">{day}</p>
                      <p className="text-stone-500 text-[10px]">
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>Cleanup Buffer: <strong>{salon.bufferMinutes} mins</strong></span>
                  <span>Cancellation Window: <strong>{salon.cancellationWindowHours} hours</strong></span>
                </div>
              </div>

              {/* Recent Bookings in this Salon */}
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                  Recent Booking Activity ({salonBookings.length})
                </h3>
                {salonBookings.length === 0 ? (
                  <p className="text-xs text-stone-400">No bookings recorded yet for this salon.</p>
                ) : (
                  <div className="divide-y divide-stone-100 text-xs">
                    {salonBookings.map((b) => (
                      <div key={b.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-stone-800">{b.bookingCode}</span>
                          <span className="text-stone-500 ml-2">{b.customerName}</span>
                          <span className="text-stone-400 text-[10px] ml-2 font-mono">({b.source})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-stone-900">₹{b.totalAmount}</span>
                          <Badge status={b.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Owner Profile & Verification Docs */}
            <div className="space-y-6">
              {/* Owner Info Card */}
              <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200 text-xs space-y-3">
                <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Owner Profile</h3>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{salon.ownerName}</p>
                  <p className="text-stone-400 font-mono text-[10px]">ID: {salon.ownerId}</p>
                </div>
                <div className="space-y-1.5 text-stone-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{salon.ownerPhone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{salon.ownerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Compliance & Verification Card */}
              <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200 text-xs space-y-3">
                <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                  Business Verification
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Commercial Registration</p>
                      <p className="text-[11px] text-stone-500">Verified by Operations Admin</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Premises Physical Location</p>
                      <p className="text-[11px] text-stone-500">Indiranagar HAL 2nd Stage</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Staff Health & Sanitation</p>
                      <p className="text-[11px] text-stone-500">Hygiene protocol active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSuspendModalOpen && (
        <SuspendSalonModal
          isOpen={true}
          onClose={() => setIsSuspendModalOpen(false)}
          salonName={salon.name}
          onConfirm={handleSuspend}
        />
      )}
    </AdminLayout>
  );
}

