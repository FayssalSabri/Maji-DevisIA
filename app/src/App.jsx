import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { NewQuotationPage } from './pages/NewQuotationPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Show, SignIn } from '@clerk/react';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Map standard paths to 'currentRoute' strings expected by child components
  const path = location.pathname.replace('/', '');
  const currentRoute = path === '' ? 'dashboard' : path;

  const setRoute = (newRoute) => {
    navigate(`/${newRoute}`);
  };

  return (
    <Routes>
      <Route path="/" element={<DashboardPage currentRoute="dashboard" setRoute={setRoute} />} />
      <Route
        path="/dashboard"
        element={<DashboardPage currentRoute="dashboard" setRoute={setRoute} />}
      />
      <Route
        path="/new-quotation"
        element={<NewQuotationPage currentRoute="new-quotation" setRoute={setRoute} />}
      />
      <Route path="/history" element={<HistoryPage currentRoute="history" setRoute={setRoute} />} />
      <Route
        path="/settings"
        element={<SettingsPage currentRoute="settings" setRoute={setRoute} />}
      />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Show when="signed-in">
            <AppContent />
          </Show>
          <Show when="signed-out">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100%',
                flex: 1,
                background: 'var(--bg-secondary)'
              }}
            >
              <img
                src="/maji-logo-vert.png"
                alt="Maji"
                style={{ height: '48px', marginBottom: '32px' }}
              />
              <SignIn routing="virtual" />
            </div>
          </Show>
        </BrowserRouter>
      </ErrorBoundary>
    </AppProvider>
  );
}

export default App;
