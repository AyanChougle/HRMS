
const firebaseConfig = {
  apiKey: "AIzaSyCiVmXa3LEf9VP9rvNoQtN2fVJTOPqDVws",
  authDomain: "hrms-3b9d9.firebaseapp.com",
  projectId: "hrms-3b9d9",
  storageBucket: "hrms-3b9d9.firebasestorage.app",
  messagingSenderId: "443705359479",
  appId: "1:443705359479:web:648816dce3da59ae681a72",
  measurementId: "G-5RHNVEH8TC"
};

// Initialize Firebase once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// -----------------------------------------------------------------------------
// STRICT SYSTEM ARCHITECTURE:
// Firebase is used EXCLUSIVELY for Authentication (Identity, Passwords, Session).
// All database collections, business data, and storage reside on Hostinger MySQL.
// -----------------------------------------------------------------------------
const auth = firebase.auth();

// Safe Offline/No-op Firestore Stub so legacy calls never query Google Firestore
// and never trigger "FirebaseError: Missing or insufficient permissions"
function createFirestoreStub() {
  const emptyQuerySnapshot = {
    empty: true,
    size: 0,
    docs: [],
    forEach: () => {},
    map: () => []
  };

  const emptyDocSnapshot = {
    exists: false,
    id: '',
    data: () => null
  };

  const queryStub = {
    where: () => queryStub,
    orderBy: () => queryStub,
    limit: () => queryStub,
    startAfter: () => queryStub,
    get: async () => emptyQuerySnapshot,
    onSnapshot: (callback) => {
      if (typeof callback === 'function') {
        try { callback(emptyQuerySnapshot); } catch (_) {}
      }
      return () => {}; // Unsubscribe function
    },
    doc: (docId) => ({
      id: docId || '',
      get: async () => ({ ...emptyDocSnapshot, id: docId }),
      set: async () => {},
      update: async () => {},
      delete: async () => {}
    }),
    add: async () => ({ id: 'doc_' + Date.now() })
  };

  return {
    collection: () => queryStub,
    doc: (docPath) => queryStub.doc(docPath),
    batch: () => ({
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: async () => {}
    }),
    runTransaction: async (fn) => fn({
      get: async () => emptyDocSnapshot,
      set: () => {},
      update: () => {},
      delete: () => {}
    })
  };
}

const db = createFirestoreStub();
const storage = null;

// Helper for server timestamps
const serverTimestamp = () => new Date().toISOString();
const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  delete: () => null,
  increment: (n) => n,
  arrayUnion: (...items) => items,
  arrayRemove: (...items) => items
};

if (typeof firebase !== 'undefined' && firebase.firestore) {
  try {
    firebase.firestore.FieldValue = FieldValue;
  } catch (_) {}
}

window.FirebaseApp = {
  config: firebaseConfig,
  auth,
  db,
  storage,
  serverTimestamp,
  FieldValue
};
