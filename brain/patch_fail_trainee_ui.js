const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

const certifyBtn = `<button class="btn btn-secondary btn-sm" onclick="TrainingView.openCertifyModal('\${t.id}', '\${(t.fullName || '').replace(/'/g, "\\\\'")}')" title="Award Day 6 Certification">
                            Certify
                          </button>`;

const failBtn = `<button class="btn btn-danger btn-sm" onclick="TrainingView.failTrainee('\${t.id}', '\${(t.fullName || '').replace(/'/g, "\\\\'")}')" title="Fail Certification and send to HR">
                            Fail
                          </button>`;

c = c.replace(certifyBtn, certifyBtn + '\\n                          ' + failBtn);

const newMethods = `
  async failTrainee(traineeId, traineeName) {
    if (!confirm('Are you sure you want to fail ' + traineeName + '? This will immediately trigger the HR Termination Workflow and lock their account.')) return;
    
    try {
      const reason = prompt('Please provide a reason for certification failure (required):');
      if (!reason || !reason.trim()) {
        Toast.error('Failure reason is required.');
        return;
      }
      
      await trainingService.failTrainee(traineeId, reason);
      Toast.success(traineeName + ' has been marked as failed and pushed to HR termination workflow.');
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not fail trainee: ' + (e.message || e));
    }
  },
`;

c = c.replace(/openCertifyModal\(traineeId, fullName\) \{/g, newMethods + '\\n  openCertifyModal(traineeId, fullName) {');

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED training-view.js with Fail button');
