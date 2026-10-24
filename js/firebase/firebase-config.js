/**
 * DIALLO HRMS — ZERO-NETWORK FIREBASE COMPATIBILITY STUB
 * Completely decouples the application from Google Firebase.
 * All runtime database and authentication operations run through Hostinger MySQL & PHP APIs.
 * This stub safely intercepts legacy calls without making any network requests.
 */

var firebase;
var auth;
var db;
var FirebaseApp;

(function () {
  const noop = () => {};
  const asyncNoop = async () => {};

  const emptyQuerySnapshot = {
    empty: true,
    size: 0,
    docs: [],
    forEach: noop,
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
    onSnapshot: (cb) => {
      if (typeof cb === 'function') {
        try { cb(emptyQuerySnapshot); } catch (_) {}
      }
      return noop;
    },
    doc: (docId) => ({
      id: docId || '',
      get: async () => ({ ...emptyDocSnapshot, id: docId }),
      set: asyncNoop,
      update: asyncNoop,
      delete: asyncNoop
    }),
    add: async () => ({ id: 'doc_' + Date.now() })
  };

  const firestoreStub = {
    collection: () => queryStub,
    doc: (docPath) => queryStub.doc(docPath),
    batch: () => ({
      set: noop,
      update: noop,
      delete: noop,
      commit: asyncNoop
    }),
    runTransaction: async (fn) => fn({
      get: async () => emptyDocSnapshot,
      set: noop,
      update: noop,
      delete: noop
    })
  };

  const FieldValue = {
    serverTimestamp: () => new Date().toISOString(),
    delete: () => null,
    increment: (n) => n,
    arrayUnion: (...items) => items,
    arrayRemove: (...items) => items
  };

  const authStub = {
    currentUser: null,
    onAuthStateChanged: (cb) => {
      // Defer to AuthGuard and authService
      return noop;
    },
    signInWithEmailAndPassword: async () => {
      throw new Error('Firebase Auth is decommissioned. Use authService.signIn.');
    },
    createUserWithEmailAndPassword: async () => {
      throw new Error('Firebase Auth is decommissioned.');
    },
    signOut: asyncNoop
  };

  window.firebase = {
    apps: [{ name: '[DEFAULT]' }],
    app: () => window.firebase.apps[0],
    initializeApp: () => window.firebase.apps[0],
    auth: () => authStub,
    firestore: Object.assign(() => firestoreStub, { FieldValue }),
    storage: () => ({
      ref: () => ({
        put: asyncNoop,
        getDownloadURL: async () => ''
      })
    })
  };

  window.auth = authStub;
  window.db = firestoreStub;
  window.FirebaseApp = {
    auth: authStub,
    db: firestoreStub
  };

  firebase = window.firebase;
  auth = window.auth;
  db = window.db;
  FirebaseApp = window.FirebaseApp;
})();
