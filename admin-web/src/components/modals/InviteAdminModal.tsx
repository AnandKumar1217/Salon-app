'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AdminRole } from '../../lib/types';
import { UserCheck, ShieldCheck } from 'lucide-react';

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; name: string; role: AdminRole }) => Promise<void>;
}

export const InviteAdminModal: React.FC<InviteAdminModalProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('OPERATIONS_ADMIN');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setLoading(true);
    try {
      await onInvite({ name, email, role });
      setName('');
      setEmail('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Authorized Administrator"
      subtitle="Issue administrator credentials and assign security role"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Staff Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jdoe@glamora.com"
            className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Assigned Security Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Privileges)</option>
            <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN (Salons & User Verification)</option>
            <option value="SUPPORT_ADMIN">SUPPORT_ADMIN (Customer & Owner Tickets)</option>
            <option value="FINANCE_ADMIN">FINANCE_ADMIN (Subscriptions & Settlements)</option>
          </select>
          <p className="mt-1 text-[11px] text-stone-400">
            Role will be provisioned directly in the authoritative MongoDB database.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end space-x-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Provision Admin
          </Button>
        </div>
      </form>
    </Modal>
  );
};

