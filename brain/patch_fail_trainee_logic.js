const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/services/trainingService.js';
let c = fs.readFileSync(path, 'utf8');

const newMethod = `
  async failTrainee(traineeId, reason) {
    try {
      const traineeDoc = await db.collection('trainees').doc(traineeId).get();
      if (!traineeDoc.exists) throw new Error("Trainee not found.");
      
      const traineeData = traineeDoc.data();
      const employeeId = traineeData.employeeId || traineeId;

      // 1. Update Trainee Record
      await this.updateTrainee(traineeId, {
        progress: 0,
        status: 'FAILED',
        certificationStatus: 'FAILED',
        trainingStatus: 'FAILED',
        terminationReason: reason,
        terminatedAt: new Date().toISOString(),
        terminatedBy: AuthGuard.userProfile?.displayName || 'Lead Trainer'
      });

      // 2. Update Employee Record (Trigger HR Workflow)
      await db.collection('employees').doc(employeeId).set({
        employmentStatus: 'TERMINATED',
        trainingStatus: 'FAILED',
        certificationStatus: 'FAILED',
        isActive: false,
        terminationReason: reason,
        terminatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 3. Update User Auth Status (Disable Login)
      const empDoc = await db.collection('employees').doc(employeeId).get();
      let userId = employeeId;
      if (empDoc.exists && empDoc.data().userId) {
        userId = empDoc.data().userId;
      }
      await db.collection('users').doc(userId).set({
        status: 'SUSPENDED',
        isActive: false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 4. Create HR Workflow Request / Notification
      if (window.auditService) {
        await auditService.log('CERTIFICATION_FAILED', 'TRAINING', 'employees', employeeId, { reason });
      }

      console.log(\`Successfully marked Trainee \${employeeId} as FAILED and triggered termination.\`);
      return true;
    } catch (e) {
      console.error('Error failing trainee:', e);
      throw e;
    }
  },
`;

c = c.replace(/async handoverToFloor\(traineeId, department = 'Operations', teamLeadName = 'Reporting Manager'\) \{/g, newMethod + '\n  async handoverToFloor(traineeId, department = \'Operations\', teamLeadName = \'Reporting Manager\') {');

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED trainingService.js with failTrainee');
