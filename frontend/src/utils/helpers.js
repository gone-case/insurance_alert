import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

export const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '—';
export const fmtDateTime = (d) => d ? format(new Date(d), 'dd MMM yyyy, hh:mm a') : '—';
export const fmtRelative = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—';
export const daysUntil = (d) => d ? differenceInDays(new Date(d), new Date()) : null;

export const fmtCurrency = (n) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export const urgencyColor = (days) => {
  if (days === null) return 'text-slate-400';
  if (days < 0)  return 'text-red-400';
  if (days <= 3) return 'text-red-400';
  if (days <= 7) return 'text-orange-400';
  if (days <= 15) return 'text-yellow-400';
  return 'text-green-400';
};

export const urgencyBadge = (days) => {
  if (days === null) return 'bg-slate-800 text-slate-400';
  if (days < 0)  return 'bg-red-900/40 text-red-400 border border-red-800/50';
  if (days <= 3) return 'bg-red-900/40 text-red-400 border border-red-800/50';
  if (days <= 7) return 'bg-orange-900/40 text-orange-400 border border-orange-800/50';
  if (days <= 15) return 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50';
  return 'bg-green-900/40 text-green-400 border border-green-800/50';
};

export const STATUS_COLORS = {
  Interested:    'bg-blue-900/40 text-blue-400 border border-blue-800/40',
  Pending:       'bg-yellow-900/40 text-yellow-400 border border-yellow-800/40',
  Purchased:     'bg-green-900/40 text-green-400 border border-green-800/40',
  'Not Interested': 'bg-red-900/40 text-red-400 border border-red-800/40',
  Paused:        'bg-slate-800 text-slate-400 border border-slate-700',
  Renewed:       'bg-green-900/40 text-green-400 border border-green-800/40',
  Expired:       'bg-red-900/40 text-red-400 border border-red-800/40',
};

export const POLICY_TYPES = ['Life','Health','Motor','Home','Travel','Term','ULIP','Other'];
export const LEAD_STATUSES = ['All','Interested','Pending','Purchased','Not Interested','Paused'];
export const RENEWAL_STATUSES = ['All','Pending','Renewed','Expired','Paused'];
