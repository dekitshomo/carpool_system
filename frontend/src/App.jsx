import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { FindRidePage } from './pages/FindRidePage';
import { OfferRidePage } from './pages/OfferRidePage';
import { TripDetailsPage } from './pages/TripDetailsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  const { user, isAuthenticated, isEmailVerified } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      <Navbar />

      {/* Unverified Email Warning Notification Banner */}
      {isAuthenticated && !isEmailVerified && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 text-xs font-bold shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between w-full gap-2">
            <span className="flex items-center gap-2 truncate">
              <span>⚠️</span>
              <span>Please verify your college email (<strong>{user?.email}</strong>) to activate full rideshare privileges.</span>
            </span>
            <Link
              to={`/verify-email?email=${encodeURIComponent(user?.email || '')}`}
              className="px-3.5 py-1 bg-white text-orange-700 hover:bg-orange-50 rounded-full font-black text-[11px] shadow-sm flex-shrink-0 transition"
            >
              Verify Now →
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/find-ride" element={<FindRidePage />} />
          <Route path="/trips/:id" element={<TripDetailsPage />} />

          {/* Authenticated Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offer-ride"
            element={
              <ProtectedRoute>
                <OfferRidePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-trips"
            element={
              <ProtectedRoute>
                <MyTripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            CampusRide • Student Carpool System
          </p>
          <p className="text-slate-400 dark:text-slate-500">
            Collegiate ride-sharing platform connecting students travelling along the royal highways of Bhutan.
          </p>
        </div>
      </footer>
    </div>
  );
};
