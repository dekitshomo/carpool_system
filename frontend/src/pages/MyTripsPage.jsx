import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { RouteVisualizer } from '../components/RouteVisualizer';
import { 
  Car, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Phone, 
  Edit3, 
  Trash2,
  Sparkles
} from 'lucide-react';

export const MyTripsPage = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit trip modal state
  const [editingTrip, setEditingTrip] = useState(null);
  const [editPickup, setEditPickup] = useState('');
  const [editDepartureTime, setEditDepartureTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMyTrips();
      if (data.success) {
        setTrips(data.trips || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await api.acceptRequest(requestId);
      if (res.success) {
        fetchTrips();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Optional reason for declining:');
    try {
      setActionLoading(true);
      const res = await api.rejectRequest(requestId, reason || 'Declined by driver');
      if (res.success) {
        fetchTrips();
      }
    } catch (err) {
      alert(err.message || 'Failed to decline request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this entire trip? All booked passengers will be notified immediately.')) return;
    try {
      setActionLoading(true);
      const res = await api.cancelTrip(tripId);
      if (res.success) {
        fetchTrips();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel trip');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setEditPickup(trip.pickup_point);
    setEditDepartureTime(trip.departure_time);
    setEditNotes(trip.notes || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTrip) return;
    try {
      setActionLoading(true);
      const res = await api.updateTrip(editingTrip.id, {
        pickup_point: editPickup,
        departure_time: editDepartureTime,
        notes: editNotes
      });
      if (res.success) {
        setEditingTrip(null);
        fetchTrips();
      }
    } catch (err) {
      alert(err.message || 'Failed to update trip');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="flex gap-8">
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-brand-orange dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Driver Operations
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                My Published Trips
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Manage your scheduled campus carpools, review student seat requests, and monitor passenger rosters.
              </p>
            </div>

            <Link
              to="/offer-ride"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-orange-500/20 transition self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Publish New Trip
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map(n => (
                <div key={n} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No Published Trips Yet"
              description="Share your regular commute between campus and town to help fellow students and split vehicle expenses."
              actionText="Offer a Ride Now"
              actionLink="/offer-ride"
            />
          ) : (
            <div className="space-y-6">
              {trips.map(trip => {
                const pendingReqs = trip.requests ? trip.requests.filter(r => r.status === 'pending') : [];
                const acceptedReqs = trip.requests ? trip.requests.filter(r => r.status === 'accepted') : [];

                return (
                  <div
                    key={trip.id}
                    className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5"
                  >
                    {/* Header and status */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <RouteVisualizer
                        startLocation={trip.start_location}
                        destination={trip.destination}
                        pickupPoint={trip.pickup_point}
                        departureTime={trip.departure_time}
                      />

                      <div className="flex items-center gap-2 self-start">
                        <StatusBadge status={trip.status} />
                        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 font-black text-xs border border-blue-100 dark:border-blue-900/60 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {trip.available_seats} of {trip.total_seats} seats left
                        </span>
                      </div>
                    </div>

                    {/* Schedule Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Date</span>
                        <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{trip.travel_date}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Departure</span>
                        <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{trip.departure_time}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Vehicle</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {trip.vehicle_model} ({trip.registration_number})
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Pending Requests</span>
                        <p className="font-black text-brand-orange dark:text-orange-400 mt-0.5">
                          {pendingReqs.length} waiting
                        </p>
                      </div>
                    </div>

                    {/* Pending Requests Section */}
                    {pendingReqs.length > 0 && (
                      <div className="p-5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-3xl space-y-3">
                        <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Pending Passenger Requests ({pendingReqs.length})
                        </h4>
                        
                        <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60">
                          {pendingReqs.map(req => (
                            <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="font-black text-slate-950 dark:text-white text-sm">{req.passenger_name}</span>{' '}
                                <span className="text-slate-500 dark:text-slate-400 font-mono">({req.passenger_student_id})</span>
                                <div className="text-slate-700 dark:text-slate-300 mt-0.5 font-medium">
                                  Requested: <strong>{req.seats_requested} seat(s)</strong> • Contact: {req.passenger_phone}
                                </div>
                                {req.notes && (
                                  <p className="italic text-slate-600 dark:text-slate-300 mt-1 bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-amber-100 dark:border-amber-900/60">
                                    "{req.notes}"
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAcceptRequest(req.id)}
                                  disabled={actionLoading || trip.available_seats < req.seats_requested}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-sm transition disabled:opacity-30 flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confirmed Passengers Section */}
                    {acceptedReqs.length > 0 && (
                      <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Confirmed Passenger Roster ({acceptedReqs.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {acceptedReqs.map(req => (
                            <div key={req.id} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                              <div>
                                <p className="font-black text-slate-950 dark:text-white">{req.passenger_name}</p>
                                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                                  <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {req.passenger_phone}
                                </p>
                              </div>
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200 dark:border-emerald-800">
                                {req.seats_requested} Seat(s)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <Link
                        to={`/trips/${trip.id}`}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
                      >
                        Public Page →
                      </Link>

                      {trip.status === 'published' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(trip)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleCancelTrip(trip.id)}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Cancel Trip
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Edit Trip Modal */}
      <Modal
        isOpen={!!editingTrip}
        onClose={() => setEditingTrip(null)}
        title="Edit Trip Details"
      >
        {editingTrip && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Pickup Point
              </label>
              <input
                type="text"
                required
                value={editPickup}
                onChange={(e) => setEditPickup(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Departure Time
              </label>
              <input
                type="time"
                required
                value={editDepartureTime}
                onChange={(e) => setEditDepartureTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Notes for Passengers
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-gradient-to-r from-brand-blue to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
