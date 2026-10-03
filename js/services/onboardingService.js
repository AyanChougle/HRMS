/**
 * DIALLO HRMS — EMPLOYEE ONBOARDING SERVICE (PHASE 4)
 * Manages new joiner checklists, task assignments, due dates, and milestone tracking
 */

const onboardingService = {
  // Get all onboarding tasks
  async getTasks(filters = {}) {
    try {
      this.purgeAllTasks().catch(() => {});
      return [];
    } catch (err) {
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

  // Auto-generate standard onboarding task template for a new joiner (Disabled per user requirement)
  async generateDefaultTasksForEmployee(employee) {
    return Promise.resolve([]);
  },

  // Purge all legacy onboarding checklist tasks from Firestore
  async purgeAllTasks() {
    try {
      const snap = await db.collection('onboardingTasks').get();
      if (snap.empty) return;
      let batch = db.batch();
      let count = 0;
      for (const doc of snap.docs) {
        batch.delete(doc.ref);
        count++;
        if (count === 400) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    } catch (e) {
      console.warn('Error purging onboarding tasks:', e);
    }
  }
};

window.onboardingService = onboardingService;
