const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/services/employeeService.js';
let c = fs.readFileSync(path, 'utf8');

const oldOrgBlock = `        department: employeeData.department || 'Engineering',
        designationId: employeeData.designationId || '',
        designation: employeeData.designation || 'Staff',
        gradeId: employeeData.gradeId || 'G2',
        costCenterId: employeeData.costCenterId || '',
        managerId: employeeData.managerId || '',
        manager: employeeData.manager || '',`;

const newOrgBlock = `        department: employeeData.department || 'Engineering',
        designationId: employeeData.designationId || '',
        designation: employeeData.designation || 'Staff',
        gradeId: employeeData.gradeId || 'G2',
        costCenterId: employeeData.costCenterId || '',
        managerId: employeeData.managerId || '',
        manager: employeeData.manager || '',
        operationsManagerId: employeeData.operationsManagerId || '',
        teamLeaderId: employeeData.teamLeaderId || '',
        mentorTrainerId: employeeData.mentorTrainerId || '',
        
        // Lifecycle
        trainingStatus: employeeData.trainingStatus || (employeeData.roleId === 'TRAINEE' ? 'IN_PROGRESS' : 'COMPLETED'),
        certificationStatus: employeeData.certificationStatus || (employeeData.roleId === 'TRAINEE' ? 'PENDING' : 'PASSED'),
        employmentStatus: employeeData.employmentStatus || 'ACTIVE',
        isActive: employeeData.isActive !== undefined ? employeeData.isActive : true,`;

c = c.replace(oldOrgBlock, newOrgBlock);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED employeeService.js');
