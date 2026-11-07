import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { RouteVisualizer } from '../components/RouteVisualizer';
import { BhutanLiveMap } from '../components/BhutanLiveMap';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  Users, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  Send,
  AlertCircle,
  Plus,
  Minus,
  Navigation,
  Sparkles,
  SlidersHorizontal,
  Compass,
  Map as MapIcon
} from 'lucide-react';

export const FindRidePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View Mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');
  const [selectedMapTrip, setSelectedMapTrip] = useState(null);

  // Filters state
  const [startLocation, setStartLocation] = useState(searchParams.get('start_location') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [travelDate, setTravelDate] = useState(searchParams.get('travel_date') || '');
  const [timeAfter, setTimeAfter] = useState('');
  const [minSeats, setMinSeats] = useState(1);
  const [sortBy, setSortBy] = useState('date');

  // Request Seat Modal State
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [seatsToRequest, setSeatsToRequest] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Quick corridor filter pills
  const popularCorridors = [
    { label: 'All Corridors', start: '', dest: '' },
    { label: 'Trashigang ↔ Kanglung', start: 'Trashigang', dest: 'Kanglung' },
    { label: 'Kanglung ↔ Khaling', start: 'Kanglung', dest: 'Khaling' },
    { label: 'Trashigang ↔ Ranjung', start: 'Trashigang', dest: 'Ranjung' },
    { label: 'Thimphu ↔ Paro', start: 'Thimphu', dest: 'Paro' },
    { label: 'Thimphu ↔ Punakha', start: 'Thimphu', dest: 'Punakha' },
    { label: 'Phuntsholing ↔ Thimphu', start: 'Phuntsholing', dest: 'Thimphu' }
  ];

  const fetchTrips = async (overrideParams = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      const s = overrideParams.start_location !== undefined ? overrideParams.start_location : startLocation;
      const d = overrideParams.destination !== undefined ? overrideParams.destination : destination;

      if (s.trim()) params.start_location = s.trim();
      if (d.trim()) params.destination = d.trim();
      if (travelDate) params.travel_date = travelDate;
      if (timeAfter) params.time_after = timeAfter;
      if (minSeats) params.min_seats = minSeats;
      if (sortBy) params.sort_by = sortBy;

      const data = await api.getAvailableTrips(params);
      if (data.success) {
        const fetched = data.trips || [];
        setTrips(fetched);
        if (fetched.length > 0) {
          setSelectedMapTrip(fetched[0]);
        } else {
          setSelectedMapTrip(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  const handleApplyCorridor = (corridor) => {
    setStartLocation(corridor.start);
    setDestination(corridor.dest);
    fetchTrips({ start_location: corridor.start, destination: corridor.dest });
  };

  const handleResetFilters = () => {
    setStartLocation('');
    setDestination('');
    setTravelDate('');
    setTimeAfter('');
    setMinSeats(1);
    setSortBy('date');
    setSearchParams({});
    setTimeout(() => {
      fetchTrips({ start_location: '', destination: '' });
    }, 50);
  };

  const openRequestModal = (trip) => {
    setSelectedTrip(trip);
    setSeatsToRequest(1);
    setRequestNotes('');
    setRequestError('');
    setRequestSuccess(false);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setRequestError('Please sign in to request a ride.');
      return;
    }
    setRequestError('');

    try {
      setRequestLoading(true);
      const res = await api.createRequest({
        trip_id: selectedTrip.id,
        seats_requested: seatsToRequest,
        notes: requestNotes
      });

      if (res.success) {
        setRequestSuccess(true);
        setTimeout(() => {
          setSelectedTrip(null);
          setRequestSuccess(false);
          fetchTrips();
        }, 1600);
      }
    } catch (err) {
      setRequestError(err.message || 'Failed to submit request');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Bhutan Route Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Find Campus Rides
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Explore routes from this to there published by verified student drivers across Bhutan.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              viewMode === 'map'
                ? 'bg-gradient-to-r from-brand-orange to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Interactive Route Map
          </button>
        </div>
      </div>

      {/* Popular Highway Corridors Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-brand-orange" />
          Quick Corridors (From This to There):
        </span>
        <div className="flex flex-wrap gap-2">
          {popularCorridors.map((c, idx) => {
            const isActive = (!c.start && !startLocation && !destination) ||
              (c.start && startLocation.toLowerCase().includes(c.start.toLowerCase()));
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyCorridor(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-orange text-white shadow-sm shadow-orange-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Origin Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 w-3 h-3 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 z-10"></span>
              <input
                type="text"
                placeholder="From: Starting Town (e.g. Trashigang)"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              />
            </div>

            {/* Destination Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 w-3 h-3 rounded-sm bg-brand-orange z-10"></span>
              <input
                type="text"
                placeholder="To: Destination (e.g. Kanglung)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              />
            </div>

            {/* Travel Date */}
            <div className="relative flex items-center">
              <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              />
            </div>

            {/* Departure Time */}
            <div className="relative flex items-center">
              <Clock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <input
                type="time"
                value={timeAfter}
                onChange={(e) => setTimeAfter(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              />
            </div>
          </div>

          {/* Secondary Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Min. Seats:</span>
                <select
                  value={minSeats}
                  onChange={(e) => setMinSeats(Number(e.target.value))}
                  className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value={1} className="dark:bg-slate-900">1 Seat</option>
                  <option value={2} className="dark:bg-slate-900">2 Seats</option>
                  <option value={3} className="dark:bg-slate-900">3+ Seats</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="date" className="dark:bg-slate-900">Earliest Departure</option>
                  <option value="seats_desc" className="dark:bg-slate-900">Most Seats Available</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-brand-blue to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-amber-300" />
                Find Rides
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
          <span>Available Trips</span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">({trips.length} active)</span>
        </h2>
      </div>

      {/* MAP VIEW MODE */}
      {viewMode === 'map' && (
        <div className="space-y-6">
          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            <BhutanLiveMap
              startLocation={selectedMapTrip ? selectedMapTrip.start_location : (startLocation || 'Trashigang Town')}
              destination={selectedMapTrip ? selectedMapTrip.destination : (destination || 'Kanglung (Sherubtse Campus)')}
              pickupPoint={selectedMapTrip ? selectedMapTrip.pickup_point : ''}
              tripDriverName={selectedMapTrip ? selectedMapTrip.driver_name : 'Verified Peer'}
              tripTime={selectedMapTrip ? selectedMapTrip.departure_time : ''}
              height="500px"
              showRouteSelector={true}
            />
          </div>

          {/* Active Trips Along This Corridor */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-brand-orange" />
              Select a Carpool to Route from This to There ({trips.length} available)
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Car className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No active trips match this exact corridor.</p>
                <p className="text-[11px] text-slate-400">Try selecting another highway corridor from the pills above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map(trip => {
                  const isSelected = selectedMapTrip && selectedMapTrip.id === trip.id;
                  const isMyTrip = user && user.id === trip.driver_id;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedMapTrip(trip)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'bg-orange-50/60 dark:bg-orange-950/30 border-brand-orange shadow-md ring-2 ring-brand-orange/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {trip.travel_date} • {trip.departure_time}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black text-[11px] border border-emerald-200 dark:border-emerald-800/60">
                            {trip.available_seats} seats left
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5 truncate">
                            <span>{trip.start_location}</span>
                            <span className="text-brand-orange">→</span>
                            <span>{trip.destination}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-brand-blue flex-shrink-0" />
                            Pickup: <strong className="text-slate-700 dark:text-slate-300 truncate">{trip.pickup_point}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {trip.driver_avatar ? (
                            <img src={trip.driver_avatar} alt={trip.driver_name} className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-brand-blue text-white font-black text-[10px] flex items-center justify-center">
                              {trip.driver_name?.charAt(0) || 'D'}
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{trip.driver_name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/trips/${trip.id}`}
                            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Details
                          </Link>

                          {!isMyTrip && trip.available_seats > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRequestModal(trip);
                              }}
                              className="px-3 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-black shadow-sm transition"
                            >
                              Request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIST VIEW MODE */}
      {viewMode === 'list' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No Carpools Found"
            description="Try broadening your route names or switching your travel date. If you have a car, you can also offer a ride to help others!"
            actionText="Clear All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map(trip => {
              const isMyTrip = user && user.id === trip.driver_id;
              return (
                <div
                  key={trip.id}
                  className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Bar: Date & Seats */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {trip.travel_date}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {trip.available_seats} of {trip.total_seats} seats left
                      </span>
                    </div>

                    {/* Route Visualizer Timeline */}
                    <RouteVisualizer
                      startLocation={trip.start_location}
                      destination={trip.destination}
                      pickupPoint={trip.pickup_point}
                      departureTime={trip.departure_time}
                      estimatedDuration={trip.estimated_duration || '35 mins'}
                    />

                    {/* Trip note */}
                    {trip.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 line-clamp-2">
                        "{trip.notes}"
                      </p>
                    )}
                  </div>

                  {/* Driver Info & Action Bar */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {trip.driver_avatar ? (
                        <img src={trip.driver_avatar} alt={trip.driver_name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-blue/20 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-indigo-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          {trip.driver_name?.charAt(0) || 'D'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-slate-950 dark:text-white">{trip.driver_name}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{trip.vehicle_model}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMapTrip(trip);
                          setViewMode('map');
                        }}
                        className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="View route on map"
                      >
                        <Compass className="w-3.5 h-3.5 text-brand-orange" />
                        Map
                      </button>

                      <Link
                        to={`/trips/${trip.id}`}
                        className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition"
                      >
                        Details
                      </Link>

                      {isMyTrip ? (
                        <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl text-xs">
                          Your Trip
                        </span>
                      ) : trip.available_seats <= 0 ? (
                        <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl text-xs">
                          Full
                        </span>
                      ) : (
                        <button
                          onClick={() => openRequestModal(trip)}
                          className="px-4 py-2 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition cursor-pointer"
                        >
                          Request Seat
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}

      {/* Interactive Request Seat Modal with Stepper */}
      <Modal
        isOpen={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        title="Request Seats in Carpool"
      >
        {selectedTrip && (
          requestSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black animate-bounce">
                ✓
              </div>
              <h4 className="text-xl font-black text-slate-950 dark:text-white">Seat Request Sent!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {selectedTrip.driver_name} has received your request and will review it shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="space-y-5">
              
              {/* Trip Summary Mini-Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between font-black text-slate-900 dark:text-white text-sm">
                  <span>{selectedTrip.start_location} → {selectedTrip.destination}</span>
                  <span className="text-brand-orange">{selectedTrip.available_seats} seats left</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Pickup: {selectedTrip.pickup_point}</span>
                  <span>{selectedTrip.travel_date} at {selectedTrip.departure_time}</span>
                </div>
              </div>

              {requestError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}

              {/* Interactive Seat Stepper */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  How many seats do you need?
                </label>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {seatsToRequest} {seatsToRequest === 1 ? 'Seat' : 'Seats'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={seatsToRequest <= 1}
                      onClick={() => setSeatsToRequest(Math.max(1, seatsToRequest - 1))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 active:scale-95 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">{seatsToRequest}</span>
                    <button
                      type="button"
                      disabled={seatsToRequest >= selectedTrip.available_seats}
                      onClick={() => setSeatsToRequest(Math.min(selectedTrip.available_seats, seatsToRequest + 1))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 active:scale-95 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes to driver */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Message / Pickup Spot for Driver (Optional)
                </label>
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. Waiting at campus taxi stand with backpack..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrip(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {requestLoading ? 'Submitting...' : 'Confirm Seat Request'}
                </button>
              </div>
            </form>
          )
        )}
      </Modal>

    </div>
  );
};
