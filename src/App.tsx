import { Routes, Route, useLocation } from 'react-router-dom';
import IconSprite from './components/IconSprite';
import Nav from './components/Nav';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import PublicPage from './pages/PublicPage';
import Login from './pages/Login';
import Portal from './pages/Portal';
import Admin from './pages/Admin';

function AppShell() {
  const { pathname } = useLocation();
  const showPublicNav = pathname === '/' || pathname === '/login';

  return (
    <>
      <IconSprite />
      {showPublicNav && <Nav />}
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/portal"
          element={
            <ProtectedRoute role="creator">
              <Portal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App
