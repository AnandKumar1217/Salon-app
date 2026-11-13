import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'solid' | 'subtle';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();

  let styles = 'bg-stone-100 text-stone-700 border-stone-200';

  if (['APPROVED', 'ACTIVE', 'PAID', 'RESOLVED', 'SUCCESS', 'CONFIRMED'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['PENDING_APPROVAL', 'PENDING', 'IN_PROGRESS', 'OPEN', 'TRIAL', 'HIGH'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['SUSPENDED', 'REJECTED', 'CANCELLED', 'FAILED', 'PAST_DUE', 'URGENT'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['COMPLETED', 'SUPER_ADMIN'].includes(normalized)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (['OPERATIONS_ADMIN', 'GROWTH'].includes(normalized)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['FINANCE_ADMIN', 'STARTER'].includes(normalized)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (['SUPPORT_ADMIN', 'LOW'].includes(normalized)) {
    styles = 'bg-teal-50 text-teal-700 border-teal-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

