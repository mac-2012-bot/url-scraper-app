import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapingResult } from '../types';

// User-Agents mais modernos e realistas
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'
];

export const scrapeUrl = async (url: string): Promise<ScrapingResult> => {
  try {
    // Validar URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // User-Agent mais realista para evitar bloqueios
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const startTime = new Date();
    
    // Configuração otimizada para evitar Network Errors
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 20000, // 20 segundos para sites mais lentos
      maxRedirects: 5,
      maxContentLength: 10 * 1024 * 1024, // Limite de 10MB
      maxBodyLength: 10 * 1024 * 1024,
      validateStatus: (status) => status < 500, // Aceita 4xx também
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extrair título
    const title = $('title').text() || url;

    // Extrair conteúdo principal - estratégia mais robusta
    let content = '';
    
    // Tentar múltiplos seletores para encontrar conteúdo principal
    const contentSelectors = [
      'article',
      'main',
      '.mw-parser-output', // Wikipedia específica
      '.article',
      '.content',
      '.main-content',
      'body'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      const text = element.text().trim();
      if (text && text.length > 100) {
        content = text;
        break;
      }
    }
    
    // Fallback: extrair parágrafos se não encontrar conteúdo principal
    if (!content || content.length < 100) {
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

    // Remover elementos desnecessários
    $('script, style, noscript, iframe, img, svg, nav, footer, header, aside, button, form').remove();

    // Contar palavras e caracteres
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = content.length;

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
    console.error('Scraping error details:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const statusText = error.response?.statusText || error.message;
      
      let errorMessage = '';
      
      if (status === 403) {
        errorMessage = '🔒 Acesso bloqueado (403 Forbidden) - O site pode estar a bloquear requests automatizados. Tenta com outro site.';
      } else if (status === 404) {
        errorMessage = '📍 URL não encontrado (404 Not Found) - Verifica se o URL está correto.';
      } else if (status === 503) {
        errorMessage = '🚧 Servidor indisponível (503 Service Unavailable) - Tenta novamente mais tarde.';
      } else if (status === 429) {
        errorMessage = '⚠️ Muitas requests (429 Too Many Requests) - Espera alguns minutos e tenta novamente.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '⏱️ Timeout - O site demorou demasiado a responder (mais de 20 segundos).';
      } else {
        errorMessage = `🌐 Erro de rede: ${statusText} (Código: ${status})`;
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
  
  // Tentar encontrar conteúdo principal com múltiplos seletores
  const selectors = [
    'article',
    'main',
    '.mw-parser-output',
    '.article',
    '.content',
    '.main-content',
    'body'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    const text = element.text().trim();
    if (text && text.length > 100) {
      return text;
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