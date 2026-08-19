const fs = require('fs');

const loginPath = 'src/LoginScreen.tsx';
let loginCode = fs.readFileSync(loginPath, 'utf-8');
loginCode = loginCode.replace(
  "import { KeyRound, AlertCircle, Loader2, MessageCircle } from 'lucide-react';",
  "import { KeyRound, AlertCircle, Loader2, MessageCircle } from 'lucide-react';\nimport { doc, getDoc, updateDoc } from 'firebase/firestore';\nimport { db } from './firebase';"
);

const loginFetchOld = `    try {
      const sessionId = localStorage.getItem('sessionId');
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), sessionId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.sessionId) {
          localStorage.setItem('sessionId', data.sessionId);
        }
        sessionStorage.setItem('accessCode', code.toUpperCase());
        navigate('/app');
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }`;

const loginFetchNew = `    try {
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
    }`;

loginCode = loginCode.replace(loginFetchOld, loginFetchNew);
fs.writeFileSync(loginPath, loginCode);

const gamePath = 'src/Game.tsx';
let gameCode = fs.readFileSync(gamePath, 'utf-8');
gameCode = gameCode.replace(
  "import { LogOut } from 'lucide-react';",
  "import { LogOut } from 'lucide-react';\nimport { doc, updateDoc, getDoc } from 'firebase/firestore';\nimport { db } from './firebase';"
);

const logoutOld = `        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, sessionId })
        });`;

const logoutNew = `        const codeRef = doc(db, 'access_codes', code);
        const codeSnap = await getDoc(codeRef);
        if (codeSnap.exists() && codeSnap.data().session_id === sessionId) {
          await updateDoc(codeRef, { session_id: null });
        }`;

gameCode = gameCode.replace(logoutOld, logoutNew);
fs.writeFileSync(gamePath, gameCode);

