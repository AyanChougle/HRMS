/**
 * DIALLO HRMS — FIREBASE CLOUD FUNCTIONS (PRODUCTION PHASE 20)
 * Server-side automation, security processing, Hostinger storage authorization,
 * and scheduled compliance jobs.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. AUTH TRIGGER: On User Registration
 * Assigns custom claims (roleId, companyId) and syncs user document
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    const email = user.email || '';
    const uid = user.uid;

    // Check if user already has an invited record in Firestore
    const userDocRef = db.collection('users').doc(uid);
    const existingDoc = await userDocRef.get();

    let roleId = 'EMPLOYEE';
    let companyId = 'comp_diallo_india';

    if (existingDoc.exists) {
      const data = existingDoc.data();
      roleId = data.roleId || roleId;
      companyId = data.companyId || companyId;
    }

    // Set Custom Claims for fast Security Rules evaluation
    await admin.auth().setCustomUserClaims(uid, {
      roleId,
      companyId
    });

    // Write / Update user profile
    await userDocRef.set({
      uid,
      email,
      displayName: user.displayName || email.split('@')[0],
      roleId,
      companyId,
      status: 'ACTIVE',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log to Audit Trail
    await db.collection('auditLogs').add({
      logId: 'LOG-' + Date.now(),
      companyId,
      actorUserId: uid,
      actorEmail: email,
      actorRole: roleId,
      action: 'USER_REGISTERED',
      resourceType: 'users',
      resourceId: uid,
      severity: 'INFO',
      result: 'SUCCESS',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (err) {
    console.error('Error in onUserCreated function:', err);
    return { error: err.message };
  }
});

/**
 * 2. HTTP ENDPOINT: Hostinger Storage Upload Authorization Token
 * Authorizes a client upload to storage.diallo.com
 */
exports.authorizeStorageUpload = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const { category, fileName } = req.body;
      const companyId = decodedToken.companyId || 'comp_diallo_india';
      const uid = decodedToken.uid;

      return res.status(200).json({
        authorized: true,
        companyId,
        uid,
        storageDomain: 'https://storage.diallo.com',
        uploadEndpoint: 'https://storage.diallo.com/api/upload.php'
      });
    } catch (err) {
      console.error('Error authorizing storage upload:', err);
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
  });
});

/**
 * 3. SCHEDULED CRON JOB: Daily Compliance & Probation Audit (Every day at 00:00 UTC)
 */
exports.scheduledDailyHRComplianceJob = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0];

  try {
    // 1. Check Expiring Certifications
    const certSnap = await db.collection('certifications')
      .where('expiryDate', '<=', thirtyDaysStr)
      .where('status', '==', 'VALID')
      .get();

    for (const doc of certSnap.docs) {
      await doc.ref.update({
        status: 'EXPIRING_SOON',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 2. Check Probations Ending in Next 14 Days
    const probSnap = await db.collection('probationRecords')
      .where('status', '==', 'ACTIVE')
      .get();

    for (const doc of probSnap.docs) {
      const p = doc.data();
      if (p.probationEndDate && p.probationEndDate <= thirtyDaysStr) {
        // Dispatch Notification to Manager & HR
        await db.collection('notifications').add({
          title: 'Probation Review Due Soon',
          message: `Probation for employee ${p.employeeName} (${p.employeeCode}) is ending on ${p.probationEndDate}. Please complete the milestone evaluation.`,
          recipientId: p.managerId || 'HR_DEPARTMENT',
          companyId: p.companyId || 'comp_diallo_india',
          type: 'PROBATION_REMINDER',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    return null;
  } catch (err) {
    console.error('Error in scheduledDailyHRComplianceJob:', err);
    return null;
  }
});
