/**
 * DIALLO HRMS — RECRUITMENT & APPLICANT TRACKING SYSTEM (ATS) SERVICE (PHASE 9)
 * Manages Job Requisitions, Positions, Candidates, Applications, Kanban Stages,
 * Interviews, Feedbacks, Assessments, Job Offers, and Handoff to Employee Onboarding
 */

const recruitmentService = {
  // ATS Pipeline Stages
  STAGES: [
    'APPLIED',
    'SCREENING',
    'SHORTLISTED',
    'INTERVIEW',
    'ASSESSMENT',
    'SELECTED',
    'OFFER',
    'HIRED',
    'REJECTED'
  ],

  // 1. WORKFORCE & JOB REQUISITIONS
  async getRequisitions(companyId = null) {
    try {
      const targetCompany = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const snapshot = await db.collection('jobRequisitions')
        .where('companyId', '==', targetCompany)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching job requisitions:', e);
      return [];
    }
  },

  async createRequisition(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        positionTitle: data.positionTitle,
        departmentId: data.departmentId || 'Technology',
        departmentName: data.departmentName || 'Technology',
        designation: data.designation || data.positionTitle,
        branchId: data.branchId || 'HQ - Mumbai',
        numberOfPositions: Number(data.numberOfPositions) || 1,
        employmentType: data.employmentType || 'FULL_TIME',
        reason: data.reason || 'Business Expansion',
        minExperience: Number(data.minExperience) || 2,
        maxExperience: Number(data.maxExperience) || 5,
        salaryMin: Number(data.salaryMin) || 600000,
        salaryMax: Number(data.salaryMax) || 1200000,
        targetJoiningDate: data.targetJoiningDate || '2026-11-01',
        status: 'PENDING_APPROVAL', // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, FILLED
        requestedBy: AuthGuard.userProfile?.displayName || 'Line Manager',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('jobRequisitions').add(payload);
      await auditService.log('REQUISITION_CREATED', 'RECRUITMENT', 'jobRequisitions', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating job requisition:', err);
      throw err;
    }
  },

  async approveRequisition(id) {
    try {
      await db.collection('jobRequisitions').doc(id).update({
        status: 'APPROVED',
        approvedBy: AuthGuard.userProfile?.displayName || 'HR Admin',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await auditService.log('REQUISITION_APPROVED', 'RECRUITMENT', 'jobRequisitions', id, {});
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 2. JOB POSITIONS & PUBLISHING
  async getJobs(filters = {}) {
    try {
      let query = db.collection('jobPositions');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.status) query = query.where('status', '==', filters.status);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching jobs:', e);
      return [];
    }
  },

  async createJob(jobData) {
    try {
      const companyId = jobData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        title: jobData.title,
        department: jobData.department || 'Technology',
        location: jobData.location || 'Mumbai, Maharashtra',
        employmentType: jobData.employmentType || 'FULL_TIME', // FULL_TIME, PART_TIME, CONTRACT
        workMode: jobData.workMode || 'HYBRID', // ON_SITE, REMOTE, HYBRID
        experience: jobData.experience || '2–5 Years',
        openings: Number(jobData.openings) || 1,
        salaryRange: jobData.salaryRange || '₹8,00,000 – ₹12,00,000',
        description: jobData.description || 'Deliver high performance web and enterprise cloud modules.',
        requirements: jobData.requirements || 'Experience in Vanilla JS, Cloud Firestore, HTML5, CSS3, and REST APIs.',
        skills: jobData.skills ? (Array.isArray(jobData.skills) ? jobData.skills : jobData.skills.split(',').map(s => s.trim())) : ['JavaScript', 'Firebase', 'CSS3'],
        status: 'PUBLISHED', // DRAFT, PUBLISHED, PAUSED, CLOSED
        closingDate: jobData.closingDate || '2026-12-31',
        publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: AuthGuard.userProfile?.displayName || 'HR Recruiter',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('jobPositions').add(payload);
      await auditService.log('JOB_PUBLISHED', 'RECRUITMENT', 'jobPositions', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating job position:', err);
      throw err;
    }
  },

  async updateJobStatus(jobId, newStatus) {
    try {
      await db.collection('jobPositions').doc(jobId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await auditService.log('JOB_STATUS_CHANGED', 'RECRUITMENT', 'jobPositions', jobId, { status: newStatus });
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 3. CANDIDATES & APPLICATIONS MANAGEMENT
  async getCandidates(filters = {}) {
    try {
      let query = db.collection('candidates');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async createCandidate(candidateData) {
    try {
      const companyId = candidateData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      
      // Duplicate detection by email
      const existing = await db.collection('candidates')
        .where('companyId', '==', companyId)
        .where('email', '==', candidateData.email.trim().toLowerCase())
        .get();

      if (!existing.empty) {
        throw new Error(`Candidate with email '${candidateData.email}' already exists in candidate talent pool.`);
      }

      const payload = {
        companyId,
        firstName: candidateData.firstName,
        lastName: candidateData.lastName || '',
        fullName: `${candidateData.firstName} ${candidateData.lastName || ''}`.trim(),
        email: candidateData.email.trim().toLowerCase(),
        phone: candidateData.phone || '',
        location: candidateData.location || 'Mumbai',
        currentCompany: candidateData.currentCompany || 'Freelance / Stealthed',
        currentDesignation: candidateData.currentDesignation || 'Software Engineer',
        totalExperience: Number(candidateData.totalExperience) || 3,
        skills: candidateData.skills ? (Array.isArray(candidateData.skills) ? candidateData.skills : candidateData.skills.split(',').map(s => s.trim())) : ['JavaScript', 'HTML5', 'CSS'],
        source: candidateData.source || 'CAREER_PAGE', // CAREER_PAGE, REFERRAL, LINKEDIN, DIRECT
        profileStatus: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('candidates').add(payload);
      payload.id = docRef.id;
      await auditService.log('CANDIDATE_CREATED', 'RECRUITMENT', 'candidates', docRef.id, payload);

      // Create initial Job Application if jobId provided
      if (candidateData.jobId) {
        await this.createApplication({
          candidateId: docRef.id,
          candidateName: payload.fullName,
          candidateEmail: payload.email,
          jobId: candidateData.jobId,
          jobTitle: candidateData.jobTitle || 'Open Position',
          companyId
        });
      }

      return payload;
    } catch (err) {
      console.error('Error creating candidate:', err);
      throw err;
    }
  },

  async getApplications(filters = {}) {
    try {
      let query = db.collection('jobApplications');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.jobId) query = query.where('jobId', '==', filters.jobId);
      if (filters.stage) query = query.where('currentStage', '==', filters.stage);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async createApplication(data) {
    try {
      const payload = {
        candidateId: data.candidateId,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        jobId: data.jobId,
        jobTitle: data.jobTitle,
        companyId: data.companyId || 'comp_diallo_india',
        currentStage: 'APPLIED', // APPLIED, SCREENING, SHORTLISTED, INTERVIEW, ASSESSMENT, SELECTED, OFFER, HIRED, REJECTED
        source: data.source || 'CAREER_PAGE',
        appliedAt: new Date().toISOString(),
        assignedRecruiter: AuthGuard.userProfile?.displayName || 'Talent Acquisition',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('jobApplications').add(payload);
      await auditService.log('APPLICATION_CREATED', 'RECRUITMENT', 'jobApplications', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async updateApplicationStage(appId, newStage, reason = '') {
    try {
      const appDoc = await db.collection('jobApplications').doc(appId).get();
      if (!appDoc.exists) throw new Error('Application not found');

      const oldStage = appDoc.data().currentStage;

      // 1. Update Application stage
      await db.collection('jobApplications').doc(appId).update({
        currentStage: newStage,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 2. Log versioned stage history
      await db.collection('applicationStageHistory').add({
        applicationId: appId,
        candidateId: appDoc.data().candidateId,
        fromStage: oldStage,
        toStage: newStage,
        reason: reason || `Advanced stage to ${newStage}`,
        changedBy: AuthGuard.userProfile?.displayName || 'Recruiter',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('STAGE_CHANGED', 'RECRUITMENT', 'jobApplications', appId, { fromStage: oldStage, toStage: newStage });
      return true;
    } catch (err) {
      console.error('Error updating application stage:', err);
      throw err;
    }
  },

  async deleteApplication(appId) {
    try {
      await db.collection('jobApplications').doc(appId).delete();
      await auditService.log('APPLICATION_DELETED', 'RECRUITMENT', 'jobApplications', appId, {});
      return true;
    } catch (err) {
      console.error('Error deleting application:', err);
      throw err;
    }
  },

  async rejectApplication(appId, reason = 'Candidate disqualified / withdrawn') {
    return this.updateApplicationStage(appId, 'REJECTED', reason);
  },

  async deleteCandidate(candidateId) {
    try {
      // 1. Delete Candidate Document
      await db.collection('candidates').doc(candidateId).delete();

      // 2. Cascade delete linked applications
      const appsSnap = await db.collection('jobApplications').where('candidateId', '==', candidateId).get();
      const batch = db.batch();
      appsSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      await auditService.log('CANDIDATE_DELETED', 'RECRUITMENT', 'candidates', candidateId, {});
      return true;
    } catch (err) {
      console.error('Error deleting candidate:', err);
      throw err;
    }
  },

  async purgeTestCandidates() {
    try {
      const snap = await db.collection('candidates').get();
      let purgedCount = 0;
      const batch = db.batch();

      for (const doc of snap.docs) {
        const data = doc.data();
        const name = (data.fullName || '').trim().toLowerCase();
        const email = (data.email || '').trim().toLowerCase();

        // Detect test/dummy patterns (repeated chars, common dummy inputs, invalid emails)
        const isTestName = ['aaa', 'bbb', 'ccc', 'awd', 'asdf', 'test', 'dad dadad'].includes(name) ||
                           /^([a-z])\1{2,}$/.test(name) ||
                           name.length <= 2;
        const isTestEmail = !email || !email.includes('@') || email.includes('test') || email.includes('example.com') || email.length < 5;

        if (isTestName || isTestEmail) {
          batch.delete(doc.ref);
          purgedCount++;

          // Cascade delete linked applications
          const appSnap = await db.collection('jobApplications').where('candidateId', '==', doc.id).get();
          appSnap.docs.forEach(aDoc => batch.delete(aDoc.ref));
        }
      }

      if (purgedCount > 0) {
        await batch.commit();
        await auditService.log('TEST_CANDIDATES_PURGED', 'RECRUITMENT', 'candidates', 'batch', { count: purgedCount });
      }
      return purgedCount;
    } catch (err) {
      console.error('Error purging test candidates:', err);
      throw err;
    }
  },

  // 4. SCREENING & EVALUATION
  async createScreening(data) {
    try {
      const payload = {
        applicationId: data.applicationId,
        candidateId: data.candidateId,
        experienceScore: Number(data.experienceScore) || 4,
        skillScore: Number(data.skillScore) || 4,
        educationScore: Number(data.educationScore) || 4,
        communicationScore: Number(data.communicationScore) || 4,
        overallScore: Number(data.overallScore) || 4.0,
        recommendation: data.recommendation || 'SHORTLIST', // SHORTLIST, REJECT, HOLD
        comments: data.comments || '',
        screenedBy: AuthGuard.userProfile?.displayName || 'Recruiter',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('candidateScreenings').add(payload);
      if (data.recommendation === 'SHORTLIST') {
        await this.updateApplicationStage(data.applicationId, 'SHORTLISTED', 'Passed initial screening');
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  // 5. INTERVIEWS & FEEDBACK
  async getInterviews(filters = {}) {
    try {
      let query = db.collection('interviews');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async scheduleInterview(data) {
    try {
      const payload = {
        applicationId: data.applicationId,
        candidateId: data.candidateId,
        candidateName: data.candidateName,
        jobTitle: data.jobTitle,
        companyId: data.companyId || 'comp_diallo_india',
        round: data.round || 'Walk-in / In-Person Interview',
        interviewType: data.interviewType || (data.meetingLink?.startsWith('http') ? 'VIDEO' : 'IN_PERSON'),
        interviewer: data.interviewer || AuthGuard.userProfile?.displayName || 'Hiring Lead',
        date: data.date,
        time: data.time || '14:00',
        location: data.location || (data.interviewType === 'IN_PERSON' ? (data.meetingLink || 'HQ - Mumbai, Meeting Room 2') : ''),
        meetingLink: data.meetingLink || '',
        status: 'SCHEDULED', // SCHEDULED, COMPLETED, CANCELLED
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('interviews').add(payload);
      if (data.applicationId) {
        await this.updateApplicationStage(data.applicationId, 'INTERVIEW', `Scheduled ${payload.round}`);
      }
      await auditService.log('INTERVIEW_CREATED', 'RECRUITMENT', 'interviews', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async submitInterviewFeedback(data) {
    try {
      const payload = {
        interviewId: data.interviewId,
        candidateId: data.candidateId,
        technicalRating: Number(data.technicalRating) || 4,
        communicationRating: Number(data.communicationRating) || 4,
        problemSolvingRating: Number(data.problemSolvingRating) || 4,
        overallRating: Number(data.overallRating) || 4.2,
        recommendation: data.recommendation || 'PASS', // PASS, FAIL, HOLD
        comments: data.comments || '',
        interviewerName: AuthGuard.userProfile?.displayName || 'Interviewer',
        submittedAt: new Date().toISOString()
      };

      const docRef = await db.collection('interviewFeedback').add(payload);
      await db.collection('interviews').doc(data.interviewId).update({ status: 'COMPLETED' });

      if (data.recommendation === 'PASS' && data.applicationId) {
        await this.updateApplicationStage(data.applicationId, 'SELECTED', 'Passed technical & manager interview rounds');
      }

      await auditService.log('FEEDBACK_SUBMITTED', 'RECRUITMENT', 'interviewFeedback', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  // 6. JOB OFFERS & PRE-EMPLOYMENT
  async getOffers(companyId = null) {
    try {
      const targetCompany = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const snapshot = await db.collection('jobOffers')
        .where('companyId', '==', targetCompany)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  async createOffer(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        applicationId: data.applicationId,
        candidateId: data.candidateId,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        positionTitle: data.positionTitle,
        department: data.department || 'Technology',
        branch: data.branch || 'HQ - Mumbai',
        annualCtc: Number(data.annualCtc) || 1200000,
        monthlyGross: Math.round((Number(data.annualCtc) || 1200000) / 12),
        joiningDate: data.joiningDate || '2026-11-01',
        offerDate: new Date().toISOString().slice(0, 10),
        expiryDate: data.expiryDate || '2026-10-15',
        status: 'PENDING_APPROVAL', // DRAFT, PENDING_APPROVAL, APPROVED, SENT, ACCEPTED, REJECTED
        createdBy: AuthGuard.userProfile?.displayName || 'HR Lead',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('jobOffers').add(payload);
      if (data.applicationId) {
        await this.updateApplicationStage(data.applicationId, 'OFFER', `Prepared job offer of ₹${payload.annualCtc.toLocaleString('en-IN')}`);
      }
      await auditService.log('OFFER_CREATED', 'RECRUITMENT', 'jobOffers', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async approveOffer(offerId) {
    try {
      await db.collection('jobOffers').doc(offerId).update({
        status: 'APPROVED',
        approvedBy: AuthGuard.userProfile?.displayName || 'Director HR',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await auditService.log('OFFER_APPROVED', 'RECRUITMENT', 'jobOffers', offerId, {});
      return true;
    } catch (e) {
      throw e;
    }
  },

  async acceptOffer(offerId, candidateId, applicationId) {
    try {
      await db.collection('jobOffers').doc(offerId).update({
        status: 'ACCEPTED',
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (applicationId) {
        await this.updateApplicationStage(applicationId, 'OFFER_ACCEPTED', 'Candidate accepted formal offer');
      }

      await auditService.log('OFFER_ACCEPTED', 'RECRUITMENT', 'jobOffers', offerId, {});
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 7. SEAMLESS HANDOVER: HIRED CANDIDATE -> EMPLOYEE & ONBOARDING (PHASE 4)
  async convertCandidateToEmployee(candidateData, offerData = {}) {
    try {
      const companyId = offerData.companyId || candidateData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      // 1. Generate Employee Code (e.g. EMP-0014)
      const code = await employeeService.getNextEmployeeCode(companyId);

      // 2. Resolve Candidate Information
      let fullName = candidateData.candidateName || candidateData.fullName || 'Candidate Staff';
      let email = candidateData.candidateEmail || candidateData.email || '';
      let phone = candidateData.phone || '';
      let designation = offerData.positionTitle || candidateData.jobTitle || 'Software Engineer';
      let department = offerData.department || candidateData.department || 'Technology';

      if (candidateData.candidateId) {
        try {
          const cDoc = await db.collection('candidates').doc(candidateData.candidateId).get();
          if (cDoc.exists) {
            const cData = cDoc.data();
            fullName = cData.fullName || fullName;
            email = cData.email || email;
            phone = cData.phone || phone;
            designation = cData.currentDesignation || designation;
          }
        } catch (e) {
          console.warn('Could not fetch candidate details:', e);
        }
      }

      const parts = fullName.split(' ');
      const firstName = candidateData.firstName || parts[0] || 'Staff';
      const lastName = candidateData.lastName || parts.slice(1).join(' ') || '';
      const safeEmail = (email && email.includes('@')) ? email : `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff'}@diallo.in`;

      // 3. Create Employee Master record
      const newEmp = await employeeService.createEmployee({
        employeeCode: code,
        firstName,
        lastName,
        fullName,
        email: safeEmail,
        personalEmail: safeEmail,
        workEmail: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'emp'}.${(lastName || 'diallo').toLowerCase().replace(/[^a-z0-9]/g, '')}@diallo.in`,
        phone: phone || '+91 98200 12345',
        department: department,
        designation: designation,
        location: offerData.branch || 'HQ - Mumbai',
        branchId: 'branch_mumbai',
        branchName: offerData.branch || 'HQ - Mumbai',
        joiningDate: offerData.joiningDate || new Date().toISOString().slice(0, 10),
        employmentStatus: 'ACTIVE',
        employmentType: 'Permanent',
        source: 'RECRUITMENT_ATS',
        candidateId: candidateData.candidateId || candidateData.id || '',
        companyId: companyId
      });

      // 4. Initialize Standard Onboarding Checklist tasks
      if (typeof onboardingService !== 'undefined' && onboardingService.createTask) {
        try {
          await onboardingService.createTask({
            title: `Verify Identity & Background Checks for ${newEmp.fullName}`,
            employeeId: newEmp.id,
            employeeName: newEmp.fullName,
            assignedTo: 'HR Operations',
            dueDate: offerData.joiningDate || new Date().toISOString().slice(0, 10)
          });
          await onboardingService.createTask({
            title: `Issue IT Equipment & Workspace Credentials for ${newEmp.fullName}`,
            employeeId: newEmp.id,
            employeeName: newEmp.fullName,
            assignedTo: 'IT Administration',
            dueDate: offerData.joiningDate || new Date().toISOString().slice(0, 10)
          });
        } catch (taskErr) {
          console.warn('Onboarding task creation warning:', taskErr);
        }
      }

      // 5. Update Application status to HIRED and record employeeCode
      if (candidateData.applicationId) {
        await db.collection('jobApplications').doc(candidateData.applicationId).update({
          currentStage: 'HIRED',
          employeeCode: code,
          employeeId: newEmp.id,
          hiredAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // 6. Update Candidate document status to HIRED
      if (candidateData.candidateId) {
        try {
          await db.collection('candidates').doc(candidateData.candidateId).update({
            profileStatus: 'HIRED',
            employeeCode: code,
            employeeId: newEmp.id,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } catch (cErr) {
          console.warn('Candidate status update warning:', cErr);
        }
      }

      await auditService.log('CANDIDATE_HIRED', 'RECRUITMENT', 'employees', newEmp.id, { employeeCode: code, fullName: newEmp.fullName });
      return newEmp;
    } catch (err) {
      console.error('Error converting candidate to employee:', err);
      throw err;
    }
  }
};

window.recruitmentService = recruitmentService;
