import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { NewQuotationPage } from './pages/NewQuotationPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Show, SignIn } from '@clerk/react';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  return (
    <>
      {currentRoute === 'dashboard' && <DashboardPage currentRoute={currentRoute} setRoute={setCurrentRoute} />}
      {currentRoute === 'new-quotation' && <NewQuotationPage currentRoute={currentRoute} setRoute={setCurrentRoute} />}
      {currentRoute === 'history' && <HistoryPage currentRoute={currentRoute} setRoute={setCurrentRoute} />}
      {currentRoute === 'settings' && <SettingsPage currentRoute={currentRoute} setRoute={setCurrentRoute} />}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <Show when="signed-in">
        <AppContent />
      </Show>
      <Show when="signed-out">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', flex: 1, background: 'var(--bg-secondary)' }}>
          <img src="/maji-logo-vert.png" alt="Maji" style={{ height: '48px', marginBottom: '32px' }} />
          <SignIn routing="virtual" />
        </div>
      </Show>
    </AppProvider>
  );
}

export default App;
