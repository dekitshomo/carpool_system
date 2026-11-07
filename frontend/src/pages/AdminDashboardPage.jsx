import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { 
  ShieldCheck, 
  Users, 
  Car, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  TrendingUp, 
  Calendar, 
  Filter, 
  BarChart3, 
  Activity, 
  FileText, 
  Trash2,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'verifications' | 'users' | 'trips' | 'reports'

  const [stats, setStats] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification modal state
  const [verificationModal, setVerificationModal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Remove Trip modal state
  const [removeTripTarget, setRemoveTripTarget] = useState(null);
  const [removeReason, setRemoveReason] = useState('');

  // User management filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Trip management filter state
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('');

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const fetchVerifications = async () => {
    try {
      const data = await api.getAdminVerifications();
      if (data.success) {
        setVerifications(data.verifications || []);
      }
    } catch (err) {
      console.error('Failed to load verifications:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {};
      if (userSearch) params.search = userSearch;
      if (userRoleFilter) params.role = userRoleFilter;
      if (userStatusFilter) params.status = userStatusFilter;
      const data = await api.getAdminUsers(params);
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchTrips = async () => {
    try {
      const params = {};
      if (tripSearch) params.search = tripSearch;
      if (tripStatusFilter) params.status = tripStatusFilter;
      const data = await api.getAdminTrips(params);
      if (data.success) {
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await api.getReports();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchVerifications(),
        fetchUsers(),
        fetchTrips(),
        fetchReports()
      ]);
      setLoading(false);
    };
    init();
  }, []);

  // Handle Driver Verification action (Approve / Reject)
  const handleVerificationAction = async (action) => {
    if (!verificationModal) return;
    try {
      setActionLoading(true);
      const res = await api.handleDriverVerification(verificationModal.id, action, adminNotes);
      if (res.success) {
        setVerificationModal(null);
        setAdminNotes('');
        await Promise.all([fetchVerifications(), fetchStats(), fetchUsers()]);
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle User Status toggle (Suspend / Activate)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to mark this student account as ${newStatus}?`)) return;

    try {
      setActionLoading(true);
      const res = await api.updateUserStatus(userId, newStatus);
      if (res.success) {
        await Promise.all([fetchUsers(), fetchStats()]);
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Remove Trip
  const handleRemoveTrip = async (e) => {
    e.preventDefault();
    if (!removeTripTarget) return;

    try {
      setActionLoading(true);
      const res = await api.removeTripByAdmin(removeTripTarget.id, removeReason);
      if (res.success) {
        setRemoveTripTarget(null);
        setRemoveReason('');
        await Promise.all([fetchTrips(), fetchStats()]);
      }
    } catch (err) {
      alert(err.message || 'Failed to remove trip');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Update Report status
  const handleUpdateReport = async (reportId, newStatus) => {
    const adminNote = prompt('Resolution notes / action taken:');
    try {
      setActionLoading(true);
      const res = await api.updateReportStatus(reportId, newStatus, adminNote || 'Resolved by admin');
      if (res.success) {
        fetchReports();
      }
    } catch (err) {
      alert(err.message || 'Failed to update report');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingVerifsCount = verifications.filter(v => v.status === 'pending').length;
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
      
      {/* Top Admin Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-800/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold uppercase tracking-wider border border-purple-400/20">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            Administration & Campus Safety Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Admin Operations Console</h1>
          <p className="text-xs sm:text-sm text-purple-100/80">
            Monitor platform metrics, verify student driver credentials, moderate trips, and review campus safety reports.
          </p>
        </div>

        {/* Quick alerts badges */}
        <div className="flex items-center gap-3">
          {pendingVerifsCount > 0 && (
            <div className="px-3.5 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              {pendingVerifsCount} Pending Verification{pendingVerifsCount > 1 ? 's' : ''}
            </div>
          )}
          {pendingReportsCount > 0 && (
            <div className="px-3.5 py-2 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              {pendingReportsCount} Report{pendingReportsCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Platform Analytics', icon: BarChart3 },
          { id: 'verifications', label: `Driver Verifications (${pendingVerifsCount})`, icon: ShieldCheck },
          { id: 'users', label: 'Student Users', icon: Users },
          { id: 'trips', label: 'Trip Management', icon: Car },
          { id: 'reports', label: `Safety Reports (${pendingReportsCount})`, icon: AlertTriangle }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Registered Students</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalUsers || 0}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 font-medium">
                <span>🚗 {stats?.totalDrivers || 0} Drivers</span>
                <span>•</span>
                <span>🎒 {stats?.totalPassengers || 0} Passengers</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Verified Active Drivers</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats?.activeDrivers || 0}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-medium">
                {stats?.pendingVerifications || 0} awaiting approval
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Trips Published</span>
              <p className="text-3xl font-black text-brand-blue dark:text-sky-400">{stats?.totalTrips || 0}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 font-medium">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{stats?.activeTrips || 0} active</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.completedTrips || 0} completed</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Ride Requests</span>
              <p className="text-3xl font-black text-brand-orange dark:text-orange-400">{stats?.totalRequests || 0}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 font-medium">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.acceptedRequests || 0} accepted</span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats?.pendingRequests || 0} pending</span>
              </div>
            </div>
          </div>

          {/* Visual Representation Section: Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Most Popular Routes Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-blue dark:text-blue-400" />
                  Most Popular Student Commute Routes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Trip frequencies and passenger booking demand</p>
              </div>

              <div className="space-y-3 pt-2">
                {stats?.popularRoutes && stats.popularRoutes.length > 0 ? (
                  stats.popularRoutes.map((route, i) => {
                    const maxTrips = stats.popularRoutes[0]?.trip_count || 1;
                    const percent = Math.min(100, Math.round((route.trip_count / maxTrips) * 100));

                    return (
                      <div key={i} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span className="truncate max-w-[280px]">📍 {route.route}</span>
                          <span className="text-slate-500 dark:text-slate-400">{route.trip_count} trips ({route.total_requests || 0} requests)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-brand-blue to-sky-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No route data accumulated yet.</p>
                )}
              </div>
            </div>

            {/* Monthly Registrations & User Growth Graph */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Student Registration Statistics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Monthly student user onboarding metrics</p>
              </div>

              <div className="space-y-4 pt-3">
                {stats?.monthlyRegistrations && stats.monthlyRegistrations.length > 0 ? (
                  stats.monthlyRegistrations.map((m, idx) => {
                    const maxReg = Math.max(...stats.monthlyRegistrations.map(r => r.total), 1);
                    const driverPercent = Math.round((m.drivers / maxReg) * 100);
                    const passengerPercent = Math.round((m.passengers / maxReg) * 100);

                    return (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>Month: {m.month}</span>
                          <span>Total: {m.total} ({m.drivers} Drivers, {m.passengers} Passengers)</span>
                        </div>
                        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                          <div
                            className="bg-brand-orange h-full"
                            style={{ width: `${driverPercent}%` }}
                            title={`Drivers: ${m.drivers}`}
                          ></div>
                          <div
                            className="bg-brand-blue h-full"
                            style={{ width: `${passengerPercent}%` }}
                            title={`Passengers: ${m.passengers}`}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No registration trends recorded.</p>
                )}

                <div className="flex items-center justify-center gap-6 pt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-brand-orange"></span> Student Drivers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-brand-blue"></span> Passengers
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Trips by Status Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white text-base">Trip Status Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Active / Published</span>
                  <p className="text-2xl font-black text-brand-blue dark:text-sky-400 mt-1">{stats?.activeTrips || 0}</p>
                </div>
                <Car className="w-8 h-8 text-blue-400" />
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">Completed</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.completedTrips || 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase">Cancelled</span>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats?.cancelledTrips || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-rose-400" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DRIVER VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Pending Driver Verification Requests</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify student driving credentials and vehicles before permitting them to publish trips.
              </p>
            </div>
          </div>

          {verifications.length === 0 ? (
            <p className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">No verification requests found.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {verifications.map((v) => (
                <div key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">{v.driver_name}</h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">({v.driver_student_id})</span>
                      <StatusBadge status={v.status} />
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      <div>Email: <strong>{v.driver_email}</strong></div>
                      <div>Phone: <strong>{v.driver_phone}</strong></div>
                      <div>License No: <strong className="font-mono text-brand-blue dark:text-sky-400">{v.license_number}</strong></div>
                      <div>
                        Vehicle: {v.vehicle_model ? (
                          <strong>{v.vehicle_model} ({v.registration_number})</strong>
                        ) : (
                          <span className="italic text-slate-400">No vehicle profile added yet</span>
                        )}
                      </div>
                    </div>

                    {v.admin_notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                        Admin Note: "{v.admin_notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {v.status === 'pending' ? (
                      <button
                        onClick={() => {
                          setVerificationModal(v);
                          setAdminNotes('');
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs transition shadow-md shadow-purple-500/20"
                      >
                        Review Credentials
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setVerificationModal(v);
                          setAdminNotes(v.admin_notes || '');
                        }}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold"
                      >
                        Re-evaluate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Manage Registered Students</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Search students, view roles, or suspend accounts for safety violations.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search by name, ID, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />

              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setTimeout(fetchUsers, 50);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="driver">Drivers</option>
                <option value="passenger">Passengers</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  setTimeout(fetchUsers, 50);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>

              <button
                onClick={fetchUsers}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Trips / Requests</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{u.student_id}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-semibold">{u.role}</span>
                      {u.role === 'driver' && (
                        u.is_verified ? (
                          <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Verified</span>
                        ) : (
                          <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">Pending</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'driver' ? `${u.trips_count || 0} trips` : `${u.requests_count || 0} requests`}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            u.status === 'active'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRIP MODERATION */}
      {activeTab === 'trips' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Platform Trips Moderation</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monitor all published routes and remove inappropriate listings.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search trip route or driver..."
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTrips()}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />

              <select
                value={tripStatusFilter}
                onChange={(e) => {
                  setTripStatusFilter(e.target.value);
                  setTimeout(fetchTrips, 50);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={fetchTrips}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
              >
                Search
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {trips.map(t => (
              <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                    <span>{t.start_location}</span>
                    <span className="text-slate-400">→</span>
                    <span>{t.destination}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>Driver: <strong>{t.driver_name}</strong></span>
                    <span>•</span>
                    <span>{t.travel_date} at {t.departure_time}</span>
                    <span>•</span>
                    <span>Seats: {t.available_seats}/{t.total_seats}</span>
                    <span>•</span>
                    <span>{t.vehicle_model}</span>
                  </div>
                  {t.notes && (
                    <p className="text-slate-400 dark:text-slate-500 italic">"{t.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/trips/${t.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                  >
                    View
                  </a>

                  {t.status === 'published' && (
                    <button
                      onClick={() => setRemoveTripTarget(t)}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Trip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SAFETY REPORTS & COMPLAINTS */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Campus Safety Reports & Complaints</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Student feedback on safety, no-shows, or platform policy issues.</p>
            </div>
          </div>

          {reports.length === 0 ? (
            <p className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">No safety reports submitted.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((r) => (
                <div key={r.id} className="py-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{r.reason}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300">
                    <span>Reported by: <strong>{r.reporter_name}</strong></span>
                    {r.reported_user_name && (
                      <span className="ml-3">Reported student: <strong className="text-rose-700 dark:text-rose-400">{r.reported_user_name}</strong></span>
                    )}
                    {r.start_location && (
                      <span className="ml-3">Trip: {r.start_location} → {r.destination}</span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    "{r.description}"
                  </div>

                  {r.admin_notes && (
                    <div className="text-[11px] text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2 rounded-lg">
                      <strong>Admin Resolution Note:</strong> {r.admin_notes}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReport(r.id, 'resolved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                        >
                          Resolve Report
                        </button>
                        <button
                          onClick={() => handleUpdateReport(r.id, 'dismissed')}
                          className="px-3 py-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-semibold"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Driver Verification Modal */}
      <Modal
        isOpen={!!verificationModal}
        onClose={() => setVerificationModal(null)}
        title="Review Driver Verification Credentials"
      >
        {verificationModal && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{verificationModal.driver_name}</span>
                <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">{verificationModal.driver_student_id}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">Email: {verificationModal.driver_email}</div>
              <div className="text-slate-600 dark:text-slate-300">Phone: {verificationModal.driver_phone}</div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Driving License Number:</span>
                <p className="font-mono font-extrabold text-brand-blue dark:text-sky-400 text-sm">{verificationModal.license_number}</p>
              </div>
              {verificationModal.vehicle_model && (
                <div className="pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Registered Vehicle:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {verificationModal.vehicle_model} ({verificationModal.registration_number}) - Capacity: {verificationModal.vehicle_capacity}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Notes / Decision Feedback
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter feedback or validation notes for the student driver..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerificationModal(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerificationAction('reject')}
                className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Reject Verification
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerificationAction('approve')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Approve Driver
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Trip Modal */}
      <Modal
        isOpen={!!removeTripTarget}
        onClose={() => setRemoveTripTarget(null)}
        title="Remove Inappropriate Trip"
      >
        {removeTripTarget && (
          <form onSubmit={handleRemoveTrip} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              You are about to remove the trip: <strong>{removeTripTarget.start_location} → {removeTripTarget.destination}</strong> by driver <strong>{removeTripTarget.driver_name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Reason for Removal
              </label>
              <textarea
                rows={3}
                required
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="e.g. Violation of campus carpool guidelines, commercial solicitations..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRemoveTripTarget(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {actionLoading ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
