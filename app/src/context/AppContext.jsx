import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { defaultCostParameters } from '../data/costParameters';
import { calculateCosts as fallbackCalculateCosts } from '../utils/costCalculator';
import * as api from '../services/api';

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
      newState = {
        ...state,
        currentWizard: { ...state.currentWizard, file: action.payload, step: 2, error: null }
      };
      break;
    case 'SET_PROCESSING':
      newState = {
        ...state,
        currentWizard: { ...state.currentWizard, isProcessing: action.payload }
      };
      break;
    case 'SET_ERROR':
      newState = {
        ...state,
        currentWizard: { ...state.currentWizard, error: action.payload, isProcessing: false }
      };
      break;
    case 'SET_SPECS':
      newState = {
        ...state,
        currentWizard: {
          ...state.currentWizard,
          specs: action.payload,
          isProcessing: false,
          step: 3,
          error: null
        }
      };
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
      newState = {
        ...state,
        currentWizard: {
          ...state.currentWizard,
          validation: action.payload,
          isProcessing: false,
          error: null
        }
      };
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
          id: action.payload.id,
          status: action.payload.status,
          observation: action.payload.observation,
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
    case 'SET_PARAMETERS':
      newState = {
        ...state,
        parameters: action.payload
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
  const { getToken } = useAuth();

  const fetchConfig = async () => {
    try {
      const token = await getToken();
      const result = await api.getConfigApi(token);
      if (result.data && Object.keys(result.data).length > 0) {
        dispatch({ type: 'SET_PARAMETERS', payload: result.data });
      }
    } catch (err) {
      console.error('Failed to load global config', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveParameters = async () => {
    localStorage.setItem('maji_parameters', JSON.stringify(state.parameters));
    try {
      const token = await getToken();
      await api.saveConfigApi(token, state.parameters);
    } catch (err) {
      console.error('Failed to save config globally', err);
    }
  };

  const simulateExtraction = async (fileObj) => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    try {
      const token = await getToken();
      const result = await api.extractData(token, fileObj);
      if (fileObj.useMock) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      dispatch({ type: 'SET_SPECS', payload: result.data });
    } catch (err) {
      console.error(err);
      dispatch({ type: 'SET_ERROR', payload: `L'extraction a échoué: ${err.message}` });
    }
  };

  const calculateCosts = async (specs, parameters) => {
    try {
      const token = await getToken();
      const result = await api.calculateCostsApi(token, specs, parameters);
      dispatch({ type: 'SET_COSTS', payload: result.data });
      return result.data;
    } catch (err) {
      console.error('Local fallback calculation due to API error', err);
      const fallbackCosts = fallbackCalculateCosts(specs, parameters);
      dispatch({ type: 'SET_COSTS', payload: fallbackCosts });
      return fallbackCosts;
    }
  };

  const runValidation = async (specs, costs) => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    try {
      const token = await getToken();
      const result = await api.runValidationApi(token, specs, costs);
      dispatch({ type: 'SET_VALIDATION', payload: result.data });
    } catch (err) {
      console.error('Validation failed', err);
      dispatch({ type: 'SET_ERROR', payload: 'Validation API Error' });
    }
  };

  const fetchHistory = async () => {
    try {
      const token = await getToken();
      const result = await api.fetchHistoryApi(token);
      dispatch({ type: 'SET_HISTORY', payload: result.data });
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const saveQuotation = async (quotationData) => {
    try {
      const token = await getToken();
      await api.saveQuotationApi(token, quotationData);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to save quotation', err);
    }
  };

  const updateQuotationStatus = async (quoteId, newStatus) => {
    try {
      const token = await getToken();
      await api.updateQuotationStatusApi(token, quoteId, newStatus);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to update quotation status', err);
    }
  };

  const deleteQuotation = async (quoteId) => {
    try {
      const token = await getToken();
      await api.deleteQuotationApi(token, quoteId);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to delete quotation', err);
    }
  };

  const syncERP = async (quoteData) => {
    try {
      const token = await getToken();
      const result = await api.syncERPApi(token, quoteData);
      return result;
    } catch (err) {
      console.error('Failed to sync ERP', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        simulateExtraction,
        calculateCosts,
        runValidation,
        fetchHistory,
        saveQuotation,
        updateQuotationStatus,
        deleteQuotation,
        saveParameters,
        syncERP
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
