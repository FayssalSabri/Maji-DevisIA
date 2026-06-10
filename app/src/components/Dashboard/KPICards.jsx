import React from 'react';
import { FileText, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export const KPICards = () => {
  return (
    <div className="kpi-grid">
      <div className="kpi-card fade-in" style={{ animationDelay: '0ms' }}>
        <div className="kpi-label"><FileText /> Devis Générés (Mois)</div>
        <div className="kpi-value"><AnimatedCounter value={142} /></div>
        <div className="kpi-change positive">+12% vs mois dernier</div>
      </div>
      <div className="kpi-card fade-in" style={{ animationDelay: '100ms' }}>
        <div className="kpi-label"><Clock /> Temps Moyen / Devis</div>
        <div className="kpi-value"><AnimatedCounter value={2.4} suffix=" min" decimals={1} /></div>
        <div className="kpi-change positive">-85% vs Excel (15 min)</div>
      </div>
      <div className="kpi-card fade-in" style={{ animationDelay: '200ms' }}>
        <div className="kpi-label"><CheckCircle /> Précision IA</div>
        <div className="kpi-value"><AnimatedCounter value={98.2} suffix="%" decimals={1} /></div>
        <div className="kpi-change positive">Sur 1000+ extractions</div>
      </div>
      <div className="kpi-card fade-in" style={{ animationDelay: '300ms' }}>
        <div className="kpi-label"><TrendingUp /> Taux de Conversion</div>
        <div className="kpi-value"><AnimatedCounter value={42.5} suffix="%" decimals={1} /></div>
        <div className="kpi-change">Stable</div>
      </div>
    </div>
  );
};
