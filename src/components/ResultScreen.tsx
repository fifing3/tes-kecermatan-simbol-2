import { TestConfig, AnswerResult } from '../types';
import { Trophy, RefreshCw, Clock } from 'lucide-react';

export default function ResultScreen({ 
  results, 
  config, 
  onRestart 
}: { 
  results: AnswerResult[], 
  config: TestConfig, 
  onRestart: () => void 
}) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = config.numQuestions;
  const accuracy = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-3xl p-6 md:p-8 text-center shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Trophy className="w-64 h-64" />
        </div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-blue-950">Latihan Selesai</h2>
          <p className="text-blue-800 font-medium mb-8">
            Mode {config.mode === 'santai' ? 'Latihan Santai' : 'Simulasi Ujian'}
          </p>
          
          <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
            <div className="text-7xl font-bold text-blue-900 mb-2">
              {correctCount} <span className="text-4xl text-slate-300">/ {totalCount}</span>
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">Jawaban Benar</p>

            <div className="flex justify-center gap-8 md:gap-12 pt-6 border-t border-slate-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900 mb-1">{accuracy}%</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Akurasi</div>
              </div>
              {config.mode === 'ujian' && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-1 flex items-center justify-center gap-2">
                    <Clock className="w-6 h-6" />
                    {results.filter(r => r.selectedId === null).length}
                  </div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Waktu Habis</div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={onRestart}
            className="bg-blue-900 text-white rounded-2xl px-6 py-3.5 md:py-4 w-full font-semibold text-lg hover:bg-blue-950 hover:shadow-xl hover:shadow-blue-900/30 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-5 h-5" />
            Mulai Sesi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
