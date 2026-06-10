import React, { useState } from 'react';
import { UploadCloud, FileType2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const UploadStep = () => {
  const { dispatch, simulateExtraction } = useAppContext();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile({ name: e.dataTransfer.files[0].name, nativeFile: e.dataTransfer.files[0] });
    }
  };

  const processFile = (fileObj) => {
    dispatch({ type: 'UPLOAD_FILE', payload: fileObj });
    simulateExtraction(fileObj);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Importer un plan technique</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px' }}>
        Déposez le PDF du plan client. L'IA va automatiquement extraire la cartouche, la matière et les dimensions.
      </p>

      <div 
        className={`upload-zone ${dragActive ? 'dragover' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
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
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>SUPPORT REAR BRAKE</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
