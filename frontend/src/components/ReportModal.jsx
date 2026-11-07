import React, { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../services/api';
import { AlertTriangle, Send } from 'lucide-react';

export const ReportModal = ({ isOpen, onClose, tripId, reportedUserId, contextTitle }) => {
  const [reason, setReason] = useState('Safety Concern');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reasons = [
    'Safety Concern / Reckless Driving',
    'No-show / Abandoned Trip',
    'Inappropriate Behavior or Language',
    'Mismatched Vehicle or Driver Identity',
    'Overcharging or Commercial Demands',
    'Other Policy Violation'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!description.trim()) {
      setError('Please provide a brief explanation of the issue.');
      return;
    }

    try {
      setLoading(true);
      await api.createReport({
        trip_id: tripId || null,
        reported_user_id: reportedUserId || null,
        reason,
        description: description.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report an Issue or Safety Concern">
      {success ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
            ✓
          </div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">Report Submitted</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Our campus safety team will review this report promptly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {contextTitle && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Reporting: <strong>{contextTitle}</strong></span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {reasons.map((r) => (
                <option key={r} value={r} className="dark:bg-slate-900">{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain what happened, including dates, locations, or specific concerns..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
