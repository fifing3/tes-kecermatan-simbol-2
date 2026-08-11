import { Question } from './types';

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateSymbol(): string {
  let sym = '';
  for (let i = 0; i < 3; i++) {
    sym += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return sym;
}

export function generateQuestion(numSymbols: number, minMatch: number): Question {
  const reference = new Set<string>();
  
  while (reference.size < numSymbols) {
    reference.add(generateSymbol());
  }
  const refArray = Array.from(reference);

  const correctRowIndex = Math.floor(Math.random() * 5);
  const rowIds = ['A', 'B', 'C', 'D', 'E'];
  const rows = [];

  for (let i = 0; i < 5; i++) {
    const isCorrectRow = i === correctRowIndex;
    
    // For incorrect rows, ensure matches are strictly less than minMatch.
    const numMatches = isCorrectRow ? minMatch : Math.floor(Math.random() * minMatch);
    
    const shuffledRef = [...refArray].sort(() => Math.random() - 0.5);
    const selectedMatches = shuffledRef.slice(0, numMatches);

    const nonMatches = new Set<string>();
    while (nonMatches.size < numSymbols - numMatches) {
      const sym = generateSymbol();
      if (!reference.has(sym)) {
        nonMatches.add(sym);
      }
    }

    const rowSymbols = [...selectedMatches, ...Array.from(nonMatches)].sort(() => Math.random() - 0.5);
    
    rows.push({
      id: rowIds[i],
      symbols: rowSymbols,
      matches: numMatches
    });
  }

  return {
    reference: refArray,
    rows,
    correctRowId: rowIds[correctRowIndex]
  };
}
