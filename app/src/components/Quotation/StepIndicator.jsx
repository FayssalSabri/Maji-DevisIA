import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Check } from 'lucide-react';

export const StepIndicator = () => {
  const { state } = useAppContext();
  const currentStep = state.currentWizard.step;

  const steps = [
    { id: 1, label: 'Import' },
    { id: 2, label: 'Extraction IA' },
    { id: 3, label: 'Validation Spécifications' },
    { id: 4, label: 'Calcul Coûts' },
    { id: 5, label: 'Contrôle IA' },
    { id: 6, label: 'Génération Devis' },
  ];

  return (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div 
            className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
          >
            <div className="step-num">
              {currentStep > step.id ? <Check size={12} strokeWidth={3} /> : step.id}
            </div>
            {step.label}
          </div>
          {index < steps.length - 1 && <div className="step-connector" />}
        </React.Fragment>
      ))}
    </div>
  );
};
