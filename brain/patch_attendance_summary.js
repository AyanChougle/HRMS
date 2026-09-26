const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/services/attendanceService.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldSummary = `  async getTodaySummary(companyId = null) {
    try {
      const todayStr = this.getCompanyLocalDate();
      let query = db.collection('attendanceRecords').where('date', '==', todayStr);
      if (companyId) query = query.where('companyId', '==', companyId);

      const [snapshot, totalEmpSnap] = await Promise.all([
        query.get(),
        db.collection('employees').where('employmentStatus', '==', 'ACTIVE').get()
      ]);

      const totalEmployees = totalEmpSnap.size;
      let present = 0;
      let late = 0;
      let onLeave = 0;
      let wfh = 0;

      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.status === 'PRESENT' || d.status === 'REGULARIZED') present++;
        else if (d.status === 'LATE') { present++; late++; }
        else if (d.status === 'ON_LEAVE') onLeave++;
        else if (d.status === 'WFH') wfh++;
      });

      return {
        totalEmployees,
        present,
        onTime: Math.max(0, present - late),
        late,
        onLeave,
        wfh,
        absent: Math.max(0, totalEmployees - present - onLeave),
        avgWorkHours: present > 0 ? '8h 45m' : '0h 00m'
      };
    } catch (err) {
      console.error('Error computing attendance summary:', err);
      return { totalEmployees: 0, present: 0, onTime: 0, late: 0, onLeave: 0, wfh: 0, absent: 0, avgWorkHours: '0h 00m' };
    }
  },`;

const newSummary = `  async getTodaySummary(companyId = null, employeeIds = null) {
    try {
      const todayStr = this.getCompanyLocalDate();
      let query = db.collection('attendanceRecords').where('date', '==', todayStr);
      if (companyId) query = query.where('companyId', '==', companyId);

      const snapshot = await query.get();
      let docs = snapshot.docs.map(doc => doc.data());

      if (Array.isArray(employeeIds)) {
        const idSet = new Set(employeeIds);
        docs = docs.filter(d => idSet.has(d.employeeId) || idSet.has(d.uid));
      }

      let totalEmployees = 0;
      if (Array.isArray(employeeIds)) {
        totalEmployees = employeeIds.length;
      } else {
        const totalEmpSnap = await db.collection('employees').where('employmentStatus', '==', 'ACTIVE').get();
        totalEmployees = totalEmpSnap.size;
      }

      let present = 0;
      let late = 0;
      let onLeave = 0;
      let wfh = 0;

      docs.forEach(d => {
        if (d.status === 'PRESENT' || d.status === 'REGULARIZED') present++;
        else if (d.status === 'LATE') { present++; late++; }
        else if (d.status === 'ON_LEAVE') onLeave++;
        else if (d.status === 'WFH') wfh++;
      });

      return {
        totalEmployees,
        present,
        onTime: Math.max(0, present - late),
        late,
        onLeave,
        wfh,
        absent: Math.max(0, totalEmployees - present - onLeave),
        avgWorkHours: present > 0 ? '8h 45m' : '0h 00m'
      };
    } catch (err) {
      console.error('Error computing attendance summary:', err);
      return { totalEmployees: 0, present: 0, onTime: 0, late: 0, onLeave: 0, wfh: 0, absent: 0, avgWorkHours: '0h 00m' };
    }
  },`;

content = content.replace(oldSummary, newSummary);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched attendanceService.js getTodaySummary with employeeIds array support');
