import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, PowerOff, Loader2, KeyRound, AlertCircle, LogOut, Trash2, ChevronLeft, ChevronRight, MonitorX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessCode {
  id: number;
  code: string;
  is_active: number;
  created_at: string;
  expires_at: string | null;
  session_id: string | null;
}

export default function AdminScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  
  const navigate = useNavigate();

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/admin/codes', {
        headers: {
          'x-admin-code': 'pejuangunhan2027'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch (err) {
      setError('Gagal memuat kode akses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
      fetchCodes();
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCodeInput === 'pejuangunhan2027') {
      sessionStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setLoginError('');
      fetchCodes();
    } else {
      setLoginError('Kode admin tidak valid');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleGenerate = async (count: number = 1) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-code', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': 'pejuangunhan2027'
        },
        body: JSON.stringify({ count, expiresInDays: expiresInDays ? parseInt(expiresInDays) : null })
      });
      if (res.ok) {
        fetchCodes();
      } else {
        setError('Gagal membuat kode');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetDevice = async (code: string) => {
    try {
      const res = await fetch('/api/admin/reset-device', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': 'pejuangunhan2027'
        },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        fetchCodes();
      }
    } catch (err) {
      console.error('Gagal reset device', err);
    }
  };

  const handleDeactivate = async (code: string) => {
    try {
      const res = await fetch('/api/admin/deactivate-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': 'pejuangunhan2027'
        },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        fetchCodes();
      }
    } catch (err) {
      console.error('Gagal menonaktifkan kode', err);
    }
  };

  const handleDelete = async (code: string) => {
    try {
      const res = await fetch('/api/admin/delete-code', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': 'pejuangunhan2027'
        },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        fetchCodes();
        // Adjust page if we deleted the last item on current page
        const newTotal = codes.length - 1;
        const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch (err) {
      console.error('Gagal menghapus kode', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
            <p className="text-slate-500 mt-2 text-sm">Masukkan kode admin untuk mengakses panel</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kode Admin</label>
              <input 
                type="password"
                value={adminCodeInput}
                onChange={(e) => {
                  setAdminCodeInput(e.target.value);
                  setLoginError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={!adminCodeInput}
              className="w-full bg-slate-800 text-white rounded-xl py-3.5 font-semibold shadow-md hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(codes.length / ITEMS_PER_PAGE);
  const paginatedCodes = codes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-950 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              Admin Panel
            </h1>
            <p className="text-slate-500 mt-1">Manajemen kode akses BMU</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <label className="text-sm text-slate-600 font-medium">Masa Berlaku:</label>
              <select 
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
              >
                <option value="1">1 Hari</option>
                <option value="7">7 Hari</option>
                <option value="30">30 Hari</option>
                <option value="">Selamanya</option>
              </select>
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button 
                onClick={() => handleGenerate(1)}
                disabled={isGenerating}
                className="text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
              >
                +1 Kode
              </button>
              <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
              <button 
                onClick={() => handleGenerate(10)}
                disabled={isGenerating}
                className="text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
              >
                +10 Kode
              </button>
              <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
              <button 
                onClick={() => handleGenerate(20)}
                disabled={isGenerating}
                className="text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
              >
                +20 Kode
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-4">Kode Akses</th>
                  <th className="px-6 py-4">Dibuat / Berlaku</th>
                  <th className="px-6 py-4">Status / Device</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : paginatedCodes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Belum ada kode akses.
                    </td>
                  </tr>
                ) : (
                  paginatedCodes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-blue-900 tracking-wider text-base">
                        {c.code}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        <div className="flex flex-col gap-1">
                          <span>Dibuat: {new Date(c.created_at.replace(' ', 'T') + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
                          {c.expires_at && (
                            <span className={new Date() > new Date(c.expires_at.replace(' ', 'T') + 'Z') ? "text-red-500 font-medium" : "text-amber-600 font-medium"}>
                              Exp: {new Date(c.expires_at.replace(' ', 'T') + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                          {c.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                              Nonaktif
                            </span>
                          )}
                          {c.session_id ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 border border-blue-100 text-blue-600">
                              Terpakai (1 Device)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 border border-slate-100 text-slate-400">
                              Belum Terpakai
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.session_id && (
                            <button 
                              onClick={() => handleResetDevice(c.code)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Reset Device"
                            >
                              <MonitorX className="w-4 h-4" />
                            </button>
                          )}
                          {c.is_active ? (
                            <button 
                              onClick={() => handleDeactivate(c.code)}
                              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Nonaktifkan"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-300 w-8 inline-block text-center">-</span>
                          )}
                          <button 
                            onClick={() => handleDelete(c.code)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : paginatedCodes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Belum ada kode akses.
              </div>
            ) : (
              paginatedCodes.map((c) => (
                <div key={c.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 tracking-wider text-base">
                      {c.code}
                    </span>
                    <div className="flex gap-2">
                      {c.session_id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700" title="Device Terikat">
                          1 Device
                        </span>
                      )}
                      {c.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Nonaktif
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between text-sm">
                    <div className="flex flex-col gap-1 text-slate-500 text-xs">
                      <span>{new Date(c.created_at.replace(' ', 'T') + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
                      {c.expires_at && (
                        <span className={new Date() > new Date(c.expires_at.replace(' ', 'T') + 'Z') ? "text-red-500 font-medium" : "text-amber-600 font-medium"}>
                          Exp: {new Date(c.expires_at.replace(' ', 'T') + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.session_id && (
                        <button 
                          onClick={() => handleResetDevice(c.code)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center justify-center w-8 h-8"
                          title="Reset Device"
                        >
                          <MonitorX className="w-4 h-4" />
                        </button>
                      )}
                      {c.is_active ? (
                        <button 
                          onClick={() => handleDeactivate(c.code)}
                          className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-lg transition-colors flex items-center justify-center w-8 h-8"
                          title="Nonaktifkan"
                        >
                          <PowerOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 w-8 inline-block text-center">-</span>
                      )}
                      <button 
                        onClick={() => handleDelete(c.code)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center w-8 h-8"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, codes.length)} dari {codes.length} kode
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-700 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
