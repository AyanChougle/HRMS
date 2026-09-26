const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/services/approvalService.js';
let c = fs.readFileSync(path, 'utf8');

const oldGetApprovals = `      if (filters.status && filters.status !== 'ALL') {
        query = query.where('status', '==', filters.status);
      } else {
        query = query.where('status', '==', 'PENDING');
      }`;

const newGetApprovals = `      if (filters.status && filters.status !== 'ALL') {
        query = query.where('status', '==', filters.status);
      } else {
        query = query.where('status', '==', 'PENDING');
      }`;

// Wait, I need to filter the results post-query, because Firestore doesn't support complex OR queries easily (assignedTo == uid OR assignedRole == roleId).
const oldFilter = `      if (filters.module && filters.module !== 'ALL') {
        list = list.filter(t => t.module === filters.module);
      }

      return list;`;

const newFilter = `      if (filters.module && filters.module !== 'ALL') {
        list = list.filter(t => t.module === filters.module);
      }

      // Enforce Scope: Only show tasks explicitly assigned to me OR to my generic HR role pool
      if (roleId !== 'SUPER_ADMIN') {
        list = list.filter(t => {
          if (t.assignedTo && t.assignedTo === uid) return true;
          if (!t.assignedTo && (t.assignedRole === roleId || t.assignedRole === 'HR' && roleId === 'HR_MANAGER')) return true;
          return false;
        });
      }

      return list;`;

c = c.replace(oldFilter, newFilter);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED approvalService.js getMyApprovals scope filter');
