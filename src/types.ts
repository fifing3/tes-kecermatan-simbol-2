export type Mode = 'santai' | 'ujian';

export interface TestConfig {
  numSymbols: number;
  minMatch: number;
  numQuestions: number;
  mode: Mode;
  timeLimit: number;
}

export interface Question {
  reference: string[];
  rows: {
    id: string;
    symbols: string[];
    matches: number;
  }[];
  correctRowId: string;
}

export interface AnswerResult {
  questionIndex: number;
  selectedId: string | null;
  isCorrect: boolean;
}
