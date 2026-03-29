import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import FeedPage from '@/pages/FeedPage';
import ProfilePage from '@/pages/ProfilePage';
import LoadingScreen from '@/components/LoadingScreen';
import '@/App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  if (!user) {
    // Redirect to login and replace history so back button won't return here
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }
  
  if (user) {
    return <Navigate to="/feed" replace />;
  }
  
  return children;
}

// Component to handle back button after logout
function AuthStateWatcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // If user is not logged in and tries to access protected routes via back button
    const protectedPaths = ['/feed', '/profile'];
    if (!user && protectedPaths.includes(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [user, location.pathname, navigate]);
  
  // Handle popstate (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const protectedPaths = ['/feed', '/profile'];
      if (!user && protectedPaths.includes(window.location.pathname)) {
        navigate('/login', { replace: true });
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, navigate]);
  
  return null;
}

function AppRoutes() {
  return (
    <>
      <AuthStateWatcher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
