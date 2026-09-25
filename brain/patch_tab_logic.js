const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Fix the redirection logic
const OLD_LOGIC = `    if (isTrainee && (this.activeTab === 'trainees' || this.activeTab === 'trainers')) {
      this.activeTab = 'my_learning';
    } else if (isTrainer && this.activeTab === 'my_learning') {
      this.activeTab = 'trainees';
    } else if (isEmployee && this.activeTab === 'trainees') {
      this.activeTab = 'my_learning';
    }`;

const NEW_LOGIC = `    const isAdmin = !isTrainee && !isEmployee && !isTrainer;
    
    // Prevent trainees / standard employees from accessing restricted tabs
    if (!isAdmin && !isTrainer && this.activeTab !== 'my_learning') {
      this.activeTab = 'my_learning';
    }
    
    // Default tab for trainer if they just landed
    if (isTrainer && !this.activeTab) {
      this.activeTab = 'trainees';
    }`;

c = c.replace(OLD_LOGIC, NEW_LOGIC);

// 2. Change the tab label
const OLD_LABEL = "${isTrainee ? 'My Learning Track & Modules' : (isEmployee ? 'My Learning & Mentorship' : 'Trainee Learning Track (Preview)')}";
const NEW_LABEL = "${isTrainee ? 'My Learning Track & Modules' : (isEmployee ? 'My Learning & Mentorship' : 'Trainee Curriculum & Mentorship')}";

c = c.replace(OLD_LABEL, NEW_LABEL);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED training-view.js tab logic and label');
