import React from 'react';
import { Bell, User } from 'lucide-react';

export const Header = ({ title, subtitle }) => {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="page-header-sub">{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ padding: '8px' }}>
          <Bell size={18} />
        </button>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
          <User size={16} color="var(--text-secondary)" />
        </div>
      </div>
    </header>
  );
};
