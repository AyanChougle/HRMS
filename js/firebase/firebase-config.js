/**
 * DIALLO HRMS — FIREBASE CONFIGURATION & INITIALIZATION
 * Centralized Firebase App, Auth, Firestore, and Storage initialization
 */

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

// Global Firebase Service Instances
const auth = firebase.auth();
const db = firebase.firestore();
// NOTE: Firebase Storage is NOT used. All file storage is on Hostinger (storage.diallo.com).
const storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

// Helper for server timestamps
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
const FieldValue = firebase.firestore.FieldValue;

window.FirebaseApp = {
  config: firebaseConfig,
  auth,
  db,
  storage,
  serverTimestamp,
  FieldValue
};
