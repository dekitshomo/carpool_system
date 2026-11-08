import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CollegeMailboxModal } from '../components/CollegeMailboxModal';
import { GmailSetupModal } from '../components/GmailSetupModal';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  ArrowRight, 
  Inbox, 
  UserPlus, 
  Info,
  RotateCcw
} from 'lucide-react';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, verifyEmail, refreshUser } = useAuth();

  const initialEmail = searchParams.get('email') || user?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Mailbox modal
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setError('Please provide your email account and 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResendMessage('');
      const res = await verifyEmail({ email: email.trim(), code: code.trim() });
      if (res.success) {
        setSuccess(true);
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim() || resendCooldown > 0) return;
    try {
      setResending(true);
      setError('');
      setResendMessage('');
      const res = await api.resendVerification({ email: email.trim() });
      if (res.success) {
        setResendMessage(res.message || 'Verification code resent to your email account!');
        setResendCooldown(30);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const isAccountNotFound = error.toLowerCase().includes('not found') || error.toLowerCase().includes('register');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 transition-colors duration-200">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-orange to-amber-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-orange-500/25">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Verify Email Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Confirm your email account to activate your ridesharing profile
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 p-7 sm:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          
          {success ? (
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl font-black">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  Email Account Verified!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Your account has been officially created and activated. You now have full access to publish trips and request seats.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {error && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {isAccountNotFound && (
                    <div className="pt-1 border-t border-rose-200 dark:border-rose-800/80">
                      <Link 
                        to="/register" 
                        className="inline-flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-200 hover:underline"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Click here to register this account now →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {resendMessage && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{resendMessage}</span>
                </div>
              )}

              {/* Informative Guidance */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    The hosted Render app must have the Google Apps Script Web App URL and shared secret configured in the backend service's Environment settings. Gmail SMTP may time out on hosting networks. Local development can use SMTP settings in <code className="bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono text-[11px]">backend/.env</code>.
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setGmailModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>⚙️ Set Up Local Gmail SMTP &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Email Account Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email Account
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. 07240066.sherubtse@rub.edu.bt"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* 6-Digit Code Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <span className="text-[10px] text-slate-400">Check your email account</span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-orange" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 613218"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-base font-mono font-black tracking-widest text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange text-center sm:text-left"
                  />
                </div>
              </div>

              {/* Interactive Mailbox Helper Button */}
              {email && (
                <button
                  type="button"
                  onClick={() => setMailboxOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800/60 text-brand-orange dark:text-orange-400 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Inbox className="w-4 h-4" />
                  <span>📬 View Carpool System Email Preview</span>
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-black rounded-2xl text-xs sm:text-sm tracking-tight shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Activating Account...' : 'Confirm & Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Resend Code Action */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Didn't get the code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending || resendCooldown > 0 || !email.trim()}
                  className="font-bold text-brand-orange hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resending 
                      ? 'Sending...' 
                      : resendCooldown > 0 
                        ? `Wait ${resendCooldown}s` 
                        : 'Resend Code'}
                  </span>
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link to="/login" className="hover:text-slate-600 dark:hover:text-slate-300">
              ← Return to Sign In
            </Link>
          </div>
        </div>

      </div>

      {/* Simulated Mailbox Preview Modal */}
      <CollegeMailboxModal
        isOpen={mailboxOpen}
        onClose={() => setMailboxOpen(false)}
        email={email}
      />

      {/* 1-Click Gmail Connect Modal */}
      <GmailSetupModal
        isOpen={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
        currentEmail={email}
        onSuccess={handleResendCode}
      />
    </div>
  );
};
