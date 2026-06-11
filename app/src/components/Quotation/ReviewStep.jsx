import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { ConfidenceBadge } from '../ui/ConfidenceBadge';
import { ArrowRight, Save, Edit3, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';

export const ReviewStep = () => {
  const { state, dispatch } = useAppContext();
  const specs = state.currentWizard.specs;
  const [showReasoning, setShowReasoning] = React.useState(false);

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const updateField = (category, field, value) => {
    dispatch({ type: 'UPDATE_SPEC', payload: { category, field, value } });
  };

  return (
    <div className="fade-in split-layout">
      
      {/* Left: Interactive Form */}
      <div style={{ overflowY: 'auto', paddingRight: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px' }}>Vérification des données</h2>
          <button className="btn btn-primary" onClick={handleNext}>
            Valider et Chiffrer <ArrowRight />
          </button>
        </div>

        <div className="review-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* AI Reasoning Panel */}
          <div className="review-section" style={{ border: '1px solid var(--accent)', background: 'rgba(13, 148, 136, 0.05)' }}>
            <div 
              className="review-section-header" 
              style={{ color: 'var(--accent)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: showReasoning ? '1px solid rgba(13, 148, 136, 0.2)' : 'none' }}
              onClick={() => setShowReasoning(!showReasoning)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainCircuit size={16} /> 
                Raisonnement de l'IA Estimateur
              </div>
              {showReasoning ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {showReasoning && (
              <div className="review-section-body" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>Analyse du plan PDF :</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                  <li>Extrait la référence <em>{specs.identification.reference}</em> et la désignation <em>{specs.identification.designation}</em> depuis le cartouche en bas à droite.</li>
                  <li>Matière <em>{specs.material.type} {specs.material.nuance}</em> détectée dans les notes générales.</li>
                  <li>Extrait {specs.holes.reduce((sum, h) => sum + h.quantity, 0)} perçages (trous de fixation) à partir des vues de projection.</li>
                  <li>Détecté {specs.bends.reduce((sum, b) => sum + b.quantity, 0)} zones de pliage selon les lignes de construction et annotations.</li>
                  <li>Volume et masse calculés analytiquement à partir des dimensions d'encombrement.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Identification */}
          <div className="review-section">
            <div className="review-section-header">Identification</div>
            <div className="review-section-body">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Référence <ConfidenceBadge level={specs.confidences.reference} />
                </label>
                <input 
                  type="text" className="form-input form-input-mono" 
                  value={specs.identification.reference}
                  onChange={(e) => updateField('identification', 'reference', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Désignation</label>
                <input 
                  type="text" className="form-input" 
                  value={specs.identification.designation}
                  onChange={(e) => updateField('identification', 'designation', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Matière */}
          <div className="review-section">
            <div className="review-section-header">Matière & Traitement</div>
            <div className="review-section-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Matière <ConfidenceBadge level={specs.confidences.material} />
                  </label>
                  <select 
                    className="form-input"
                    value={specs.material.type}
                    onChange={(e) => updateField('material', 'type', e.target.value)}
                  >
                    <option value="Non renseigné">Non renseigné</option>
                    <option value="Steel">Acier</option>
                    <option value="Aluminum">Aluminium</option>
                    <option value="Stainless Steel">Inox</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Épaisseur (mm)</label>
                  <input 
                    type="number" className="form-input form-input-mono" 
                    value={specs.material.thickness}
                    onChange={(e) => updateField('material', 'thickness', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nuance</label>
                  <input 
                    type="text" className="form-input" 
                    value={specs.material.nuance}
                    onChange={(e) => updateField('material', 'nuance', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Traitement</label>
                  <input 
                    type="text" className="form-input" 
                    value={specs.material.treatment}
                    onChange={(e) => updateField('material', 'treatment', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="review-section">
            <div className="review-section-header">Dimensions Brut (mm)</div>
            <div className="review-section-body">
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Longueur</label>
                  <input 
                    type="number" className="form-input form-input-mono" 
                    value={specs.dimensions.length}
                    onChange={(e) => updateField('dimensions', 'length', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Largeur</label>
                  <input 
                    type="number" className="form-input form-input-mono" 
                    value={specs.dimensions.width}
                    onChange={(e) => updateField('dimensions', 'width', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Masse (g)</label>
                  <input 
                    type="number" className="form-input form-input-mono" 
                    value={specs.dimensions.mass}
                    onChange={(e) => updateField('dimensions', 'mass', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operations */}
          <div className="review-section">
            <div className="review-section-header">Opérations Identifiées</div>
            <div className="review-section-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Détail</th>
                    <th>Qté</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.holes.map((h, i) => (
                    <tr key={`h-${i}`}>
                      <td>Découpe ({h.shape})</td>
                      <td className="form-input-mono">Ø {h.diameter} mm</td>
                      <td className="form-input-mono">{h.quantity}</td>
                    </tr>
                  ))}
                  {specs.bends.map((b, i) => (
                    <tr key={`b-${i}`}>
                      <td>Pliage</td>
                      <td className="form-input-mono">{b.angle}° (R={b.radius})</td>
                      <td className="form-input-mono">{b.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Right: PDF Context */}
      <div className="mobile-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px' }}>Document Source</h3>
          <span className="badge badge-success">Extraction Terminée</span>
        </div>
        <div className="pdf-viewer">
          <object data={state.currentWizard.file?.url || '/piece_003.pdf'} type="application/pdf">
            <p>Aperçu indisponible</p>
          </object>
        </div>
      </div>

    </div>
  );
};
