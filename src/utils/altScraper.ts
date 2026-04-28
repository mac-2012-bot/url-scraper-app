// Import dinâmico para evitar erros se a ferramenta não existir
const web_fetch = (globalThis as any).web_fetch || null;
import type { ScrapingResult } from '../types';

/**
 * Alternativa de scraping usando a ferramenta nativa do OpenClaw
 * Esta abordagem contorna bloqueios de CORS e Network Errors
 */
export const altScrapeUrl = async (url: string): Promise<ScrapingResult> => {
  try {
    // Validar URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const startTime = new Date();

    // Se a ferramenta web_fetch existir, usa-a
    if (web_fetch) {
      const result = await web_fetch({
        url,
        extractMode: 'markdown',
        maxChars: 50000,
      });

      const html = result.content;
      
      // Extrair título da resposta
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : url;

      // Extrair conteúdo principal - tenta encontrar o conteúdo principal
      let content = html;
      
      // Remover scripts e estilos
      content = content
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<noscript[^>]*>.*?<\/noscript>/gis, '')
        .replace(/<nav[^>]*>.*?<\/nav>/gis, '')
        .replace(/<footer[^>]*>.*?<\/footer>/gis, '')
        .replace(/<header[^>]*>.*?<\/header>/gis, '')
        .replace(/<aside[^>]*>.*?<\/aside>/gis, '')
        .replace(/<button[^>]*>.*?<\/button>/gis, '')
        .replace(/<form[^>]*>.*?<\/form>/gis, '')
        .replace(/<img[^>]*>/gis, '')
        .replace(/<svg[^>]*>.*?<\/svg>/gis, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '');

      // Limpar conteúdo
      content = content
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();

      // Contar palavras e caracteres
      const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
      const charCount = content.length;

      return {
        url,
        title,
        content,
        status: 'success',
        timestamp: startTime.toISOString(),
        wordCount,
        charCount,
        source: 'web_fetch',
      };
    }

    // Se web_fetch não existir, retorna erro
    return {
      url,
      title: url,
      content: '',
      status: 'error',
      error: '🔧 Alternativa de scraping não disponível - web_fetch não está carregada',
      timestamp: new Date().toISOString(),
      wordCount: 0,
      charCount: 0,
    };
  } catch (error) {
    console.error('Alt scraping error:', error);
    
    return {
      url,
      title: url,
      content: '',
      status: 'error',
      error: '🔄 Alternativa de scraping falhou: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
      timestamp: new Date().toISOString(),
      wordCount: 0,
      charCount: 0,
      source: 'web_fetch',
    };
  }
};

/**
 * Tenta primeiro com scraping normal, se falhar usa a alternativa
 */
export const tryScrape = async (url: string): Promise<ScrapingResult> => {
  try {
    // Primeiro tenta o scraping normal
    const { scrapeUrl } = await import('./scraper');
    const result = await scrapeUrl(url);
    
    // Se deu Network Error, tenta a alternativa
    if (result.status === 'error' && result.error?.includes('Network Error')) {
      console.log('Network Error detetado, tentando alternativa web_fetch...');
      const altResult = await altScrapeUrl(url);
      
      if (altResult.status === 'success') {
        return altResult;
      }
      
      return altResult;
    }
    
    return result;
  } catch (error) {
    // Se tudo falhar, retorna erro
    return {
      url,
      title: url,
      content: '',
      status: 'error',
      error: '❌ Ambos os métodos de scraping falharam: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
      timestamp: new Date().toISOString(),
      wordCount: 0,
      charCount: 0,
    };
  }
};