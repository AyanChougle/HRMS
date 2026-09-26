const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/services/trainingService.js';
let c = fs.readFileSync(path, 'utf8');

const oldCertify = `  async certifyTrainee(traineeId, rating = 5, notes = 'Completed Day 6 certification evaluation successfully.') {
    return await this.evaluateTrainee(traineeId, {
      progress: 0,
      rating: Number(rating) || 5,
      status: 'CERTIFIED',
      notes: notes
    });
  },`;

const newCertify = `  async certifyTrainee(traineeId, rating = 5, notes = 'Completed Day 6 certification evaluation successfully.') {
    const res = await this.evaluateTrainee(traineeId, {
      progress: 100,
      rating: Number(rating) || 5,
      status: 'CERTIFIED',
      notes: notes
    });

    try {
      // 1. Fetch Trainee Doc to get the actual Employee ID (often they are the same)
      const traineeDoc = await db.collection('trainees').doc(traineeId).get();
      if (!traineeDoc.exists) return res;
      
      const traineeData = traineeDoc.data();
      const employeeId = traineeData.employeeId || traineeId; // Fallback to traineeId if it matches

      // 2. Update Employees Collection
      await db.collection('employees').doc(employeeId).set({
        roleId: 'EMPLOYEE',
        trainingStatus: 'COMPLETED',
        certificationStatus: 'PASSED',
        employmentStatus: 'ACTIVE',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 3. Update Users Collection (Auth Role)
      // Usually userId == employeeId
      const empDoc = await db.collection('employees').doc(employeeId).get();
      let userId = employeeId;
      if (empDoc.exists && empDoc.data().userId) {
        userId = empDoc.data().userId;
      }

      await db.collection('users').doc(userId).set({
        roleId: 'EMPLOYEE',
        status: 'ACTIVE',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 4. Log Audit
      if (window.auditService) {
        await auditService.log('CERTIFICATION_PASSED', 'TRAINING', 'employees', employeeId, { rating, notes });
      }

      console.log(\`Successfully transitioned Trainee \${employeeId} to Employee.\`);
    } catch (err) {
      console.warn('Error transitioning trainee to employee:', err);
    }
    
    return res;
  },`;

c = c.replace(oldCertify, newCertify);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED trainingService.js certifyTrainee');
