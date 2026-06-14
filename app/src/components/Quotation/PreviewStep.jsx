import React, { useRef, useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Download, Send, FileText, Briefcase } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export const PreviewStep = ({ setRoute }) => {
  const { state, dispatch, saveQuotation } = useAppContext();
  const specs = state.currentWizard.specs;
  const costs = state.currentWizard.costs;
  const technicalPdfRef = useRef(null);
  const commercialPdfRef = useRef(null);

  const [activeTab, setActiveTab] = useState('commercial'); // 'technical' | 'commercial'
  const [status, setStatus] = useState(state.currentWizard.status || 'Brouillon');
  const [observation, setObservation] = useState(state.currentWizard.observation || '');

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Use existing ID if loading from history, otherwise generate new one
  const refDevis = useMemo(
    () =>
      state.currentWizard.id ||
      `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    [state.currentWizard.id]
  );
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  const validUntilStr = validUntil.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleFinish = async () => {
    const quoteData = {
      id: refDevis,
      reference: specs.identification.reference,
      designation: specs.identification.designation,
      client: specs.identification.client || 'Client Non Défini',
      totalCost: costs.totalTTC || costs.total, // Ensure TTC is saved
      margin: state.parameters.defaultMargin * 100,
      status: status,
      observation: observation,
      specs: specs,
      costs: costs
    };
    if (saveQuotation) {
      await saveQuotation(quoteData);
    }
    dispatch({ type: 'RESET_WIZARD' });
    if (setRoute) {
      setRoute('history');
    }
  };

  const handleExportPDF = () => {
    const element = activeTab === 'technical' ? technicalPdfRef.current : commercialPdfRef.current;
    if (!element) return;
    const prefix = activeTab === 'technical' ? 'FICHE_TECHNIQUE' : 'DEVIS';
    const opt = {
      margin: 0,
      filename: `MAJI_${prefix}_${refDevis}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1024 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const fmt = (v) =>
    (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bendingQty = costs.details?.totalBends || 0;
  const bendingUnit = bendingQty > 0 ? costs.bending / bendingQty : 0;

  return (
    <div
      className="fade-in"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
    >
      {/* ── DUAL-VIEW TABS ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <button
          className={`btn ${activeTab === 'technical' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('technical')}
          style={{ width: '250px', justifyContent: 'center' }}
        >
          <FileText size={16} /> Fiche Technique (Interne)
        </button>
        <button
          className={`btn ${activeTab === 'commercial' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('commercial')}
          style={{ width: '250px', justifyContent: 'center' }}
        >
          <Briefcase size={16} /> Devis Commercial (Client)
        </button>
      </div>

      {/* ── SAVE CONFIGURATION ── */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '210mm',
          marginBottom: '16px'
        }}
      >
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>
          Configuration de l'enregistrement
        </h3>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Statut du devis</label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Brouillon">Brouillon</option>
              <option value="Validé">Validé (Interne)</option>
              <option value="Envoyé">Envoyé au client</option>
              <option value="Refusé">Refusé</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Observation / Note interne (Optionnel)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: En attente de confirmation fournisseur pour le traitement..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div
        className="pd-action-bar"
        style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
      >
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => dispatch({ type: 'SET_STEP', payload: 5 })}
            title="Retour à la validation"
          >
            Retour
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              alert(
                '✅ Webhook déclenché avec succès !\n\nLe devis a été synchronisé avec Odoo / Salesforce (Simulation API MVP).'
              );
            }}
            title="Push to CRM/ERP"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Sync CRM
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <Download size={16} /> Exporter PDF
          </button>
          <button className="btn btn-primary" onClick={handleFinish}>
            <Send size={16} />{' '}
            {state.currentWizard.id ? 'Enregistrer les modifications' : 'Finaliser & Enregistrer'}
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT: TECHNICAL COSTING SHEET (Internal) ── */}
      {activeTab === 'technical' && (
        <div className="pd-paper-bg fade-in">
          <div className="pd-scale-wrapper">
            <div className="pd-page" ref={technicalPdfRef}>
              <div className="pd-tech-header">
                <div>
                  <h1
                    style={{
                      fontSize: '20px',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Fiche de Chiffrage Technique
                  </h1>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    Document Interne Usine — Généré par MAJI AI
                  </div>
                </div>
                <div className="pd-tech-header-right">
                  <img
                    src="/maji-logo-vert.png"
                    alt="MAJI"
                    style={{ height: '20px', marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Réf: {refDevis}</div>
                </div>
              </div>

              <div className="pd-tech-grid">
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#0d9488',
                      margin: '0 0 12px 0'
                    }}
                  >
                    Informations Pièce
                  </h3>
                  <table className="pd-tech-table">
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Référence</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {specs.identification.reference}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Client</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {specs.identification.client}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Désignation</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {specs.identification.designation}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Tolérance ISO</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {specs.tolerances?.iso || 'ISO 2768-m'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#0d9488',
                      margin: '0 0 12px 0'
                    }}
                  >
                    Matière & Dimensions
                  </h3>
                  <table className="pd-tech-table">
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Matière</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {specs.material.type} {specs.material.nuance}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Épaisseur</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {specs.material.thickness} mm
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Format Brut</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {specs.dimensions.length} × {specs.dimensions.width} mm
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Masse Calculée</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {(costs.details?.calculatedMass || 0).toFixed(4)} kg
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <h3
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: '#0d9488',
                  margin: '0 0 8px 0',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '4px'
                }}
              >
                Gamme Opératoire (Nomenclature)
              </h3>
              <table
                className="pd-tech-table"
                style={{ borderCollapse: 'collapse', marginBottom: '32px' }}
              >
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Opération</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Paramètres Extraits (IA)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Quantité / Unité</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>Découpe Laser</td>
                    <td style={{ padding: '12px 8px' }}>
                      Périmètre de coupe estimé:{' '}
                      {(costs.details?.totalCuttingLengthMm || 0).toFixed(0)} mm
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>1</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>Pliage</td>
                    <td style={{ padding: '12px 8px' }}>
                      Angles:{' '}
                      {specs.bends.map((b) => `${b.angle}°(R${b.radius})`).join(', ') || 'Aucun'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      {costs.details?.totalBends || 0} plis
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>Perçage / Taraudage</td>
                    <td style={{ padding: '12px 8px' }}>
                      Diamètres: {specs.holes.map((h) => `Ø${h.diameter}`).join(', ') || 'Aucun'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      {costs.details?.totalHoles || 0} trous
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>Traitement Surface</td>
                    <td style={{ padding: '12px 8px' }}>
                      {specs.material.treatment || 'Aucun traitement spécifié'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>1 lot</td>
                  </tr>
                </tbody>
              </table>

              <h3
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: '#0d9488',
                  margin: '0 0 8px 0',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '4px'
                }}
              >
                Synthèse des Coûts Industriels (PR)
              </h3>
              <div className="pd-tech-summary">
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Coût de Production Brut (PR) unitaire
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e' }}>
                    {fmt(costs.subtotal)} €
                  </div>
                </div>
                <div className="pd-tech-summary-right">
                  <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>
                    MAT: {fmt(costs.material)}€ | DEC: {fmt(costs.cutting)}€ | PLI:{' '}
                    {fmt(costs.bending)}€ | TRT: {fmt(costs.surfaceTreatment)}€ | MO:{' '}
                    {fmt(costs.labor)}€
                  </div>
                </div>
              </div>

              <div className="pd-tech-footer">
                <span>Validé par l'algorithme MAJI AI V2.1</span>
                <span>Date d'édition: {today}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: COMMERCIAL QUOTATION (Client) ── */}
      {activeTab === 'commercial' && (
        <div className="pd-paper-bg fade-in">
          <div className="pd-scale-wrapper">
            <div className="pd-page" ref={commercialPdfRef}>
              {/* ═══════════ HEADER ═══════════ */}
              <div className="pd-header">
                <div className="pd-header-left">
                  <img src="/maji-logo-vert.png" alt="MAJI" className="pd-logo" />
                  <div className="pd-company-details">
                    <p>
                      <strong>Maji Group</strong>
                    </p>
                    <p>1835 Chemin des Saints-Pères</p>
                    <p>13090 Aix-en-Provence, France</p>
                    <p>SIRET 534 386 495 00046</p>
                  </div>
                </div>
                <div className="pd-header-right">
                  <div className="pd-doc-badge">QUOTATION / DEVIS</div>
                  <table className="pd-meta-table">
                    <tbody>
                      <tr>
                        <td className="pd-meta-label">Numéro</td>
                        <td className="pd-meta-value">{refDevis}</td>
                      </tr>
                      <tr>
                        <td className="pd-meta-label">Date</td>
                        <td className="pd-meta-value">{today}</td>
                      </tr>
                      <tr>
                        <td className="pd-meta-label">Validité</td>
                        <td className="pd-meta-value">{validUntilStr}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ═══════════ DIVIDER ═══════════ */}
              <div className="pd-accent-line"></div>

              {/* ═══════════ CLIENT + PREVIEW ═══════════ */}
              <div className="pd-two-col">
                <div className="pd-card">
                  <div className="pd-card-label">Destinataire</div>
                  <div className="pd-card-title">
                    {specs.identification.client || 'Client à définir'}
                  </div>
                  <div className="pd-card-sub">Ref Client: {specs.identification.reference}</div>
                  <div className="pd-card-sub">Projet: {specs.identification.designation}</div>
                </div>
                <div className="pd-card pd-card-cad">
                  <div className="pd-card-label">Aperçu Pièce</div>
                  <div className="pd-cad-img-wrap">
                    <img
                      src={
                        state.currentWizard.file?.name === 'piece_003.pdf'
                          ? '/piece_003.png'
                          : '/cad_part.png'
                      }
                      alt="Plan technique"
                      className="pd-cad-img"
                    />
                  </div>
                </div>
              </div>

              {/* ═══════════ SPECS ═══════════ */}
              <div className="pd-section-header">Spécifications Techniques Validées</div>
              <div className="pd-specs-grid">
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Référence</span>
                  <span className="pd-spec-value">{specs.identification.reference}</span>
                </div>
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Désignation</span>
                  <span className="pd-spec-value">{specs.identification.designation}</span>
                </div>
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Matière</span>
                  <span className="pd-spec-value">
                    {specs.material.type} {specs.material.nuance}
                  </span>
                </div>
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Épaisseur</span>
                  <span className="pd-spec-value">{specs.material.thickness} mm</span>
                </div>
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Dimensions Brut</span>
                  <span className="pd-spec-value">
                    {specs.dimensions.length} × {specs.dimensions.width} mm
                  </span>
                </div>
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Masse Estimée</span>
                  <span className="pd-spec-value">
                    {(costs.details?.calculatedMass || 0).toFixed(3)} kg
                  </span>
                </div>
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Tolérance</span>
                  <span className="pd-spec-value">{specs.tolerances?.iso || 'ISO 2768-m'}</span>
                </div>
                <div className="pd-spec-item">
                  <span className="pd-spec-label">Opérations</span>
                  <span className="pd-spec-value">
                    {costs.details?.totalBends || 0} plis, {costs.details?.totalHoles || 0} trous
                  </span>
                </div>
              </div>

              {/* ═══════════ COST TABLE ═══════════ */}
              <div className="pd-section-header">Détail du Chiffrage Industriel (Pour 1 pièce)</div>
              <table className="pd-cost-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Description</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Qté</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Prix Unitaire</th>
                    <th style={{ width: '25%', textAlign: 'right' }}>Total H.T.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pd-cost-desc">
                      <strong>Matière Première</strong>
                      <br />
                      {specs.material.type} {specs.material.nuance} ép. {specs.material.thickness}mm
                    </td>
                    <td className="pd-cost-amount" style={{ textAlign: 'center' }}>
                      1 forfait
                    </td>
                    <td className="pd-cost-amount">{fmt(costs.material)} €</td>
                    <td className="pd-cost-amount">{fmt(costs.material)} €</td>
                  </tr>
                  <tr>
                    <td className="pd-cost-desc">
                      <strong>Découpe Laser</strong>
                      <br />
                      Long. de coupe {(costs.details?.totalCuttingLengthMm || 0).toFixed(0)} mm
                    </td>
                    <td className="pd-cost-amount" style={{ textAlign: 'center' }}>
                      1 forfait
                    </td>
                    <td className="pd-cost-amount">{fmt(costs.cutting)} €</td>
                    <td className="pd-cost-amount">{fmt(costs.cutting)} €</td>
                  </tr>
                  {costs.bending > 0 && (
                    <tr>
                      <td className="pd-cost-desc">
                        <strong>Pliage / Presse Plieuse</strong>
                      </td>
                      <td className="pd-cost-amount" style={{ textAlign: 'center' }}>
                        {bendingQty} plis
                      </td>
                      <td className="pd-cost-amount">{fmt(bendingUnit)} €</td>
                      <td className="pd-cost-amount">{fmt(costs.bending)} €</td>
                    </tr>
                  )}
                  {costs.surfaceTreatment > 0 && (
                    <tr>
                      <td className="pd-cost-desc">
                        <strong>Traitement de Surface</strong>
                        <br />
                        Forfait minimum / pièce
                      </td>
                      <td className="pd-cost-amount" style={{ textAlign: 'center' }}>
                        1 forfait
                      </td>
                      <td className="pd-cost-amount">{fmt(costs.surfaceTreatment)} €</td>
                      <td className="pd-cost-amount">{fmt(costs.surfaceTreatment)} €</td>
                    </tr>
                  )}
                  <tr>
                    <td className="pd-cost-desc">
                      <strong>Main d'Œuvre & Réglages</strong>
                      <br />
                      Mise en place et contrôle
                    </td>
                    <td className="pd-cost-amount" style={{ textAlign: 'center' }}>
                      {(costs.details?.totalMachineTimeMin || 0).toFixed(1)} min
                    </td>
                    <td className="pd-cost-amount">—</td>
                    <td className="pd-cost-amount">{fmt(costs.labor)} €</td>
                  </tr>
                </tbody>
              </table>

              {/* ═══════════ TOTALS ═══════════ */}
              <div className="pd-totals-wrap">
                <div className="pd-totals-box">
                  <div className="pd-total-line">
                    <span>Coût de production brut (PR)</span>
                    <span>{fmt(costs.subtotal)} €</span>
                  </div>
                  <div className="pd-total-line">
                    <span>
                      Marge industrielle ({(costs.details?.marginPercent || 25).toFixed(0)}%)
                    </span>
                    <span>{fmt(costs.margin)} €</span>
                  </div>
                  <div className="pd-total-line pd-total-grand" style={{ background: '#1a1a2e' }}>
                    <span>Total Industriel H.T.</span>
                    <span>{fmt(costs.total)} €</span>
                  </div>
                  <div className="pd-total-line">
                    <span>TVA ({(costs.details?.vatRate || 20).toFixed(0)}%)</span>
                    <span>{fmt(costs.vatAmount)} €</span>
                  </div>
                  <div
                    className="pd-total-line pd-total-grand"
                    style={{
                      borderTop: '2px dashed rgba(255,255,255,0.3)',
                      marginTop: '4px',
                      paddingTop: '8px'
                    }}
                  >
                    <span>Total Montant Dû (TTC)</span>
                    <span>{fmt(costs.totalTTC)} €</span>
                  </div>
                </div>
              </div>

              {/* ═══════════ CONDITIONS ═══════════ */}
              <div className="pd-conditions" style={{ marginTop: 'auto' }}>
                <div className="pd-section-header">Conditions Techniques & Commerciales</div>
                <div className="pd-cond-grid">
                  <div className="pd-cond-item">
                    <div className="pd-cond-title">Délai de fabrication</div>
                    <div className="pd-cond-text">15 jours ouvrés après réception de commande</div>
                  </div>
                  <div className="pd-cond-item">
                    <div className="pd-cond-title">Modalités de paiement</div>
                    <div className="pd-cond-text">30 jours fin de mois, par virement bancaire</div>
                  </div>
                  <div className="pd-cond-item">
                    <div className="pd-cond-title">Validité de l'offre</div>
                    <div className="pd-cond-text">Jusqu'au {validUntilStr}</div>
                  </div>
                </div>
                <p className="pd-legal-text">
                  <strong>Tolérances de fabrication :</strong> Sauf indication contraire sur le
                  plan, les tolérances générales de découpe et de pliage sont applicables selon la
                  norme ISO 2768-m. Rayon de pliage intérieur standard selon abaques outillage
                  (typiquement 2mm).
                  <br />
                  <br />
                  Ce devis a été généré via le système automatisé MAJI AI. Son acceptation vaut
                  accord sans réserve sur nos Conditions Générales de Vente Industrielles. La TVA en
                  vigueur (20%) est appliquée à la facturation finale en France.
                </p>
              </div>

              {/* ═══════════ FOOTER ═══════════ */}
              <div className="pd-footer">
                <div className="pd-footer-left">
                  <img src="/maji-logo-vert.png" alt="MAJI" className="pd-footer-logo-img" />
                </div>
                <div className="pd-footer-center">
                  MAJI SARL — RCS Aix-en-Provence B 534 386 495 — www.maji-invest.com
                </div>
                <div className="pd-footer-right">Confidentiel / Usage Interne Client</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
