import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowRight } from 'lucide-react';

export const RecentQuotations = ({ setRoute }) => {
  const { state, fetchHistory } = useAppContext();

  useEffect(() => {
    fetchHistory();
  }, []);
  return (
    <div className="card fade-in" style={{ animationDelay: '400ms' }}>
      <div className="card-header">
        <div className="card-title">Devis Récents</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setRoute('history')}>
          Voir tout <ArrowRight />
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID Devis</th>
              <th>Référence</th>
              <th>Client</th>
              <th>Date</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right' }}>Montant</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.quotations.slice(0, 5).map((q) => (
              <tr key={q.id}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{q.id}</span>
                </td>
                <td>{q.reference}</td>
                <td>{q.client}</td>
                <td>{new Date(q.date).toLocaleDateString('fr-FR')}</td>
                <td>
                  <span
                    className={`badge ${
                      q.status === 'Validé'
                        ? 'badge-success'
                        : q.status === 'Envoyé'
                          ? 'badge-info'
                          : 'badge-warning'
                    }`}
                  >
                    {q.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  {q.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      alert(`Ouverture du devis ${q.id} (Simulation PDF)`);
                      window.open('/piece_003.pdf', '_blank');
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
  );
};
