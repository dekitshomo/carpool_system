import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RouteVisualizer } from '../components/RouteVisualizer';
import { BhutanLiveMap, BHUTAN_ROUTES } from '../components/BhutanLiveMap';
import { 
  Car, 
  Search, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Navigation, 
  Compass, 
  ChevronRight,
  Sparkles,
  Map as MapIcon,
  ShieldAlert,
  Award
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, isDriver } = useAuth();
  const navigate = useNavigate();

  // Mode switcher: 'ride' | 'drive'
  const [activeTab, setActiveTab] = useState('ride');

  // Search fields
  const [fromLocation, setFromLocation] = useState('Trashigang Town');
  const [toLocation, setToLocation] = useState('Kanglung (Sherubtse Campus)');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState(1);

  // Live Map corridor selector on landing page
  const [selectedCorridorKey, setSelectedCorridorKey] = useState('trashigang_kanglung');

  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popular route shortcuts
  const popularCorridors = [
    { key: 'trashigang_kanglung', from: 'Trashigang Town', to: 'Kanglung Campus', time: '35 mins', rides: '14 rides today' },
    { key: 'kanglung_trashigang', from: 'Kanglung Campus', to: 'Trashigang Town', time: '35 mins', rides: '8 rides today' },
    { key: 'trashigang_mongar', from: 'Trashigang Bridge', to: 'Mongar Town Center', time: '3 hrs', rides: '4 rides this week' },
    { key: 'thimphu_paro', from: 'Thimphu City', to: 'Paro Campus', time: '1 hr 15m', rides: '12 rides this week' },
  ];

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const data = await api.getAvailableTrips({ sort_by: 'date' });
        if (data.success) {
          setRecentTrips(data.trips.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching sample trips:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (fromLocation) query.set('start_location', fromLocation);
    if (toLocation) query.set('destination', toLocation);
    if (travelDate) query.set('travel_date', travelDate);
    if (passengers) query.set('min_seats', passengers);
    navigate(`/find-ride?${query.toString()}`);
  };

  const handleSelectCorridor = (c) => {
    setFromLocation(c.from);
    setToLocation(c.to);
    setSelectedCorridorKey(c.key);
  };

  return (
    <div className="space-y-24 pb-24 overflow-hidden transition-colors duration-200">
      
      {/* Hero Section: Modern Vibrant Carpool Hub */}
      <section className="relative pt-6 sm:pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Colorful Glow Ambient Background Effects */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-gradient-to-tr from-brand-blue/20 via-orange-500/15 to-purple-600/20 blur-3xl -z-10 rounded-full pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Interactive Tabbed Booking Card */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white text-xs font-black tracking-tight shadow-md border border-slate-700/50">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Official Bhutan Student Carpool Network</span>
              <span className="text-slate-500">•</span>
              <span className="text-brand-orange font-bold">2026 Academic Edition</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.08]">
              Travel anywhere across campus, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-indigo-600 to-brand-orange">together.</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Connect with fellow university students travelling in the same direction. Split fuel, ride in safety and comfort, and track rides live across Bhutan.
            </p>

            {/* Segmented Switcher (Ride vs Drive) */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-5 transition-colors">
              
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('ride')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all duration-200 ${
                    activeTab === 'ride'
                      ? 'bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Search className="w-4 h-4 text-brand-orange" />
                  Find a Ride
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('drive')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all duration-200 ${
                    activeTab === 'drive'
                      ? 'bg-gradient-to-r from-brand-orange to-amber-600 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Car className="w-4 h-4 text-emerald-300" />
                  Offer a Ride
                </button>
              </div>

              {activeTab === 'ride' ? (
                /* RIDE FORM */
                <form onSubmit={handleHeroSearch} className="space-y-4">
                  <div className="space-y-3">
                    
                    {/* Pickup Field */}
                    <div className="relative flex items-center">
                      <div className="absolute left-4 z-10 w-3 h-3 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900"></div>
                      <input
                        type="text"
                        required
                        placeholder="Leaving from (e.g. Trashigang Town)"
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* Destination Field */}
                    <div className="relative flex items-center">
                      <div className="absolute left-4 z-10 w-3 h-3 rounded-sm bg-brand-orange"></div>
                      <input
                        type="text"
                        required
                        placeholder="Going to (e.g. Kanglung Campus)"
                        value={toLocation}
                        onChange={(e) => setToLocation(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all placeholder:text-slate-400"
                      />
                    </div>

                  </div>

                  {/* Date & Seats Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>

                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(Number(e.target.value))}
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      >
                        <option value={1}>1 Passenger</option>
                        <option value={2}>2 Passengers</option>
                        <option value={3}>3 Passengers</option>
                        <option value={4}>4 Passengers</option>
                      </select>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-blue via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-black text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-200"
                  >
                    <Search className="w-4 h-4 text-amber-300" />
                    Search Available Carpools
                  </button>
                </form>
              ) : (
                /* DRIVE TAB */
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Drive & Save On Every Commute
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-400">
                      Offset your vehicle fuel costs by filling empty seats with verified university peers.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">Avg Monthly Saving</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Nu. 2,500+</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">Student Safety</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">100% Verified</p>
                    </div>
                  </div>

                  <Link
                    to="/offer-ride"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-black text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all duration-200"
                  >
                    <Car className="w-4 h-4" />
                    Publish a Campus Trip Now
                  </Link>
                </div>
              )}

              {/* Quick Route Corridor Pills */}
              <div className="pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                  Popular Bhutan Corridors:
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularCorridors.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectCorridor(c)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-brand-blue dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>{c.from.split(' ')[0]} → {c.to.split(' ')[0]}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({c.time})</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Bhutan Journey Route Map Preview */}
          <div className="lg:col-span-5 relative space-y-4">
            
            {/* Visual Glassmorphic Mockup Container with Route Map */}
            <div className="relative mx-auto max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 text-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-800 space-y-5">
              
              {/* Header Pill */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Bhutan Journey Route Map</span>
                </div>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                  Trashigang ↔ Kanglung
                </span>
              </div>

              {/* Interactive Map Preview */}
              <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                <BhutanLiveMap
                  startLocation={fromLocation}
                  destination={toLocation}
                  tripDriverName="Tashi Dorji"
                  tripTime="08:30 AM"
                  height="260px"
                />
              </div>

              {/* Driver Details Card */}
              <div className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                    TD
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">Tashi Dorji</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[11px] text-slate-400">Toyota Prius (BP-1-A1234)</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/80">
                    Active Driver
                  </span>
                </div>
              </div>

              {/* Quick Book CTA */}
              <Link
                to="/find-ride"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-xs tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all duration-200"
              >
                <span>Browse All Available Rides</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Floating verification badge */}
            <div className="hidden sm:flex bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 items-center gap-3 max-w-sm mx-auto">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-black text-slate-900 dark:text-white">Bhutan Student ID Verified</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Restricted to enrolled college students and faculties</p>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Trust & Live Statistics Counter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-[2.5rem] shadow-2xl border border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trips Completed</span>
            <p className="text-3xl sm:text-4xl font-black text-white">1,250+</p>
            <p className="text-xs text-slate-400">Across eastern & western dzongkhags</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Fuel Offset</span>
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">Nu. 140K+</p>
            <p className="text-xs text-slate-400">Pooled commute savings</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Students</span>
            <p className="text-3xl sm:text-4xl font-black text-brand-orange">850+</p>
            <p className="text-xs text-slate-400">Verified drivers & passengers</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Safety Check</span>
            <p className="text-3xl sm:text-4xl font-black text-sky-400">100%</p>
            <p className="text-xs text-slate-400">License plate & ID verification</p>
          </div>
        </div>
      </section>

      {/* Interactive Bhutan Corridors Showcase Section (Full Interactive Map) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              Geographically Accurate Bhutan Highway Map
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">Live Journey Tracker & Bhutan Corridors</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Pan, zoom, and simulate real-time vehicle progress along Bhutan's mountain highways.</p>
          </div>

          {/* Corridor Selection Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(BHUTAN_ROUTES).map(([key, route]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCorridorKey(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  selectedCorridorKey === key
                    ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {route.name.split('↔')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl">
          <BhutanLiveMap
            initialRouteKey={selectedCorridorKey}
            tripDriverName="Campus Ride Driver"
            tripTime="Every Hour"
            height="460px"
          />
        </div>
      </section>

      {/* Featured Rides Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60">
              Real-Time Available Rides
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-2">Upcoming Campus Carpools</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Verified student drivers with available seats today and tomorrow</p>
          </div>

          <Link
            to="/find-ride"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs transition shadow-md"
          >
            <span>Explore All Rides</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
            ))}
          </div>
        ) : recentTrips.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
            No published trips currently available. Be the first student driver to offer a ride!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentTrips.map((trip) => (
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
                      {trip.available_seats} seat{trip.available_seats > 1 ? 's' : ''} left
                    </span>
                  </div>

                  {/* Visual Route Timeline Component */}
                  <RouteVisualizer
                    startLocation={trip.start_location}
                    destination={trip.destination}
                    pickupPoint={trip.pickup_point}
                    departureTime={trip.departure_time}
                    estimatedDuration={trip.estimated_duration || '35 mins'}
                  />

                  {/* Driver Note if any */}
                  {trip.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 line-clamp-2">
                      "{trip.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Bar: Driver Info & Action Button */}
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
                        <span className="text-xs font-black text-slate-900 dark:text-white">{trip.driver_name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{trip.vehicle_model}</span>
                    </div>
                  </div>

                  <Link
                    to={`/trips/${trip.id}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs transition shadow-sm"
                  >
                    View & Book
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3 Steps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-brand-orange bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900/60">
            Frictionless Commuting
          </span>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">How CampusRide Works</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Engineered specifically for student routines and class schedules.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 flex items-center justify-center font-black text-lg">
              01
            </div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">Search or Publish Route</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Find rides by departure time and campus gates, or publish your vehicle’s empty seats with our simple form.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-orange-400 dark:hover:border-orange-500 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-brand-orange dark:text-orange-400 flex items-center justify-center font-black text-lg">
              02
            </div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">Instant Seat Allocation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Request seats with 1-click. Our atomic transaction engine auto-reserves seats to completely eliminate overbooking.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
              03
            </div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">Live Tracking & Safe Travel</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Meet at designated campus pickup spots. Follow your route live on the interactive Bhutan map with verified peers.
            </p>
          </div>

        </div>
      </section>

      {/* Safety & Student Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-blue-800/50">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-blue-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              Safety First Campus Protocol
            </span>
            <h2 className="text-2xl sm:text-4xl font-black">
              Student verified. Campus monitored. Always reliable.
            </h2>
            <p className="text-blue-100/80 text-sm leading-relaxed">
              Every carpool driver submits their driver's license and student ID for mandatory campus admin review before any ride can be published.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-6 py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition"
              >
                Create Student Account
              </Link>
              <Link
                to="/find-ride"
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 backdrop-blur-md transition"
              >
                Browse Active Corridors
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
