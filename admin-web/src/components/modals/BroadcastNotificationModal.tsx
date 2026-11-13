'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { BellRing, Send, CheckCircle2 } from 'lucide-react';

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    target: 'ALL' | 'CUSTOMERS' | 'SALON_OWNERS' | 'SPECIFIC_SALON';
    title: string;
    message: string;
  }) => Promise<void>;
}

export const BroadcastNotificationModal: React.FC<BroadcastNotificationModalProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [target, setTarget] = useState<'ALL' | 'CUSTOMERS' | 'SALON_OWNERS' | 'SPECIFIC_SALON'>('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);
    try {
      await onSend({ target, title, message });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setMessage('');
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Platform Broadcast"
      subtitle="Dispatch system push notification & in-app alerts"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-semibold text-stone-800">Broadcast Dispatched Successfully</h4>
            <p className="text-xs text-stone-500">Delivered and added to recipient in-app feeds.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Target Audience</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
              >
                <option value="ALL">All Platform Users (Customers & Salon Owners)</option>
                <option value="CUSTOMERS">Customers Only</option>
                <option value="SALON_OWNERS">Salon Owners Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Notification Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Special Holiday Platform Update ✨"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Message Body</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message details that will appear on Android status bar and in-app feed..."
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Dispatch FCM
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

