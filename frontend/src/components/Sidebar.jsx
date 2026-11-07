import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Search, 
  PlusCircle, 
  Clock, 
  Calendar, 
  User, 
  Bell, 
  ShieldCheck, 
  Car,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const Sidebar = () => {
  const { user, isDriver, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md shadow-blue-500/20 dark:from-blue-600 dark:to-indigo-500'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
    }`;

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-24 space-y-5">
        
        {/* User Card Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 flex items-center gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user?.name || 'User'} 
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-blue/30 dark:ring-blue-500/30 flex-shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs truncate">{user?.name}</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.department || user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {user?.role}
              </span>
              {user?.role === 'driver' && (
                user?.is_verified ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Pending
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Verification Alert Banner if unverified driver */}
        {isDriver && !user?.is_verified && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black">Verification Pending</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">Admin approval required before you can publish trips.</p>
            </div>
          </div>
        )}

        {/* Navigation Group */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-3 space-y-1 shadow-sm">
          <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Main Menu
          </p>

          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>

          <NavLink to="/find-ride" className={navLinkClass}>
            <Search className="w-4 h-4" />
            Find a Ride
          </NavLink>

          {(isDriver || isAdmin) && (
            <NavLink to="/offer-ride" className={navLinkClass}>
              <PlusCircle className="w-4 h-4 text-brand-orange" />
              Offer a Ride
            </NavLink>
          )}

          <NavLink to="/my-requests" className={navLinkClass}>
            <Clock className="w-4 h-4" />
            My Requests
          </NavLink>

          {(isDriver || isAdmin) && (
            <NavLink to="/my-trips" className={navLinkClass}>
              <Calendar className="w-4 h-4" />
              My Published Trips
            </NavLink>
          )}

          <NavLink to="/notifications" className={navLinkClass}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                Notifications
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
          </NavLink>

          <NavLink to="/profile" className={navLinkClass}>
            <User className="w-4 h-4" />
            Profile & Vehicle
          </NavLink>

          {isAdmin && (
            <>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 my-1"></div>
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                Administration
              </p>
              <NavLink 
                to="/admin" 
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Dashboard
              </NavLink>
            </>
          )}
        </div>

        {/* Safety Badge Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-800 dark:to-slate-900 p-4 rounded-3xl text-white space-y-1.5 shadow-md border border-slate-800/60">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
            <Car className="w-4 h-4 text-emerald-400" /> Campus Safety Tip
          </div>
          <p className="text-[11px] text-slate-300 dark:text-slate-400 leading-relaxed">
            Always confirm the vehicle registration plate and driver student ID before boarding.
          </p>
        </div>

      </div>
    </aside>
  );
};
