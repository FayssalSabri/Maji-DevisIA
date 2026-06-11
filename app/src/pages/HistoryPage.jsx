import React, { useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, Download } from 'lucide-react';

export const HistoryPage = ({ currentRoute, setRoute }) => {
  const { state, fetchHistory, dispatch, updateQuotationStatus } = useAppContext();

  useEffect(() => {
    fetchHistory();
  }, []);
  return (
    <Layout 
      title="Historique des devis" 
      subtitle="Retrouvez et analysez vos chiffrages passés"
      currentRoute={currentRoute}
      setRoute={setRoute}
    >
      <div className="card">
        <div className="card-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', width: '60%' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-tertiary)' }} />
              <input type="text" className="form-input" placeholder="Rechercher par référence, client..." style={{ paddingLeft: '36px' }} />
            </div>
            <button className="btn btn-secondary"><Filter size={16} /> Filtres</button>
          </div>
          <button className="btn btn-secondary"><Download size={16} /> Exporter CSV</button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID Devis</th>
                <th>Client</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Date</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Montant HT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
            {state.quotations.map(q => (
              <tr key={q.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{q.id}</span></td>
                  <td style={{ fontWeight: 500 }}>{q.client}</td>
                  <td>{q.reference}</td>
                  <td>
                    <div>{q.designation}</div>
                    {q.observation && (
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Obs:</strong> {q.observation}
                      </div>
                    )}
                  </td>
                  <td>{new Date(q.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <select
                      value={q.status}
                      onChange={(e) => updateQuotationStatus(q.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: q.status === 'Validé' ? 'var(--success-muted)' : q.status === 'Envoyé' ? 'var(--info-muted)' : q.status === 'Refusé' ? 'var(--error-muted)' : 'var(--warning-muted)',
                        color: q.status === 'Validé' ? 'var(--success)' : q.status === 'Envoyé' ? 'var(--info)' : q.status === 'Refusé' ? 'var(--error)' : 'var(--warning)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="Brouillon" style={{ color: 'var(--text-primary)' }}>Brouillon</option>
                      <option value="Validé" style={{ color: 'var(--text-primary)' }}>Validé</option>
                      <option value="Envoyé" style={{ color: 'var(--text-primary)' }}>Envoyé</option>
                      <option value="Refusé" style={{ color: 'var(--text-primary)' }}>Refusé</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {q.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (q.specs && q.costs) {
                          dispatch({ type: 'LOAD_QUOTATION', payload: q });
                          setRoute('new-quotation');
                        } else {
                          alert('Ce devis ancien ne contient pas les données complètes.');
                        }
                      }}
                    >
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
