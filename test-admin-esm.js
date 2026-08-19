import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
  initializeApp({
    credential: applicationDefault(),
    projectId: 'dependable-pursuit-76rpq'
  });
  const db = getFirestore('ai-studio-tespsikologipenc-71af4fff-1b69-4b2b-b333-8caf44df222b');
  db.collection('access_codes').limit(1).get()
    .then(() => console.log('Admin SDK works with specific DB!'))
    .catch(e => console.error('Admin SDK Error:', e.message));
} catch(e) { 
  console.error('Init error:', e); 
}
