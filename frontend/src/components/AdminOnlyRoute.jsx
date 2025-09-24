import React from 'react';
import { Navigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';

const AdminOnlyRoute = ({ children }) => {
  const currentUser = authUtils.getCurrentUser();
  
  // Check if user is authenticated and has admin role
  if (!authUtils.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default AdminOnlyRoute;