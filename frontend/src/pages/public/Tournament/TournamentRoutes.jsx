import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTournament } from "./TournamentContext";
import ProtectedManagementRoute from "./components/ProtectedManagementRoute";

// Lazy load các component tabs
const OverviewTab = lazy(() => import("./tabs/OverviewTab"));
const ScheduleTab = lazy(() => import("./tabs/ScheduleTab"));
const StandingsTab = lazy(() => import("./tabs/StandingsTab"));
const TeamsTab = lazy(() => import("./tabs/TeamsTab"));
const TeamInfoPage = lazy(() => import("./tabs/TeamInfoPage"));
const TeamMembersPage = lazy(() => import("./tabs/TeamMembersPage"));
const CustomTab = lazy(() => import("./tabs/CustomTab"));
const RegistrationTab = lazy(() => import("./tabs/RegistrationTab"));
const RegistrationListTab = lazy(() => import("./tabs/RegistrationListTab"));
const MatchResultsTab = lazy(() => import("./tabs/MatchResultsTab"));

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

const TournamentRoutes = () => {
  const { tournament } = useTournament()
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewTab tournament={tournament} />} />
        <Route path="register" element={<RegistrationTab tournament={tournament} />} />
        <Route path="registrations" element={<RegistrationListTab tournament={tournament} />} />
        <Route path="schedule" element={<ScheduleTab tournament={tournament} />} />
        <Route path="results" element={<MatchResultsTab tournament={tournament} />} />
        <Route path="standings" element={<StandingsTab tournament={tournament} />} />
        <Route path="teams/:teamId/info" element={
          <ProtectedManagementRoute>
            <TeamInfoPage />
          </ProtectedManagementRoute>
        } />
        <Route path="teams/:teamId/members" element={
          <ProtectedManagementRoute>
            <TeamMembersPage />
          </ProtectedManagementRoute>
        } />
        <Route path="teams/:teamId" element={<Navigate to="info" replace />} />
        <Route path="teams" element={
          <ProtectedManagementRoute>
            <TeamsTab tournament={tournament} />
          </ProtectedManagementRoute>
        } />
        <Route path="custom/*" element={
          <ProtectedManagementRoute>
            <CustomTab tournament={tournament} />
          </ProtectedManagementRoute>
        } />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </Suspense>
  );
};

export default TournamentRoutes;

