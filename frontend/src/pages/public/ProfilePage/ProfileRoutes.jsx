import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Lazy load các component pages
const BookingsPage = lazy(() => import("./pages/Bookings"));
const FavoritesPage = lazy(() => import("./pages/Favorites"));
const MyTournamentsPage = lazy(() => import("./pages/MyTournaments"));
const SettingsPage = lazy(() => import("./pages/Settings"));

// Loading component
const PageLoader = () => (
  <>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6b7280' }}>Đang tải...</p>
      </div>
    </div>
  </>
);

const ProfileRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to="bookings" replace />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="tournaments" element={<MyTournamentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="bookings" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ProfileRoutes;

