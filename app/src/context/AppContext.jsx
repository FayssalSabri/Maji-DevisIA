import React, { createContext, useReducer, useContext } from 'react';
import { defaultCostParameters } from '../data/costParameters';

const AppContext = createContext();

const initialState = {
  quotations: [],
  parameters: defaultCostParameters,
  currentWizard: {
    step: 1, // 1: Upload, 2: Extract, 3: Review, 4: Cost, 5: Validate, 6: Preview
    file: null,
    specs: null, 
    costs: null,
    validation: null,
    isProcessing: false,
    error: null
  }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_HISTORY':
      return { ...state, quotations: action.payload };
    case 'SET_STEP':
      return { ...state, currentWizard: { ...state.currentWizard, step: action.payload } };
    case 'UPLOAD_FILE':
      return { ...state, currentWizard: { ...state.currentWizard, file: action.payload, step: 2 } };
    case 'SET_PROCESSING':
      return { ...state, currentWizard: { ...state.currentWizard, isProcessing: action.payload } };
    case 'SET_ERROR':
      return { ...state, currentWizard: { ...state.currentWizard, error: action.payload, isProcessing: false } };
    case 'SET_SPECS':
      return { ...state, currentWizard: { ...state.currentWizard, specs: action.payload, isProcessing: false, step: 3 } };
    case 'UPDATE_SPEC':
      return { 
        ...state, 
        currentWizard: { 
          ...state.currentWizard, 
          specs: { 
            ...state.currentWizard.specs, 
            [action.payload.category]: {
              ...state.currentWizard.specs[action.payload.category],
              [action.payload.field]: action.payload.value
            }
          } 
        } 
      };
    case 'SET_COSTS':
      return { ...state, currentWizard: { ...state.currentWizard, costs: action.payload } };
    case 'SET_VALIDATION':
      return { ...state, currentWizard: { ...state.currentWizard, validation: action.payload, isProcessing: false } };
    case 'RESET_WIZARD':
      return { ...state, currentWizard: initialState.currentWizard };
    case 'LOAD_QUOTATION':
      return { 
        ...state, 
        currentWizard: { 
          ...state.currentWizard, 
          step: 6, 
          specs: action.payload.specs, 
          costs: action.payload.costs,
          file: { url: '/piece_003.pdf', name: 'piece_003.pdf' } 
        } 
      };
    case 'UPDATE_PARAMETER':
      return {
        ...state,
        parameters: {
          ...state.parameters,
          [action.payload.category]: {
            ...state.parameters[action.payload.category],
            [action.payload.field]: action.payload.value
          }
        }
      };
    case 'UPDATE_ROOT_PARAMETER':
        return {
          ...state,
          parameters: {
            ...state.parameters,
            [action.payload.field]: action.payload.value
          }
        };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Using relative path so Nginx (Prod) or Vite Proxy (Dev) routes it correctly
  const API_BASE = '/api';

  // 1. Extraction (FastAPI + Gemini)
  const simulateExtraction = async (fileObj) => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    
    try {
      let formData = new FormData();
      
      // If we are passing the mock file from public
      if (fileObj.url) {
        const response = await fetch(fileObj.url);
        const blob = await response.blob();
        formData.append('file', blob, fileObj.name);
      } else if (fileObj.nativeFile) {
        formData.append('file', fileObj.nativeFile);
      }

      const res = await fetch(`${API_BASE}/extract`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to extract data');
      const result = await res.json();
      
      // Simulate the 4 second visual processing UX before advancing
      setTimeout(() => {
        dispatch({ type: 'SET_SPECS', payload: result.data });
      }, 3000);

    } catch (err) {
      console.error(err);
      dispatch({ type: 'SET_ERROR', payload: "L'extraction a échoué. Backend injoignable." });
    }
  };

  // 2. Cost Calculation
  const calculateCosts = async (specs, parameters) => {
    try {
      const res = await fetch(`${API_BASE}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs, parameters })
      });
      if (res.ok) {
        const result = await res.json();
        dispatch({ type: 'SET_COSTS', payload: result.data });
        return result.data;
      }
    } catch (err) {
      console.error("Local fallback calculation due to API error", err);
    }
  };

  // 3. Validation
  const runValidation = async (specs, costs) => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    try {
      const res = await fetch(`${API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs, costs })
      });
      if (res.ok) {
        const result = await res.json();
        setTimeout(() => {
          dispatch({ type: 'SET_VALIDATION', payload: result.data });
        }, 1500); // 1.5s UX delay
      }
    } catch (err) {
      console.error("Validation failed", err);
      dispatch({ type: 'SET_ERROR', payload: "Validation API Error" });
    }
  };

  // 4. History API
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) {
        const result = await res.json();
        dispatch({ type: 'SET_HISTORY', payload: result.data });
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const saveQuotation = async (quotationData) => {
    try {
      await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData)
      });
      await fetchHistory(); // Refresh
    } catch (err) {
      console.error("Failed to save quotation", err);
    }
  };

  const updateQuotationStatus = async (quoteId, newStatus) => {
    try {
      await fetch(`${API_BASE}/history/${quoteId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchHistory(); // Refresh
    } catch (err) {
      console.error("Failed to update quotation status", err);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, simulateExtraction, calculateCosts, runValidation, fetchHistory, saveQuotation, updateQuotationStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
