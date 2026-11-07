import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { RouteVisualizer } from '../components/RouteVisualizer';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  Car, 
  Phone, 
  ArrowRight, 
  Search,
  Sparkles
} from 'lucide-react';

export const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMyRequests();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancelRequest = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;

    try {
      setCancelLoading(true);
      const res = await api.cancelRequest(cancelTarget.id, cancelReason);
      if (res.success) {
        setCancelTarget(null);
        setCancelReason('');
        fetchRequests();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'pending') return req.status === 'pending';
    if (filter === 'accepted') return req.status === 'accepted';
    if (filter === 'cancelled') return req.status === 'cancelled' || req.status === 'rejected';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="flex gap-8">
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Bookings & Requests
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                My Ride Bookings
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Track status and manage your submitted campus carpool seats.
              </p>
            </div>

            <Link
              to="/find-ride"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-orange-500/20 transition self-start sm:self-auto"
            >
              <Search className="w-3.5 h-3.5" />
              Find More Rides
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            {[
              { id: 'all', label: 'All Requests', count: requests.length },
              { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
              { id: 'accepted', label: 'Confirmed', count: requests.filter(r => r.status === 'accepted').length },
              { id: 'cancelled', label: 'Cancelled / Past', count: requests.filter(r => r.status === 'cancelled' || r.status === 'rejected').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 ${
                  filter === tab.id
                    ? 'bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab.id ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Requests Content */}
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Requests in this Section"
              description="Search available rides along your route and reserve empty seats with fellow students."
              actionText="Find Available Rides"
              actionLink="/find-ride"
            />
          ) : (
            <div className="space-y-5">
              {filteredRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <RouteVisualizer
                      startLocation={req.start_location}
                      destination={req.destination}
                      pickupPoint={req.pickup_point}
                      departureTime={req.departure_time}
                    />

                    <div className="flex items-center gap-2 self-start">
                      <StatusBadge status={req.status} />
                    </div>
                  </div>

                  {/* Info Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Date</span>
                      <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{req.travel_date}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Departure</span>
                      <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{req.departure_time}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Seats Reserved</span>
                      <p className="font-black text-brand-orange dark:text-orange-400 mt-0.5">
                        {req.seats_requested} {req.seats_requested === 1 ? 'Seat' : 'Seats'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Vehicle</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {req.vehicle_model}
                      </p>
                    </div>
                  </div>

                  {/* Driver and Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {req.driver_avatar ? (
                        <img src={req.driver_avatar} alt={req.driver_name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-blue/20 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-indigo-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          {req.driver_name?.charAt(0) || 'D'}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          Driver: {req.driver_name} ({req.driver_student_id})
                        </div>
                        {req.status === 'accepted' && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Contact: <strong className="text-slate-800 dark:text-slate-200">{req.driver_phone}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/trips/${req.trip_id}`}
                        className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition"
                      >
                        View Trip
                      </Link>

                      {(req.status === 'pending' || req.status === 'accepted') && (
                        <button
                          onClick={() => setCancelTarget(req)}
                          className="px-3.5 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cancellation Reason if any */}
                  {req.cancellation_reason && (
                    <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-xs text-rose-800 dark:text-rose-300">
                      <strong>Cancellation note:</strong> {req.cancellation_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Confirm Cancellation"
      >
        {cancelTarget && (
          <form onSubmit={handleCancelRequest} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to cancel your seat request for the trip to <strong>{cancelTarget.destination}</strong> on <strong>{cancelTarget.travel_date}</strong>?
            </p>

            {cancelTarget.status === 'accepted' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl text-xs font-semibold">
                Since this was an accepted booking, your <strong>{cancelTarget.seats_requested} seat(s)</strong> will be restored immediately for other students.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule clash, arranged alternative ride..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Keep Booking
              </button>
              <button
                type="submit"
                disabled={cancelLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black disabled:opacity-50 transition shadow-sm"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
