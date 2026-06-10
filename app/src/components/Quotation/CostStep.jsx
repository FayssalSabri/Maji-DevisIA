import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { ArrowRight, Settings, Package, Scissors, Activity, Users } from 'lucide-react';

export const CostStep = () => {
  const { state, dispatch, calculateCosts } = useAppContext();
  const [costs, setLocalCosts] = useState(state.currentWizard.costs || null);

  useEffect(() => {
    // Trigger calculation API on mount and on param change
    const fetchCosts = async () => {
      const data = await calculateCosts(state.currentWizard.specs, state.parameters);
      if (data) setLocalCosts(data);
    };
    fetchCosts();
  }, [state.currentWizard.specs, state.parameters]);

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', payload: 5 });
  };

  const updateParam = (category, field, value) => {
    if (category) {
      dispatch({ type: 'UPDATE_PARAMETER', payload: { category, field, value } });
    } else {
      dispatch({ type: 'UPDATE_ROOT_PARAMETER', payload: { field, value } });
    }
  };

  if (!costs) return <div className="fade-in">Calcul en cours via le backend FastAPI...</div>;

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', height: '100%' }}>
      {/* Same UI as before, just using local costs state */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px' }}>Détail du Chiffrage</h2>
          <button className="btn btn-primary" onClick={handleNext}>
            Contrôle IA <ArrowRight />
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="cost-line">
            <div className="cost-line-label"><Package size={16}/> Matière ({state.currentWizard.specs.material.type})</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.material} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Scissors size={16}/> Découpe Laser</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.cutting} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Activity size={16}/> Pliage</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.bending} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Activity size={16}/> Frappe/Découpe Trous</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.holes} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Users size={16}/> Main d'œuvre / Réglages</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.labor} suffix=" €" /></div>
          </div>
          <div className="cost-line" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="cost-line-label">Sous-total (Prix de Revient)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.subtotal} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label">Marge ({state.parameters.defaultMargin * 100}%)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.margin} suffix=" €" /></div>
          </div>
          <div className="cost-line cost-total">
            <div className="cost-line-label">PRIX DE VENTE UNITAIRE</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.total} suffix=" €" /></div>
          </div>
        </div>

      </div>

      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={16} /> Paramètres (Temps réel)
        </h3>
        <div className="form-group">
          <label className="form-label">Taux Marge (%)</label>
          <input 
            type="number" className="form-input form-input-mono" 
            value={state.parameters.defaultMargin * 100}
            onChange={(e) => updateParam(null, 'defaultMargin', parseFloat(e.target.value) / 100 || 0)}
          />
        </div>
      </div>
    </div>
  );
};
