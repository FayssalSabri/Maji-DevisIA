import React from 'react';
import { Layout } from '../components/Layout/Layout';
import { KPICards } from '../components/Dashboard/KPICards';
import { RecentQuotations } from '../components/Dashboard/RecentQuotations';

export const DashboardPage = ({ currentRoute, setRoute }) => {
  return (
    <Layout 
      title="Vue d'ensemble" 
      subtitle="Performances et activité récente"
      currentRoute={currentRoute}
      setRoute={setRoute}
    >
      <KPICards />
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <RecentQuotations setRoute={setRoute} />
        
        <div className="card fade-in" style={{ animationDelay: '500ms' }}>
          <div className="card-header">
            <div className="card-title">Activité Récente</div>
          </div>
          <ul className="timeline">
            <li className="timeline-item">
              <div className="timeline-dot" style={{ color: 'var(--success)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <div className="timeline-text">Devis <strong>Q-2026-03-01</strong> validé par M. Martin</div>
                <div className="timeline-time">Il y a 10 minutes</div>
              </div>
            </li>
            <li className="timeline-item">
              <div className="timeline-dot" style={{ color: 'var(--accent)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div>
                <div className="timeline-text">Nouveau plan <strong>piece_003.pdf</strong> analysé</div>
                <div className="timeline-time">Il y a 2 heures</div>
              </div>
            </li>
            <li className="timeline-item">
              <div className="timeline-dot">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div>
                <div className="timeline-text">Connexion ERP synchronisée</div>
                <div className="timeline-time">Aujourd'hui à 08:00</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};
