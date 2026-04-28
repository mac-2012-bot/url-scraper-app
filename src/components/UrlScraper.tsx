import { useState } from 'react';
import ScraperForm from './ScraperForm';
import ScrapingResult from './ScrapingResult';
import '../styles/UrlScraper.css';

const UrlScraper = () => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async (urlResult: any) => {
    setIsLoading(true);
    setResult(urlResult);
    setIsLoading(false);
  };

  const handleClear = () => {
    setResult(null);
  };

  return (
    <div className="scraper-app">
      <header className="scraper-header">
        <h1>🔍 URL Scraper</h1>
        <p>Extrai conteúdo de websites e converte para texto limpo</p>
      </header>

      <div className="scraper-content">
        {!result ? (
          <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
        ) : (
          <ScrapingResult result={result} onClear={handleClear} />
        )}
      </div>

      <footer className="scraper-footer">
        <p>✨ Ferramenta de scraping simples • Dados extraídos automaticamente</p>
        <p>💡 Dica: Tenta com wikipedia.org, publico.pt ou qualquer site público</p>
      </footer>
    </div>
  );
};

export default UrlScraper;