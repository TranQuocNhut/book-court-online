import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Lazy load các component pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Courts = lazy(() => import("./pages/Courts"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Reports = lazy(() => import("./pages/Reports"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Leagues = lazy(() => import("./pages/Leagues"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Services = lazy(() => import("./pages/Services"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-600">Đang tải...</p>
    </div>
  </div>
);

const OwnerRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courts" element={<Courts />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="leagues" element={<Leagues />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="services" element={<Services />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default OwnerRoutes;

