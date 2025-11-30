

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container mt-5">
      <h1>Willkommen, {user?.rolle === 'admin' ? 'Admin' : 'Therapeut'}!</h1>
      <p>Du bist jetzt eingeloggt.</p>
      <button onClick={handleLogout} className="btn btn-danger mt-3">
        Logout
      </button>
    </div>
  );
};

export default Dashboard;