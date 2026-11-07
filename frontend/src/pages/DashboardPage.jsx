import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { RouteVisualizer } from '../components/RouteVisualizer';
import {
  Search,
  PlusCircle,
  Car,
  Clock,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Bell,
  Compass,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Mail
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isDriver, isVerifiedDriver, isAdmin } = useAuth();
  const { notifications } = useNotifications();

  const [myRequests, setMyRequests] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [recommendedTrips, setRecommendedTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load passenger requests
        const reqData = await api.getMyRequests();
        if (reqData.success) {
          setMyRequests(reqData.requests || []);
        }

        // If driver, load trips
        if (isDriver || isAdmin) {
          const tripsData = await api.getMyTrips();
          if (tripsData.success) {
            setMyTrips(tripsData.trips || []);
          }
        }

        // Recommended trips
        const recData = await api.getAvailableTrips({ sort_by: 'date' });
        if (recData.success) {
          setRecommendedTrips((recData.trips || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isDriver, isAdmin]);

  const upcomingRequests = myRequests.filter(r => r.status === 'accepted');
  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const activePublishedTrips = myTrips.filter(t => t.status === 'published');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="flex gap-8">

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 space-y-8">

          {/* Welcome Banner - Modern Hero Card */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 text-white rounded-[2.5rem] p-7 sm:p-9 shadow-2xl border border-slate-800">
            <div className="relative z-10 max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Student ID: {user?.student_id}</span> • <span>{user?.department || 'University Student'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
              </h1>

              <p className="text-slate-300 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                Your campus carpool hub is up to date. Connect with peer students, share rides, and track vehicle progress live.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/find-ride"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  Find a Ride
                </Link>

                {(isDriver || isAdmin) && (
                  <Link
                    to="/offer-ride"
                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 backdrop-blur-md flex items-center gap-2 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-brand-orange" />
                    Offer a Ride
                  </Link>
                )}
              </div>
            </div>

            {/* Ambient Background Blur */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
          </div>

          {/* Unverified Email Warning */}
          {user && !user.email_verified && (
            <div className="p-5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs text-orange-900 dark:text-orange-200 space-y-0.5">
                  <h4 className="font-black text-sm text-orange-950 dark:text-orange-100">
                    College Email Verification Required
                  </h4>
                  <p className="text-orange-800 dark:text-orange-300/90 leading-relaxed">
                    A 6-digit code was sent to <strong>{user?.email}</strong>. Verify your email to activate full carpool features.
                  </p>
                </div>
              </div>
              <Link
                to={`/verify-email?email=${encodeURIComponent(user?.email || '')}`}
                className="px-4 py-2 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md transition flex-shrink-0 text-center"
              >
                Verify Email →
              </Link>
            </div>
          )}

          {/* Verification Status Warning if Driver is unverified */}
          {isDriver && !isVerifiedDriver && (
            <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl flex items-start gap-3.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <h4 className="font-black text-sm text-amber-800 dark:text-amber-200">Driver Verification Pending</h4>
                <p className="leading-relaxed">
                  Your driver documents are awaiting admin approval. You will receive an instant notification once verified and able to post trips.
                </p>
                <Link to="/profile" className="inline-block font-bold text-amber-900 dark:text-amber-300 underline mt-1">
                  Manage Vehicle & Check Verification →
                </Link>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar - Colorful & High-Contrast */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Upcoming Rides</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{upcomingRequests.length}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Confirmed bookings</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Requests</span>
              <p className="text-3xl font-black text-brand-orange dark:text-orange-400 mt-1">{pendingRequests.length}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Awaiting driver</span>
            </div>

            {isDriver ? (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Published Trips</span>
                <p className="text-3xl font-black text-brand-blue dark:text-sky-400 mt-1">{activePublishedTrips.length}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Active driver routes</span>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Bookings</span>
                <p className="text-3xl font-black text-brand-blue dark:text-sky-400 mt-1">{myRequests.length}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Semester carpools</span>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Unread Alerts</span>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {notifications.filter(n => !n.is_read).length}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">In-app notifications</span>
            </div>
          </div>

          {/* Upcoming Confirmed Rides with Route Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Upcoming Confirmed Rides</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your scheduled bookings with peer student drivers</p>
              </div>
              <Link
                to="/my-requests"
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                All Requests →
              </Link>
            </div>

            {loading ? (
              <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-[2rem] animate-pulse"></div>
            ) : upcomingRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                You have no upcoming confirmed rides scheduled.{' '}
                <Link to="/find-ride" className="text-brand-orange font-bold underline">
                  Search available campus rides
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcomingRequests.map(req => (
                  <div key={req.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <RouteVisualizer
                        startLocation={req.start_location}
                        destination={req.destination}
                        pickupPoint={req.pickup_point}
                        departureTime={req.departure_time}
                      />
                      <StatusBadge status="accepted" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 py-2 border-y border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold">{req.travel_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold">{req.departure_time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{req.driver_name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">Phone: {req.driver_phone}</p>
                      </div>

                      <Link
                        to={`/trips/${req.trip_id}`}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        Trip Info
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Rides */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Recommended Rides</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Popular upcoming routes across campus corridors</p>
              </div>
              <Link
                to="/find-ride"
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                Browse All Rides →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recommendedTrips.map(trip => (
                <div key={trip.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-brand-orange bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-800/60">
                        {trip.available_seats} seat{trip.available_seats > 1 ? 's' : ''} left
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{trip.travel_date}</span>
                    </div>

                    <h4 className="font-black text-sm text-slate-950 dark:text-white leading-tight">
                      {trip.start_location} → {trip.destination}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Pickup: {trip.pickup_point}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">{trip.driver_name}</span>
                    <Link
                      to={`/trips/${trip.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition"
                    >
                      Book →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
