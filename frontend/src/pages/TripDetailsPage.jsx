import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ReportModal } from '../components/ReportModal';
import { RouteVisualizer } from '../components/RouteVisualizer';
import { BhutanLiveMap } from '../components/BhutanLiveMap';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Flag, 
  ArrowLeft, 
  Send,
  Plus,
  Minus,
  Navigation,
  Compass,
  Sparkles
} from 'lucide-react';

export const TripDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewTab, setViewTab] = useState('map'); // 'map' or 'timeline'

  // Request modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState('');

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getTripById(id);
      if (data.success && data.trip) {
        setTrip(data.trip);
      }
    } catch (err) {
      setError(err.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const isDriverOfTrip = user && trip && user.id === trip.driver_id;
  const userRequest = trip?.userRequest;

  // Handle passenger request submission
  const handleRequestSeat = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/trips/${id}` } });
      return;
    }

    try {
      setSubmittingRequest(true);
      const res = await api.createRequest({
        trip_id: trip.id,
        seats_requested: seatsRequested,
        notes: requestNotes
      });
      if (res.success) {
        setRequestFeedback('Request submitted successfully!');
        setTimeout(() => {
          setRequestModalOpen(false);
          setRequestFeedback('');
          fetchTripDetails();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit seat request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Driver accepts request
  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await api.acceptRequest(requestId);
      if (res.success) {
        fetchTripDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  // Driver rejects request
  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Optional reason for declining:');
    try {
      setActionLoading(true);
      const res = await api.rejectRequest(requestId, reason || 'Declined by driver');
      if (res.success) {
        fetchTripDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  // Passenger cancels their request
  const handleCancelMyRequest = async () => {
    if (!userRequest) return;
    try {
      setActionLoading(true);
      const res = await api.cancelRequest(userRequest.id, cancelReason);
      if (res.success) {
        setCancelModalOpen(false);
        fetchTripDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  // Driver cancels the whole trip
  const handleCancelTrip = async () => {
    if (!window.confirm('Are you sure you want to cancel this entire trip? All passengers will be notified.')) return;
    try {
      setActionLoading(true);
      const res = await api.cancelTrip(trip.id);
      if (res.success) {
        fetchTripDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel trip');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-brand-orange rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loading trip telemetry & details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Trip Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'The requested trip does not exist or has been removed.'}</p>
        <Link 
          to="/find-ride" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Available Rides
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
      
      {/* Top back navigation & status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={trip.status} />
          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Report this trip"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Visual Route Banner Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Verified Campus Carpool Route
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white flex flex-wrap items-center gap-2">
              <span>{trip.start_location}</span>
              <span className="text-brand-orange">→</span>
              <span>{trip.destination}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-blue dark:text-blue-400" />
              Designated Pickup Point: <strong className="text-slate-800 dark:text-slate-200">{trip.pickup_point}</strong>
            </p>
          </div>

          <span className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black text-xs sm:text-sm border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 self-start sm:self-center shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {trip.available_seats} of {trip.total_seats} seats remaining
          </span>
        </div>

        {/* View Switcher: Live Bhutan Map vs Route Timeline */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('map')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
                viewTab === 'map'
                  ? 'bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              Bhutan Journey Route Map
            </button>
            <button
              onClick={() => setViewTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
                viewTab === 'timeline'
                  ? 'bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Navigation className="w-4 h-4" />
              Route Stations
            </button>
          </div>
        </div>

        {/* Dynamic Display: Live Bhutan Map or Timeline */}
        {viewTab === 'map' ? (
          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
            <BhutanLiveMap
              startLocation={trip.start_location}
              destination={trip.destination}
              pickupPoint={trip.pickup_point}
              tripDriverName={trip.driver_name}
              tripTime={trip.departure_time}
              height="480px"
            />
          </div>
        ) : (
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <RouteVisualizer
              startLocation={trip.start_location}
              destination={trip.destination}
              pickupPoint={trip.pickup_point}
              departureTime={trip.departure_time}
              estimatedDuration={trip.estimated_duration || '35 mins'}
            />
          </div>
        )}

        {/* Key Trip Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-800 dark:to-slate-900 text-white rounded-3xl text-xs border border-slate-800 shadow-md">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Travel Date</span>
            <p className="font-black text-white text-sm mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              {trip.travel_date}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Departure Time</span>
            <p className="font-black text-white text-sm mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-orange" />
              {trip.departure_time}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Trip Duration</span>
            <p className="font-black text-white text-sm mt-0.5">
              {trip.estimated_duration || 'Approx. 35 mins'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Total Capacity</span>
            <p className="font-black text-emerald-400 text-sm mt-0.5">
              {trip.vehicle_capacity || trip.total_seats} passenger seats
            </p>
          </div>
        </div>

        {/* Trip Description */}
        {trip.notes && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Driver Notes & Guidelines</h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
              "{trip.notes}"
            </p>
          </div>
        )}

        {/* Passenger Booking / Status Box */}
        {!isDriverOfTrip && (
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            {userRequest ? (
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Booking Status:</span>
                  <StatusBadge status={userRequest.status} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Requested {userRequest.seats_requested} seat(s) on {new Date(userRequest.created_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Join this Student Carpool</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reserve available seats in this vehicle directly with the student driver.</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {userRequest ? (
                userRequest.status !== 'cancelled' && userRequest.status !== 'rejected' && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="px-4 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition"
                  >
                    Cancel Booking
                  </button>
                )
              ) : trip.available_seats > 0 && trip.status === 'published' ? (
                <button
                  onClick={() => setRequestModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  Request Seat(s)
                </button>
              ) : (
                <span className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl text-xs">
                  {trip.status !== 'published' ? 'Trip Not Active' : 'Fully Booked'}
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Driver & Vehicle Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Driver Trust Card with Avatar */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-blue dark:text-blue-400" /> Driver Profile
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Verified Student Driver
            </span>
          </div>

          <div className="flex items-center gap-4">
            {trip.driver_avatar ? (
              <img 
                src={trip.driver_avatar} 
                alt={trip.driver_name} 
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-blue/30 dark:ring-blue-500/30 shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-blue to-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                {trip.driver_name?.charAt(0) || 'D'}
              </div>
            )}
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-base">{trip.driver_name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{trip.driver_department || 'University Student'}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Student ID: <strong className="text-slate-800 dark:text-slate-200">{trip.driver_student_id}</strong></p>
            </div>
          </div>

          {trip.driver_bio && (
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 leading-relaxed">
              "{trip.driver_bio}"
            </p>
          )}

          {/* Contact Details */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Phone className="w-3.5 h-3.5 text-brand-blue dark:text-blue-400" />
              <span>Mobile Phone: <strong>{trip.driver_phone}</strong></span>
            </div>
            {trip.driver_email && (
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Mail className="w-3.5 h-3.5 text-brand-blue dark:text-blue-400" />
                <span>College Email: <strong>{trip.driver_email}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Specification Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-brand-orange dark:text-orange-400" /> Vehicle Credentials
            </h3>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {trip.vehicle_type}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500">Model:</span>
              <span className="font-black text-slate-900 dark:text-white">{trip.vehicle_model}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500">Registration Plate:</span>
              <span className="font-mono font-black text-slate-950 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-800/80">
                {trip.registration_number}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500">Vehicle Color:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{trip.vehicle_color || 'Standard Metallic'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400 dark:text-slate-500">Max Passenger Capacity:</span>
              <span className="font-black text-brand-blue dark:text-blue-400">{trip.vehicle_capacity || trip.total_seats} passenger seats</span>
            </div>
          </div>
        </div>

      </div>

      {/* Driver Management Section (Driver or Admin) */}
      {isDriverOfTrip && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Manage Passenger Seat Requests</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review, accept, or decline student bookings for this ride</p>
            </div>
            {trip.status === 'published' && (
              <button
                onClick={handleCancelTrip}
                disabled={actionLoading}
                className="px-4 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition"
              >
                Cancel Entire Trip
              </button>
            )}
          </div>

          {/* Passenger requests */}
          {trip.requests && trip.requests.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {trip.requests.map(req => (
                <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    {req.passenger_avatar ? (
                      <img 
                        src={req.passenger_avatar} 
                        alt={req.passenger_name} 
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-blue/20 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center flex-shrink-0">
                        {req.passenger_name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-sm">{req.passenger_name}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono">({req.passenger_student_id})</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>Phone: <strong className="text-slate-700 dark:text-slate-300">{req.passenger_phone}</strong></span>
                        <span>•</span>
                        <span>Requested: <strong className="text-slate-700 dark:text-slate-300">{req.seats_requested} seat(s)</strong></span>
                      </div>
                      {req.notes && (
                        <p className="text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                          "{req.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={actionLoading || trip.available_seats < req.seats_requested}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition disabled:opacity-30"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No passenger requests received yet for this trip.
            </div>
          )}

          {/* Confirmed Roster */}
          {trip.acceptedPassengers && trip.acceptedPassengers.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Confirmed Passenger Roster ({trip.acceptedPassengers.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trip.acceptedPassengers.map(p => (
                  <div key={p.request_id} className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs space-y-1 flex items-center gap-3">
                    {p.passenger_avatar ? (
                      <img src={p.passenger_avatar} alt={p.passenger_name} className="w-9 h-9 rounded-xl object-cover ring-1 ring-emerald-300 flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold flex items-center justify-center flex-shrink-0">
                        {p.passenger_name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{p.passenger_name} ({p.seats_requested} seat)</p>
                      <p className="text-slate-600 dark:text-slate-400">Contact: <strong className="text-slate-800 dark:text-slate-200">{p.passenger_phone}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Request Seat Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Seats in Carpool"
      >
        {requestFeedback ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black animate-bounce">
              ✓
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">{requestFeedback}</h4>
          </div>
        ) : (
          <form onSubmit={handleRequestSeat} className="space-y-5">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-1.5">
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {trip.start_location} → {trip.destination}
              </div>
              <p className="text-slate-500 dark:text-slate-400">Pickup: {trip.pickup_point}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-black">{trip.available_seats} seat(s) available</p>
            </div>

            {/* Stepper */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Number of Seats
              </label>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {seatsRequested} {seatsRequested === 1 ? 'Seat' : 'Seats'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={seatsRequested <= 1}
                    onClick={() => setSeatsRequested(Math.max(1, seatsRequested - 1))}
                    className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 active:scale-95 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">{seatsRequested}</span>
                  <button
                    type="button"
                    disabled={seatsRequested >= trip.available_seats}
                    onClick={() => setSeatsRequested(Math.min(trip.available_seats, seatsRequested + 1))}
                    className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Message to Driver (Optional)
              </label>
              <textarea
                rows={3}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="e.g. Waiting by the main gate with backpack..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRequest}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingRequest ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Cancel Request Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Booking Request"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to cancel your booking? Any accepted seats will be immediately returned to the pool for other students.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cancellation Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule clash, took alternate campus bus..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancelMyRequest}
              disabled={actionLoading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 transition"
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        tripId={trip.id}
        reportedUserId={trip.driver_id}
        contextTitle={`${trip.start_location} → ${trip.destination} (${trip.driver_name})`}
      />

    </div>
  );
};
