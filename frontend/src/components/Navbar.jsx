import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ThemeSelector } from './ThemeSelector';
import { 
  Car, 
  Search, 
  PlusCircle, 
  Bell, 
  User, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  Calendar, 
  Compass, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  Sparkles,
  MapPin
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isDriver, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-orange via-amber-500 to-brand-blue text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all duration-300">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-slate-950 dark:text-white leading-none flex items-center gap-1">
                Campus<span className="text-brand-orange bg-orange-50 dark:bg-orange-950/60 px-1.5 py-0.5 rounded-lg border border-orange-200/60 dark:border-orange-800/60 text-sm ml-0.5">Ride</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">Student Carpool</span>
            </div>
          </Link>

          {/* Desktop Navigation Segmented Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
            <Link
              to="/find-ride"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive('/find-ride')
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-brand-blue" />
              Find a Ride
            </Link>

            {isAuthenticated && (
              <>
                {(isDriver || isAdmin) && (
                  <Link
                    to="/offer-ride"
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      isActive('/offer-ride')
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Offer a Ride
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  Dashboard
                </Link>

                <Link
                  to="/my-requests"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    isActive('/my-requests')
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Requests
                </Link>

                {(isDriver || isAdmin) && (
                  <Link
                    to="/my-trips"
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      isActive('/my-trips')
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    My Trips
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all duration-200 ${
                      isActive('/admin')
                        ? 'bg-purple-700 text-white shadow-sm'
                        : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right Area: Theme Selector, Notifications, User */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* 3-Way Theme Selector (Light, Dark, System) */}
            <ThemeSelector />

            {isAuthenticated ? (
              <>
                {/* Notification Bell with Ping */}
                <Link
                  to="/notifications"
                  className="relative p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200 active:scale-95"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-orange text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown Pill with Profile Picture */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-all duration-200 active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-950 text-white flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="hidden lg:block text-left text-xs">
                      <div className="font-extrabold text-slate-900 dark:text-white leading-tight max-w-[95px] truncate">
                        {user?.name?.split(' ')[0]}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdown && (
                    <div 
                      className="absolute right-0 mt-3 w-64 rounded-3xl bg-white dark:bg-slate-900 shadow-uber dark:shadow-2xl border border-slate-100 dark:border-slate-800 py-2.5 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setUserDropdown(false)}
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 rounded-t-3xl -mt-2.5 mb-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Student Profile</p>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-950 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700">
                            {user?.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-2">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-950 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {user?.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user?.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-black text-slate-950 dark:text-white truncate">{user?.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          {user?.role === 'driver' && (
                            user.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Verified Driver
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                Pending Approval
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Edit Profile & Photo
                      </Link>

                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Compass className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </Link>

                      <Link
                        to="/my-requests"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        My Bookings
                      </Link>

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-uber-orange !text-xs !py-2 !px-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Join
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 py-4 space-y-2 animate-in fade-in slide-in-from-top-1">
            <Link
              to="/find-ride"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Search className="w-4 h-4 text-brand-blue" />
              Find a Ride
            </Link>

            {/* Theme Selector for Mobile */}
            <div className="pt-2 px-4 pb-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeSelector variant="segmented" />
            </div>

            {isAuthenticated ? (
              <>
                {(isDriver || isAdmin) && (
                  <Link
                    to="/offer-ride"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-brand-orange bg-orange-50/70 dark:bg-orange-950/40"
                  >
                    <PlusCircle className="w-4 h-4 text-brand-orange" />
                    Offer a Ride
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Compass className="w-4 h-4 text-slate-400" />
                  Dashboard
                </Link>

                <Link
                  to="/my-requests"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  My Requests
                </Link>

                {(isDriver || isAdmin) && (
                  <Link
                    to="/my-trips"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Calendar className="w-4 h-4 text-slate-400" />
                    My Published Trips
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Profile & Photo
                </Link>

                <Link
                  to="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  Notifications ({unreadCount})
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-black text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="btn-uber-orange !text-xs !py-2.5"
                >
                  Join Carpool
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
