import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, Download, Trash2 } from 'lucide-react';

export const HistoryPage = ({ currentRoute, setRoute }) => {
  const { state, fetchHistory, dispatch, updateQuotationStatus, deleteQuotation, syncERP } =
    useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredQuotations = useMemo(() => {
    if (!searchTerm) return state.quotations;
    const lower = searchTerm.toLowerCase();
    return state.quotations.filter(
      (q) =>
        (q.reference && q.reference.toLowerCase().includes(lower)) ||
        (q.client && q.client.toLowerCase().includes(lower)) ||
        (q.designation && q.designation.toLowerCase().includes(lower)) ||
        (q.id && q.id.toLowerCase().includes(lower))
    );
  }, [state.quotations, searchTerm]);

  const exportCSV = () => {
    if (filteredQuotations.length === 0) return;

    const headers = [
      'ID Devis',
      'Client',
      'Reference',
      'Designation',
      'Date',
      'Statut',
      'Montant HT'
    ];
    const rows = filteredQuotations.map((q) => [
      q.id,
      `"${q.client || ''}"`,
      `"${q.reference || ''}"`,
      `"${q.designation || ''}"`,
      new Date(q.date).toLocaleDateString('fr-FR'),
      q.status,
      q.totalCost
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      headers.join(',') +
      '\n' +
      rows.map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'historique_devis_maji.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      deleteQuotation(id);
    }
  };

  const handleSyncERP = async () => {
    if (filteredQuotations.length === 0) return;
    try {
      // Sync the first or all? For simplicity, we sync the most recent valid quote or a specific one.
      // Actually let's add a button per quote, or a bulk action. Bulk action is easier here.
      await syncERP({ id: 'BULK_SYNC' });
      alert('✅ Synchronisation ERP déclenchée avec succès.');
    } catch (e) {
      alert('❌ Erreur lors de la synchronisation ERP.');
    }
  };

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
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '10px',
                  color: 'var(--text-tertiary)'
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Rechercher par référence, client..."
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary">
              <Filter size={16} /> Filtres
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleSyncERP}
              disabled={filteredQuotations.length === 0}
            >
              <Download size={16} /> Sync ERP
            </button>
            <button
              className="btn btn-secondary"
              onClick={exportCSV}
              disabled={filteredQuotations.length === 0}
            >
              <Download size={16} /> Exporter CSV
            </button>
          </div>
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
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}
                  >
                    Aucun devis trouvé.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {q.id}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{q.client}</td>
                    <td>{q.reference}</td>
                    <td>
                      <div>{q.designation}</div>
                      {q.observation && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}
                        >
                          <strong style={{ color: 'var(--text-secondary)' }}>Obs:</strong>{' '}
                          {q.observation}
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
                          background:
                            q.status === 'Validé'
                              ? 'var(--success-muted)'
                              : q.status === 'Envoyé'
                                ? 'var(--info-muted)'
                                : q.status === 'Refusé'
                                  ? 'var(--error-muted)'
                                  : 'var(--warning-muted)',
                          color:
                            q.status === 'Validé'
                              ? 'var(--success)'
                              : q.status === 'Envoyé'
                                ? 'var(--info)'
                                : q.status === 'Refusé'
                                  ? 'var(--error)'
                                  : 'var(--warning)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="Brouillon" style={{ color: 'var(--text-primary)' }}>
                          Brouillon
                        </option>
                        <option value="Validé" style={{ color: 'var(--text-primary)' }}>
                          Validé
                        </option>
                        <option value="Envoyé" style={{ color: 'var(--text-primary)' }}>
                          Envoyé
                        </option>
                        <option value="Refusé" style={{ color: 'var(--text-primary)' }}>
                          Refusé
                        </option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {q.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center'
                      }}
                    >
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
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(q.id)}
                        style={{ color: 'var(--error)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
