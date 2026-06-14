import React from 'react';
import { Bell } from 'lucide-react';
import { UserButton } from '@clerk/react';

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
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: '32px',
                height: '32px'
              }
            }
          }}
        />
      </div>
    </header>
  );
};
