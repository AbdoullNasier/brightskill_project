import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role to prevent infinite loops
        // or just to a generic unauthorized page. For now, redirect home.
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
