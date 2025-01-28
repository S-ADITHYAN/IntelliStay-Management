import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const isAdmin = localStorage.getItem('role') === 'admin';
    const isAuthenticated = localStorage.getItem('token');
    
    return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/signup" />;
};

export default AdminRoute; 