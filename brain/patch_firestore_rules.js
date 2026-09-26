const fs = require('fs');
const path = 'D:/AYAN/HRMS/firestore.rules';
let c = fs.readFileSync(path, 'utf8');

const oldFunctions = `    function isAdmin() {
      return isAuthenticated() && tokenRole() in ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'];
    }

    // "Privileged" = can manage most company data (admins, HR, payroll for their domain).
    function isPrivileged() {
      return isAuthenticated() && (isAdmin() || tokenRole() in ['HR', 'PAYROLL']);
    }`;

const newFunctions = `    function isAdmin() {
      return isAuthenticated() && tokenRole() == 'SUPER_ADMIN';
    }

    function isHRManager() {
      return isAuthenticated() && tokenRole() == 'HR_MANAGER';
    }

    function isPrivileged() {
      return isAuthenticated() && (isAdmin() || isHRManager());
    }

    function isManagerOfRecord(resourceData) {
      return isAuthenticated() && (
        resourceData.managerId == request.auth.uid || 
        resourceData.operationsManagerId == request.auth.uid || 
        resourceData.teamLeaderId == request.auth.uid || 
        resourceData.mentorTrainerId == request.auth.uid
      );
    }`;

c = c.replace(oldFunctions, newFunctions);

// Add the contextual scope to the self-service block
const oldSelfServiceRead = `(isSameCompany(resource.data.companyId) && (
            resource.data.employeeId == request.auth.uid ||
            resource.data.requestedById == request.auth.uid ||
            resource.data.recipientId == request.auth.uid ||
            resource.data.uid == request.auth.uid
          ))`;

const newSelfServiceRead = `(isSameCompany(resource.data.companyId) && (
            resource.data.employeeId == request.auth.uid ||
            resource.data.requestedById == request.auth.uid ||
            resource.data.recipientId == request.auth.uid ||
            resource.data.uid == request.auth.uid ||
            isManagerOfRecord(resource.data)
          ))`;

c = c.replace(oldSelfServiceRead, newSelfServiceRead);
c = c.replace(oldSelfServiceRead, newSelfServiceRead); // Do it twice, one for read, one for update/delete!

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED firestore.rules');
