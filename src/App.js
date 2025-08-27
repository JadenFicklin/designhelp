import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getBackgroundThemeStyles } from './utils/themeUtils';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeWrapper from './components/ThemeWrapper';
import Login from './components/Login';
import Library from './pages/Library';
import ItemDetail from './pages/ItemDetail';
import Flashcards from './pages/Flashcards';
import Shop from './pages/Shop';
import Collectibles from './pages/Collectibles';

const queryClient = new QueryClient();

const AppNavigation = () => {
  const { currentUser, logout, userCoins, userBackgroundTheme } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const themeStyles = getBackgroundThemeStyles(userBackgroundTheme);
  
  return (
    <nav className={`${themeStyles.navBg} shadow-sm border-b ${themeStyles.navBorder}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className={`text-xl font-bold ${themeStyles.navText}`}>Design Vault</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`${themeStyles.navText} ${themeStyles.navHover} px-3 py-2 rounded-md text-sm font-medium`}>
              Library
            </Link>
            <Link to="/flashcards" className={`${themeStyles.navText} ${themeStyles.navHover} px-3 py-2 rounded-md text-sm font-medium`}>
              Flashcards
            </Link>
            <Link to="/shop" className={`${themeStyles.navText} ${themeStyles.navHover} px-3 py-2 rounded-md text-sm font-medium`}>
              🛍️ Shop
            </Link>
            <Link to="/collectibles" className={`${themeStyles.navText} ${themeStyles.navHover} px-3 py-2 rounded-md text-sm font-medium`}>
              🏆 Collection
            </Link>
            <div className="flex items-center space-x-4">
              {/* Coin Counter */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                <div className="text-yellow-800 text-lg animate-bounce">💰</div>
                <div className="text-white font-bold text-lg">
                  {userCoins.toLocaleString()}
                </div>
                <div className="text-yellow-800 text-sm opacity-80">coins</div>
              </div>
              
              <span className={`text-sm ${themeStyles.textMuted}`}>
                {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className={`${themeStyles.navText} hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium`}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Coin Counter for Mobile */}
            <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 rounded-full shadow-lg">
              <div className="text-yellow-800 text-sm">💰</div>
              <div className="text-white font-bold text-xs">
                {userCoins.toLocaleString()}
              </div>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${themeStyles.navText} p-2 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`${themeStyles.navText} ${themeStyles.navHover} block px-3 py-2 rounded-md text-base font-medium`}
              >
                Library
              </Link>
              <Link
                to="/flashcards"
                onClick={() => setMobileMenuOpen(false)}
                className={`${themeStyles.navText} ${themeStyles.navHover} block px-3 py-2 rounded-md text-base font-medium`}
              >
                Flashcards
              </Link>
              <Link
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className={`${themeStyles.navText} ${themeStyles.navHover} block px-3 py-2 rounded-md text-base font-medium`}
              >
                🛍️ Shop
              </Link>
              <Link
                to="/collectibles"
                onClick={() => setMobileMenuOpen(false)}
                className={`${themeStyles.navText} ${themeStyles.navHover} block px-3 py-2 rounded-md text-base font-medium`}
              >
                🏆 Collection
              </Link>
              
              {/* Mobile User Info */}
              <div className="pt-4 pb-3 border-t border-gray-700">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {currentUser?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className={`text-base font-medium ${themeStyles.navText}`}>
                      {currentUser?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className={`${themeStyles.navText} hover:text-red-400 block w-full text-left px-3 py-2 rounded-md text-base font-medium`}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                <AppNavigation />
                <ThemeWrapper>
                  <Library />
                </ThemeWrapper>
              </ProtectedRoute>
            } />
            <Route path="/item/:id" element={
              <ProtectedRoute>
                <AppNavigation />
                <ThemeWrapper>
                  <ItemDetail />
                </ThemeWrapper>
              </ProtectedRoute>
            } />
            <Route path="/flashcards" element={
              <ProtectedRoute>
                <AppNavigation />
                <ThemeWrapper>
                  <Flashcards />
                </ThemeWrapper>
              </ProtectedRoute>
            } />
            <Route path="/shop" element={
              <ProtectedRoute>
                <AppNavigation />
                <ThemeWrapper>
                  <Shop />
                </ThemeWrapper>
              </ProtectedRoute>
            } />
            <Route path="/collectibles" element={
              <ProtectedRoute>
                <AppNavigation />
                <ThemeWrapper>
                  <Collectibles />
                </ThemeWrapper>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
