import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Mail, Clock, CheckCircle2, RotateCcw, X, ExternalLink, KeyRound } from 'lucide-react';

export const CollegeMailboxModal = ({ isOpen, onClose, email }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const fetchInbox = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const res = await api.getSimulatedInbox(email);
      if (res.success) {
        setEmails(res.emails || []);
        if (res.emails && res.emails.length > 0) {
          setSelectedEmail(res.emails[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load mailbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInbox();
    }
  }, [isOpen, email]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Webmail Titlebar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-md shadow-orange-500/25">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Email Account Mailbox</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Carpool System Inbox
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchInbox}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh Mailbox"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-orange' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mailbox Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading && emails.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Connecting to registered college mail server...
            </div>
          ) : emails.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No emails received yet</p>
              <p className="text-xs text-slate-400">Click resend verification code to generate a new verification email.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email List Strip if multiple */}
              {emails.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {emails.map((msg, idx) => (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedEmail(msg)}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-bold transition flex-shrink-0 border ${
                        selectedEmail?.id === msg.id
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-brand-orange text-brand-orange'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="truncate max-w-[140px]">{msg.subject}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Render Selected Email Preview */}
              {selectedEmail && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
                  {/* Sender & Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="text-emerald-700 dark:text-emerald-400">Carpool System</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white mt-1">
                        {selectedEmail.subject}
                      </h4>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(selectedEmail.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedEmail.verification_code && (
                    <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-brand-orange" />
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-300">
                            Verification Code Extracted
                          </div>
                          <div className="text-base font-black font-mono text-slate-900 dark:text-white tracking-widest">
                            {selectedEmail.verification_code}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-orange-800 dark:text-orange-300">
                        Enter it on the verification page
                      </span>
                    </div>
                  )}

                  {/* Rendered HTML Email Container */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm max-h-[380px] overflow-y-auto text-slate-900">
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                      className="email-html-body"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Official collegiate notification dispatched to {email}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
          >
            Close Mailbox
          </button>
        </div>
      </div>
    </div>
  );
};
