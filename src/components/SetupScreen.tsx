import React, { useState } from 'react';
import { TestConfig } from '../types';
import { Check, Settings, Clock, PlayCircle, Info } from 'lucide-react';

interface Props {
  onStart: (config: TestConfig) => void;
  initialConfig: TestConfig;
}

export default function SetupScreen({ onStart, initialConfig }: Props) {
  const [config, setConfig] = useState<TestConfig>(initialConfig);

  const OptionButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 flex-1 md:flex-none text-center flex items-center justify-center gap-2 ${
        active 
          ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20 ring-2 ring-blue-900 ring-offset-2 ring-offset-white' 
          : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      {children}
      {active && <Check className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Settings className="w-48 h-48" />
        </div>
        
        <h2 className="font-semibold text-xl md:text-2xl text-blue-950 mb-6 relative z-10 flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-900" />
          Pengaturan Latihan
        </h2>

        <div className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide">Jumlah Simbol Acuan / Per Baris</label>
            <div className="flex gap-3">
              {[4, 5, 6].map(n => (
                <OptionButton 
                  key={n} 
                  active={config.numSymbols === n} 
                  onClick={() => setConfig({...config, numSymbols: n})}
                >
                  {n}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide">Minimal Simbol Cocok</label>
            <div className="flex gap-3">
              {[2, 3].map(n => (
                <OptionButton 
                  key={n} 
                  active={config.minMatch === n} 
                  onClick={() => setConfig({...config, minMatch: n})}
                >
                  {n}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide">Jumlah Soal</label>
            <div className="flex gap-3">
              {[10, 20, 30].map(n => (
                <OptionButton 
                  key={n} 
                  active={config.numQuestions === n} 
                  onClick={() => setConfig({...config, numQuestions: n})}
                >
                  {n}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide">Mode</label>
            <div className="flex gap-3 flex-col md:flex-row">
              <OptionButton 
                active={config.mode === 'santai'} 
                onClick={() => setConfig({...config, mode: 'santai'})}
              >
                Latihan Santai
              </OptionButton>
              <OptionButton 
                active={config.mode === 'ujian'} 
                onClick={() => setConfig({...config, mode: 'ujian'})}
              >
                Simulasi Ujian
              </OptionButton>
            </div>
          </div>

          {config.mode === 'ujian' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4" /> Waktu per Soal
              </label>
              <div className="flex gap-3">
                {[5, 10, 15].map(n => (
                  <OptionButton 
                    key={n} 
                    active={config.timeLimit === n} 
                    onClick={() => setConfig({...config, timeLimit: n})}
                  >
                    {n} detik
                  </OptionButton>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => onStart(config)}
        className="w-full bg-blue-900 text-white rounded-2xl py-3.5 md:py-4 text-lg font-semibold shadow-lg shadow-blue-900/30 hover:bg-blue-950 hover:shadow-xl hover:shadow-blue-900/40 transition-all duration-300 transform active:scale-[0.98] mb-6 flex justify-center items-center gap-3"
      >
        <PlayCircle className="w-6 h-6" />
        Mulai Latihan
      </button>

      <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 text-slate-600 space-y-4 text-sm leading-relaxed">
        <h3 className="font-semibold text-lg text-blue-950 flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-blue-600" />
          Instruksi Pengerjaan
        </h3>
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
          <span>Setiap soal: <strong>{config.numSymbols} simbol acuan</strong> (huruf & angka) dan <strong>5 baris pilihan (A-E)</strong>, masing-masing berisi simbol berbeda. Cari <strong>satu baris</strong> yang memiliki simbol cocok dengan acuan sebanyak {config.minMatch} atau lebih.</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-white p-4 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2"><Check className="w-4 h-4" /> Latihan Santai</h4>
            <p className="text-slate-500 text-xs">Simbol yang cocok langsung ditandai setelah menjawab. Tidak ada batas waktu.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-blue-950 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-800" /> Simulasi Ujian</h4>
            <p className="text-slate-500 text-xs">Dibatasi {config.timeLimit} detik per soal. Koreksi dan hasil baru muncul di akhir sesi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
