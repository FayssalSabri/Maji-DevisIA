import React from 'react';
import { Layout } from '../components/Layout/Layout';
import { StepIndicator } from '../components/Quotation/StepIndicator';
import { UploadStep } from '../components/Quotation/UploadStep';
import { ExtractionStep } from '../components/Quotation/ExtractionStep';
import { ReviewStep } from '../components/Quotation/ReviewStep';
import { CostStep } from '../components/Quotation/CostStep';
import { ValidationStep } from '../components/Quotation/ValidationStep';
import { PreviewStep } from '../components/Quotation/PreviewStep';
import { useAppContext } from '../context/AppContext';

export const NewQuotationPage = ({ currentRoute, setRoute }) => {
  const { state } = useAppContext();
  const step = state.currentWizard.step;

  return (
    <Layout 
      title="Nouveau Devis IA" 
      subtitle="Génération assistée à partir d'un plan"
      currentRoute={currentRoute}
      setRoute={setRoute}
    >
      <div style={{ marginBottom: '32px', margin: '-24px -32px 32px' }}>
        <StepIndicator />
      </div>

      <div style={{ height: 'calc(100% - 80px)' }}>
        {step === 1 && <UploadStep />}
        {step === 2 && <ExtractionStep />}
        {step === 3 && <ReviewStep />}
        {step === 4 && <CostStep />}
        {step === 5 && <ValidationStep />}
        {step === 6 && <PreviewStep setRoute={setRoute} />}
      </div>
    </Layout>
  );
};
