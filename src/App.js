import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Library from './pages/Library';
import ItemDetail from './pages/ItemDetail';
import Flashcards from './pages/Flashcards';

const queryClient = new QueryClient();

const AppNavigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Design Vault</h1>
          </div>
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Library
            </Link>
            <Link to="/flashcards" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Flashcards
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <AppNavigation />
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Library />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/item/:id" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <AppNavigation />
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <ItemDetail />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/flashcards" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <AppNavigation />
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Flashcards />
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
