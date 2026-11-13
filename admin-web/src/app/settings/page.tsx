'use client';

import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Database, Smartphone, Globe, MessageSquare } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';

export default function PlatformSettingsPage() {
  const [defaultBuffer, setDefaultBuffer] = useState('10');
  const [cancellationWindow, setCancellationWindow] = useState('2');
  const [taxRate, setTaxRate] = useState('5');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Platform Global Settings</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Default salon operating parameters, taxation policies, and booking engine constraints.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Booking Engine Global Defaults */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
              Default Salon Operating Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Default Buffer Time (Minutes)
                </label>
                <input
                  type="number"
                  value={defaultBuffer}
                  onChange={(e) => setDefaultBuffer(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
                />
                <p className="text-[10px] text-stone-400 mt-1">Clean-up & prep buffer between appointments</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cancellation Policy Window (Hours)
                </label>
                <input
                  type="number"
                  value={cancellationWindow}
                  onChange={(e) => setCancellationWindow(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
                />
                <p className="text-[10px] text-stone-400 mt-1">Minimum advance notice required for cancellations</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Standard Salon Tax / GST (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
                />
                <p className="text-[10px] text-stone-400 mt-1">Computed on service subtotal during checkout</p>
              </div>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
              Database & Media Infrastructure Connectivity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400">Database Engine</span>
                <p className="font-mono text-stone-800 font-semibold">MongoDB Production Cluster</p>
                <p className="text-emerald-600 text-[11px] font-medium">● Connected (Atlas / Local)</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400">Media & Image Storage</span>
                <p className="font-mono text-stone-800 font-semibold">Cloudinary CDN</p>
                <p className="text-emerald-600 text-[11px] font-medium">● High-Performance CDN Active</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSaved ? (
              <span className="text-xs font-semibold text-emerald-600">✓ Settings saved successfully</span>
            ) : (
              <div />
            )}
            <Button type="submit" variant="primary" size="sm">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Global Configuration
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

