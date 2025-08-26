import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  console.log('ProtectedRoute: currentUser:', currentUser ? currentUser.email : 'null');

  if (!currentUser) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return children;
};

export default ProtectedRoute;
