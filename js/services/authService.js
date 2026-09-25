/**
 * DIALLO HRMS — AUTHENTICATION SERVICE (FIREBASE BACKED)
 * Firebase Auth wrapper for sign-in, registration, password recovery and session management
 */

const authService = {
  // Email & Password Sign In
  async signIn(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Ensure user profile document exists in Firestore (self-heal missing profile)
      try {
        const userDocRef = db.collection('users').doc(user.uid);
        const docSnap = await userDocRef.get();
        const userEmail = (user.email || '').toLowerCase().trim();
        const isMasterAdmin = userEmail === 'ayanislight@gmail.com';

        if (!docSnap.exists) {
          let employeeId = null;
          try {
            const empSnap = await db.collection('employees').where('workEmail', '==', userEmail).limit(1).get();
            if (!empSnap.empty) {
              employeeId = empSnap.docs[0].id;
            }
          } catch (empErr) {}

          const selfProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
            roleId: isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE',
            companyId: 'comp_diallo_india',
            companyName: 'Diallo India Private Limited',
            branchId: 'branch_mumbai',
            branchName: 'HQ - Mumbai',
            employeeId: employeeId,
            status: 'ACTIVE',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          await userDocRef.set(selfProfile, { merge: true });
        } else {
          // If doc exists, verify critical defaults while strictly preserving user's assigned role
          const existingData = docSnap.data() || {};
          const updates = {};
          if (!existingData.status) updates.status = 'ACTIVE';
          if (!existingData.companyId) updates.companyId = 'comp_diallo_india';
          if (!existingData.roleId) updates.roleId = isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE';
          if (Object.keys(updates).length > 0) {
            updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            await userDocRef.set(updates, { merge: true });
          }
        }

        // Ensure user is provisioned as an official employee
        if (window.AuthGuard && typeof AuthGuard.ensureEmployeeProfile === 'function') {
          const profileData = (await userDocRef.get()).data() || {};
          await AuthGuard.ensureEmployeeProfile(user.uid, user.email, profileData);
        }
      } catch (dbErr) {
        console.warn('User profile check in signIn:', dbErr);
      }

      // Safe non-blocking audit logging
      try {
        if (typeof auditService !== 'undefined' && auditService.log) {
          auditService.log('USER_LOGIN', 'AUTH', 'users', user.uid, { email }).catch(() => {});
        }
      } catch (e) {
        console.warn('Audit log skipped:', e);
      }

      return { success: true, user };
    } catch (err) {
      console.error('Sign in error:', err);
      let message = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        message = 'Invalid email or password. Please verify your credentials or register a new account.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'This account has been deactivated. Please contact your HR administrator.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network connectivity error. Please check your internet connection.';
      }
      return { success: false, error: message, code: err.code };
    }
  },

  // User Registration (with Firestore profile creation)
  async signUp(email, password, profileData = {}) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const userEmail = (user.email || email || '').toLowerCase().trim();
      const isMasterAdmin = userEmail === 'ayanislight@gmail.com';
      let requestedRole = profileData.roleId ? profileData.roleId.toString().toUpperCase().trim() : (isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE');
      if (!['EMPLOYEE', 'TRAINER', 'TRAINEE', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER', 'PAYROLL', 'MANAGER'].includes(requestedRole)) {
        requestedRole = isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE';
      }
      // Administrative roles can only be provisioned by Super Admin/HR inside the app
      if (['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER'].includes(requestedRole) && !isMasterAdmin && !profileData.createdInsideApp) {
        requestedRole = 'EMPLOYEE';
      }
      const initialRole = requestedRole;
      let employeeId = profileData.employeeId || null;

      if (!employeeId) {
        try {
          const empSnap = await db.collection('employees').where('workEmail', '==', userEmail).limit(1).get();
          if (!empSnap.empty) {
            employeeId = empSnap.docs[0].id;
          }
        } catch (empErr) {}
      }

      const profile = {
        uid: user.uid,
        email: user.email,
        displayName: profileData.displayName || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || email.split('@')[0],
        roleId: initialRole,
        companyName: profileData.companyName || 'Diallo India Private Limited',
        companyId: profileData.companyId || 'comp_diallo_india',
        branchId: profileData.branchId || 'branch_mumbai',
        branchName: profileData.branchName || 'HQ - Mumbai',
        employeeId: employeeId,
        phone: profileData.phone || '',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        await db.collection('users').doc(user.uid).set(profile, { merge: true });
        if (window.AuthGuard && typeof AuthGuard.ensureEmployeeProfile === 'function') {
          await AuthGuard.ensureEmployeeProfile(user.uid, user.email, profile);
        }
      } catch (dbErr) {
        console.warn('Could not save user profile doc directly:', dbErr);
      }

      try {
        if (typeof auditService !== 'undefined' && auditService.log) {
          auditService.log('USER_REGISTERED', 'AUTH', 'users', user.uid, { email, roleId: profile.roleId }).catch(() => {});
        }
      } catch (e) {}

      return { success: true, user, profile };
    } catch (err) {
      console.error('Sign up error:', err);
      let message = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      return { success: false, error: message, code: err.code };
    }
  },

  // Send Password Reset Email
  async sendPasswordReset(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      try {
        if (typeof auditService !== 'undefined' && auditService.log) {
          auditService.log('PASSWORD_RESET_REQUESTED', 'AUTH', 'users', null, { email }).catch(() => {});
        }
      } catch (e) {}
      return { success: true, message: `Password reset link sent to ${email}` };
    } catch (err) {
      console.error('Password reset error:', err);
      let message = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        message = 'No registered account found with this email address.';
      }
      return { success: false, error: message, code: err.code };
    }
  },

  // Sign out
  async signOut() {
    try {
      const user = auth.currentUser;
      if (user && typeof auditService !== 'undefined' && auditService.log) {
        auditService.log('USER_LOGOUT', 'AUTH', 'users', user.uid, { email: user.email }).catch(() => {});
      }
      await auth.signOut();
      sessionStorage.clear();
      return { success: true };
    } catch (err) {
      console.error('Sign out error:', err);
      return { success: false, error: err.message };
    }
  },

  // Get current auth state
  getCurrentUser() {
    return auth.currentUser;
  }
};

window.authService = authService;
