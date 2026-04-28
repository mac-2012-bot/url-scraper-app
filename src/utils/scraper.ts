import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapingResult } from '../types';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36'
];

export const scrapeUrl = async (url: string): Promise<ScrapingResult> => {
  try {
    // Validar URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const startTime = new Date();
    
    // Configuração mais robusta para evitar Network Errors
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      timeout: 15000, // Aumentado de 10s para 15s
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Aceita status 4xx também
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extrair título
    const title = $('title').text() || url;

    // Extrair conteúdo principal - tenta encontrar o conteúdo principal
    let content = '';
    
    // Tentar encontrar artigo/main
    const article = $('article').text() || $('main').text() || $('body').text();
    if (article && article.length > 50) {
      content = article;
    } else {
      // Fallback: extrair parágrafos
      $('p').each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 10) {
          content += text + '\n\n';
        }
      });
    }

    // Limpar conteúdo
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim();

    // Remover scripts e estilos
    $('script, style, noscript, iframe, img, svg').remove();

    // Contar palavras e caracteres
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = content.length;

    // endTime não usado, mas mantido para métricas futuras

    return {
      url,
      title,
      content,
      status: 'success',
      timestamp: startTime.toISOString(),
      wordCount,
      charCount,
    };
  } catch (error) {
    console.error('Scraping error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const statusText = error.response?.statusText || error.message;
      
      return {
        url,
        title: url,
        content: '',
        status: 'error',
        error: status === 403
          ? '🔒 Acesso negado (403 Forbidden) - Tenta outro site ou verifica se o site bloqueia scraping'
          : status === 404
            ? '📍 URL não encontrado (404 Not Found)'
            : status === 503
              ? '🚧 Servidor indisponível (503 Service Unavailable)'
              : `🌐 Erro de rede: ${statusText}`,
        timestamp: new Date().toISOString(),
        wordCount: 0,
        charCount: 0,
      };
    }

    return {
      url,
      title: url,
      content: '',
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer scraping',
      timestamp: new Date().toISOString(),
      wordCount: 0,
      charCount: 0,
    };
  }
};

export const extractMainContent = (html: string): string => {
  const $ = cheerio.load(html);
  
  // Tentar encontrar conteúdo principal
  const selectors = [
    'article',
    'main',
    '.article',
    '.content',
    '.main-content',
    'body'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.text().trim().length > 100) {
      return element.text();
    }
  }
  
  // Fallback: extrair todos os parágrafos
  let content = '';
  $('p').each((_, element) => {
    const text = $(element).text().trim();
    if (text && text.length > 10) {
      content += text + '\n\n';
    }
  });
  
  return content.trim();
};