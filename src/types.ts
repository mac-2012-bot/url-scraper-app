export interface ScrapingResult {
  url: string;
  title: string;
  content: string;
  status: 'success' | 'error';
  error?: string;
  timestamp: string;
  wordCount: number;
  charCount: number;
  source?: string;
}

export interface ScrapingHistory {
  id: number;
  result: ScrapingResult;
  timestamp: string;
}