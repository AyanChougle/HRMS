/**
 * DIALLO HRMS — TRAINING, TRAINEES & TRAINERS SERVICE (L&D)
 * Manages Intern/Trainee Cohorts, Trainer Directory, Training Programs, Mentorship 1-on-1s, and Certifications
 */

const trainingService = {
  // Official 7-Day Training Modules Framework
  SEVEN_DAY_MODULES: [
    {
      day: 1,
      title: 'Introduction, Trade Types, Market, What is Cryptocurrency',
      topics: [
        'Welcome & Company Induction',
        'Financial Markets & Trade Types Overview',
        'Market Terminology & Key Indicators',
        'Introduction to Cryptocurrency & Blockchain Essentials',
        'Day 1 Knowledge Check & Q&A'
      ],
      duration: '9 Hours (10:00 AM - 07:00 PM)',
      learningObjectives: 'Understand market basics, trading types, and core cryptocurrency fundamentals.'
    },
    {
      day: 2,
      title: 'Product Training, Company Overview',
      topics: [
        'Diallo Organization Structure & Value Proposition',
        'Platform Features, Tools & Trading Interfaces',
        'Client Solutions & Service Architecture',
        'Competitive Advantage & Industry Positioning',
        'Day 2 Product Walkthrough & Assessment'
      ],
      duration: '9 Hours (10:00 AM - 07:00 PM)',
      learningObjectives: 'Master company solutions, product suites, and operational workflows.'
    },
    {
      day: 3,
      title: 'Calculation and Rebuttals',
      topics: [
        'Trade Calculations, Leverage, Margin & Spread Math',
        'Fee Structures, Profit/Loss Formulas & Risk Ratios',
        'Customer Objection Scenarios & Practical Rebuttals',
        'Overcoming Skepticism with Data & Facts',
        'Calculation Speed Drills & Rebuttal Roleplay'
      ],
      duration: '9 Hours (10:00 AM - 07:00 PM)',
      learningObjectives: 'Accurately perform trade calculations and confidently address common client objections.'
    },
    {
      day: 4,
      title: 'Rebuttals and Mock Call Practice',
      topics: [
        'Advanced Rebuttals for High-Resistance Scenarios',
        'Call Flow, Pitching & Active Listening Standards',
        'Live Mock Call Practice Session Part 1',
        'Trainer Critique & Peer Feedback Matrix',
        'Call Recording Analysis & Corrections'
      ],
      duration: '9 Hours (10:00 AM - 07:00 PM)',
      learningObjectives: 'Perfect call flow articulation and handle live customer resistance effectively.'
    },
    {
      day: 5,
      title: 'Mock Call Practice',
      topics: [
        'Intensive Simulation Drills (Inbound & Outbound Scenarios)',
        'Edge Case Handling & Escalation Framework',
        'Tone, Pitch, Professional Etiquette & Rapport Building',
        'Trainer Scorecard Evaluations (1-on-1)',
        'Certification Readiness Review'
      ],
      duration: '9 Hours (10:00 AM - 07:00 PM)',
      learningObjectives: 'Demonstrate end-to-end call competency under live simulated conditions.'
    },
    {
      day: 6,
      title: 'Certification',
      topics: [
        'Comprehensive Theory Examination (Market, Crypto & Product)',
        'Calculation Test (Margin, Leverage & PnL)',
        'Final Benchmark Mock Call Evaluation with Lead Trainer',
        'Quality Compliance Review & Scorecard Issuance',
        'Official Training Certificate Awarding'
      ],
      duration: '9 Hours (10:00 AM - 07:00 PM)',
      learningObjectives: 'Pass statutory training assessment and receive certified trainee credential.'
    },
    {
      day: 7,
      title: 'Handover to Floor',
      topics: [
        'Floor Orientation & Team Introduction',
        'Workstation Setup (Laptop, Headset, ID, CRM Credentials)',
        'Introduction to Assigned Reporting Manager / Team Lead',
        'Live Floor Shadowing & Buddy System Kickoff',
        'Official Onboarding Handover Sign-off'
      ],
      duration: '9 Hours (10:00 AM - 07:00 PM)',
      learningObjectives: 'Seamlessly transition from training environment to production operational floor.'
    }
  ],

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
      const currentDay = Number(data.currentDay) || 1;
      const totalDays = 7;
      const progress = Math.round((currentDay / totalDays) * 100);

      const payload = {
        companyId,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        traineeCode: data.traineeCode || `TRN-${Date.now().toString().slice(-4)}`,
        department: data.department || 'Operations',
        track: data.track || '7-Day Core Training Modules',
        trainerId: data.trainerId || null,
        trainerName: data.trainerName || (typeof AuthGuard !== 'undefined' && AuthGuard?.userProfile?.displayName) || 'Corporate Trainer',
        batchName: data.batchName || 'Batch 2026-Q3',
        currentDay: currentDay,
        totalDays: totalDays,
        currentModuleTitle: this.SEVEN_DAY_MODULES[currentDay - 1]?.title || 'Day 1 Training',
        startDate: data.startDate || new Date().toISOString().slice(0, 10),
        targetEndDate: data.targetEndDate || '2026-12-31',
        progress: progress,
        completedModules: currentDay > 1 ? currentDay - 1 : 0,
        totalModules: totalDays,
        status: data.status || 'IN_TRAINING', // IN_TRAINING, CERTIFIED, HANDED_OVER
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
        mode: data.mode || 'CLASSROOM', // HYBRID, CLASSROOM, VIRTUAL
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
        progress: Number(evaluationData.progress) || 0,
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
  },

  // 5. PROGRESSION ACTIONS
  async advanceTraineeDay(traineeId, currentDay) {
    try {
      const nextDay = Math.min(Number(currentDay) + 1, 7);
      const nextModule = this.SEVEN_DAY_MODULES[nextDay - 1];
      const progress = Math.round((nextDay / 7) * 100);

      const updates = {
        currentDay: nextDay,
        completedModules: nextDay - 1,
        progress: progress,
        currentModuleTitle: nextModule?.title || `Day ${nextDay} Training`,
        status: nextDay === 6 ? 'CERTIFIED' : (nextDay === 7 ? 'HANDED_OVER' : 'IN_TRAINING'),
        lastAdvancedAt: new Date().toISOString(),
        lastAdvancedBy: AuthGuard.userProfile?.displayName || 'Lead Trainer'
      };

      if (nextDay === 6) {
        updates.certifiedDate = new Date().toISOString().slice(0, 10);
      }
      if (nextDay === 7) {
        updates.handoverDate = new Date().toISOString().slice(0, 10);
      }

      await this.updateTrainee(traineeId, updates);
      if (typeof Toast !== 'undefined') {
        Toast.success(`Trainee advanced to Day ${nextDay}: ${nextModule?.title || ''}`);
      }
      return updates;
    } catch (e) {
      console.error('Error advancing trainee day:', e);
      throw e;
    }
  },

  async certifyTrainee(traineeId, rating = 5, notes = 'Completed Day 6 certification evaluation successfully.') {
    return await this.evaluateTrainee(traineeId, {
      progress: 0,
      rating: Number(rating) || 5,
      status: 'CERTIFIED',
      notes: notes
    });
  },

  async handoverToFloor(traineeId, department = 'Operations', teamLeadName = 'Reporting Manager') {
    try {
      const updates = {
        currentDay: 7,
        completedModules: 7,
        progress: 100,
        status: 'HANDED_OVER',
        handoverDepartment: department,
        assignedTeamLead: teamLeadName,
        handoverDate: new Date().toISOString().slice(0, 10),
        handedOverBy: AuthGuard.userProfile?.displayName || 'Lead Trainer'
      };
      await this.updateTrainee(traineeId, updates);
      if (typeof Toast !== 'undefined') {
        Toast.success(`Trainee officially handed over to ${department} floor!`);
      }
      return updates;
    } catch (e) {
      console.error('Error completing floor handover:', e);
      throw e;
    }
  }
};

window.trainingService = trainingService;
