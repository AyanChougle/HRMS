/**
 * DIALLO HRMS — TRAINING, TRAINEES & TRAINERS SERVICE (L&D)
 * Manages Intern/Trainee Cohorts, Trainer Directory, Training Programs, Mentorship 1-on-1s, and Certifications
 */

const trainingService = {
  // 1. TRAINEES MANAGEMENT
  async getTrainees(filters = {}) {
    try {
      const companyId = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let query = db.collection('trainees').where('companyId', '==', companyId);

      if (filters.status && filters.status !== 'ALL') {
        query = query.where('status', '==', filters.status);
      }
      if (filters.trainerId) {
        query = query.where('trainerId', '==', filters.trainerId);
      }
      if (filters.department && filters.department !== 'ALL') {
        query = query.where('department', '==', filters.department);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching trainees:', e);
      return [];
    }
  },

  async getTrainee(traineeId) {
    try {
      const doc = await db.collection('trainees').doc(traineeId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (e) {
      return null;
    }
  },

  async createTrainee(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        traineeCode: data.traineeCode || `TRN-${Date.now().toString().slice(-4)}`,
        department: data.department || 'Engineering & Technology',
        track: data.track || 'Graduate Engineering Trainee (GET)',
        trainerId: data.trainerId || null,
        trainerName: data.trainerName || 'Unassigned',
        batchName: data.batchName || 'Cohort 2026-Q3',
        startDate: data.startDate || new Date().toISOString().slice(0, 10),
        targetEndDate: data.targetEndDate || '2026-12-31',
        progress: Number(data.progress) || 0,
        completedModules: Number(data.completedModules) || 0,
        totalModules: Number(data.totalModules) || 5,
        status: data.status || 'IN_TRAINING', // IN_TRAINING, IN_EVALUATION, CERTIFIED, ONBOARDED
        rating: Number(data.rating) || 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: AuthGuard.userProfile?.displayName || 'HR Administrator'
      };

      const docRef = await db.collection('trainees').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('TRAINEE_ENROLLED', 'L&D', 'trainees', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating trainee:', e);
      throw e;
    }
  },

  async updateTrainee(traineeId, updates) {
    try {
      await db.collection('trainees').doc(traineeId).set({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      throw e;
    }
  },

  async deleteTrainee(traineeId) {
    try {
      await db.collection('trainees').doc(traineeId).delete();
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 2. TRAINERS & MENTORS DIRECTORY
  async getTrainers(filters = {}) {
    try {
      const companyId = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let query = db.collection('trainers').where('companyId', '==', companyId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching trainers:', e);
      return [];
    }
  },

  async createTrainer(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone || '+91 98000 00000',
        trainerType: data.trainerType || 'INTERNAL', // INTERNAL, EXTERNAL
        designation: data.designation || 'Senior Technical Mentor',
        specialization: data.specialization || 'Full Stack Architecture & Cloud',
        batchesConducted: Number(data.batchesConducted) || 0,
        activeTrainees: Number(data.activeTrainees) || 0,
        rating: Number(data.rating) || 5.0,
        bio: data.bio || 'Experienced technical instructor and organizational coach.',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('trainers').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating trainer:', e);
      throw e;
    }
  },

  async deleteTrainer(trainerId) {
    try {
      await db.collection('trainers').doc(trainerId).delete();
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 3. TRAINING PROGRAMS & BATCHES
  async getPrograms(filters = {}) {
    try {
      const companyId = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let query = db.collection('trainingPrograms').where('companyId', '==', companyId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching training programs:', e);
      return [];
    }
  },

  async createProgram(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        title: data.title.trim(),
        category: data.category || 'Technical Engineering',
        duration: data.duration || '8 Weeks',
        mode: data.mode || 'HYBRID', // HYBRID, CLASSROOM, VIRTUAL
        trainerName: data.trainerName || 'Assigned Lead',
        trainerId: data.trainerId || null,
        enrolledCount: Number(data.enrolledCount) || 0,
        status: data.status || 'ACTIVE', // ACTIVE, UPCOMING, COMPLETED
        modules: Array.isArray(data.modules) ? data.modules : (data.modules ? data.modules.split('\n').map(m => m.trim()).filter(Boolean) : ['Foundational Overview', 'Deep Dive Core', 'Practical Project', 'Assessment & Certification']),
        description: data.description || 'Comprehensive organizational upskilling and mentorship program.',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('trainingPrograms').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating program:', e);
      throw e;
    }
  },

  async deleteProgram(programId) {
    try {
      await db.collection('trainingPrograms').doc(programId).delete();
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 4. RECORD EVALUATION & CERTIFY
  async evaluateTrainee(traineeId, evaluationData) {
    try {
      const updates = {
        progress: Number(evaluationData.progress) || 100,
        rating: Number(evaluationData.rating) || 5,
        status: evaluationData.status || 'CERTIFIED',
        evaluationNotes: evaluationData.notes || '',
        evaluatedBy: AuthGuard.userProfile?.displayName || 'Lead Trainer',
        evaluatedAt: new Date().toISOString()
      };

      if (updates.status === 'CERTIFIED') {
        updates.certifiedDate = new Date().toISOString().slice(0, 10);
      }

      await this.updateTrainee(traineeId, updates);
      if (typeof Toast !== 'undefined') {
        Toast.success('Trainee evaluation recorded successfully!');
      }
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.trainingService = trainingService;
