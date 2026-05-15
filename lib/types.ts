export interface DataRow {
  [key: string]: string | number | null;
}

export interface AnalysisResult {
  summary: string;
  statistics: {
    [key: string]: {
      mean?: number;
      median?: number;
      min?: number;
      max?: number;
      stdDev?: number;
    };
  };
  insights: string[];
  recommendedCharts: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DataContext {
  filename: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  data: DataRow[];
  analysis?: AnalysisResult;
}
