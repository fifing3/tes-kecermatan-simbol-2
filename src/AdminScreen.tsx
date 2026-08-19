import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, PowerOff, Loader2, KeyRound, AlertCircle, LogOut, Trash2, ChevronLeft, ChevronRight, MonitorX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';

interface AccessCode {
  id?: number;
  code: string;
  is_active: number;
  created_at: string;
  expires_at: string | null;
  session_id: string | null;
}

export default function AdminScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email === 'fifing3@gmail.com' || user.isAnonymous) {
          setIsAuthenticated(true);
          setLoginError('');
        } else {
          signOut(auth);
          setLoginError('Anda tidak memiliki akses ke panel admin.');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const q = query(collection(db, 'access_codes'), orderBy('created_at', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const codesData: AccessCode[] = [];
        snapshot.forEach((doc) => {
          codesData.push({ id: codesData.length, ...doc.data() } as AccessCode);
        });
        setCodes(codesData);
        setIsLoading(false);
      }, (err) => {
        console.error("Firestore error:", err);
        setError('Gagal memuat kode akses');
        setIsLoading(false);
      });
      return unsubscribe;
    }
  }, [isAuthenticated]);

  const handleSSOLogin = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setLoginError(err.message || 'Gagal login SSO');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (adminCodeInput === 'pejuangunhan2027') {
      try {
        await signInAnonymously(auth);
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed') {
          setLoginError('Login Kode Akses diblokir oleh Firebase. Harap aktifkan "Anonymous Auth" di Firebase Console > Authentication > Sign-in method.');
        } else {
          setLoginError('Terjadi kesalahan saat login.');
        }
      }
    } else {
      setLoginError('Kode admin tidak valid');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleGenerate = async (count: number = 1) => {
    setIsGenerating(true);
    try {
      const batch = writeBatch(db);
      
      const generateSingleCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomPart = '';
        for (let i = 0; i < 3; i++) {
          randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `UNHAN-${randomPart}`;
      };

      let expiresAtValue = null;
      if (expiresInDays) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expiresInDays));
        expiresAtValue = d.toISOString().replace('T', ' ').substring(0, 19);
      }

      for (let i = 0; i < count; i++) {
        const code = generateSingleCode();
        const docRef = doc(db, 'access_codes', code);
        batch.set(docRef, {
          code,
          is_active: 1,
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          expires_at: expiresAtValue,
          session_id: null
        });
      }
      
      await batch.commit();
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat generate kode');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetDevice = async (code: string) => {
    try {
      await updateDoc(doc(db, 'access_codes', code), { session_id: null });
    } catch (err) {
      console.error('Gagal reset device', err);
    }
  };

  const handleDeactivate = async (code: string) => {
    try {
      await updateDoc(doc(db, 'access_codes', code), { is_active: 0 });
    } catch (err) {
      console.error('Gagal menonaktifkan kode', err);
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteDoc(doc(db, 'access_codes', code));
      const newTotal = codes.length - 1;
      const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error('Gagal menghapus kode', err);
    }
  };

  if (isLoading && !isAuthenticated) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
            <p className="text-slate-500 mt-2 text-sm">Gunakan akun admin untuk mengakses panel</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kode Akses Admin</label>
              <input 
                type="password"
                value={adminCodeInput}
                onChange={(e) => {
                  setAdminCodeInput(e.target.value);
                  setLoginError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={!adminCodeInput}
              className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-semibold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Masuk dengan Kode
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">ATAU</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            
            <button 
              type="button"
              onClick={handleSSOLogin}
              className="w-full bg-white border-2 border-slate-200 text-slate-700 rounded-xl py-3 font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(codes.length / ITEMS_PER_PAGE);
  const currentCodes = codes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin Panel BMU</h1>
              <p className="text-slate-400 text-xs">Manajemen Kode Akses</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-sm font-medium border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  Generate Kode Baru
                </h2>
                <p className="text-slate-500 text-sm mt-1">Buat kode akses untuk peserta ujian</p>
              </div>
              
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Masa Berlaku (Hari)</label>
                  <select 
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tidak ada batas</option>
                    <option value="1">1 Hari</option>
                    <option value="7">7 Hari</option>
                    <option value="30">30 Hari</option>
                  </select>
                </div>
                
                <button 
                  onClick={() => handleGenerate(1)}
                  disabled={isGenerating}
                  className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  1 Kode
                </button>
                <button 
                  onClick={() => handleGenerate(10)}
                  disabled={isGenerating}
                  className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  10 Kode
                </button>
                <button 
                  onClick={() => handleGenerate(50)}
                  disabled={isGenerating}
                  className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  50 Kode
                </button>
              </div>
            </div>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center p-12">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Belum ada kode</h3>
                <p className="text-slate-500">Silakan generate kode akses baru</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode Akses</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Perangkat</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dibuat</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Berlaku Sampai</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentCodes.map((code, idx) => {
                      const isExpired = code.expires_at ? new Date() > new Date(code.expires_at.replace(' ', 'T') + 'Z') : false;
                      const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                      
                      return (
                        <tr key={code.code} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-center text-slate-400 font-medium">{globalIndex}</td>
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg tracking-wide">
                              {code.code}
                            </span>
                          </td>
                          <td className="p-4">
                            {code.is_active === 1 ? (
                              isExpired ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                                  Kedaluwarsa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  Aktif
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Nonaktif
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {code.session_id ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  Terhubung
                                </span>
                                <button 
                                  onClick={() => handleResetDevice(code.code)}
                                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                  title="Reset perangkat agar kode bisa digunakan di perangkat lain"
                                >
                                  <MonitorX className="w-3.5 h-3.5" />
                                  Reset
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">-</span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-slate-600 font-medium">
                            {new Date(code.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4 text-sm text-slate-600 font-medium">
                            {code.expires_at ? new Date(code.expires_at.replace(' ', 'T') + 'Z').toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {code.is_active === 1 && (
                                <button 
                                  onClick={() => handleDeactivate(code.code)}
                                  className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                                  title="Nonaktifkan"
                                >
                                  <PowerOff className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDelete(code.code)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-sm text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="font-bold text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, codes.length)}</span> dari <span className="font-bold text-slate-800">{codes.length}</span> kode
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 transition-colors bg-slate-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 transition-colors bg-slate-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
