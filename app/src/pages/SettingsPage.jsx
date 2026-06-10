import React from 'react';
import { Layout } from '../components/Layout/Layout';
import { useAppContext } from '../context/AppContext';
import { Save } from 'lucide-react';

export const SettingsPage = ({ currentRoute, setRoute }) => {
  const { state, dispatch } = useAppContext();
  const params = state.parameters;

  const updateParam = (category, field, value) => {
    dispatch({ type: 'UPDATE_PARAMETER', payload: { category, field, value } });
  };

  return (
    <Layout 
      title="Paramètres Métier" 
      subtitle="Configuration des coûts et hypothèses de chiffrage"
      currentRoute={currentRoute}
      setRoute={setRoute}
    >
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary"><Save size={16} /> Enregistrer les paramètres</button>
      </div>

      <div className="settings-grid">
        
        {/* Machine Rates */}
        <div className="settings-section">
          <div className="settings-section-title">Taux Horaires Machines (€/h)</div>
          <div className="form-group">
            <label className="form-label">Découpe Laser</label>
            <input 
              type="number" className="form-input" 
              value={params.machineRates.laser}
              onChange={e => updateParam('machineRates', 'laser', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pliage / Presse</label>
            <input 
              type="number" className="form-input" 
              value={params.machineRates.bending}
              onChange={e => updateParam('machineRates', 'bending', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Poinçonnage</label>
            <input 
              type="number" className="form-input" 
              value={params.machineRates.punching}
              onChange={e => updateParam('machineRates', 'punching', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Material Prices */}
        <div className="settings-section">
          <div className="settings-section-title">Prix Matières Premières (€/kg)</div>
          {Object.entries(params.materialRates).map(([mat, price]) => (
            <div className="form-group" key={mat}>
              <label className="form-label">{mat}</label>
              <input 
                type="number" step="0.1" className="form-input" 
                value={price}
                onChange={e => updateParam('materialRates', mat, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>

        {/* Times & Labor */}
        <div className="settings-section">
          <div className="settings-section-title">Temps Opératoires & M.O.</div>
          <div className="form-group">
            <label className="form-label">Taux Horaire Main d'Œuvre (€/h)</label>
            <input 
              type="number" className="form-input" 
              value={params.laborRate}
              onChange={e => dispatch({ type: 'UPDATE_ROOT_PARAMETER', payload: { field: 'laborRate', value: parseFloat(e.target.value) } })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Réglage Laser (min)</label>
              <input 
                type="number" className="form-input" 
                value={params.times.setupLaser}
                onChange={e => updateParam('times', 'setupLaser', parseFloat(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Réglage Pliage (min)</label>
              <input 
                type="number" className="form-input" 
                value={params.times.setupBending}
                onChange={e => updateParam('times', 'setupBending', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};
