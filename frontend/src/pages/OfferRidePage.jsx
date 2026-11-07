import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { BhutanLiveMap } from '../components/BhutanLiveMap';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Navigation,
  Compass
} from 'lucide-react';

export const OfferRidePage = () => {
  const { user, isDriver, isVerifiedDriver, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    start_location: 'Trashigang Town',
    destination: 'Kanglung (Sherubtse Campus)',
    pickup_point: 'Trashigang Main Taxi Stand',
    travel_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    departure_time: '08:30',
    available_seats: 3,
    estimated_duration: '35 mins',
    notes: 'Travelling to morning classes. Space available in boot for bags. Strictly non-smoking.',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Suggested popular college corridors across Bhutan
  const popularPresets = [
    { start: 'Trashigang Town', dest: 'Kanglung (Sherubtse Campus)', pickup: 'Trashigang Main Taxi Stand', duration: '35 mins' },
    { start: 'Kanglung Campus', dest: 'Trashigang Town', pickup: 'Sherubtse Main Gate', duration: '35 mins' },
    { start: 'Kanglung Campus', dest: 'Khaling Handloom Center', pickup: 'Lower Kanglung Bus Stop', duration: '50 mins' },
    { start: 'Trashigang Town', dest: 'Ranjung High School', pickup: 'Chazam Junction', duration: '30 mins' },
    { start: 'Thimphu Main Gate', dest: 'Paro Campus', pickup: 'Babesa Bridge', duration: '1 hr 05 mins' },
    { start: 'Thimphu City Center', dest: 'Punakha (Khuruthang)', pickup: 'Semtokha Dzong', duration: '2 hrs' },
    { start: 'Phuntsholing (CST Campus)', dest: 'Thimphu City Center', pickup: 'Rinchending Checkpost', duration: '4 hrs 30 mins' },
  ];

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      start_location: preset.start,
      destination: preset.dest,
      pickup_point: preset.pickup,
      estimated_duration: preset.duration
    }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Verification check
    if (!isAdmin && (!isDriver || !isVerifiedDriver)) {
      setError('Only verified student drivers can publish active trips. Please check your verification status.');
      return;
    }

    if (!formData.start_location || !formData.destination || !formData.pickup_point || !formData.travel_date || !formData.departure_time) {
      setError('Please provide all mandatory trip details.');
      return;
    }

    const seats = parseInt(formData.available_seats, 10);
    if (isNaN(seats) || seats <= 0) {
      setError('Available seats must be greater than zero.');
      return;
    }

    if (user?.vehicle && seats > user.vehicle.capacity) {
      setError(`Available seats cannot exceed vehicle capacity of ${user.vehicle.capacity}.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.createTrip(formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/my-trips');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to publish trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="flex gap-8">
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Form */}
        <div className="flex-1 space-y-6">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-brand-orange dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Driver Console
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              Publish a Campus Trip
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Plot your journey from starting point to destination across Bhutan's collegiate corridors and share empty seats.
            </p>
          </div>

          {/* Verification Status Warning if Driver is unverified */}
          {!isAdmin && (!isDriver || !isVerifiedDriver) && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-[2rem] p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-base">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                Driver Verification Required
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                For collegiate passenger safety, all student drivers must submit a driving license and vehicle registration for campus admin verification prior to posting trips.
              </p>
              <div className="pt-1">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Submit Driver Verification & Vehicle →
                </Link>
              </div>
            </div>
          )}

          {/* Registered Vehicle Banner */}
          {user?.vehicle && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-orange to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 flex-shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Active Vehicle: {user.vehicle.model} ({user.vehicle.vehicle_type})
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Plate: <strong className="font-mono text-slate-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">{user.vehicle.registration_number}</strong> • Max Capacity: {user.vehicle.capacity} passengers
                  </div>
                </div>
              </div>
              <Link 
                to="/profile" 
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                Change Vehicle
              </Link>
            </div>
          )}

          {/* Quick Route Presets */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Bhutan Campus Corridors (Click to route from this to there):
            </span>
            <div className="flex flex-wrap gap-2">
              {popularPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/60 hover:text-brand-orange dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all text-left flex items-center gap-1.5"
                >
                  <Navigation className="w-3 h-3 text-brand-orange flex-shrink-0" />
                  <span>{p.start.split(' ')[0]} → {p.dest.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Offer Form Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Trip published successfully! Redirecting to your trips...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Route Endpoints: "From This" to "There" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 inline-block"></span>
                    Starting Location (From This) *
                  </label>
                  <input
                    type="text"
                    name="start_location"
                    required
                    placeholder="e.g. Trashigang Town"
                    value={formData.start_location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-brand-orange inline-block"></span>
                    Final Destination (To There) *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    required
                    placeholder="e.g. Kanglung (Sherubtse Campus)"
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  />
                </div>
              </div>

              {/* Pickup Point & Estimated Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-blue dark:text-blue-400" />
                    Specific Pickup Spot (Along Route) *
                  </label>
                  <input
                    type="text"
                    name="pickup_point"
                    required
                    placeholder="e.g. Trashigang Main Taxi Stand"
                    value={formData.pickup_point}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Designated waypoint where passengers board your car</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Estimated Travel Duration
                  </label>
                  <input
                    type="text"
                    name="estimated_duration"
                    placeholder="e.g. 35 mins"
                    value={formData.estimated_duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  />
                </div>
              </div>

              {/* Bhutan Journey Route Map Card */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-orange" />
                    Bhutan Journey Route Map (Auto-updates with route)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Interactive highway corridor view
                  </span>
                </div>
                
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                  <BhutanLiveMap
                    startLocation={formData.start_location}
                    destination={formData.destination}
                    pickupPoint={formData.pickup_point}
                    tripDriverName={user?.name || 'You'}
                    tripTime={formData.departure_time}
                    height="380px"
                    showRouteSelector={false}
                  />
                </div>
              </div>

              {/* Date, Time & Visual Seat Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Travel Date *
                  </label>
                  <input
                    type="date"
                    name="travel_date"
                    required
                    value={formData.travel_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Departure Time *
                  </label>
                  <input
                    type="time"
                    name="departure_time"
                    required
                    value={formData.departure_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-orange" /> Available Seats *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({ ...formData, available_seats: num })}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all ${
                          formData.available_seats === num
                            ? 'bg-gradient-to-r from-brand-orange to-amber-600 text-white shadow-md shadow-orange-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trip Notes & Guidelines */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Trip Notes / Instructions for Passengers (Optional)
                </label>
                <textarea
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Boot space available for backpacks. Strictly non-smoking. Leaving promptly at 08:30 AM..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (!isAdmin && (!isDriver || !isVerifiedDriver))}
                  className="w-full py-4 bg-gradient-to-r from-brand-orange via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-black rounded-2xl text-sm shadow-lg shadow-orange-500/25 transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  {loading ? 'Publishing Trip...' : 'Publish Campus Carpool'}
                </button>
              </div>

            </form>

          </div>

        </div>

      </div>
    </div>
  );
};
