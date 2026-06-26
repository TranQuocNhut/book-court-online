import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Lazy load các component pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Facilities = lazy(() => import("./pages/Facilities"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Users = lazy(() => import("./pages/Users"));
const Payments = lazy(() => import("./pages/Payments"));
const Withdrawals = lazy(() => import("./pages/Withdrawals"));
const Categories = lazy(() => import("./pages/Categories"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Feedbacks = lazy(() => import("./pages/Feedbacks"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
      <p className="text-gray-600">Đang tải...</p>
    </div>
  </div>
);

const AdminRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="users" element={<Users />} />
        <Route path="payments" element={<Payments />} />
        <Route path="withdrawals" element={<Withdrawals />} />
        <Route path="categories" element={<Categories />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="feedbacks" element={<Feedbacks />} />
        <Route path="activity_log" element={<ActivityLog />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;

