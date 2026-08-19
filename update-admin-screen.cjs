const fs = require('fs');

let code = fs.readFileSync('src/AdminScreen.tsx', 'utf8');

code = code.replace(
  "import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';",
  "import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';"
);

code = code.replace(
  "const [loginError, setLoginError] = useState('');",
  "const [loginError, setLoginError] = useState('');\n  const [adminCodeInput, setAdminCodeInput] = useState('');"
);

const oldAuthEffect = `  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email === 'fifing3@gmail.com') {
          setIsAuthenticated(true);
          setLoginError('');
        } else {
          signOut(auth);
          setLoginError('You are not authorized to access the admin panel.');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });
    return unsubscribeAuth;
  }, []);`;

const newAuthEffect = `  useEffect(() => {
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
  }, []);`;

code = code.replace(oldAuthEffect, newAuthEffect);

const oldLoginMethods = `  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setLoginError(err.message || 'Gagal login');
    }
  };`;

const newLoginMethods = `  const handleSSOLogin = async () => {
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
  };`;

code = code.replace(oldLoginMethods, newLoginMethods);

const oldForm = `          <form onSubmit={handleAdminLogin} className="space-y-6">
            {loginError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-800 text-white rounded-xl py-3.5 font-semibold shadow-md hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
            >
              Sign in with Google
            </button>
          </form>`;

const newForm = `          <form onSubmit={handleAdminLogin} className="space-y-6">
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
          </form>`;

code = code.replace(oldForm, newForm);

fs.writeFileSync('src/AdminScreen.tsx', code);
