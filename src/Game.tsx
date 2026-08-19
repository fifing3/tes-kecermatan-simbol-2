import { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import TestScreen from './components/TestScreen';
import ResultScreen from './components/ResultScreen';
import { generateQuestion } from './utils';
import { TestConfig, Question, AnswerResult } from './types';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function Game() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'result'>('setup');
  const [config, setConfig] = useState<TestConfig>({
    numSymbols: 5,
    minMatch: 2,
    numQuestions: 20,
    mode: 'santai',
    timeLimit: 10,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<AnswerResult[]>([]);

  const handleStart = (newConfig: TestConfig) => {
    setConfig(newConfig);
    const newQuestions = Array.from({ length: newConfig.numQuestions }, () => 
      generateQuestion(newConfig.numSymbols, newConfig.minMatch)
    );
    setQuestions(newQuestions);
    setGameState('playing');
  };

  const handleFinish = (finalAnswers: AnswerResult[]) => {
    setResults(finalAnswers);
    setGameState('result');
  };

  const handleLogout = async () => {
    const code = sessionStorage.getItem('accessCode');
    const sessionId = localStorage.getItem('sessionId');
    
    if (code && sessionId) {
      try {
        const codeRef = doc(db, 'access_codes', code);
        const codeSnap = await getDoc(codeRef);
        if (codeSnap.exists() && codeSnap.data().session_id === sessionId) {
          await updateDoc(codeRef, { session_id: null });
        }
      } catch (err) {
        console.error('Failed to logout on server', err);
      }
    }
    
    sessionStorage.removeItem('accessCode');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center p-3 md:p-5 font-sans">
      <div className="w-full max-w-4xl z-10 relative">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-blue-200 pb-3 mb-5 gap-4">
          <div className="w-full overflow-hidden">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-blue-950 tracking-tight truncate">Bimbel Masuk Unhan (BMU)</h1>
            <p className="text-xs sm:text-sm md:text-base text-blue-800 mt-1 truncate">Simulasi Tes Kecermatan Psikologi Unhan</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {gameState === 'setup' && (
          <SetupScreen initialConfig={config} onStart={handleStart} />
        )}
        
        {gameState === 'playing' && (
          <TestScreen 
            questions={questions} 
            config={config} 
            onFinish={handleFinish} 
          />
        )}
        
        {gameState === 'result' && (
          <ResultScreen 
            results={results} 
            config={config} 
            onRestart={() => setGameState('setup')} 
          />
        )}
      </div>
    </div>
  );
}
