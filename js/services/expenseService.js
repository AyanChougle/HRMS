/**
 * DIALLO HRMS — EXPENSE & REIMBURSEMENT SERVICE (PHASE 10)
 * Manages Employee Expense Claims, Receipts, Policy Limits, Multi-Level Approvals, and Settlements
 */

const expenseService = {
  // Default Expense Categories
  DEFAULT_CATEGORIES: [
    { id: 'cat_travel', code: 'TRAVEL', name: 'Travel & Flights', maxAmount: 50000, requiresReceipt: true, icon: '✈️' },
    { id: 'cat_fuel', code: 'FUEL', name: 'Fuel & Conveyance', maxAmount: 10000, requiresReceipt: true, icon: '⛽' },
    { id: 'cat_food', code: 'FOOD', name: 'Meals & Food', maxAmount: 3000, requiresReceipt: true, icon: '🍔' },
    { id: 'cat_hotel', code: 'ACCOMMODATION', name: 'Hotel & Accommodation', maxAmount: 35000, requiresReceipt: true, icon: '🏨' },
    { id: 'cat_supplies', code: 'OFFICE_SUPPLIES', name: 'Office Supplies & Hardware', maxAmount: 15000, requiresReceipt: true, icon: '📦' },
    { id: 'cat_internet', code: 'INTERNET', name: 'Internet & Mobile Bills', maxAmount: 4000, requiresReceipt: true, icon: '📶' },
    { id: 'cat_client', code: 'CLIENT_MEETING', name: 'Client Entertainment', maxAmount: 12000, requiresReceipt: true, icon: '🤝' },
    { id: 'cat_training', code: 'TRAINING', name: 'Certifications & Courses', maxAmount: 25000, requiresReceipt: true, icon: '🎓' },
    { id: 'cat_medical', code: 'MEDICAL', name: 'Medical Emergency', maxAmount: 20000, requiresReceipt: true, icon: '🏥' },
    { id: 'cat_misc', code: 'MISCELLANEOUS', name: 'Miscellaneous', maxAmount: 5000, requiresReceipt: false, icon: '💼' }
  ],

  // 1. GET ALL CATEGORIES
  async getCategories(companyId = null) {
    try {
      const targetCompany = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const snapshot = await db.collection('expenseCategories')
        .where('companyId', '==', targetCompany)
        .get();

      if (snapshot.empty) {
        // Auto-seed default categories if empty
        for (const cat of this.DEFAULT_CATEGORIES) {
          await db.collection('expenseCategories').doc(`${targetCompany}_${cat.code.toLowerCase()}`).set({
            ...cat,
            companyId: targetCompany,
            isActive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        return this.DEFAULT_CATEGORIES;
      }

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching expense categories:', e);
      return this.DEFAULT_CATEGORIES;
    }
  },

  // 2. GET EXPENSES (With Role-Based & Multitenant Scoping)
  async getExpenses(filters = {}) {
    try {
      let query = db.collection('expenses');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.status && filters.status !== 'All') query = query.where('status', '==', filters.status);
      if (filters.categoryId && filters.categoryId !== 'All') query = query.where('categoryCode', '==', filters.categoryId);

      const snapshot = await query.orderBy('expenseDate', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching expenses:', e);
      return [];
    }
  },

  // 3. CREATE / DRAFT EXPENSE CLAIM
  async createExpense(expenseData) {
    try {
      const companyId = expenseData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const employeeId = expenseData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || 'EMP001';
      const employeeName = expenseData.employeeName || AuthGuard.userProfile?.displayName || 'Employee';

      const amount = Number(expenseData.amount) || 0;
      if (amount <= 0) throw new Error('Expense amount must be greater than zero.');

      // Check duplicate claim: same employee, date, category, and exact amount
      const existing = await db.collection('expenses')
        .where('employeeId', '==', employeeId)
        .where('expenseDate', '==', expenseData.expenseDate)
        .where('categoryCode', '==', expenseData.categoryCode)
        .where('amount', '==', amount)
        .get();

      if (!existing.empty) {
        throw new Error('Possible duplicate expense detected: a claim for this category, date, and amount already exists.');
      }

      const payload = {
        companyId,
        employeeId,
        employeeName,
        employeeCode: expenseData.employeeCode || 'EMP-001',
        department: expenseData.department || 'Technology',
        branchName: expenseData.branchName || 'HQ - Mumbai',
        categoryCode: expenseData.categoryCode || 'MISCELLANEOUS',
        categoryName: expenseData.categoryName || 'Miscellaneous',
        expenseDate: expenseData.expenseDate || new Date().toISOString().slice(0, 10),
        amount,
        currency: 'INR',
        description: expenseData.description || '',
        businessPurpose: expenseData.businessPurpose || '',
        paymentMethod: expenseData.paymentMethod || 'PERSONAL_CARD', // PERSONAL_CARD, CORPORATE_CARD, CASH
        reimbursementMethod: expenseData.reimbursementMethod || 'DIRECT', // DIRECT, PAYROLL
        receiptUrl: expenseData.receiptUrl || null,
        receiptFileName: expenseData.receiptFileName || null,
        status: expenseData.submitImmediately ? 'SUBMITTED' : 'DRAFT', // DRAFT, SUBMITTED, APPROVED, REJECTED, ACTION_REQUIRED, PAID
        submittedAt: expenseData.submitImmediately ? new Date().toISOString() : null,
        approvedAt: null,
        rejectedAt: null,
        paidAt: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('expenses').add(payload);
      payload.id = docRef.id;

      // Register in central Approvals Queue if submitted
      if (payload.status === 'SUBMITTED') {
        await approvalService.createApprovalRequest({
          type: `Expense Claim: ₹${amount.toLocaleString('en-IN')}`,
          referenceId: docRef.id,
          employee: employeeName,
          companyId,
          detail: `${payload.categoryName} (${payload.expenseDate}): ${payload.description}`,
          status: 'PENDING',
          metadata: { expenseId: docRef.id, amount, category: payload.categoryCode }
        });
      }

      await auditService.log(
        payload.status === 'SUBMITTED' ? 'EXPENSE_SUBMITTED' : 'EXPENSE_DRAFTED',
        'EXPENSES',
        'expenses',
        docRef.id,
        payload
      );

      return payload;
    } catch (err) {
      console.error('Error creating expense claim:', err);
      throw err;
    }
  },

  // 4. APPROVE EXPENSE (Manager / HR / Finance)
  async approveExpense(expenseId, approverComments = '') {
    try {
      const expDoc = await db.collection('expenses').doc(expenseId).get();
      if (!expDoc.exists) throw new Error('Expense claim not found.');

      const current = expDoc.data();
      if (current.status === 'APPROVED' || current.status === 'PAID') {
        throw new Error('Expense is already approved or paid.');
      }

      const approverName = AuthGuard.userProfile?.displayName || 'Finance Lead';
      const payload = {
        status: 'APPROVED',
        approvedBy: approverName,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        approverComments: approverComments || 'Approved in accordance with travel & expense policy.',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('expenses').doc(expenseId).update(payload);

      // Record in expenseApprovals history
      await db.collection('expenseApprovals').add({
        expenseId,
        companyId: current.companyId,
        approverName,
        status: 'APPROVED',
        comments: payload.approverComments,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('EXPENSE_APPROVED', 'EXPENSES', 'expenses', expenseId, payload);
      return true;
    } catch (e) {
      console.error('Error approving expense:', e);
      throw e;
    }
  },

  // 5. REJECT EXPENSE
  async rejectExpense(expenseId, rejectionReason) {
    try {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Rejection reason is mandatory.');
      }

      const payload = {
        status: 'REJECTED',
        rejectedBy: AuthGuard.userProfile?.displayName || 'Manager',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectionReason: rejectionReason.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('expenses').doc(expenseId).update(payload);

      await db.collection('expenseApprovals').add({
        expenseId,
        approverName: payload.rejectedBy,
        status: 'REJECTED',
        comments: rejectionReason.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('EXPENSE_REJECTED', 'EXPENSES', 'expenses', expenseId, payload);
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 6. REQUEST CHANGES (Clarification on receipts/notes)
  async requestChanges(expenseId, feedback) {
    try {
      const payload = {
        status: 'ACTION_REQUIRED',
        reviewFeedback: feedback || 'Please provide updated receipt or itemized bills.',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('expenses').doc(expenseId).update(payload);
      await auditService.log('EXPENSE_CHANGES_REQUESTED', 'EXPENSES', 'expenses', expenseId, payload);
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 7. MARK EXPENSE AS PAID / REIMBURSED
  async markExpensePaid(expenseId, paymentDetails = {}) {
    try {
      const payload = {
        status: 'PAID',
        paidBy: AuthGuard.userProfile?.displayName || 'Finance Disbursement',
        paidAt: firebase.firestore.FieldValue.serverTimestamp(),
        paymentReference: paymentDetails.paymentReference || `TXN-${Date.now().toString().slice(-6)}`,
        paymentMethod: paymentDetails.paymentMethod || 'BANK_TRANSFER',
        reimbursementMethod: paymentDetails.reimbursementMethod || 'DIRECT',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('expenses').doc(expenseId).update(payload);
      await auditService.log('EXPENSE_PAID', 'EXPENSES', 'expenses', expenseId, payload);
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 8. DELETE DRAFT EXPENSE
  async deleteExpense(expenseId) {
    try {
      await db.collection('expenses').doc(expenseId).delete();
      await auditService.log('EXPENSE_DELETED', 'EXPENSES', 'expenses', expenseId, {});
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.expenseService = expenseService;
