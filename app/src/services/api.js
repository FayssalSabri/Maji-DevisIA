const API_BASE = '/api';

export const getAuthHeaders = (token, additionalHeaders = {}) => {
  return {
    Authorization: `Bearer ${token}`,
    ...additionalHeaders
  };
};

export const extractData = async (token, fileObj) => {
  const formData = new FormData();

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
    headers: getAuthHeaders(token),
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to extract data');
  }
  return await res.json();
};

export const calculateCostsApi = async (token, specs, parameters) => {
  const res = await fetch(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ specs, parameters })
  });

  if (!res.ok) {
    throw new Error('API Error');
  }
  return await res.json();
};

export const runValidationApi = async (token, specs, costs) => {
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ specs, costs })
  });

  if (!res.ok) {
    throw new Error('API Error');
  }
  return await res.json();
};

export const fetchHistoryApi = async (token) => {
  const res = await fetch(`${API_BASE}/history`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to load history');
  return await res.json();
};

export const saveQuotationApi = async (token, quotationData) => {
  const res = await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(quotationData)
  });
  if (!res.ok) throw new Error('Failed to save quotation');
  return await res.json();
};

export const updateQuotationStatusApi = async (token, quoteId, newStatus) => {
  const res = await fetch(`${API_BASE}/history/${quoteId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status: newStatus })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return await res.json();
};

export const deleteQuotationApi = async (token, quoteId) => {
  const res = await fetch(`${API_BASE}/history/${quoteId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to delete');
  return await res.json();
};

export const getConfigApi = async (token) => {
  const res = await fetch(`${API_BASE}/config`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch config');
  return await res.json();
};

export const saveConfigApi = async (token, configData) => {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(configData)
  });
  if (!res.ok) throw new Error('Failed to save config');
  return await res.json();
};

export const syncERPApi = async (token, quoteData) => {
  const res = await fetch(`${API_BASE}/webhook/erp`, {
    method: 'POST',
    headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(quoteData)
  });
  if (!res.ok) throw new Error('Failed to sync ERP');
  return await res.json();
};
