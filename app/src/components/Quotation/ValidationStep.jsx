import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Send, MessageSquare } from 'lucide-react';

export const ValidationStep = () => {
  const { state, dispatch, runValidation } = useAppContext();
  
  // Chat state
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', content: "Bonjour, je suis l'assistant MAJI AI. Avez-vous des questions sur ce chiffrage ou le contrôle de cohérence ?" }
  ]);
  const [messageInput, setMessageInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!state.currentWizard.validation && !state.currentWizard.isProcessing) {
      runValidation(state.currentWizard.specs, state.currentWizard.costs);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', payload: 6 });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    const userMsg = messageInput.trim();
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    
    setChatHistory(newHistory);
    setMessageInput("");
    setIsChatLoading(true);

    try {
      // Create a context object containing the current quotation data
      const context = {
        specs: state.currentWizard.specs,
        costs: state.currentWizard.costs,
        validation: state.currentWizard.validation
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: context,
          history: chatHistory.slice(1) // exclude the initial hardcoded greeting if you want, or send it
        })
      });

      if (res.ok) {
        const result = await res.json();
        setChatHistory([...newHistory, { role: 'model', content: result.data }]);
      }
    } catch (err) {
      setChatHistory([...newHistory, { role: 'model', content: "Désolé, je ne peux pas me connecter au serveur." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (state.currentWizard.isProcessing || !state.currentWizard.validation) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px', marginBottom: '24px' }}></div>
        <h3 style={{ fontSize: '16px' }}>L'IA vérifie la cohérence du devis...</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>Croisement via API FastAPI.</p>
      </div>
    );
  }

  const validationResult = state.currentWizard.validation;

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck color="var(--accent)" /> Bilan de Cohérence IA
        </h2>
        <button className="btn btn-primary" onClick={handleNext}>
          Valider & Générer le PDF <ArrowRight />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
        <div className="score-ring-container">
          <div style={{ 
            width: '120px', height: '120px', borderRadius: '50%', 
            border: `6px solid ${validationResult.status === 'pass' ? 'var(--success)' : validationResult.status === 'warn' ? 'var(--warning)' : 'var(--error)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)'
          }}>
            {validationResult.score}
          </div>
          <div className="score-ring-label">Score de Fiabilité</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
            {validationResult.status === 'pass' ? 'Devis Fiable' : validationResult.status === 'warn' ? 'Vérification Manuelle Conseillée' : 'Incohérence Majeure Détectée'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            {validationResult.status === 'pass' 
              ? "Aucune anomalie détectée par le backend FastAPI." 
              : `${validationResult.issues.length} point(s) d'attention ont été remontés.`}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        {validationResult.issues.map((issue, idx) => (
          <div key={idx} className={`validation-card ${issue.level} fade-in`} style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="validation-icon">
              {issue.level === 'pass' ? <CheckCircle2 size={18} /> : 
               issue.level === 'warn' ? <AlertTriangle size={18} /> : 
               <XCircle size={18} />}
            </div>
            <div>
              <div className="validation-title">{issue.title}</div>
              <div className="validation-desc">{issue.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT INTERFACE */}
      <div className="chat-container fade-in" style={{ animationDelay: '300ms' }}>
        <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <MessageSquare size={16} color="var(--accent)" /> Discuter avec l'IA
        </h3>
        
        <div className="chat-box">
          <div className="chat-messages">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="chat-message model" style={{ opacity: 0.7 }}>
                <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', display: 'inline-block' }}></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="chat-input-wrapper">
            <input 
              type="text" 
              placeholder="Posez une question sur ce devis..." 
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isChatLoading}
            />
            <button onClick={handleSendMessage} disabled={isChatLoading || !messageInput.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
