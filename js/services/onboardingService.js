/**
 * DIALLO HRMS — EMPLOYEE ONBOARDING SERVICE (PHASE 4)
 * Manages new joiner checklists, task assignments, due dates, and milestone tracking
 */

const onboardingService = {
  // Get all onboarding tasks
  async getTasks(filters = {}) {
    try {
      let query = db.collection('onboardingTasks');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.status) query = query.where('status', '==', filters.status);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching onboarding tasks:', err);
      return [];
    }
  },

  // Create a new onboarding task
  async createTask(taskData) {
    try {
      const payload = {
        employeeId: taskData.employeeId,
        employeeName: taskData.employeeName || 'New Joiner',
        companyId: taskData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        title: taskData.title,
        description: taskData.description || '',
        assignedTo: taskData.assignedTo || 'HR Team',
        dueDate: taskData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: taskData.status || 'PENDING', // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('onboardingTasks').add(payload);
      await auditService.log('ONBOARDING_TASK_CREATED', 'ONBOARDING', 'onboardingTasks', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating onboarding task:', err);
      throw err;
    }
  },

  // Update task status
  async updateTaskStatus(taskId, status) {
    try {
      const updateData = {
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (status === 'COMPLETED') {
        updateData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      await db.collection('onboardingTasks').doc(taskId).update(updateData);
      await auditService.log('ONBOARDING_TASK_UPDATED', 'ONBOARDING', 'onboardingTasks', taskId, { status });
      return true;
    } catch (err) {
      console.error('Error updating onboarding task:', err);
      throw err;
    }
  },

  // Update onboarding task details
  async updateTask(taskId, updateData) {
    try {
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('onboardingTasks').doc(taskId).update(payload);
      await auditService.log('ONBOARDING_TASK_UPDATED', 'ONBOARDING', 'onboardingTasks', taskId, updateData);
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  },

  // Delete onboarding task
  async deleteTask(taskId) {
    try {
      await db.collection('onboardingTasks').doc(taskId).delete();
      await auditService.log('ONBOARDING_TASK_DELETED', 'ONBOARDING', 'onboardingTasks', taskId, {});
      return true;
    } catch (err) {
      console.error('Error deleting onboarding task:', err);
      throw err;
    }
  },

  // Auto-generate standard onboarding task template for a new joiner
  async generateDefaultTasksForEmployee(employee) {
    const defaultTemplates = [
      { title: 'Identity & Address Document Verification', description: 'Collect and verify PAN, Aadhaar, and address proof', assignedTo: 'HR Operations' },
      { title: 'Corporate Email & Portal Account Setup', description: 'Generate Diallo portal credentials and official work email', assignedTo: 'IT Support' },
      { title: 'Assign Workspace & Hardware Assets', description: 'Issue laptop, access card, and workstation', assignedTo: 'IT Support' },
      { title: 'HR Orientation & Policy Walkthrough', description: 'Conduct Day-1 company overview and code of conduct review', assignedTo: 'HR Team' },
      { title: 'Manager 1-on-1 & Goal Setting', description: 'Introduction with reporting manager and 90-day expectation alignment', assignedTo: employee.manager || 'Manager' }
    ];

    for (const t of defaultTemplates) {
      await this.createTask({
        employeeId: employee.id,
        employeeName: employee.fullName || employee.name,
        title: t.title,
        description: t.description,
        assignedTo: t.assignedTo,
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
      });
    }
  }
};

window.onboardingService = onboardingService;
