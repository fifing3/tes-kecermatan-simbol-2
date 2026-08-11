import { useEffect, useState } from 'react';
import { Question, TestConfig, AnswerResult } from '../types';
import { Timer, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function TestScreen({
  questions,
  config,
  onFinish
}: {
  questions: Question[],
  config: TestConfig,
  onFinish: (answers: AnswerResult[]) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);

  const question = questions[currentIndex];

  useEffect(() => {
    if (config.mode === 'ujian' && !hasAnswered) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentIndex, config.mode, hasAnswered]);

  const handleTimeOut = () => {
    const newAnswers = [...answers, {
      questionIndex: currentIndex,
      selectedId: null,
      isCorrect: false
    }];
    setAnswers(newAnswers);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(config.timeLimit);
    } else {
      onFinish(newAnswers);
    }
  };

  const handleAnswer = (rowId: string) => {
    if (hasAnswered) return;
    
    setSelectedRowId(rowId);
    setHasAnswered(true);
    
    const isCorrect = rowId === question.correctRowId;
    if (isCorrect) setScore(s => s + 1);

    const newAnswers = [...answers, {
      questionIndex: currentIndex,
      selectedId: rowId,
      isCorrect
    }];
    setAnswers(newAnswers);

    if (config.mode === 'ujian') {
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setHasAnswered(false);
          setSelectedRowId(null);
          setTimeLeft(config.timeLimit);
        } else {
          onFinish(newAnswers);
        }
      }, 400); 
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasAnswered(false);
      setSelectedRowId(null);
    } else {
      onFinish(answers);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center text-sm md:text-base mb-3 text-blue-900 font-medium">
        <span className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-2">
          Soal {currentIndex + 1} <span className="text-slate-400">/ {questions.length}</span>
        </span>
        {config.mode === 'ujian' && (
          <span className={`px-4 py-2 rounded-xl border shadow-sm flex items-center gap-2 transition-colors ${timeLeft <= 5 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-blue-100 text-blue-900'}`}>
            <Timer className="w-4 h-4" />
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        )}
        <span className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          {score}
        </span>
      </div>
      
      <div className="w-full h-2.5 bg-blue-100 rounded-full mb-5 overflow-hidden">
        <div 
          className="h-full bg-blue-900 transition-all duration-300 rounded-full" 
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 mb-5 overflow-hidden">
        <div className="bg-blue-900 text-white text-center py-3 font-semibold tracking-wider border-b border-blue-950 text-sm">
          SIMBOL ACUAN
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-4 p-3 md:p-6">
          {question.reference.map((sym, i) => (
            <div key={i} className="px-2.5 py-1.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl border-2 border-blue-100 font-sans text-base md:text-2xl font-semibold text-blue-950 bg-white shadow-sm flex items-center justify-center min-w-[48px] md:min-w-[60px]">
              {sym}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:gap-3 mb-5">
        {question.rows.map((row) => {
          const isSelected = selectedRowId === row.id;
          const isCorrectRow = question.correctRowId === row.id;
          
          let bgClass = "bg-white hover:border-blue-400 hover:shadow-md cursor-pointer border-slate-200";
          if (hasAnswered && config.mode === 'santai') {
            bgClass = "bg-white border-slate-200 opacity-60 pointer-events-none"; 
            if (isSelected && !isCorrectRow) bgClass = "bg-red-50 border-red-300 opacity-100 pointer-events-none ring-1 ring-red-300"; 
            if (isCorrectRow) bgClass = "bg-green-50 border-green-400 opacity-100 pointer-events-none shadow-md ring-1 ring-green-400";
          } else if (hasAnswered && config.mode === 'ujian') {
            if (isSelected) bgClass = "bg-blue-50 border-blue-400 ring-1 ring-blue-400 opacity-100 pointer-events-none"; 
            else bgClass = "bg-white border-slate-200 opacity-50 pointer-events-none";
          }

          return (
            <div 
              key={row.id} 
              onClick={() => handleAnswer(row.id)}
              className={`flex items-center p-2 md:p-3 rounded-2xl border-2 transition-all duration-200 ${bgClass}`}
            >
              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-base md:text-xl mr-2 md:mr-3 shrink-0 transition-colors ${
                (hasAnswered && config.mode === 'santai' && isCorrectRow) 
                  ? 'bg-green-100 text-green-700' 
                  : (hasAnswered && config.mode === 'santai' && isSelected && !isCorrectRow)
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-50 text-blue-700'
              }`}>
                {row.id}
              </div>
              <div className="flex gap-1.5 md:gap-3 flex-1 flex-wrap">
                {row.symbols.map((sym, j) => {
                   const isMatch = question.reference.includes(sym);
                   const highlight = hasAnswered && config.mode === 'santai' && isMatch;
                   return (
                     <div 
                       key={j} 
                       className={`rounded-lg md:rounded-xl px-2 py-1 md:px-3.5 md:py-2 font-sans text-sm md:text-lg border transition-colors ${
                        highlight 
                          ? 'bg-yellow-100 border-yellow-300 font-semibold text-yellow-900 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                       }`}
                     >
                       {sym}
                     </div>
                   )
                })}
              </div>
              {hasAnswered && config.mode === 'santai' && (
                <div className={`text-xs md:text-sm font-medium ml-2 text-right w-24 hidden md:block ${isCorrectRow ? 'text-green-600' : 'text-slate-400'}`}>
                  {row.matches} cocok
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasAnswered && config.mode === 'santai' && (
        <div className="mt-5 flex flex-col md:flex-row items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 duration-300 gap-4">
          <div className="flex items-center gap-3">
            {selectedRowId === question.correctRowId ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-bold text-lg text-green-700">Benar!</div>
                  <div className="text-sm text-slate-500">Baris {question.correctRowId} adalah pilihan yang tepat.</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-bold text-lg text-red-700">Kurang Tepat</div>
                  <div className="text-sm text-slate-500">Jawaban yang benar adalah <span className="font-bold text-green-600">Baris {question.correctRowId}</span>.</div>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={handleNext}
            className="w-full md:w-auto bg-blue-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-950 hover:shadow-lg hover:shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Lanjut <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
