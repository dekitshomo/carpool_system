import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { Sidebar } from '../components/Sidebar';
import { EmptyState } from '../components/EmptyState';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Car, 
  ShieldCheck, 
  Clock, 
  CheckCheck,
  Sparkles
} from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request_received':
        return <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-brand-orange dark:text-orange-400 flex items-center justify-center flex-shrink-0"><Car className="w-5 h-5" /></div>;
      case 'request_accepted':
        return <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>;
      case 'request_rejected':
      case 'trip_cancelled':
        return <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0"><XCircle className="w-5 h-5" /></div>;
      case 'driver_verified':
        return <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5" /></div>;
      default:
        return <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0"><Bell className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="flex gap-8">
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Alerts & Updates
              </div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">In-App Notifications</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Stay updated on your ride requests, confirmations, and campus trip announcements.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <CheckCheck className="w-4 h-4 text-brand-blue dark:text-blue-400" />
                Mark All as Read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No Notifications Yet"
              description="You're all caught up! When drivers respond to your requests or post new updates, you'll see them here."
              actionText="Browse Available Rides"
              actionLink="/find-ride"
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`p-5 flex items-start gap-4 transition cursor-pointer ${
                    n.is_read 
                      ? 'hover:bg-slate-50/60 dark:hover:bg-slate-800/50' 
                      : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {getNotificationIcon(n.type)}

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm ${n.is_read ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-black text-slate-950 dark:text-white flex items-center gap-2'}`}>
                        {n.title}
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>

                    {n.related_trip_id && (
                      <div className="pt-1">
                        <Link
                          to={`/trips/${n.related_trip_id}`}
                          className="inline-block text-xs font-bold text-brand-blue dark:text-blue-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Related Trip →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
