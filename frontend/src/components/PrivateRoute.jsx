import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  
  // Check if user is authenticated by looking for token in localStorage
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Basic validation - check if both token and user exist
    if (!token || !user) {
      return false;
    }
    
    try {
      // Additional validation - check if user data is valid JSON
      JSON.parse(user);
      return true;
    } catch (error) {
      // If user data is corrupted, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };

  // If not authenticated, redirect to login with the current location
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default PrivateRoute;