import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { defaultCostParameters } from '../data/costParameters';
import { calculateCosts as fallbackCalculateCosts } from '../utils/costCalculator';

const AppContext = createContext();

const loadInitialState = () => {
  const savedParams = localStorage.getItem('maji_parameters');
  const savedQuotations = localStorage.getItem('maji_quotations');
  return {
    quotations: savedQuotations ? JSON.parse(savedQuotations) : [],
    parameters: savedParams ? JSON.parse(savedParams) : defaultCostParameters,
    currentWizard: {
      step: 1,
      file: null,
      specs: null, 
      costs: null,
      validation: null,
      isProcessing: false,
      error: null
    }
  };
};

const initialState = loadInitialState();

function reducer(state, action) {
  let newState;
  switch (action.type) {
    case 'SET_HISTORY':
      newState = { ...state, quotations: action.payload };
      break;
    case 'SET_STEP':
      newState = { ...state, currentWizard: { ...state.currentWizard, step: action.payload } };
      break;
    case 'UPLOAD_FILE':
      newState = { ...state, currentWizard: { ...state.currentWizard, file: action.payload, step: 2, error: null } };
      break;
    case 'SET_PROCESSING':
      newState = { ...state, currentWizard: { ...state.currentWizard, isProcessing: action.payload } };
      break;
    case 'SET_ERROR':
      newState = { ...state, currentWizard: { ...state.currentWizard, error: action.payload, isProcessing: false } };
      break;
    case 'SET_SPECS':
      newState = { ...state, currentWizard: { ...state.currentWizard, specs: action.payload, isProcessing: false, step: 3, error: null } };
      break;
    case 'UPDATE_SPEC':
      newState = { 
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
      break;
    case 'SET_COSTS':
      newState = { ...state, currentWizard: { ...state.currentWizard, costs: action.payload } };
      break;
    case 'SET_VALIDATION':
      newState = { ...state, currentWizard: { ...state.currentWizard, validation: action.payload, isProcessing: false, error: null } };
      break;
    case 'RESET_WIZARD':
      newState = { ...state, currentWizard: initialState.currentWizard };
      break;
    case 'LOAD_QUOTATION':
      newState = { 
        ...state, 
        currentWizard: { 
          ...state.currentWizard, 
          step: 6, 
          specs: action.payload.specs, 
          costs: action.payload.costs,
          file: { url: '/piece_003.pdf', name: 'piece_003.pdf' } 
        } 
      };
      break;
    case 'UPDATE_PARAMETER':
      newState = {
        ...state,
        parameters: {
          ...state.parameters,
          [action.payload.category]: {
            ...state.parameters[action.payload.category],
            [action.payload.field]: action.payload.value
          }
        }
      };
      break;
    case 'UPDATE_ROOT_PARAMETER':
        newState = {
          ...state,
          parameters: {
            ...state.parameters,
            [action.payload.field]: action.payload.value
          }
        };
        break;
    default:
      return state;
  }
  
  if (action.type === 'SET_HISTORY') {
    localStorage.setItem('maji_quotations', JSON.stringify(newState.quotations));
  }
  
  return newState;
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Using relative path so Nginx (Prod) or Vite Proxy (Dev) routes it correctly
  const API_BASE = '/api';

  const saveParameters = () => {
    localStorage.setItem('maji_parameters', JSON.stringify(state.parameters));
  };

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

      if (fileObj.useMock) {
        formData.append('use_mock', 'true');
      }

      const res = await fetch(`${API_BASE}/extract`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to extract data');
      }
      const result = await res.json();
      
      // Add a realistic delay when using mock data to simulate AI processing time
      if (fileObj.useMock) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      dispatch({ type: 'SET_SPECS', payload: result.data });

    } catch (err) {
      console.error(err);
      dispatch({ type: 'SET_ERROR', payload: `L'extraction a échoué: ${err.message}` });
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
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      console.error("Local fallback calculation due to API error", err);
      // Fallback
      const fallbackCosts = fallbackCalculateCosts(specs, parameters);
      dispatch({ type: 'SET_COSTS', payload: fallbackCosts });
      return fallbackCosts;
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
        dispatch({ type: 'SET_VALIDATION', payload: result.data });
      } else {
        throw new Error('API Error');
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

  const deleteQuotation = async (quoteId) => {
    try {
      await fetch(`${API_BASE}/history/${quoteId}`, {
        method: 'DELETE'
      });
      await fetchHistory();
    } catch (err) {
      console.error("Failed to delete quotation", err);
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      simulateExtraction, 
      calculateCosts, 
      runValidation, 
      fetchHistory, 
      saveQuotation, 
      updateQuotationStatus,
      deleteQuotation,
      saveParameters
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
