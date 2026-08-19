import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, AlertCircle, Loader2, MessageCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function LoginScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Masukkan kode akses');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const dbCode = code.toUpperCase();
      const codeRef = doc(db, 'access_codes', dbCode);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        setError('Kode akses tidak valid');
        setIsLoading(false);
        return;
      }

      const row = codeSnap.data();

      if (row.is_active === 0) {
        setError('Kode akses sudah tidak aktif');
        setIsLoading(false);
        return;
      }

      if (row.expires_at) {
        const now = new Date();
        const expiresAt = new Date(row.expires_at.replace(' ', 'T') + 'Z');
        if (now > expiresAt) {
          setError('Masa berlaku kode akses telah habis');
          setIsLoading(false);
          return;
        }
      }

      let finalSessionId = row.session_id;
      const currentSessionId = localStorage.getItem('sessionId');

      if (finalSessionId) {
        if (finalSessionId !== currentSessionId) {
          setError('Kode akses sedang digunakan di perangkat lain');
          setIsLoading(false);
          return;
        }
      } else {
        finalSessionId = crypto.randomUUID();
        await updateDoc(codeRef, { session_id: finalSessionId });
      }

      localStorage.setItem('sessionId', finalSessionId);
      sessionStorage.setItem('accessCode', dbCode);
      navigate('/app');
    } catch (err: any) {
      console.error(err);
      setError('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-5 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <KeyRound className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-blue-950">Tes Kecermatan Psikologi Unhan</h1>
          <h2 className="text-base sm:text-lg font-semibold text-blue-800 mt-1">Bimbel Masuk Unhan (BMU)</h2>
          <p className="text-slate-500 mt-2 sm:mt-3 text-sm">Masukkan kode akses untuk memulai simulasi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Kode Akses</label>
            <input 
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 uppercase transition-all"
              placeholder="UNHAN-XXX"
              maxLength={12}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading || !code}
            className="w-full bg-blue-900 text-white rounded-xl py-3.5 font-semibold shadow-md shadow-blue-900/20 hover:bg-blue-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 pt-5 sm:mt-8 sm:pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 mb-3">Butuh kode akses? Hubungi admin kami</p>
          <a 
            href="https://api.whatsapp.com/send?phone=6285156574081&text=*Hello%2C%20Bimbel%20Masuk%20Unhan%20(BMU)*%0ASaya%20berminat%20*Kode%20Akses%20Tes%20Kecermatan%20Psikologi%20Unhan*.%20Mohon%20informasi%20lebih%20lanjut.%20terimakasih" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#20bd5a] transition-colors shadow-sm shadow-[#25D366]/20 w-full"
          >
            <MessageCircle className="w-4 h-4" />
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
