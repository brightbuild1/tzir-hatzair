import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './index.css';
import { useAuth } from './hooks/useAuth';
import ScholarshipsManager from './screens/ScholarshipsManager';
import ScholarshipDetails from './screens/ScholarshipDetails';
import SoldiersManager from './screens/SoldiersManager';
import Layout from './components/Layout';
import NotFound from './screens/NotFound';
import LoginScreen from './screens/LoginScreen';

// ── Guards ────────────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login. Shows a spinner while auth loads. */
function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Redirects already-authenticated users away from /login to the dashboard. */
function RedirectIfAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  return user ? <Navigate to="/scholarship-list" replace /> : <LoginScreen />;
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<RedirectIfAuth />} />

        {/* Protected — require login */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/scholarship-list" replace />} />
            <Route path="/scholarship-list" element={<ScholarshipsManager />} />
            <Route path="/scholarship-list/:id" element={<ScholarshipDetails />} />
            <Route path="/candidate-list" element={<SoldiersManager />} />
            <Route path="/soldiers" element={<SoldiersManager />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
