import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Modal } from '../components/Modal';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');

    if (!email.trim() || !password) {
      setError('Please enter both your email account and password');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email.trim(), password);
      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(redirectPath);
        }
      }
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      if (
        err.response?.data?.is_pending_verification || 
        err.response?.data?.requires_email_verification || 
        msg.toLowerCase().includes('verify')
      ) {
        setUnverifiedEmail(email.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setUnverifiedEmail('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 transition-colors duration-200">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-orange via-amber-500 to-brand-blue rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">Sign in to CampusRide</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Access campus rides, booking requests, and community drivers</p>
        </div>

        {/* 1-Click Quick Demo Accounts Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              1-Click Demo Evaluation Profiles:
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Click to fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuickDemo('driver1@college.edu', 'password123')}
              className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-slate-200 text-center transition-all active:scale-95 flex flex-col items-center gap-0.5"
            >
              <span>🚗 Driver</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Verified</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('passenger1@college.edu', 'password123')}
              className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-slate-200 text-center transition-all active:scale-95 flex flex-col items-center gap-0.5"
            >
              <span>🎒 Passenger</span>
              <span className="text-[9px] text-brand-blue dark:text-blue-400 font-bold">CS Dept</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin@college.edu', 'password123')}
              className="py-2 px-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-2xl font-black text-purple-800 dark:text-purple-300 text-center transition-all active:scale-95 flex flex-col items-center gap-0.5"
            >
              <span>🛡️ Admin</span>
              <span className="text-[9px] text-purple-600 dark:text-purple-400">Console</span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Unverified Account Warning Banner */}
          {unverifiedEmail && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Email Account Verification Required</span>
              </div>
              <p className="text-amber-800 dark:text-amber-400">
                This account has not been activated yet. Please verify your email with the 6-digit code sent to your inbox to complete registration.
              </p>
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="inline-flex items-center gap-1.5 font-black text-amber-950 dark:text-amber-100 bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition"
              >
                <span>Enter 6-Digit Verification Code &rarr;</span>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Account
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="e.g. 07240066.sherubtse@rub.edu.bt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-bold text-brand-orange dark:text-orange-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-brand-blue via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-black rounded-2xl text-sm tracking-tight shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In to CampusRide'}
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <div>
              Don't have an account yet?{' '}
              <Link to="/register" className="font-black text-brand-orange dark:text-orange-400 hover:underline">
                Create Account
              </Link>
            </div>
            <div>
              Need to verify your email?{' '}
              <Link to="/verify-email" className="font-bold text-brand-blue dark:text-blue-400 hover:underline">
                Verify Email Account →
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Password Information"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            For campus safety and identity verification, password resets for student carpooling accounts require verification with your college administration.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white">Campus Contacts:</p>
            <p>• Campus Safety Helpdesk: <strong>safety@college.edu</strong></p>
            <p>• Student Transport Coordinator: <strong>+975-04-535100</strong></p>
          </div>
          <button
            onClick={() => setForgotModalOpen(false)}
            className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};
