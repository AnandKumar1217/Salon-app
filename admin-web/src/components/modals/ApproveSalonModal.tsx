'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ApproveSalonModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
  applicantName: string;
  onConfirm: () => Promise<void>;
}

export const ApproveSalonModal: React.FC<ApproveSalonModalProps> = ({
  isOpen,
  onClose,
  salonName,
  applicantName,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve salon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Salon Application"
      subtitle="Verify establishment and grant Salon Owner access"
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            Approving <strong>{salonName}</strong> will immediately grant <strong>{applicantName}</strong> access to Salon Owner Mode in the Glamora mobile application and publish their listing.
          </div>
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
          <Button variant="primary" size="sm" onClick={handleApprove} isLoading={loading}>
            Confirm Approval
          </Button>
        </div>
      </div>
    </Modal>
  );
};

