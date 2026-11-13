'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, CalendarCheck, Smartphone, Globe, MessageSquare, Footprints } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatCard } from '../../components/ui/StatCard';

export default function PlatformAnalyticsPage() {
  const channelBreakdown = [
    { name: 'Mobile App Bookings', count: 18, share: '45%', icon: Smartphone, color: 'bg-purple-500' },
    { name: 'Direct Walk-In Engine', count: 12, share: '30%', icon: Footprints, color: 'bg-amber-500' },
    { name: 'Public Web Portal', count: 6, share: '15%', icon: Globe, color: 'bg-blue-500' },
    { name: 'WhatsApp Business API', count: 4, share: '10%', icon: MessageSquare, color: 'bg-emerald-500' },
  ];

  const cityPerformance = [
    { city: 'Bengaluru (Indiranagar / Koramangala / HSR)', salons: 4, bookings: 40, revenue: '₹19,72,000' },
    { city: 'Mumbai (Bandra / Juhu - Upcoming)', salons: 0, bookings: 0, revenue: '₹0' },
    { city: 'Delhi NCR (Gurgaon - Upcoming)', salons: 0, bookings: 0, revenue: '₹0' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Platform Analytics & Growth</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Cross-channel booking origination, salon network expansion, and customer retention metrics.
          </p>
        </div>

        {/* Growth KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Monthly Booking Velocity"
            value="40 Bookings"
            subtitle="Combined online, web & walk-in"
            change="31%"
            isPositive={true}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          />
          <StatCard
            title="Average Ticket Size"
            value="₹872"
            subtitle="Per customer appointment"
            change="12%"
            isPositive={true}
            icon={<BarChart3 className="w-4 h-4 text-[#4A154B]" />}
          />
          <StatCard
            title="Customer Re-booking Rate"
            value="64%"
            subtitle="Return within 35 days"
            change="8%"
            isPositive={true}
            icon={<Users className="w-4 h-4 text-amber-600" />}
          />
        </div>

        {/* Channel Origination Breakdown */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 mb-4">Unified Booking Engine Origin Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {channelBreakdown.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="p-4 rounded-xl border border-stone-100 bg-stone-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-700">{item.name}</span>
                    <Icon className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-stone-900">{item.share}</span>
                    <span className="text-xs text-stone-500">({item.count} appts)</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: item.share }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* City & Territory Performance Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900">Regional Territory Performance</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3 px-6">Metropolitan Territory</th>
                <th className="py-3 px-6">Active Salons</th>
                <th className="py-3 px-6">Completed Bookings</th>
                <th className="py-3 px-6 text-right">Service Gross Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {cityPerformance.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="py-3.5 px-6 font-medium text-stone-900">{row.city}</td>
                  <td className="py-3.5 px-6">{row.salons}</td>
                  <td className="py-3.5 px-6">{row.bookings}</td>
                  <td className="py-3.5 px-6 text-right font-semibold text-stone-900">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

