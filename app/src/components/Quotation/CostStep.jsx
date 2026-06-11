import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { ArrowRight, Settings, Package, Scissors, Activity, Users, Paintbrush, AlertTriangle, Sliders, TrendingUp } from 'lucide-react';

export const CostStep = () => {
  const { state, dispatch, calculateCosts } = useAppContext();
  const [costs, setLocalCosts] = useState(state.currentWizard.costs || null);

  useEffect(() => {
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

  const isLowThreshold = costs.subtotal < 5.00;

  return (
    <div className="fade-in split-layout-cost">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px' }}>Détail du Chiffrage</h2>
          <button className="btn btn-primary" onClick={handleNext}>
            Contrôle IA <ArrowRight />
          </button>
        </div>

        {/* ── Anomaly Alert ── */}
        {isLowThreshold && (
          <div className="anomaly-alert fade-in" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={18} />
            <div>
              <strong>⚠️ Seuil industriel bas</strong>
              <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.85 }}>
                Le coût de production ({costs.subtotal.toFixed(2)} €) est inférieur au seuil minimum de 5,00 €. Vérifiez les quantités du lot ou les paramètres machine.
              </p>
            </div>
          </div>
        )}

        {/* ── Cost Breakdown ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="cost-line">
            <div className="cost-line-label"><Package size={16}/> Matière ({state.currentWizard.specs.material.type} — {costs.details?.calculatedMass?.toFixed(3) || 0} kg)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.material} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Scissors size={16}/> Découpe Laser ({costs.details?.totalCuttingLengthMm?.toFixed(0) || 0} mm)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.cutting} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Activity size={16}/> Pliage ({costs.details?.totalBends || 0} plis × 1,50 €)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.bending} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Paintbrush size={16}/> Traitement de Surface</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.surfaceTreatment} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label"><Users size={16}/> Main d'œuvre / Réglages ({costs.details?.totalMachineTimeMin?.toFixed(1)} min)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.labor} suffix=" €" /></div>
          </div>

          <div className="cost-line" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="cost-line-label">Sous-total (Prix de Revient)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.subtotal} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label">Marge Commerciale ({(state.parameters.defaultMargin * 100).toFixed(0)}%)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.margin} suffix=" €" /></div>
          </div>
          <div className="cost-line" style={{ background: 'var(--bg-tertiary)', fontWeight: 600 }}>
            <div className="cost-line-label">Total H.T.</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.total} suffix=" €" /></div>
          </div>
          <div className="cost-line">
            <div className="cost-line-label">TVA (20%)</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.vatAmount} suffix=" €" /></div>
          </div>
          <div className="cost-line cost-total">
            <div className="cost-line-label"><TrendingUp size={16}/> TOTAL TTC</div>
            <div className="cost-line-value"><AnimatedCounter value={costs.totalTTC} suffix=" €" /></div>
          </div>
        </div>
      </div>

      {/* ── What-If Analysis Panel ── */}
      <div style={{ paddingLeft: '32px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sliders size={16} /> Analyse "What-If"
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Ajustez les paramètres industriels et simulez l'impact en temps réel.
          </p>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Margin Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Marge Commerciale (%)</label>
              <input 
                type="number" 
                className="form-input form-input-mono" 
                style={{ width: '70px', padding: '4px 8px', height: 'auto', textAlign: 'right' }} 
                value={(state.parameters.defaultMargin * 100).toFixed(0)} 
                onChange={(e) => updateParam(null, 'defaultMargin', parseFloat(e.target.value) / 100)}
              />
            </div>
            <input
              type="range" style={{ width: '100%', accentColor: 'var(--accent)', height: '4px', cursor: 'pointer' }}
              min="5" max="50" step="1"
              value={state.parameters.defaultMargin * 100}
              onChange={(e) => updateParam(null, 'defaultMargin', parseFloat(e.target.value) / 100)}
            />
          </div>

          {/* Labor Rate Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Taux Horaire MO (€/h)</label>
              <input 
                type="number" 
                className="form-input form-input-mono" 
                style={{ width: '70px', padding: '4px 8px', height: 'auto', textAlign: 'right' }} 
                value={state.parameters.laborRate} 
                onChange={(e) => updateParam(null, 'laborRate', parseFloat(e.target.value))}
              />
            </div>
            <input
              type="range" style={{ width: '100%', accentColor: 'var(--accent)', height: '4px', cursor: 'pointer' }}
              min="20" max="80" step="5"
              value={state.parameters.laborRate}
              onChange={(e) => updateParam(null, 'laborRate', parseFloat(e.target.value))}
            />
          </div>

          {/* Machine Overhead Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Coeff. Machine</label>
              <input 
                type="number" 
                className="form-input form-input-mono" 
                style={{ width: '70px', padding: '4px 8px', height: 'auto', textAlign: 'right' }} 
                value={(state.parameters.machineOverhead || 1.0).toFixed(2)} 
                step="0.1"
                onChange={(e) => updateParam(null, 'machineOverhead', parseFloat(e.target.value))}
              />
            </div>
            <input
              type="range" style={{ width: '100%', accentColor: 'var(--accent)', height: '4px', cursor: 'pointer' }}
              min="0.5" max="2.0" step="0.1"
              value={state.parameters.machineOverhead || 1.0}
              onChange={(e) => updateParam(null, 'machineOverhead', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Impact Summary */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            Impact Financier Direct
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nouveau Prix H.T.</span>
            <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{costs.total.toFixed(2)} €</span>
          </div>
          <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Nouveau Prix TTC</span>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{costs.totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  );
};
