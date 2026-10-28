/**
 * DIALLO HRMS — PURE PHP/MYSQL AUTHENTICATION SERVICE
 * 100% Hostinger MySQL & PHP REST Backend (No Firebase Dependency)
 */

const authService = {
  // Canonical 7-Role Resolver: Maps any legacy role string to one of the 7 canonical roles.
  resolveCanonicalRole(roleId, designation, email) {
    const cleanRole = (roleId || '').toString().toUpperCase().trim();
    if (['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(cleanRole)) return 'ADMIN';
    if (['HR', 'HR_MANAGER'].includes(cleanRole)) return 'HR';
    if (['OPS', 'OPERATIONS_MANAGER', 'PROCESS_OWNER'].includes(cleanRole)) return 'OPS';
    if (cleanRole === 'COMPLIANCE') return 'COMPLIANCE';
    if (cleanRole === 'MANAGER') return 'MANAGER';
    if (['TL', 'TEAM_LEAD'].includes(cleanRole)) return 'TL';

    // Strict 7-role policy: all staff are EMPLOYEE
    return 'EMPLOYEE';
  },

  // 1. Sign In via Hostinger PHP/MySQL Backend
  async signIn(email, password) {
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const resp = await apiClient.post('auth.php?action=login', {
        email: cleanEmail,
        password: password
      });

      if (resp && resp.success && resp.user) {
        const mUser = resp.user;
        const userEmail = (mUser.email || cleanEmail).toLowerCase().trim();
        const resolvedRole = this.resolveCanonicalRole(mUser.role_id, mUser.designation, userEmail);

        const sessionPayload = {
          uid: mUser.uid || `usr_${mUser.id}`,
          id: mUser.id,
          employeeId: mUser.employee_id || mUser.uid || mUser.id,
          email: userEmail,
          displayName: mUser.display_name || `${mUser.first_name || ''} ${mUser.last_name || ''}`.trim() || cleanEmail.split('@')[0],
          roleId: resolvedRole,
          role: resolvedRole,
          employeeCode: mUser.employee_code || '',
          department: mUser.department || 'Operations',
          designation: mUser.designation || 'Staff',
          teamId: mUser.team_id || null,
          teamName: mUser.team_name || '',
          teamLeadId: mUser.team_lead_id || null,
          companyId: mUser.company_id || 'comp_diallo_india',
          companyName: mUser.company_name || 'Diallo India Private Limited',
          branchName: mUser.branch_name || 'Ghansoli - Navi Mumbai',
          status: mUser.status || 'ACTIVE',
          token: resp.token || '',
          authenticatedAt: Date.now()
        };

        // Store tokens & session
        if (resp.token) {
          sessionStorage.setItem('dh_bearer_token', resp.token);
          localStorage.setItem('dh_bearer_token', resp.token);
        }

        sessionStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));
        localStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));

        if (window.AuthGuard) {
          AuthGuard.currentUser = {
            uid: sessionPayload.uid,
            email: sessionPayload.email,
            displayName: sessionPayload.displayName,
            getIdToken: async () => resp.token || 'mysql-session-token'
          };
          AuthGuard.userProfile = sessionPayload;
          AuthGuard.userRole = { id: resolvedRole, name: resolvedRole };
        }

        return { success: true, user: sessionPayload };
      }

      return {
        success: false,
        error: resp?.error || 'Invalid credentials. Please verify your email and password.'
      };

    } catch (err) {
      console.error('[authService] Sign in error:', err);
      let errorMsg = err.message || 'Authentication failed. Please verify your network connection.';
      if (errorMsg.includes('401') || errorMsg.includes('Invalid')) {
        errorMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (errorMsg.includes('deactivated') || errorMsg.includes('blocked')) {
        errorMsg = 'Account access blocked. Please contact your organization administrator.';
      } else if (errorMsg.includes('throttled') || errorMsg.includes('Too many')) {
        errorMsg = 'Too many failed login attempts. Please wait 5 minutes before trying again.';
      }
      return { success: false, error: errorMsg };
    }
  },

  // 2. Verify Session with Server (check action)
  async checkSession() {
    try {
      const resp = await apiClient.get('auth.php?action=check');
      if (resp && resp.success && resp.authenticated && resp.user) {
        const mUser = resp.user;
        const resolvedRole = this.resolveCanonicalRole(mUser.role_id, mUser.designation, mUser.email);

        const sessionPayload = {
          uid: mUser.uid || `usr_${mUser.id}`,
          id: mUser.id,
          employeeId: mUser.employee_id || mUser.uid || mUser.id,
          email: mUser.email,
          displayName: mUser.display_name || mUser.email.split('@')[0],
          roleId: resolvedRole,
          role: resolvedRole,
          employeeCode: mUser.employee_code || '',
          department: mUser.department || 'Operations',
          designation: mUser.designation || 'Staff',
          companyId: mUser.company_id || 'comp_diallo_india',
          companyName: mUser.company_name || 'Diallo India Private Limited',
          branchName: mUser.branch_name || 'Ghansoli - Navi Mumbai',
          status: mUser.status || 'ACTIVE',
          authenticatedAt: Date.now()
        };

        sessionStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));
        localStorage.setItem('dh_user_session', JSON.stringify(sessionPayload));

        if (window.AuthGuard) {
          AuthGuard.currentUser = {
            uid: sessionPayload.uid,
            email: sessionPayload.email,
            displayName: sessionPayload.displayName,
            getIdToken: async () => sessionStorage.getItem('dh_bearer_token') || 'mysql-session-token'
          };
          AuthGuard.userProfile = sessionPayload;
          AuthGuard.userRole = { id: resolvedRole, name: resolvedRole };
        }

        return { success: true, user: sessionPayload };
      }

      // Not authenticated on server
      return { success: false, authenticated: false, user: null };

    } catch (err) {
      console.warn('[authService] Check session notice:', err.message);
      // Fallback: check cached session if network is momentarily unavailable
      try {
        const raw = sessionStorage.getItem('dh_user_session') || localStorage.getItem('dh_user_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.email && (parsed.status || 'ACTIVE').toUpperCase() === 'ACTIVE') {
            return { success: true, user: parsed };
          }
        }
      } catch (_) {}
      return { success: false, error: err.message };
    }
  },

  // 3. Sign Out
  async signOut() {
    try {
      await apiClient.post('auth.php?action=logout', {});
    } catch (e) {
      console.warn('[authService] Server logout notification notice:', e.message);
    }

    try {
      sessionStorage.removeItem('dh_bearer_token');
      localStorage.removeItem('dh_bearer_token');
      sessionStorage.removeItem('dh_user_session');
      localStorage.removeItem('dh_user_session');
      sessionStorage.clear();
    } catch (_) {}

    if (window.AuthGuard) {
      AuthGuard.currentUser = null;
      AuthGuard.userProfile = null;
      AuthGuard.userRole = null;
      AuthGuard.permissions.clear();
    }

    return { success: true };
  },

  // 4. Request Password Reset Link
  async sendPasswordReset(email) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const resp = await apiClient.post('auth.php?action=forgot_password', { email: cleanEmail });
      if (resp && resp.success) {
        return {
          success: true,
          message: resp.message || `Password reset link sent to ${cleanEmail}`,
          resetUrl: resp.reset_url || null
        };
      }
      return { success: false, error: resp?.error || 'Failed to send password reset request.' };
    } catch (err) {
      return { success: false, error: err.message || 'Error communicating with reset server.' };
    }
  },

  // 5. Verify Password Reset Token
  async verifyResetToken(token) {
    if (!token) return { success: false, error: 'Missing security token.' };
    try {
      const resp = await apiClient.get('auth.php?action=verify_reset_token', { token });
      if (resp && resp.success) {
        return { success: true, email: resp.email };
      }
      return { success: false, error: resp?.error || 'Invalid or expired reset token.' };
    } catch (err) {
      return { success: false, error: err.message || 'Token verification error.' };
    }
  },

  // 6. Reset Password with Token
  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      return { success: false, error: 'Token and new password are required.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const resp = await apiClient.post('auth.php?action=reset_password', {
        token: token,
        password: newPassword
      });
      if (resp && resp.success) {
        return { success: true, message: resp.message || 'Password successfully updated.' };
      }
      return { success: false, error: resp?.error || 'Failed to update password.' };
    } catch (err) {
      return { success: false, error: err.message || 'Password update failed.' };
    }
  },

  // 7. Get Current User Object
  getCurrentUser() {
    if (window.AuthGuard && AuthGuard.currentUser) return AuthGuard.currentUser;
    try {
      const raw = sessionStorage.getItem('dh_user_session') || localStorage.getItem('dh_user_session');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }
};

window.authService = authService;
