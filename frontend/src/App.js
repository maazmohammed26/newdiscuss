import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import LoadingScreen from '@/components/LoadingScreen';
import '@/App.css';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const FeedPage = lazy(() => import('@/pages/FeedPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  if (!user) {
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

function AuthStateWatcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const protectedPaths = ['/feed', '/profile'];
    if (!user && protectedPaths.includes(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [user, location.pathname, navigate]);
  
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
      <Suspense fallback={<LoadingScreen message="Loading..." />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
          <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
