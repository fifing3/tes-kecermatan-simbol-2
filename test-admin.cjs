const admin = require('firebase-admin');
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dependable-pursuit-76rpq'
  });
  const db = admin.firestore();
  db.collection('test').get().then(() => console.log('Admin SDK works!')).catch(e => console.error('Admin SDK Error:', e));
} catch(e) { console.error('Init error:', e); }
