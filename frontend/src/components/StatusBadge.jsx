import React from 'react';

export const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase();

  switch (norm) {
    case 'accepted':
    case 'approved':
    case 'completed':
    case 'verified':
    case 'active':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-sm">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );

    case 'pending':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200/80 shadow-sm">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Pending
        </span>
      );

    case 'rejected':
    case 'cancelled':
    case 'suspended':
    case 'deactivated':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200/80 shadow-sm">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );

    case 'published':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-brand-blue border border-blue-200/80 shadow-sm">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-600"></span>
          Active
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
};
