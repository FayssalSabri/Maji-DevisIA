import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = ({ children, title, subtitle, currentRoute, setRoute }) => {
  return (
    <div className="layout">
      <Sidebar currentRoute={currentRoute} setRoute={setRoute} />
      <main className="main-content">
        <Header title={title} subtitle={subtitle} />
        <div className="page-body">
          {children}
        </div>
      </main>
    </div>
  );
};
