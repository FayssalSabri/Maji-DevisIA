import React from 'react';
import { LayoutDashboard, FileText, Settings, History, Hexagon } from 'lucide-react';

export const Sidebar = ({ currentRoute, setRoute }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-quotation', label: 'Nouveau Devis', icon: FileText },
    { id: 'history', label: 'Historique', icon: History }
  ];

  const bottomItems = [{ id: 'settings', label: 'Paramètres', icon: Settings }];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ marginBottom: '16px' }}>
        <img
          src="/maji-logo-vert.png"
          alt="Maji"
          style={{ height: '28px', objectFit: 'contain' }}
        />
      </div>

      <div className="sidebar-section">Menu Principal</div>
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${currentRoute === item.id ? 'active' : ''}`}
          onClick={() => setRoute(item.id)}
        >
          <item.icon />
          {item.label}
        </button>
      ))}

      <div className="sidebar-spacer"></div>

      <div className="sidebar-section">Système</div>
      {bottomItems.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${currentRoute === item.id ? 'active' : ''}`}
          onClick={() => setRoute(item.id)}
        >
          <item.icon />
          {item.label}
        </button>
      ))}
    </aside>
  );
};
