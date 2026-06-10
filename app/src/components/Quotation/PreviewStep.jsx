import React, { useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Download, Send } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export const PreviewStep = () => {
  const { state, dispatch } = useAppContext();
  const specs = state.currentWizard.specs;
  const costs = state.currentWizard.costs;
  const pdfRef = useRef(null);

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const refDevis = `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  const validUntilStr = validUntil.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleFinish = async () => {
    const quoteData = {
      id: refDevis,
      reference: specs.identification.reference,
      designation: specs.identification.designation,
      client: specs.identification.client,
      totalCost: costs.total,
      margin: state.parameters.defaultMargin * 100,
      status: 'Validé'
    };
    await state.saveQuotation?.(quoteData) || await dispatch({ type: 'RESET_WIZARD' });
    dispatch({ type: 'RESET_WIZARD' });
  };

  const handleExportPDF = () => {
    const element = pdfRef.current;
    const opt = {
      margin: 0,
      filename: `MAJI_${refDevis}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const fmt = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const subTotal = costs.total * (1 - state.parameters.defaultMargin);
  const marginAmount = costs.total * state.parameters.defaultMargin;

  const costLabels = {
    materialCost: 'Matière Première',
    cuttingCost: 'Découpe Laser / Plasma',
    bendingCost: 'Pliage',
    machiningCost: 'Usinage CNC',
    laborCost: 'Main d\'Œuvre',
    setupCost: 'Frais de Réglage'
  };

  const costDescriptions = {
    materialCost: `${specs.material.type} ${specs.material.nuance} — ép. ${specs.material.thickness} mm`,
    cuttingCost: `Longueur découpe: ${specs.dimensions.cuttingLength || '—'} mm`,
    bendingCost: `${specs.bends?.length || 0} pli(s)`,
    machiningCost: `Perçage, taraudage, ébavurage`,
    laborCost: `Taux: ${state.parameters.laborRate} €/h`,
    setupCost: 'Mise en place outillage'
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Action bar */}
      <div className="pd-action-bar">
        <button className="btn btn-secondary" onClick={handleExportPDF}>
          <Download size={16} /> Exporter PDF
        </button>
        <button className="btn btn-primary" onClick={handleFinish}>
          <Send size={16} /> Envoyer au Client
        </button>
      </div>

      {/* Paper container */}
      <div className="pd-paper-bg">
        <div className="pd-page" ref={pdfRef}>

          {/* ═══════════ HEADER ═══════════ */}
          <div className="pd-header">
            <div className="pd-header-left">
              <img src="/maji-logo-vert.png" alt="MAJI" className="pd-logo" />
              <div className="pd-company-details">
                <p>1835 Chemin des Saints-Pères</p>
                <p>13090 Aix-en-Provence, France</p>
                <p>SIRET 534 386 495 00046</p>
              </div>
            </div>
            <div className="pd-header-right">
              <div className="pd-doc-badge">DEVIS</div>
              <table className="pd-meta-table">
                <tbody>
                  <tr><td className="pd-meta-label">Numéro</td><td className="pd-meta-value">{refDevis}</td></tr>
                  <tr><td className="pd-meta-label">Date</td><td className="pd-meta-value">{today}</td></tr>
                  <tr><td className="pd-meta-label">Validité</td><td className="pd-meta-value">{validUntilStr}</td></tr>
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
              <div className="pd-card-title">{specs.identification.client || 'Client à définir'}</div>
              <div className="pd-card-sub">Adresse à compléter</div>
              <div className="pd-card-sub">Contact à compléter</div>
            </div>
            <div className="pd-card pd-card-cad">
              <div className="pd-card-label">Aperçu Pièce</div>
              <div className="pd-cad-img-wrap">
                <img
                  src={state.currentWizard.file?.name === 'piece_003.pdf' ? '/piece_003.png' : '/cad_part.png'}
                  alt="Plan technique"
                  className="pd-cad-img"
                />
              </div>
            </div>
          </div>

          {/* ═══════════ SPECS ═══════════ */}
          <div className="pd-section-header">Spécifications Techniques</div>
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
              <span className="pd-spec-value">{specs.material.type} {specs.material.nuance}</span>
            </div>
            <div className="pd-spec-item">
              <span className="pd-spec-label">Épaisseur</span>
              <span className="pd-spec-value">{specs.material.thickness} mm</span>
            </div>
            <div className="pd-spec-item">
              <span className="pd-spec-label">Dimensions</span>
              <span className="pd-spec-value">{specs.dimensions.length} × {specs.dimensions.width} × {specs.dimensions.height} mm</span>
            </div>
            <div className="pd-spec-item">
              <span className="pd-spec-label">Masse estimée</span>
              <span className="pd-spec-value">{(costs.details?.calculatedMass || 0).toFixed(2)} kg</span>
            </div>
            <div className="pd-spec-item">
              <span className="pd-spec-label">Tolérance</span>
              <span className="pd-spec-value">{specs.tolerances?.iso || 'ISO 2768-m'}</span>
            </div>
            <div className="pd-spec-item">
              <span className="pd-spec-label">Traitement</span>
              <span className="pd-spec-value">{specs.material.treatment || 'Non renseigné'}</span>
            </div>
          </div>

          {/* ═══════════ COST TABLE ═══════════ */}
          <div className="pd-section-header">Détail du Chiffrage</div>
          <table className="pd-cost-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Poste</th>
                <th style={{ width: '35%' }}>Description</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Montant H.T.</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(costs.details)
                .filter(([k]) => k !== 'calculatedMass')
                .map(([key, val]) => (
                  <tr key={key}>
                    <td className="pd-cost-name">{costLabels[key] || key}</td>
                    <td className="pd-cost-desc">{costDescriptions[key] || '—'}</td>
                    <td className="pd-cost-amount">{fmt(val)} €</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* ═══════════ TOTALS ═══════════ */}
          <div className="pd-totals-wrap">
            <div className="pd-totals-box">
              <div className="pd-total-line">
                <span>Sous-total production</span>
                <span>{fmt(subTotal)} €</span>
              </div>
              <div className="pd-total-line">
                <span>Marge commerciale ({state.parameters.defaultMargin * 100}%)</span>
                <span>{fmt(marginAmount)} €</span>
              </div>
              <div className="pd-total-line pd-total-grand">
                <span>Total H.T.</span>
                <span>{fmt(costs.total)} €</span>
              </div>
              <div className="pd-total-line pd-total-unit">
                <span>Prix unitaire H.T.</span>
                <span>{fmt(costs.total)} € / pce</span>
              </div>
            </div>
          </div>

          {/* ═══════════ CONDITIONS ═══════════ */}
          <div className="pd-conditions">
            <div className="pd-section-header">Conditions</div>
            <div className="pd-cond-grid">
              <div className="pd-cond-item">
                <div className="pd-cond-title">Délai</div>
                <div className="pd-cond-text">15 jours ouvrés après accord</div>
              </div>
              <div className="pd-cond-item">
                <div className="pd-cond-title">Paiement</div>
                <div className="pd-cond-text">30 jours fin de mois</div>
              </div>
              <div className="pd-cond-item">
                <div className="pd-cond-title">Validité</div>
                <div className="pd-cond-text">Jusqu'au {validUntilStr}</div>
              </div>
            </div>
            <p className="pd-legal-text">
              Ce devis est généré par la plateforme MAJI AI. Son acceptation vaut accord sur nos Conditions Générales de Vente. TVA en vigueur appliquée à la facturation.
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
            <div className="pd-footer-right">
              Confidentiel
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
