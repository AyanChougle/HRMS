const fs = require('fs');

// 1. Patch performanceCycleService.js
const pcPath = 'D:/AYAN/HRMS/js/services/performanceCycleService.js';
let pcCode = fs.readFileSync(pcPath, 'utf8');

const oldPcQuery = `const snapshot = await db.collection('performanceCycles')
        .where('companyId', '==', companyId)
        .orderBy('createdAt', 'desc')
        .get();`;

const newPcQuery = `let snapshot;
      try {
        snapshot = await db.collection('performanceCycles')
          .where('companyId', '==', companyId)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (idxErr) {
        snapshot = await db.collection('performanceCycles')
          .where('companyId', '==', companyId)
          .get();
      }`;

pcCode = pcCode.replace(oldPcQuery, newPcQuery);
fs.writeFileSync(pcPath, pcCode, 'utf8');
console.log('Patched performanceCycleService.js index fallback');

// 2. Patch workflowService.js
const wfPath = 'D:/AYAN/HRMS/js/services/workflowService.js';
let wfCode = fs.readFileSync(wfPath, 'utf8');

const oldWfQuery = `const snapshot = await query.orderBy('createdAt', 'desc').get();`;

const newWfQuery = `let snapshot;
      try {
        snapshot = await query.orderBy('createdAt', 'desc').get();
      } catch (idxErr) {
        snapshot = await query.get();
      }`;

wfCode = wfCode.replace(oldWfQuery, newWfQuery);
fs.writeFileSync(wfPath, wfCode, 'utf8');
console.log('Patched workflowService.js index fallback');
