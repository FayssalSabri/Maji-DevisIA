import React, { useState, useRef } from 'react';
import { UploadCloud, FileType2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const UploadStep = () => {
  const { dispatch, simulateExtraction } = useAppContext();
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Dev flag: set to true to bypass AI and use instant mock data
  const USE_MOCK = true;
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file) => {
    setErrorMsg('');

    // Validate type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
      setErrorMsg('Format non supporté. Veuillez utiliser un PDF, PNG, ou JPG.');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Fichier trop volumineux. La taille maximale est de 10MB.');
      return;
    }

    processFile({ name: file.name, nativeFile: file });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const processFile = (fileObj) => {
    dispatch({ type: 'UPLOAD_FILE', payload: fileObj });
    simulateExtraction({ ...fileObj, useMock: USE_MOCK });
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Importer un plan technique</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px' }}>
        Déposez le PDF du plan client. L'IA va automatiquement extraire la cartouche, la matière et
        les dimensions.
      </p>

      {errorMsg && (
        <div
          style={{
            padding: '12px',
            background: 'var(--error-bg, #fee2e2)',
            color: 'var(--error, #ef4444)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          {errorMsg}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={handleFileChange}
      />

      <div
        className={`upload-zone ${dragActive ? 'dragover' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        style={{ cursor: 'pointer' }}
      >
        <UploadCloud />
        <h3>Cliquez ou glissez un fichier ici</h3>
        <p>PDF, PNG, JPG (Max 10MB)</p>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Ou utiliser un exemple récent</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: '16px', justifyContent: 'flex-start' }}
            onClick={() => processFile({ name: 'piece_003.pdf', url: '/piece_003.pdf' })}
          >
            <FileType2 style={{ color: 'var(--error)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>piece_003.pdf</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                SUPPORT REAR BRAKE
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
