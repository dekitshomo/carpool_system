import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Mail, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Send, 
  Sparkles,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export const GmailSetupModal = ({ isOpen, onClose, currentEmail = '', onSuccess }) => {
  const [gmailUser, setGmailUser] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [testEmail, setTestEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!gmailUser.trim() || !appPassword.trim()) {
      setError('Please provide your Gmail address and 16-character App Password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.configureSmtp({
        user: gmailUser.trim(),
        pass: appPassword.trim(),
        test_email: testEmail.trim() || gmailUser.trim()
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Gmail connected successfully! Check your inbox.');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Gmail SMTP. Make sure 2-Step Verification is enabled and App Password is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Connect Gmail Delivery
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/30 text-emerald-200">
                  Live Inbox
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">Deliver verification codes directly to real Gmail inboxes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-300 leading-relaxed">
            Gmail SMTP can time out on hosted services. For Render, configure the Google Apps Script Web App URL and shared secret in the backend service's Environment settings; do not enter secrets in this form or frontend code.
          </div>
          
          {/* Quick Guide Card */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl space-y-2.5 text-emerald-900 dark:text-emerald-300">
            <div className="font-black flex items-center gap-1.5 text-xs text-emerald-950 dark:text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>How to get your 16-character App Password (60 seconds):</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-400">
              <li>
                Ensure <strong>2-Step Verification</strong> is ON on your Google account.
              </li>
              <li>
                Open{' '}
                <a 
                  href="https://myaccount.google.com/apppasswords" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-black underline inline-flex items-center gap-0.5 text-emerald-950 dark:text-emerald-200 hover:text-emerald-700"
                >
                  myaccount.google.com/apppasswords
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Type app name <strong>Carpool</strong> and click <strong>Create</strong>.</li>
              <li>Copy the 16-character password and paste it below.</li>
            </ol>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gmail User */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Your Gmail Address (Sender) *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 16-Char App Password */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                16-Character Google App Password *
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="abcd efgh ijkl mnop"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Test Email Recipient */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Send Test Verification Email To:
              </label>
              <div className="relative">
                <Send className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="e.g. 07240080.sherubtse@rub.edu.bt"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                A Carpool System verification email will be sent to this inbox to verify everything works!
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Connecting & Sending Test Email...' : 'Connect Gmail & Send Real Verification Email'}</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
