import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user's actual role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'owner':
        return <Navigate to="/owner" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
}

// Specific role-based protected routes
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

export const OwnerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="owner">
    {children}
  </ProtectedRoute>
);

export const UserRoute = ({ children }) => (
  <ProtectedRoute requiredRole="user">
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
