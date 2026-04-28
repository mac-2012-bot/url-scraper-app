import { useState } from 'react';
import * as Fi from 'react-icons/fi';
import { scrapeUrl } from '../utils/scraper';
import { altScrapeUrl } from '../utils/altScraper';
import type { ScrapingResult } from '../types';

const { FiSearch, FiAlertCircle } = Fi;

interface ScraperFormProps {
  onScrape: (result: ScrapingResult) => void;
  isLoading: boolean;
}

const ScraperForm: React.FC<ScraperFormProps> = ({ onScrape, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url.trim()) {
      setError('Por favor, insere um URL válido');
      return;
    }

    try {
      // Tenta primeiro com scraping normal
      const result = await scrapeUrl(url);
      
      // Se deu Network Error, tenta a alternativa
      if (result.status === 'error' && result.error?.includes('Network Error')) {
        setError('⚠️ Network Error - Tentando alternativa web_fetch...');
        const altResult = await altScrapeUrl(url);
        onScrape(altResult);
      } else {
        onScrape(result);
      }
    } catch (err) {
      setError('Erro ao fazer scraping do URL');
    }
  };

  return (
    <div className="scraper-form-container">
      <form onSubmit={handleSubmit} className="scraper-form">
        <div className="form-group">
          <div className="input-with-icon">
            <FiSearch className="input-icon" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com ou exemplo.com"
              className="scraper-input"
              disabled={isLoading}
            />
          </div>
          {error && <p className="error-message"><FiAlertCircle /> {error}</p>}
        </div>
        
        <button type="submit" className="scraper-button" disabled={isLoading || !url.trim()}>
          {isLoading ? 'A extrair...' : 'Extrair Conteúdo'}
        </button>
      </form>
      
      <div className="quick-actions">
        <button
          className="quick-action-button"
          onClick={() => setUrl('https://pt.wikipedia.org/wiki/Portugal')}
          disabled={isLoading}
        >
          🇵🇹 Wikipedia PT
        </button>
        <button
          className="quick-action-button"
          onClick={() => setUrl('https://www.publico.pt')}
          disabled={isLoading}
        >
          📰 Público
        </button>
        <button
          className="quick-action-button"
          onClick={() => setUrl('https://www.dn.pt')}
          disabled={isLoading}
        >
          📰 DN
        </button>
      </div>
    </div>
  );
};

export default ScraperForm;