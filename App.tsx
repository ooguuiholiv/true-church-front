
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import KidsCheckin from './pages/KidsCheckin';
import Events from './pages/Events';
import EventLanding from './pages/EventLanding';
import Ministries from './pages/Ministries';
import People from './pages/People';
import Secretary from './pages/Secretary';
import Login from './pages/Login';

import { NotificationContainer } from './components/Notification';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return null;

  return (
    <HashRouter>
      <NotificationContainer />
      <Routes>
        {/* Public Landing Page */}
        <Route path="/public/event/:id" element={<EventLanding />} />

        {/* Login Page */}
        <Route path="/login" element={
          !user ? <Login onLogin={setUser} /> : <Navigate to="/dashboard" replace />
        } />

        {/* Admin Dashboard / ERP Layout (Protected) */}
        <Route path="*" element={
          user ? (
            <div className="flex h-screen w-full overflow-hidden bg-surface-darker">
              <Sidebar onLogout={handleLogout} />
              <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background-dark">
                <Header user={user} onLogout={handleLogout} />
                <div className="flex-1 overflow-y-auto scroll-smooth">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/kids" element={<KidsCheckin />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/ministries" element={<Ministries />} />
                    <Route path="/people" element={<People />} />
                    <Route path="/secretary" element={<Secretary />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </main>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
