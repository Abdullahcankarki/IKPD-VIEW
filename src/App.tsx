import React, { JSX, useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kalender from './pages/Kalender';
import KlientenPage from './pages/KlientenPage';
import TherapeutenPage from './pages/TherapeutenPage';
import AuftraggeberComponent from './pages/AuftraggeberPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import PraxisPage from './pages/PraxisPage';
import RechnungenPage from './pages/RechnungenPage';
import ProfilPage from './pages/ProfilPage';
import ErrorBoundary from './components/ErrorBoundary';
import logo from './logo-ikpd.png';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="ikpd-loading">
        <div className="spinner-border" role="status" />
        <div className="mt-3 text-muted">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ---- SVG Icons ---- */
const IconDashboard = () => (
  <svg className="ikpd-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconCalendar = () => (
  <svg className="ikpd-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconUsers = () => (
  <svg className="ikpd-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconBriefcase = () => (
  <svg className="ikpd-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
const IconReceipt = () => (
  <svg className="ikpd-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z" /><path d="M8 10h8" /><path d="M8 14h4" />
  </svg>
);
const IconStethoscope = () => (
  <svg className="ikpd-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.6A2 2 0 1 0 3 6.3V8a6 6 0 0 0 12 0V6.3a2 2 0 1 0-1.8-3.7" /><path d="M12 8a6 6 0 0 0 6 6v1a6 6 0 0 1-6 6H9" /><circle cx="18" cy="14" r="2" />
  </svg>
);
const IconBuilding = () => (
  <svg className="ikpd-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const navItems = [
  { path: '/', label: 'Dashboard', icon: IconDashboard, section: 'Übersicht' },
  { path: '/kalender', label: 'Kalender', icon: IconCalendar },
  { path: '/klienten', label: 'Klienten', icon: IconUsers, section: 'Verwaltung' },
  { path: '/auftraggeber', label: 'Auftraggeber', icon: IconBriefcase },
  { path: '/rechnungen', label: 'Rechnungen', icon: IconReceipt },
  { path: '/therapeuten', label: 'Therapeuten', icon: IconStethoscope, section: 'Praxis' },
  { path: '/praxis', label: 'Praxis', icon: IconBuilding },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (location.pathname === '/login') return null;

  const rolleLabel = user?.rolle === 'admin' ? 'Administrator' : 'Therapeut';
  const initials = user?.rolle === 'admin' ? 'AD' : 'TH';

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="ikpd-topbar">
        <Link to="/" className="ikpd-topbar-brand">
          <img src={logo} alt="IKPD" />
          <span>IKPD</span>
        </Link>
        <button className="ikpd-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menü">
          <IconMenu />
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`ikpd-sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <aside className={`ikpd-sidebar${mobileOpen ? ' open' : ''}`}>
        <Link to="/" className="ikpd-sidebar-brand" onClick={closeMobile}>
          <img src={logo} alt="IKPD Logo" />
          <div className="ikpd-sidebar-brand-text">
            IKPD
            <small>Praxisverwaltung</small>
          </div>
        </Link>

        <nav className="ikpd-sidebar-nav">
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.section && (
                <div className="ikpd-sidebar-section">{item.section}</div>
              )}
              <Link
                to={item.path}
                className={`ikpd-sidebar-link${location.pathname === item.path ? ' active' : ''}`}
                onClick={closeMobile}
              >
                <item.icon />
                {item.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        <div className="ikpd-sidebar-footer">
          <Link
            to="/profil"
            className="ikpd-sidebar-user"
            style={{ textDecoration: 'none' }}
            onClick={closeMobile}
          >
            <div className="ikpd-sidebar-avatar">{initials}</div>
            <div className="ikpd-sidebar-user-info">
              <div className="ikpd-sidebar-user-name">
                {rolleLabel}
              </div>
              <div className="ikpd-sidebar-user-role">
                {user?.rolle}
              </div>
            </div>
          </Link>
          <button
            className="ikpd-sidebar-logout"
            onClick={() => { logout(); navigate('/login'); closeMobile(); }}
          >
            <IconLogout />
            Abmelden
          </button>
        </div>
      </aside>
    </>
  );
};

function AppContent() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className={isLogin ? '' : 'ikpd-layout'}>
      <Sidebar />
      <main className={isLogin ? '' : 'ikpd-main'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/kalender" element={<RequireAuth><Kalender /></RequireAuth>} />
          <Route path="/therapeuten" element={<RequireAuth><TherapeutenPage /></RequireAuth>} />
          <Route path="/klienten" element={<RequireAuth><KlientenPage /></RequireAuth>} />
          <Route path="/auftraggeber" element={<RequireAuth><AuftraggeberComponent /></RequireAuth>} />
          <Route path="/praxis" element={<RequireAuth><PraxisPage /></RequireAuth>} />
          <Route path="/rechnungen" element={<RequireAuth><RechnungenPage /></RequireAuth>} />
          <Route path="/profil" element={<RequireAuth><ProfilPage /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
