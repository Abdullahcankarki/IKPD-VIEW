import React, { JSX } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kalender from './pages/Kalender';
import KlientenPage from './pages/KlientenPage';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import TherapeutenPage from './pages/TherapeutenPage';
import AuftraggeberComponent from './pages/AuftraggeberPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Cartzilla/assets/css/theme.min.css';
import PraxisPage from './pages/PraxisPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Authentifizierung wird geladen...</div>; // Optional: Spinner-Komponente einfügen
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          IKPD
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/kalender">Kalender</Nav.Link>
            <Nav.Link as={Link} to="/klienten">Klienten</Nav.Link>
            <Nav.Link as={Link} to="/auftraggeber">Auftraggeber</Nav.Link>
            <Nav.Link as={Link} to="/therapeuten">Therapeuten</Nav.Link>
            <Nav.Link as={Link} to="/praxis">Praxis</Nav.Link>
          </Nav>
          {user && (
            <Nav>
              <Nav.Link onClick={() => { logout(); navigate('/login'); }}>
                Logout
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavigationBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/kalender"
            element={
              <RequireAuth>
                <Kalender />
              </RequireAuth>
            }
          />
          <Route
            path="/therapeuten"
            element={
              <RequireAuth>
                <TherapeutenPage />
              </RequireAuth>
            }
          />
          <Route
            path="/klienten"
            element={
              <RequireAuth>
                <KlientenPage />
              </RequireAuth>
            }
          />
          <Route
            path="/auftraggeber"
            element={
              <RequireAuth>
                <AuftraggeberComponent />
              </RequireAuth>
            }
          />
          <Route
            path="/praxis"
            element={
              <RequireAuth>
                <PraxisPage />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
