const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

const OLD_HEADER = "  renderMyLearningTab(trainees, trainers, programs) {\n" +
"    const userEmail = (AuthGuard.userProfile?.email || AuthGuard.currentUser?.email || '').toLowerCase();\n" +
"    const userName = AuthGuard.userProfile?.displayName || 'Trainee';";

const NEW_HEADER = "  renderMyLearningTab(trainees, trainers, programs) {\n" +
"    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();\n" +
"    const isTrainer = rawRole === 'TRAINER' || rawRole === 'MENTOR';\n" +
"    const userEmail = (AuthGuard.userProfile?.email || AuthGuard.currentUser?.email || '').toLowerCase();\n" +
"    const userName = AuthGuard.userProfile?.displayName || 'Trainee';";

c = c.replace(OLD_HEADER, NEW_HEADER);
fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED renderMyLearningTab with isTrainer');
