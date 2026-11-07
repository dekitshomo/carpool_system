import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CollegeMailboxModal } from '../components/CollegeMailboxModal';
import { GmailSetupModal } from '../components/GmailSetupModal';
import { 
  Car, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  IdCard, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Inbox,
  Info
} from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    role: 'passenger', // 'passenger' | 'driver'
    license_number: '',
    password: '',
    confirm_password: '',
  });

  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [liveSent, setLiveSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const departments = [
    'Computer Science',
    'Mathematics & Statistics',
    'Physics & Chemistry',
    'Life Sciences',
    'Economics & Management',
    'Arts & Humanities',
    'Environmental Studies',
    'Other / General Studies'
  ];

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Common validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
      setError('Please fill in all required fields (Name, Email Account, Phone, Password).');
      return;
    }

    // Role-specific validations:
    // Drivers: NO student_id, NO department. License number is REQUIRED.
    // Passengers: student_id is REQUIRED.
    if (formData.role === 'passenger' && !formData.student_id.trim()) {
      setError('Student ID is required for passenger registration.');
      return;
    }

    if (formData.role === 'driver' && !formData.license_number.trim()) {
      setError('Driving license number is required for driver registration.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await register(formData);
      if (res.success) {
        // Transition to verification step - User account is NOT created yet until verified!
        setStep('verify');
        setLiveSent(Boolean(res.live_sent));
        setVerificationCode('');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setVerifyLoading(true);
      setVerifyError('');
      const res = await verifyEmail({ email: formData.email, code: verificationCode.trim() });
      if (res.success) {
        setVerifySuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setVerifyError(err.message || 'Invalid or expired verification code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setVerifyError('');
      setResendMsg('');
      const res = await api.resendVerification({ email: formData.email });
      if (res.success) {
        setLiveSent(Boolean(res.live_sent));
        setResendMsg(res.message || 'New 6-digit code has been dispatched!');
        setVerificationCode('');
      }
    } catch (err) {
      setVerifyError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 transition-colors duration-200">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-orange via-amber-500 to-brand-blue rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-orange-500/25">
            {step === 'verify' ? <Mail className="w-7 h-7 text-white" /> : <Car className="w-7 h-7 text-white" />}
          </div>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            {step === 'verify' ? 'Verify Your Email Account' : 'Create Account'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {step === 'verify' 
              ? `A 6-digit verification code has been dispatched to ${formData.email}` 
              : 'Join the campus ridesharing network'}
          </p>
        </div>

        {/* STEP 2: EMAIL VERIFICATION */}
        {step === 'verify' ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            
            {verifySuccess ? (
              <div className="text-center space-y-4 py-6 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white">Account Created & Verified!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your profile is now active. Redirecting you to your dashboard...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                
                {/* Live SMTP vs Simulated Banner */}
                {liveSent ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Email Dispatched to Your Gmail Inbox!</span>
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-400">
                      Check your inbox at <strong>{formData.email}</strong>. Look for the email titled <em>"Carpool System email verification code"</em>, then enter the code below.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Live Gmail Delivery Requires Sender Setup</span>
                    </div>
                    <p className="text-amber-800 dark:text-amber-400 leading-relaxed">
                      Emails cannot reach your inbox yet because <strong>SMTP_USER</strong> and <strong>SMTP_PASS</strong> are empty in <code className="bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-[11px] font-mono">backend/.env</code>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setGmailModalOpen(true)}
                      className="mt-1 w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-700/20 transition cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>⚙️ Connect My Gmail Account (To Deliver to Real Inboxes) &rarr;</span>
                    </button>
                  </div>
                )}

                {verifyError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {resendMsg && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{resendMsg}</span>
                  </div>
                )}

                {/* 6-Digit Code Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Enter 6-Digit Verification Code
                    </label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-orange" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 613218"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-mono font-black tracking-widest text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange text-center sm:text-left"
                    />
                  </div>
                </div>

                {/* Simulated Mailbox Preview Action */}
                <button
                  type="button"
                  onClick={() => setMailboxOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                >
                  <Inbox className="w-4 h-4 text-brand-orange" />
                  <span>📬 View Carpool System Email Preview</span>
                </button>

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black rounded-2xl text-sm shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifyLoading ? 'Verifying...' : 'Verify & Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResend}
                    className="font-bold text-brand-blue hover:underline disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>{resending ? 'Sending...' : 'Resend Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('register')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ← Edit Registration Info
                  </button>
                </div>
              </form>
            )}

          </div>
        ) : (
          /* STEP 1: REGISTRATION FORM */
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  I want to register as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'passenger' }))}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      formData.role === 'passenger'
                        ? 'border-brand-blue bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md shadow-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${formData.role === 'passenger' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-xs sm:text-sm">Passenger</div>
                      <div className={`text-[10px] ${formData.role === 'passenger' ? 'text-white/80' : 'text-slate-400'}`}>Search & book rides</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'driver' }))}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      formData.role === 'driver'
                        ? 'border-brand-orange bg-gradient-to-r from-brand-orange to-amber-600 text-white shadow-md shadow-orange-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${formData.role === 'driver' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-xs sm:text-sm">Driver</div>
                      <div className={`text-[10px] ${formData.role === 'driver' ? 'text-white/80' : 'text-slate-400'}`}>Publish trips & vehicle</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name (and Student ID only for Passenger) */}
              <div className={`grid gap-3 ${formData.role === 'passenger' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Tshering Dorji"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Student ID - ONLY for Passenger */}
                {formData.role === 'passenger' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Student ID *
                    </label>
                    <div className="relative flex items-center">
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        name="student_id"
                        required
                        placeholder="e.g. 07240066"
                        value={formData.student_id}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Email Account & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Account *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. 07240066.sherubtse@rub.edu.bt"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Phone *
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+975-17123456"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Department - ONLY for Passenger */}
              {formData.role === 'passenger' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Academic Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d} className="dark:bg-slate-900">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Driver License Number - ONLY for Driver */}
              {formData.role === 'driver' && (
                <div className="p-4 bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-orange">
                    <ShieldCheck className="w-4 h-4" />
                    Driver Verification Details
                  </div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Driving License Number *
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    required
                    placeholder="e.g. DL-BT-2022-9988"
                    value={formData.license_number}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-850 border border-orange-200 dark:border-orange-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your license will be submitted for college admin safety verification before posting trips.
                  </p>
                </div>
              )}

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Password (min 6 chars) *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      required
                      placeholder="••••••••"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black rounded-2xl text-sm shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Verification Code...' : 'Continue to Email Verification'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-blue hover:underline">
                Sign in here
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* College Mailbox Preview Modal */}
      <CollegeMailboxModal
        isOpen={mailboxOpen}
        onClose={() => setMailboxOpen(false)}
        email={formData.email}
      />

      {/* 1-Click Gmail Connect Modal */}
      <GmailSetupModal
        isOpen={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
        currentEmail={formData.email}
        onSuccess={() => {
          setLiveSent(true);
          handleResend();
        }}
      />
    </div>
  );
};
