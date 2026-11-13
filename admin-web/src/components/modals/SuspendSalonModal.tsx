'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShieldAlert, AlertCircle } from 'lucide-react';

interface SuspendSalonModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
  onConfirm: (reason: string) => Promise<void>;
}

export const SuspendSalonModal: React.FC<SuspendSalonModalProps> = ({
  isOpen,
  onClose,
  salonName,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuspend = async () => {
    if (!reason || reason.trim().length < 5) {
      setError('Please provide a mandatory reason for suspending this salon (min 5 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend salon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Suspend Salon Account"
      subtitle={`Enforce platform compliance for ${salonName}`}
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-3.5 bg-rose-50/80 border border-rose-200/90 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-rose-900 leading-relaxed">
            Suspension halts public discovery, pauses online appointment booking, and displays a suspension notice on the owner's mobile app. Existing historical booking records are safely preserved.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Mandatory Suspension Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Failure to maintain salon hygiene standards or regulatory license lapse..."
            className="w-full text-xs p-3 border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end space-x-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleSuspend} isLoading={loading}>
            Confirm Suspension
          </Button>
        </div>
      </div>
    </Modal>
  );
};

