
const authService = {
  // Email & Password Sign In (Hostinger MySQL Primary with Firebase Auth Fallback)
  async signIn(email, password) {
    const cleanEmail = (email || '').toLowerCase().trim();

    // 1. Primary Authentication: Hostinger MySQL Backend (auth.php?action=login)
    try {
      if (typeof apiClient !== 'undefined' && apiClient.post) {
        const mySqlResp = await apiClient.post('auth.php?action=login', { email: cleanEmail, password });
        if (mySqlResp && mySqlResp.success && mySqlResp.user) {
          const mUser = mySqlResp.user;
          const sessionPayload = {
            uid: mUser.uid || `mysql_${mUser.id}`,
            id: mUser.id,
            employeeId: mUser.uid || mUser.id,
            email: cleanEmail,
            displayName: mUser.display_name || cleanEmail.split('@')[0],
            roleId: mUser.role_id || 'EMPLOYEE',
            role: mUser.role_id || 'EMPLOYEE',
            employeeCode: mUser.employee_code || '',
            department: mUser.department || 'Operations',
            designation: mUser.designation || 'Staff',
            companyId: mUser.company_id || 'comp_diallo_india',
            companyName: mUser.company_name || 'Diallo India Private Limited',
            branchName: mUser.branch_name || 'Ghansoli - Navi Mumbai',
            status: mUser.status || 'ACTIVE'
          };
          sessionStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));
          localStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));

          if (window.AuthGuard) {
            AuthGuard.currentUser = {
              uid: sessionPayload.uid,
              email: sessionPayload.email,
              displayName: sessionPayload.displayName,
              getIdToken: async () => 'mysql-session-token'
            };
            AuthGuard.userProfile = sessionPayload;
          }

          if (typeof auditService !== 'undefined' && auditService.log) {
            auditService.log('USER_LOGIN', 'AUTH', 'users', sessionPayload.uid, { email: cleanEmail, method: 'MYSQL' }).catch(() => {});
          }

          return { success: true, user: sessionPayload };
        }
      }
    } catch (mysqlErr) {
      console.warn('Hostinger MySQL primary auth notice, attempting fallback:', mysqlErr.message || mysqlErr);
    }

    let firebaseUser = null;
    let fbErr = null;

    // 2. Secondary: Fallback to Firebase Auth
    try {
      const userCredential = await auth.signInWithEmailAndPassword(cleanEmail, password);
      firebaseUser = userCredential.user;
    } catch (err) {
      fbErr = err;
      console.warn('Firebase Auth signIn failed:', err.code || err.message);
    }

    // If Firebase succeeded, sync profile & clean up any fallback session
    if (firebaseUser) {
      try {
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        const docSnap = await userDocRef.get();
        const isMasterAdmin = cleanEmail === 'ayanislight@gmail.com';

        if (!docSnap.exists) {
          let employeeId = null;
          try {
            const empSnap = await db.collection('employees').where('workEmail', '==', cleanEmail).limit(1).get();
            if (!empSnap.empty) {
              employeeId = empSnap.docs[0].id;
            }
          } catch (empErr) {}

          const selfProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || cleanEmail.split('@')[0],
            roleId: isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE',
            companyId: 'comp_diallo_india',
            companyName: 'Diallo India Private Limited',
            branchId: 'branch_ghansoli',
            branchName: 'Ghansoli - Navi Mumbai',
            employeeId: employeeId,
            status: 'ACTIVE',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          await userDocRef.set(selfProfile, { merge: true });
        } else {
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

        if (window.AuthGuard && typeof AuthGuard.ensureEmployeeProfile === 'function') {
          const profileData = (await userDocRef.get()).data() || {};
          await AuthGuard.ensureEmployeeProfile(firebaseUser.uid, firebaseUser.email, profileData);
        }
      } catch (dbErr) {
        console.warn('User profile check in signIn:', dbErr);
      }

      try {
        if (typeof auditService !== 'undefined' && auditService.log) {
          auditService.log('USER_LOGIN', 'AUTH', 'users', firebaseUser.uid, { email: cleanEmail, method: 'FIREBASE' }).catch(() => {});
        }
      } catch (e) {}

      sessionStorage.removeItem('dh_user_session');
      localStorage.removeItem('dh_user_session');
      return { success: true, user: firebaseUser };
    }

    // 2. Fallback: Authenticate via Hostinger MySQL Backend if not already checked
    try {
      if (!mysqlFirstErr && typeof apiClient !== 'undefined' && apiClient.post) {
        const mySqlResp = await apiClient.post('auth.php?action=login', { email: cleanEmail, password });
        if (mySqlResp && mySqlResp.success && mySqlResp.user) {
          const mUser = mySqlResp.user;

          // Attempt opportunistic auto-provisioning into Firebase Auth for future logins
          try {
            const newCred = await auth.createUserWithEmailAndPassword(cleanEmail, password);
            if (newCred && newCred.user && mUser.display_name) {
              await newCred.user.updateProfile({ displayName: mUser.display_name }).catch(() => {});
            }
          } catch (pErr) {
            // Already exists in Firebase or policy restriction; ignore silently
          }

          let resolvedRole = (mUser.role_id || 'EMPLOYEE').toString().toUpperCase().trim();
          const desigLower = (mUser.designation || '').toLowerCase().trim();
          if (cleanEmail === 'ayan@tradeforwealth.co.in' || cleanEmail === 'ayanislight@gmail.com') {
            resolvedRole = 'SUPER_ADMIN';
          } else if (window.AuthGuard && typeof AuthGuard.resolveCanonicalRole === 'function') {
            resolvedRole = AuthGuard.resolveCanonicalRole(resolvedRole, desigLower, cleanEmail);
          } else {
            if (desigLower.includes('operations manager') || desigLower.includes('ops manager') || desigLower === 'ops') {
              resolvedRole = 'OPERATIONS_MANAGER';
            } else if (desigLower.includes('compliance')) {
              resolvedRole = 'COMPLIANCE';
            } else if (desigLower.includes('process owner')) {
              resolvedRole = 'PROCESS_OWNER';
            } else if (desigLower.includes('digital marketing') || desigLower.includes('digital') || desigLower.includes('seo')) {
              resolvedRole = 'DIGITAL_MARKETING';
            } else if (desigLower.includes('team lead') || desigLower.includes('team leader') || desigLower.includes('assistant team leader') || desigLower.includes('atl')) {
              resolvedRole = 'TEAM_LEAD';
            } else if (desigLower.includes('human resources') || desigLower.includes('hr lead') || desigLower.includes('hr manager') || desigLower.includes('recruiter') || desigLower === 'hr') {
              resolvedRole = 'HR_MANAGER';
            } else if (desigLower.includes('relationship manager') || desigLower.includes('rm')) {
              resolvedRole = 'RELATIONSHIP_MANAGER';
            } else if (desigLower.includes('manager')) {
              resolvedRole = 'MANAGER';
            } else if (desigLower.includes('trainer') || desigLower.includes('mentor')) {
              resolvedRole = 'MENTOR_TRAINER';
            } else if (desigLower.includes('trainee') || desigLower.includes('intern')) {
              resolvedRole = 'TRAINEE';
            }
          }

          const sessionPayload = {
            uid: mUser.uid || ('usr_' + mUser.id),
            id: mUser.id,
            email: mUser.email || cleanEmail,
            displayName: mUser.display_name || `${mUser.first_name || ''} ${mUser.last_name || ''}`.trim() || cleanEmail.split('@')[0],
            roleId: resolvedRole,
            department: mUser.department || 'Operations',
            designation: mUser.designation || 'Staff',
            employeeCode: mUser.employee_code || '',
            status: mUser.status || 'ACTIVE',
            companyId: mUser.company_id || 'comp_diallo_india',
            companyName: mUser.company_name || 'Diallo India Private Limited',
            branchId: mUser.branch_id || 'branch_ghansoli',
            branchName: mUser.branch_name || 'Ghansoli - Navi Mumbai',
            isMySQLSession: true,
            authenticatedAt: Date.now()
          };

          sessionStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));
          localStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));

          try {
            if (typeof auditService !== 'undefined' && auditService.log) {
              auditService.log('USER_LOGIN', 'AUTH', 'users', sessionPayload.uid, { email: cleanEmail, method: 'MYSQL' }).catch(() => {});
            }
          } catch (e) {}

          return { success: true, user: sessionPayload };
        } else if (mySqlResp && mySqlResp.error) {
          return { success: false, error: mySqlResp.error };
        }
      }
    } catch (sqlErr) {
      console.warn('MySQL fallback authentication error:', sqlErr);
      if (sqlErr.message && !sqlErr.message.includes('401') && !sqlErr.message.includes('404')) {
        // Unexpected server or network error
      }
    }

    // 3. Format informative error if both authentications failed
    let message = 'Failed to sign in. Please verify your email and password.';
    if (fbErr) {
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/invalid-login-credentials') {
        message = 'Invalid email or password. Please verify your credentials or contact HR administrator.';
      } else if (fbErr.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to many failed login attempts. Please try again later.';
      } else if (fbErr.code === 'auth/user-disabled') {
        message = 'This account has been deactivated. Please contact your HR administrator.';
      } else if (fbErr.code === 'auth/network-request-failed') {
        message = 'Network connectivity error. Please check your internet connection.';
      }
    }
    return { success: false, error: message, code: fbErr?.code };
  },

  // User Registration (with Firestore profile creation)
  async signUp(email, password, profileData = {}) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const userEmail = (user.email || email || '').toLowerCase().trim();
      const isMasterAdmin = userEmail === 'ayanislight@gmail.com';
      let requestedRole = profileData.roleId ? profileData.roleId.toString().toUpperCase().trim() : (isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE');
      if (!['SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'OPERATIONS_MANAGER', 'TEAM_LEAD', 'RELATIONSHIP_MANAGER', 'MENTOR_TRAINER', 'TRAINEE', 'EMPLOYEE', 'COMPANY_ADMIN', 'HR', 'TRAINER', 'MENTOR'].includes(requestedRole)) {
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
      const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://hrmstfw.com';
      const actionCodeSettings = {
        url: `${origin}/reset-password.html`,
        handleCodeInApp: true
      };
      try {
        await auth.sendPasswordResetEmail(email, actionCodeSettings);
      } catch (settingsErr) {
        if (settingsErr.code === 'auth/unauthorized-continue-uri') {
          await auth.sendPasswordResetEmail(email);
        } else {
          throw settingsErr;
        }
      }
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
      } else if (err.message) {
        message = err.message;
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
      try {
        await auth.signOut();
      } catch (_) {}
      try {
        sessionStorage.removeItem('dh_user_session');
        localStorage.removeItem('dh_user_session');
        sessionStorage.clear();
      } catch (_) {}
      return { success: true };
    } catch (err) {
      console.error('Sign out error:', err);
      try {
        sessionStorage.removeItem('dh_user_session');
        localStorage.removeItem('dh_user_session');
        sessionStorage.clear();
      } catch (_) {}
      return { success: false, error: err.message };
    }
  },

  // Get current auth state
  getCurrentUser() {
    if (auth.currentUser) return auth.currentUser;
    try {
      const raw = sessionStorage.getItem('dh_user_session') || localStorage.getItem('dh_user_session');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }
};

window.authService = authService;
