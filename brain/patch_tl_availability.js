const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/services/workflowService.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldResolution = `            if (assignedRole === 'DIRECT_MANAGER') {
              // Try Team Leader first, then Ops Manager, then Manager
              assignedTo = emp.teamLeaderId || emp.operationsManagerId || emp.managerId || '';
            } else if (assignedRole === 'SECOND_LEVEL_MANAGER') {
              assignedTo = emp.operationsManagerId || emp.managerId || '';
            }`;

const newResolution = `            if (assignedRole === 'DIRECT_MANAGER') {
              let isTlAvailable = true;
              if (emp.teamLeaderId) {
                try {
                  const tlDoc = await db.collection('employees').doc(emp.teamLeaderId).get();
                  if (tlDoc.exists) {
                    const tlData = tlDoc.data();
                    const st = (tlData.status || tlData.employmentStatus || 'ACTIVE').toUpperCase().trim();
                    if (['ON_LEAVE', 'INACTIVE', 'SUSPENDED', 'UNAVAILABLE', 'DEACTIVATED'].includes(st)) {
                      isTlAvailable = false;
                    }
                  }
                } catch (tlErr) { isTlAvailable = true; }
              }

              if (emp.teamLeaderId && isTlAvailable) {
                assignedTo = emp.teamLeaderId;
              } else {
                // Auto-bypass unavailable Team Lead to Operations Manager
                assignedTo = emp.operationsManagerId || emp.managerId || '';
              }
            } else if (assignedRole === 'SECOND_LEVEL_MANAGER') {
              assignedTo = emp.operationsManagerId || emp.managerId || '';
            }`;

content = content.replace(oldResolution, newResolution);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched workflowService.js with Team Lead availability bypass logic');
