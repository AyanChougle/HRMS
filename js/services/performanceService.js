/**
 * DIALLO HRMS — PERFORMANCE & APPRAISAL MANAGEMENT SERVICE (PHASE 8)
 * Goals & OKRs, KPIs, Competencies, Multi-Tier Reviews, 1-on-1s, Development Plans, PIPs, and Appraisal Recommendations
 */

const performanceService = {
  // Built-in Default Competencies Registry
  DEFAULT_COMPETENCIES: [
    { name: 'Technical Excellence', category: 'FUNCTIONAL', description: 'Domain competence, code/architectural quality, and engineering best practices' },
    { name: 'Communication & Collaboration', category: 'BEHAVIORAL', description: 'Clear articulation, active listening, and constructive cross-functional teamwork' },
    { name: 'Problem Solving & Innovation', category: 'FUNCTIONAL', description: 'Analytical troubleshooting, creative problem resolution, and process automation' },
    { name: 'Ownership & Accountability', category: 'BEHAVIORAL', description: 'End-to-end task delivery, reliability, and meeting critical deadlines' },
    { name: 'Customer Focus & Empathy', category: 'BUSINESS', description: 'Understanding user needs and delivering high-value business outcomes' }
  ],

  // 1. GOAL MANAGEMENT (OKRs)
  async getGoals(filters = {}) {
    try {
      let query = db.collection('performanceGoals');
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.cycleId) query = query.where('cycleId', '==', filters.cycleId);
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching goals:', e);
      return [];
    }
  },

  async createGoal(goalData) {
    try {
      const employeeId = goalData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const companyId = goalData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      // Validate weight
      const existingGoals = await this.getGoals({ employeeId, cycleId: goalData.cycleId });
      const currentTotalWeight = existingGoals.reduce((sum, g) => sum + (Number(g.weight) || 0), 0);
      const newWeight = Number(goalData.weight) || 20;

      if (currentTotalWeight + newWeight > 100) {
        throw new Error(`Total goal weights cannot exceed 100%. Current total: ${currentTotalWeight}%, trying to add: ${newWeight}%.`);
      }

      const payload = {
        employeeId,
        companyId,
        cycleId: goalData.cycleId || 'cycle_2026_annual',
        title: goalData.title,
        description: goalData.description || '',
        category: goalData.category || 'BUSINESS', // BUSINESS, FINANCIAL, CUSTOMER, OPERATIONAL, LEARNING, TEAM
        priority: goalData.priority || 'HIGH', // LOW, MEDIUM, HIGH, CRITICAL
        weight: newWeight,
        target: goalData.target || '100%',
        measurementUnit: goalData.measurementUnit || '%',
        startDate: goalData.startDate || new Date().toISOString().slice(0, 10),
        dueDate: goalData.dueDate || '2026-12-31',
        progress: 0,
        status: 'NOT_STARTED', // NOT_STARTED, IN_PROGRESS, AT_RISK, COMPLETED
        createdBy: AuthGuard.userProfile?.displayName || 'User',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('performanceGoals').add(payload);
      payload.id = docRef.id;

      await auditService.log('GOAL_CREATED', 'PERFORMANCE', 'performanceGoals', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error creating goal:', err);
      throw err;
    }
  },

  async updateGoalProgress(goalId, newProgress, comment = '') {
    try {
      const goalDoc = await db.collection('performanceGoals').doc(goalId).get();
      if (!goalDoc.exists) throw new Error('Goal not found');

      const oldGoal = goalDoc.data();
      const progressNum = Math.min(100, Math.max(0, Number(newProgress) || 0));
      let status = oldGoal.status;

      if (progressNum === 100) status = 'COMPLETED';
      else if (progressNum > 0) status = 'IN_PROGRESS';

      // 1. Log versioned progress history
      await db.collection('goalProgress').add({
        goalId,
        employeeId: oldGoal.employeeId,
        previousProgress: oldGoal.progress || 0,
        newProgress: progressNum,
        comment: comment || 'Progress updated',
        updatedBy: AuthGuard.userProfile?.displayName || 'Employee',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 2. Update goal record
      await db.collection('performanceGoals').doc(goalId).update({
        progress: progressNum,
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('GOAL_PROGRESS_UPDATED', 'PERFORMANCE', 'performanceGoals', goalId, { progress: progressNum, status });
      return true;
    } catch (err) {
      console.error('Error updating goal progress:', err);
      throw err;
    }
  },

  async getGoalProgressHistory(goalId) {
    try {
      const snapshot = await db.collection('goalProgress')
        .where('goalId', '==', goalId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  // 2. COMPETENCIES REGISTRY
  async getCompetencies(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('competencies')
        .where('companyId', '==', companyId)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Initialize default competencies if empty
      for (const c of this.DEFAULT_COMPETENCIES) {
        await db.collection('competencies').add({
          ...c,
          companyId,
          active: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      const fresh = await db.collection('competencies').where('companyId', '==', companyId).get();
      return fresh.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return this.DEFAULT_COMPETENCIES.map((c, i) => ({ id: `comp_${i}`, ...c }));
    }
  },

  // 3. REVIEWS WORKFLOW (SELF, MANAGER, HR)
  async getReviews(filters = {}) {
    try {
      let query = db.collection('performanceReviews');
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.cycleId) query = query.where('cycleId', '==', filters.cycleId);
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async getReviewForEmployee(employeeId, cycleId) {
    try {
      const reviewId = `${cycleId}_${employeeId}`;
      const doc = await db.collection('performanceReviews').doc(reviewId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (e) {
      return null;
    }
  },

  async submitSelfReview(data) {
    try {
      const employeeId = data.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const cycleId = data.cycleId || 'cycle_2026_annual';
      const reviewId = `${cycleId}_${employeeId}`;
      const emp = await employeeService.getEmployee(employeeId);

      const payload = {
        reviewId,
        cycleId,
        employeeId,
        companyId: emp?.companyId || 'comp_diallo_india',
        employeeSnapshot: {
          employeeCode: emp?.employeeCode || employeeId,
          fullName: emp?.fullName || emp?.name || 'Staff',
          department: emp?.department || 'General',
          designation: emp?.designation || 'Staff',
          managerId: emp?.managerId || '',
          manager: emp?.manager || ''
        },
        selfAssessment: {
          achievements: data.achievements || '',
          challenges: data.challenges || '',
          strengths: data.strengths || '',
          improvementAreas: data.improvementAreas || '',
          selfRating: Number(data.selfRating) || 4.0,
          submittedAt: new Date().toISOString()
        },
        status: 'SELF_REVIEW_SUBMITTED', // DRAFT, SELF_REVIEW_SUBMITTED, MANAGER_REVIEW_SUBMITTED, FINALIZED
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('performanceReviews').doc(reviewId).set(payload, { merge: true });
      await auditService.log('SELF_REVIEW_SUBMITTED', 'PERFORMANCE', 'performanceReviews', reviewId, payload);
      return payload;
    } catch (err) {
      console.error('Error submitting self review:', err);
      throw err;
    }
  },

  async submitManagerReview(reviewId, managerData) {
    try {
      const currentReviewDoc = await db.collection('performanceReviews').doc(reviewId).get();
      if (!currentReviewDoc.exists) throw new Error('Performance review not found');

      const r = currentReviewDoc.data();
      const goals = await this.getGoals({ employeeId: r.employeeId, cycleId: r.cycleId });
      const goalScore = performanceCalculationService.calculateGoalScore(goals);
      const competencyScore = performanceCalculationService.calculateCompetencyScore(managerData.competencyRatings || []);
      const overallScore = performanceCalculationService.calculateOverallScore(goalScore, competencyScore);
      const ratingLabel = performanceCalculationService.getRatingLabel(overallScore);

      const updates = {
        managerAssessment: {
          reviewerName: AuthGuard.userProfile?.displayName || 'Manager',
          reviewerId: AuthGuard.currentUser?.uid,
          feedback: managerData.feedback || '',
          strengths: managerData.strengths || '',
          improvementAreas: managerData.improvementAreas || '',
          competencyRatings: managerData.competencyRatings || [],
          goalScore,
          competencyScore,
          overallScore,
          ratingLabel,
          submittedAt: new Date().toISOString()
        },
        overallRating: overallScore,
        ratingLabel,
        status: 'MANAGER_REVIEW_SUBMITTED',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('performanceReviews').doc(reviewId).update(updates);
      await auditService.log('MANAGER_REVIEW_SUBMITTED', 'PERFORMANCE', 'performanceReviews', reviewId, updates);
      return { reviewId, ...r, ...updates };
    } catch (err) {
      console.error('Error submitting manager review:', err);
      throw err;
    }
  },

  async finalizeReview(reviewId, hrNotes = '') {
    try {
      await db.collection('performanceReviews').doc(reviewId).update({
        status: 'FINALIZED',
        hrNotes,
        finalizedBy: AuthGuard.userProfile?.displayName || 'HR Admin',
        finalizedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await auditService.log('PERFORMANCE_REVIEW_FINALIZED', 'PERFORMANCE', 'performanceReviews', reviewId, { hrNotes });
      return true;
    } catch (err) {
      console.error('Error finalizing review:', err);
      throw err;
    }
  },

  // 4. 1-ON-1 MEETINGS & CONTINUOUS FEEDBACK
  async getOneOnOnes(employeeId) {
    try {
      const snapshot = await db.collection('oneOnOneMeetings')
        .where('employeeId', '==', employeeId)
        .orderBy('date', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async scheduleOneOnOne(data) {
    try {
      const payload = {
        employeeId: data.employeeId,
        managerId: AuthGuard.currentUser?.uid,
        managerName: AuthGuard.userProfile?.displayName || 'Manager',
        date: data.date,
        time: data.time || '10:00 AM',
        agenda: data.agenda || 'Bi-weekly performance & coaching sync',
        notes: data.notes || '',
        status: 'SCHEDULED', // SCHEDULED, COMPLETED, CANCELLED
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('oneOnOneMeetings').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async getFeedback(employeeId) {
    try {
      const snapshot = await db.collection('performanceFeedback')
        .where('employeeId', '==', employeeId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async giveFeedback(data) {
    try {
      const payload = {
        employeeId: data.employeeId,
        fromUserName: AuthGuard.userProfile?.displayName || 'Manager',
        fromUserId: AuthGuard.currentUser?.uid,
        type: data.type || 'RECOGNITION', // RECOGNITION, CONSTRUCTIVE, GENERAL
        message: data.message,
        visibility: 'EMPLOYEE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('performanceFeedback').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  // 5. DEVELOPMENT PLANS & PIPs
  async getDevelopmentPlans(employeeId) {
    try {
      const snapshot = await db.collection('developmentPlans')
        .where('employeeId', '==', employeeId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async createDevelopmentPlan(data) {
    try {
      const payload = {
        employeeId: data.employeeId,
        area: data.area,
        currentSkill: data.currentSkill || '',
        targetSkill: data.targetSkill || '',
        actionItem: data.actionItem || 'Certification / Mentoring',
        targetDate: data.targetDate || '2026-12-31',
        status: 'IN_PROGRESS', // IN_PROGRESS, COMPLETED
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('developmentPlans').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async getPIPs(employeeId = null) {
    try {
      let query = db.collection('performanceImprovementPlans');
      if (employeeId) query = query.where('employeeId', '==', employeeId);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async createPIP(data) {
    try {
      const payload = {
        employeeId: data.employeeId,
        employeeName: data.employeeName || 'Staff',
        managerName: AuthGuard.userProfile?.displayName || 'Manager',
        startDate: data.startDate || new Date().toISOString().slice(0, 10),
        endDate: data.endDate || '2026-10-31',
        reason: data.reason,
        objectives: data.objectives,
        status: 'ACTIVE', // ACTIVE, COMPLETED, CLOSED
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('performanceImprovementPlans').add(payload);
      await auditService.log('PIP_CREATED', 'PERFORMANCE', 'performanceImprovementPlans', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  // 6. APPRAISAL RECOMMENDATIONS (INCREMENT / PROMOTION HANDOFF)
  async getAppraisalRecommendations(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('appraisalRecommendations')
        .where('companyId', '==', companyId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async createAppraisalRecommendation(data) {
    try {
      const payload = {
        employeeId: data.employeeId,
        employeeName: data.employeeName || 'Staff',
        companyId: data.companyId || 'comp_diallo_india',
        cycleId: data.cycleId || 'cycle_2026_annual',
        recommendedAction: data.recommendedAction || 'INCREMENT', // INCREMENT, PROMOTION, BONUS, DEVELOPMENT_PLAN
        recommendedPercentage: Number(data.recommendedPercentage) || 8,
        reason: data.reason || 'Outstanding annual performance score',
        status: 'PENDING', // PENDING, APPROVED, REJECTED, IMPLEMENTED
        recommendedBy: AuthGuard.userProfile?.displayName || 'Manager',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('appraisalRecommendations').add(payload);
      await auditService.log('APPRAISAL_RECOMMENDED', 'PERFORMANCE', 'appraisalRecommendations', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async approveAppraisalRecommendation(id) {
    try {
      await db.collection('appraisalRecommendations').doc(id).update({
        status: 'APPROVED',
        approvedBy: AuthGuard.userProfile?.displayName || 'HR Director',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await auditService.log('APPRAISAL_APPROVED', 'PERFORMANCE', 'appraisalRecommendations', id, {});
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.performanceService = performanceService;
