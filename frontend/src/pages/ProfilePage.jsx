import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { PhotoUploadModal } from '../components/PhotoUploadModal';
import { 
  User, 
  Mail, 
  Phone, 
  Car, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  AlertTriangle,
  Camera,
  Trash2,
  Sparkles,
  Building2,
  BadgeCheck
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, isDriver, isAdmin, updateUser, refreshUser } = useAuth();

  // Profile basic info
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || 'Computer Science',
    bio: user?.bio || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
  });

  // Vehicle info (Drivers)
  const [vehicleForm, setVehicleForm] = useState({
    model: user?.vehicle?.model || 'Toyota Prius (Hybrid)',
    registration_number: user?.vehicle?.registration_number || 'BP-1-A1234',
    vehicle_type: user?.vehicle?.vehicle_type || 'Sedan',
    capacity: user?.vehicle?.capacity || 4,
    color: user?.vehicle?.color || 'Silver Metallic',
  });

  // Verification request form (for drivers needing verification)
  const [licenseNumber, setLicenseNumber] = useState(user?.verification?.license_number || '');

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [requestingVerif, setRequestingVerif] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [vehicleSuccess, setVehicleSuccess] = useState('');
  const [vehicleError, setVehicleError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifSuccess, setVerifSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        department: user.department || 'Computer Science',
        bio: user.bio || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });

      if (user.vehicle) {
        setVehicleForm({
          model: user.vehicle.model || '',
          registration_number: user.vehicle.registration_number || '',
          vehicle_type: user.vehicle.vehicle_type || 'Sedan',
          capacity: user.vehicle.capacity || 4,
          color: user.vehicle.color || '',
        });
      }

      if (user.verification) {
        setLicenseNumber(user.verification.license_number || '');
      }
    }
  }, [user]);

  // Handle Photo Save
  const handleSavePhoto = async (base64Photo) => {
    try {
      setUpdatingPhoto(true);
      setProfileError('');
      const res = await api.updateProfile({ avatar_url: base64Photo });
      if (res.success) {
        updateUser(res.user);
        setProfileSuccess('Profile photo updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3500);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to upload photo');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  // Handle Remove Photo
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      setUpdatingPhoto(true);
      const res = await api.updateProfile({ avatar_url: '' });
      if (res.success) {
        updateUser(res.user);
        setProfileSuccess('Profile photo removed.');
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to remove photo');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      setSavingProfile(true);
      const res = await api.updateProfile(profileForm);
      if (res.success) {
        updateUser(res.user);
        setProfileSuccess('Profile information updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3500);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save vehicle
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setVehicleError('');
    setVehicleSuccess('');

    try {
      setSavingVehicle(true);
      const res = await api.saveVehicle(vehicleForm);
      if (res.success) {
        updateUser({ vehicle: res.vehicle });
        setVehicleSuccess('Vehicle information saved successfully!');
        setTimeout(() => setVehicleSuccess(''), 3500);
      }
    } catch (err) {
      setVehicleError(err.message || 'Failed to save vehicle');
    } finally {
      setSavingVehicle(false);
    }
  };

  // Submit driver verification
  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setVerifSuccess('');
    try {
      setRequestingVerif(true);
      const res = await api.requestVerification({ license_number: licenseNumber });
      if (res.success) {
        setVerifSuccess('Verification documents submitted. Awaiting administrator approval.');
        refreshUser();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit verification request');
    } finally {
      setRequestingVerif(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.changePassword(passwordForm);
      if (res.success) {
        setPasswordSuccess('Password changed successfully');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setPasswordSuccess(''), 3500);
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="flex gap-8">
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Profile Form */}
        <div className="flex-1 space-y-8">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Account Settings
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Student Profile & Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Personalize your student identity, upload your avatar, configure vehicle information, and manage safety contacts.
            </p>
          </div>

          {/* Account Overview Header with Photo Upload Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              
              {/* Profile Avatar with Photo Edit Action */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-xl bg-gradient-to-tr from-brand-blue to-indigo-500 flex items-center justify-center text-white text-3xl font-black flex-shrink-0">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user?.name || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>

                {/* Edit Photo Trigger Button */}
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  disabled={updatingPhoto}
                  title="Upload profile photo"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-white dark:ring-slate-900 transition-all transform hover:scale-110 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-black text-slate-900 dark:text-white text-xl">
                    {user?.name}
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand-blue/10 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 font-black uppercase tracking-wider border border-brand-blue/20">
                    {user?.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user?.email}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Student ID: <strong className="text-slate-800 dark:text-slate-200">{user?.student_id}</strong></span>
                  <span>•</span>
                  <span>Dept: <strong className="text-slate-800 dark:text-slate-200">{user?.department || 'General'}</strong></span>
                </div>

                {/* Photo quick actions */}
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(true)}
                    className="text-xs font-bold text-brand-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {user?.avatar_url ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {user?.avatar_url && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={updatingPhoto}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Status Pill */}
            <div className="flex flex-col items-center sm:items-end gap-2">
              {user?.role === 'driver' && (
                user?.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Verified Campus Driver
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-black text-xs border border-amber-200 dark:border-amber-800/60 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Pending Admin Verification
                  </span>
                )
              )}
              {user?.role === 'passenger' && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-800/60 shadow-sm">
                  <BadgeCheck className="w-4 h-4 text-brand-blue dark:text-blue-400" />
                  Active Student Passenger
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Basic Student Info Form */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400">
                  <User className="w-4 h-4" />
                </span>
                Personal & Campus Information
              </h3>
            </div>

            {profileError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Academic Department
                  </label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    College Email (Verified)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Student Bio / Commute Habits
                </label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="e.g. Regular commuter from Trashigang to Kanglung for morning computer science lectures..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                />
              </div>

              {/* Emergency Contact */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Campus Safety: Emergency Contact
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dorji (Guardian) / Campus Warden"
                      value={profileForm.emergency_contact_name}
                      onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+975-17XXXXXX"
                      value={profileForm.emergency_contact_phone}
                      onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-blue to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Vehicle Management (Drivers) */}
          {(isDriver || isAdmin) && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-brand-orange dark:text-orange-400">
                    <Car className="w-4 h-4" />
                  </span>
                  Vehicle Information
                </h3>
              </div>

              {vehicleError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{vehicleError}</span>
                </div>
              )}

              {vehicleSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{vehicleSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveVehicle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Vehicle Model *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hyundai Tucson (AWD)"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BP-1-A1234"
                      value={vehicleForm.registration_number}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleForm.vehicle_type}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="SUV">SUV</option>
                      <option value="Van">Van / Microbus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Max Passenger Capacity *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={vehicleForm.capacity}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Vehicle Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Silver Metallic"
                      value={vehicleForm.color}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingVehicle}
                    className="px-6 py-2.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingVehicle ? 'Saving...' : 'Save Vehicle Information'}
                  </button>
                </div>
              </form>

              {/* Driver Verification Request Section if unverified */}
              {!user?.is_verified && (
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Submit Driver Verification
                  </h4>

                  {verifSuccess && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl">
                      {verifSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSubmitVerification} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Driver License Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. DL-BTN-2023-XXXX"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={requestingVerif}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition disabled:opacity-50 shadow-md shadow-amber-600/20"
                    >
                      {requestingVerif ? 'Submitting...' : 'Submit Verification Request'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Password Security */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Lock className="w-4 h-4" />
                </span>
                Change Password
              </h3>
            </div>

            {passwordError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-black transition disabled:opacity-50 shadow-md"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        currentAvatar={user?.avatar_url}
        onSavePhoto={handleSavePhoto}
      />
    </div>
  );
};
