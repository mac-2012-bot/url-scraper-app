import type { ScrapingResult } from '../types';

/**
 * Scraping usando fetch nativo do browser
 * Esta abordagem usa a API Fetch do browser que contorna bloqueios de CORS
 * quando o site permite requests de terceiros
 */
export const browserScrapeUrl = async (url: string): Promise<ScrapingResult> => {
  try {
    // Validar URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const startTime = new Date();

    // Usar fetch nativo do browser com modo 'no-cors' para contornar CORS
    // Timeout de 30 segundos para sites mais lentos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors', // no-cors para contornar CORS de vez
      signal: controller.signal,
      credentials: 'omit',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // Verificar se a resposta é OK
    if (!response.ok) {
      return {
        url,
        title: url,
        content: '',
        status: 'error',
        error: `📡 Erro HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        wordCount: 0,
        charCount: 0,
      };
    }

    // Obter o HTML
    const html = await response.text();
    
    // Extrair título
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].substring(0, 200) : url;

    // Extrair conteúdo principal - estratégia robusta
    let content = html;
    
    // Remover elementos desnecessários
    const elementsToRemove = [
      'script', 'style', 'noscript', 'iframe', 'img', 'svg',
      'nav', 'footer', 'header', 'aside', 'button', 'form',
      'iframe', 'embed', 'object', 'link', 'meta'
    ];
    
    elementsToRemove.forEach(tag => {
      content = content.replace(new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis'), '');
    });

    // Remover atributos e tags vazias
    content = content
      .replace(/<[^>]*>/g, ' ') // Remove todas as tags HTML
      .replace(/\s+/g, ' ') // Remove múltiplos espaços
      .replace(/>\s+</g, '><') // Remove espaços entre tags
      .trim();

    // Extrair parágrafos se o conteúdo estiver muito limpo
    if (content.length < 100) {
      const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi);
      if (paragraphs) {
        content = paragraphs
          .map(p => p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
          .filter(p => p.length > 20)
          .join('\n\n');
      }
    }

    // Limitar conteúdo a 10.000 caracteres para evitar sobrecarga
    if (content.length > 10000) {
      content = content.substring(0, 10000) + '...';
    }

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
      source: 'browser-fetch',
    };
  } catch (error) {
    console.error('Browser fetch error:', error);
    let errorMessage = '🌐 Erro de rede desconhecido';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = '⏱️ Timeout - O site demorou mais de 30 segundos a responder';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = '🌐 Failed to fetch - Verifica a tua conexão à internet';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = '🌐 Network Error - Problema de rede. Verifica a internet ou tenta outro site.';
      } else {
        errorMessage = `🌐 Erro: ${error.message}`;
      }
    }
    
    return {
      url,
      title: url,
      content: '',
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString(),
      wordCount: 0,
      charCount: 0,
    };
  }
};

/**
 * Tenta scraping com fetch nativo do browser
 * Esta é a melhor alternativa para contornar CORS e Network Errors
 */
export const tryBrowserScrape = async (url: string): Promise<ScrapingResult> => {
  try {
    // Tenta primeiro com scraping normal
    const { scrapeUrl } = await import('./scraper');
    const result = await scrapeUrl(url);
    
    // Se deu Network Error, tenta a alternativa browser fetch
    if (result.status === 'error' && result.error?.includes('Network Error')) {
      console.log('Network Error detetado, tentando alternativa browser fetch...');
      const browserResult = await browserScrapeUrl(url);
      
      if (browserResult.status === 'success') {
        return {
          ...browserResult,
          error: undefined,
        };
      }
      
      return browserResult;
    }
    
    return result;
  } catch (error) {
    // Se tudo falhar, tenta diretamente com browser fetch
    try {
      console.log('Tentando diretamente com browser fetch...');
      return await browserScrapeUrl(url);
    } catch (directError) {
      return {
        url,
        title: url,
        content: '',
        status: 'error',
        error: '❌ Todos os métodos falharam: ' + (directError instanceof Error ? directError.message : 'Erro desconhecido'),
        timestamp: new Date().toISOString(),
        wordCount: 0,
        charCount: 0,
      };
    }
  }
};