import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Check } from 'lucide-react';

export const StepIndicator = () => {
  const { state, dispatch } = useAppContext();
  const currentStep = state.currentWizard.step;

  const steps = [
    { id: 1, label: 'Import' },
    { id: 2, label: 'Extraction IA' },
    { id: 3, label: 'Validation Spécifications' },
    { id: 4, label: 'Calcul Coûts' },
    { id: 5, label: 'Contrôle IA' },
    { id: 6, label: 'Génération Devis' }
  ];

  const currentStepData = steps.find((s) => s.id === currentStep) || steps[0];
  const progressPercent = (currentStep / steps.length) * 100;

  const handleStepClick = (targetStep) => {
    const interactiveSteps = [1, 3, 5, 6];
    // Allow clicking backwards to interactive steps
    if (targetStep < currentStep && interactiveSteps.includes(targetStep)) {
      dispatch({ type: 'SET_STEP', payload: targetStep });
    }
  };

  const isClickable = (targetStep) => {
    const interactiveSteps = [1, 3, 5, 6];
    return targetStep < currentStep && interactiveSteps.includes(targetStep);
  };

  return (
    <div className="step-indicator-wrapper">
      {/* Desktop View */}
      <div className="step-indicator step-indicator-desktop">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              onClick={() => handleStepClick(step.id)}
              style={{
                cursor: isClickable(step.id) ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="step-num">
                {currentStep > step.id ? <Check size={12} strokeWidth={3} /> : step.id}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className="step-connector" />}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile View */}
      <div className="step-indicator-mobile">
        <div className="mobile-step-header">
          <span className="mobile-step-count">
            Étape {currentStep} sur {steps.length}
          </span>
          <span className="mobile-step-title">{currentStepData.label}</span>
        </div>
        <div className="mobile-step-progress-bg">
          <div className="mobile-step-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
};
