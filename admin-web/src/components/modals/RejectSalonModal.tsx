'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface RejectSalonModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
  onConfirm: (reason: string) => Promise<void>;
}

export const RejectSalonModal: React.FC<RejectSalonModalProps> = ({
  isOpen,
  onClose,
  salonName,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async () => {
    if (!reason || reason.trim().length < 5) {
      setError('Please provide a mandatory reason explaining why the application is rejected (min 5 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Salon Application"
      subtitle={`Decline onboarding request for ${salonName}`}
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900 leading-relaxed">
            The owner will see this rejection reason on their Glamora mobile app screen and will be allowed to rectify their documents and reapply.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Mandatory Rejection Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incomplete business address or trade license registration mismatch..."
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
          <Button variant="danger" size="sm" onClick={handleReject} isLoading={loading}>
            Reject Application
          </Button>
        </div>
      </div>
    </Modal>
  );
};

