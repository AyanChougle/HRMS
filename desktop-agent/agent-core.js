
const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');

let db, employeeId, companyId, deviceId, employeeName;
let timer, idleTimer, state = 'ACTIVE', lastState = null;
const IDLE_THRESHOLD = Number(process.env.HRMS_IDLE_THRESHOLD_SECONDS || 300);

function init() {
  const cfg = {
    apiKey: process.env.HRMS_FIREBASE_API_KEY,
    authDomain: process.env.HRMS_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.HRMS_FIREBASE_PROJECT_ID,
    storageBucket: process.env.HRMS_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.HRMS_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.HRMS_FIREBASE_APP_ID
  };
  if (!cfg.apiKey || !cfg.projectId) throw new Error('Firebase configuration missing');
  firebase.initializeApp(cfg);
  db = firebase.firestore();
  employeeId = process.env.HRMS_AGENT_EMPLOYEE_ID;
  companyId = process.env.HRMS_COMPANY_ID;
  deviceId = process.env.HRMS_DEVICE_ID;
  employeeName = process.env.HRMS_AGENT_NAME || employeeId;
}

async function auth() {
  await firebase.auth().signInWithEmailAndPassword(
    process.env.HRMS_AGENT_EMAIL, process.env.HRMS_AGENT_PASSWORD
  );
}

async function writePresence(idleSeconds = 0) {
  const ref = db.collection('employeePresence').doc(employeeId);
  const patch = {
    employeeId, companyId, employeeName, deviceId,
    agentStatus: state,
    idleSeconds,
    agentClientTimestamp: new Date().toISOString(),
    agentLastHeartbeatAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await ref.set(patch, {merge:true});

  if (state !== lastState) {
    await db.collection('presenceEvents').add({
      employeeId, companyId, employeeName, deviceId,
      source:'DESKTOP_AGENT', state,
      idleSeconds,
      occurredAt:firebase.firestore.FieldValue.serverTimestamp(),
      clientTimestamp:new Date().toISOString()
    });
    lastState = state;
  }
}

async function heartbeat(powerMonitor) {
  if (!db || !firebase.auth().currentUser) return;
  let idle = 0;
  try { idle = powerMonitor.getSystemIdleTime(); } catch (_) {}
  if (state === 'ACTIVE' && idle >= IDLE_THRESHOLD) state = 'IDLE';
  if (state === 'IDLE' && idle < IDLE_THRESHOLD) state = 'ACTIVE';
  await writePresence(idle);
}

function setState(next) {
  state = next;
  return writePresence(0);
}

async function start(powerMonitor) {
  init();
  await auth();
  await heartbeat(powerMonitor);
  timer = setInterval(() => heartbeat(powerMonitor).catch(console.error), 30000);
  idleTimer = setInterval(() => heartbeat(powerMonitor).catch(console.error), 10000);
}
function stop(){ clearInterval(timer); clearInterval(idleTimer); }

module.exports = {start,stop,setState};
