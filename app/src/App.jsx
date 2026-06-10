import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { NewQuotationPage } from './pages/NewQuotationPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

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
      <AppContent />
    </AppProvider>
  );
}

export default App;
