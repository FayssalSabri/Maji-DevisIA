import React, { useEffect, useState } from 'react';
import { FileSearch, ScanLine, Layers, BrainCircuit } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const ExtractionStep = () => {
  const { state } = useAppContext();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { icon: FileSearch, title: "Analyse OCR du document", desc: "Lecture de la cartouche et des annotations" },
    { icon: ScanLine, title: "Extraction dimensionnelle", desc: "Reconnaissance des cotes et du volume" },
    { icon: Layers, title: "Détection des opérations", desc: "Identification des trous et plis" },
    { icon: BrainCircuit, title: "Modélisation des coûts", desc: "Préparation des paramètres de chiffrage" }
  ];

  useEffect(() => {
    // Animate steps progressively (1s each, total 4s defined in context simulateExtraction)
    const interval = setInterval(() => {
      setActiveStep(prev => (prev < steps.length ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fade-in split-layout">
      
      {/* PDF Preview Sidebar */}
      <div className="mobile-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Fichier en cours d'analyse : {state.currentWizard.file?.name}</h3>
        <div className="pdf-viewer">
          {/* We use object to preview the PDF. It relies on the browser's PDF plugin */}
          <object data={state.currentWizard.file?.url || '/piece_003.pdf'} type="application/pdf">
            <p>Le navigateur ne supporte pas la prévisualisation PDF.</p>
          </object>
        </div>
      </div>

      {/* Animation Area */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="extraction-container">
          <h2 style={{ fontSize: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="spinner"></div>
            L'IA de Maji travaille...
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {steps.map((step, idx) => {
              const status = idx < activeStep ? 'done' : idx === activeStep ? 'active' : 'pending';
              return (
                <div key={idx} className={`extraction-step ${status}`}>
                  <div className="extraction-icon">
                    <step.icon size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="extraction-title">{step.title}</div>
                    <div className="extraction-desc">{step.desc}</div>
                    {status === 'active' && (
                      <div className="extraction-progress">
                        <div className="extraction-progress-bar" style={{ width: '60%', animation: 'pulse 1s infinite alternate' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
