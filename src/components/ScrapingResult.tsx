import * as React from 'react';
import * as Fi from 'react-icons/fi';

const { useState } = React;
const { FiExternalLink, FiAlertCircle, FiClock, FiFileText, FiHash, FiX } = Fi;

interface ScrapingResultProps {
  result: any;
  onClear: () => void;
}

const ScrapingResult: React.FC<ScrapingResultProps> = ({ result, onClear }) => {
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(result.content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleOpenUrl = () => {
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  if (result.status === 'error') {
    return (
      <div className="result-container error">
        <div className="result-header">
          <h3><FiAlertCircle /> Erro ao extrair conteúdo</h3>
          <button onClick={onClear} className="close-button"><FiX /></button>
        </div>
        <div className="error-details">
          <p><strong>URL:</strong> {result.url}</p>
          <p><strong>Erro:</strong> {result.error}</p>
          <p><strong>Data:</strong> {new Date(result.timestamp).toLocaleString('pt-PT')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="result-container success">
      <div className="result-header">
        <h3><FiFileText /> Resultado da Extração</h3>
        <button onClick={onClear} className="close-button"><FiX /></button>
      </div>

      <div className="result-meta">
        <div className="meta-item">
          <FiExternalLink /> <strong>URL:</strong> {result.url}
          <button onClick={handleOpenUrl} className="open-button">Abrir</button>
        </div>
        <div className="meta-item">
          <FiHash /> <strong>Título:</strong> {result.title}
        </div>
        <div className="meta-stats">
          <span><FiFileText /> {result.wordCount} palavras</span>
          <span><FiHash /> {result.charCount} caracteres</span>
          <span><FiClock /> {new Date(result.timestamp).toLocaleString('pt-PT')}</span>
        </div>
      </div>

      <div className="result-content">
        <div className="content-actions">
          <button onClick={handleCopyContent} className="copy-content-button">
            {copiedText ? 'Copiado!' : 'Copiar Conteúdo'}
          </button>
        </div>
        <div className="content-text">
          {result.content || 'Sem conteúdo extraível encontrado.'}
        </div>
      </div>
    </div>
  );
};

export default ScrapingResult;