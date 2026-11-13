'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SupportTicket, TicketStatus } from '../../lib/types';
import { Badge } from '../ui/Badge';
import { MessageSquare, Send } from 'lucide-react';

interface TicketReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicket;
  onSave: (ticketId: string, replyText: string, newStatus: TicketStatus, internalNotes?: string) => Promise<void>;
}

export const TicketReplyModal: React.FC<TicketReplyModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onSave,
}) => {
  const [replyText, setReplyText] = useState('');
  const [internalNotes, setInternalNotes] = useState(ticket.internalNotes || '');
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && status === ticket.status && internalNotes === ticket.internalNotes) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await onSave(ticket.id, replyText, status, internalNotes);
      setReplyText('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ticket #${ticket.ticketNumber}`}
      subtitle={`${ticket.userType === 'SALON_OWNER' ? 'Salon Owner' : 'Customer'}: ${ticket.userName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSend} className="space-y-4">
        {/* Ticket Header Details */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-800">{ticket.subject}</span>
            <div className="flex items-center space-x-2">
              <Badge status={ticket.priority} />
              <Badge status={ticket.status} />
            </div>
          </div>
          <p className="text-stone-600 leading-relaxed">{ticket.message}</p>
          {ticket.salonName && (
            <p className="text-[11px] text-stone-400">Salon: <strong>{ticket.salonName}</strong></p>
          )}
        </div>

        {/* Existing Replies Thread */}
        {ticket.replies.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Conversation History</p>
            {ticket.replies.map((r) => (
              <div
                key={r.id}
                className={`p-2.5 rounded-lg text-xs ${
                  r.sender === 'ADMIN'
                    ? 'bg-[#4A154B]/5 border border-[#4A154B]/15 ml-4 text-stone-800'
                    : 'bg-stone-100 border border-stone-200 mr-4 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1 text-[11px]">
                  <span>{r.senderName} ({r.sender})</span>
                  <span className="text-stone-400 font-normal">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p>{r.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Response Input */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Reply to User</label>
          <textarea
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your response to the user..."
            className="w-full text-xs p-2.5 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
          />
        </div>

        {/* Internal Notes & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Internal Staff Note</label>
            <input
              type="text"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Private note for team only..."
              className="w-full text-xs p-2 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Update Ticket Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              className="w-full text-xs p-2 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end space-x-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Update & Send Reply
          </Button>
        </div>
      </form>
    </Modal>
  );
};

