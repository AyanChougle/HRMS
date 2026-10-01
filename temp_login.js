
    // Tab switching logic
    function switchAuthTab(tab) {
      const loginForm = document.getElementById('login-form');
      const signupForm = document.getElementById('signup-form');
      const tabLoginBtn = document.getElementById('tab-login-btn');
      const tabSignupBtn = document.getElementById('tab-signup-btn');
      const authTitle = document.getElementById('auth-title');
      const authSubtitle = document.getElementById('auth-subtitle');
      const alertBox = document.getElementById('auth-alert');

      alertBox.className = 'auth-alert';
      alertBox.style.display = 'none';

      if (tab === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabLoginBtn.classList.remove('active');
        tabSignupBtn.classList.add('active');
        authTitle.textContent = 'Create Organization Account';
        authSubtitle.textContent = 'Register a new administrator or employee account in Firebase';
      } else {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabLoginBtn.classList.add('active');
        tabSignupBtn.classList.remove('active');
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to access your organization workspace';
      }
    }

    function togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.style.color = 'var(--primary)';
      } else {
        input.type = 'password';
        btn.style.color = 'var(--text-muted)';
      }
    }


    let isAuthenticating = false;

    // Explicit Sign In Handler (always called directly by onsubmit)
    async function handleLoginSubmit(event) {
      event.preventDefault();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const alertBox = document.getElementById('auth-alert');
      const loginBtn = document.getElementById('login-submit-btn');

      if (!email || !password) return;

      isAuthenticating = true;
      alertBox.className = 'auth-alert';
      alertBox.style.display = 'none';

      loginBtn.disabled = true;
      loginBtn.innerHTML = '<span>Verifying credentials with Firebase...</span>';

      try {
        const res = await authService.signIn(email, password);

        if (res.success) {
          loginBtn.innerHTML = '<span>Success! Opening Dashboard...</span>';
          Toast.success('Authenticated successfully!');
          const redirect = sessionStorage.getItem('redirect_after_login') || 'index.html#dashboard';
          sessionStorage.removeItem('redirect_after_login');
          window.location.replace(redirect);
        } else {
          isAuthenticating = false;
          loginBtn.disabled = false;
          loginBtn.innerHTML = '<span>Sign In to HRMS</span>';

          if (res.code === 'auth/user-not-found' || res.code === 'auth/invalid-credential' || res.code === 'auth/invalid-login-credentials' || res.code === 'auth/wrong-password') {
            const safeEmail = email.replace(/'/g, "\\'");
            const safePassword = password.replace(/'/g, "\\'");
            alertBox.innerHTML = `
              <div><strong>Account not found or invalid credentials.</strong></div>
              <div style="margin-top: 6px; font-size: 0.8rem;">
                If you haven't created this account in Firebase yet, 
                <a href="javascript:void(0)" onclick="quickFillSignUp('${safeEmail}', '${safePassword}')" style="color: var(--primary); text-decoration: underline; font-weight: 600;">
                  Click here to register ${email}
                </a>
              </div>
            `;
          } else {
            alertBox.textContent = res.error;
          }

          alertBox.className = 'auth-alert error';
          alertBox.style.display = 'block';
        }
      } catch (err) {
        isAuthenticating = false;
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In to HRMS</span>';
        alertBox.textContent = err.message || 'An unexpected error occurred during sign in.';
        alertBox.className = 'auth-alert error';
        alertBox.style.display = 'block';
      }
    }

    // Explicit Sign Up Handler (always called directly by onsubmit)
    async function handleSignupSubmit(event) {
      event.preventDefault();

      const firstName = document.getElementById('signup-firstname').value.trim();
      const lastName = document.getElementById('signup-lastname').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const company = document.getElementById('signup-company').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const alertBox = document.getElementById('auth-alert');
      const signupBtn = document.getElementById('signup-submit-btn');

      if (password !== confirmPassword) {
        alertBox.textContent = 'Passwords do not match. Please verify and re-enter.';
        alertBox.className = 'auth-alert error';
        alertBox.style.display = 'block';
        return;
      }

      isAuthenticating = true;
      alertBox.className = 'auth-alert';
      alertBox.style.display = 'none';

      signupBtn.disabled = true;
      signupBtn.innerHTML = '<span>Creating Firebase Account & Profile...</span>';

      const roleId = document.getElementById('signup-role')?.value || 'EMPLOYEE';

      const profileData = {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim() || email.split('@')[0],
        roleId: roleId,
        companyName: company || 'Diallo India Private Limited',
        companyId: 'comp_diallo_india',
        branchId: 'branch_mumbai',
        branchName: 'HQ - Mumbai',
        phone: phone || ''
      };

      try {
        const res = await authService.signUp(email, password, profileData);

        if (res.success) {
          signupBtn.innerHTML = '<span>Account Created! Opening Dashboard...</span>';
          Toast.success('Account created successfully! Redirecting...');
          const redirect = sessionStorage.getItem('redirect_after_login') || 'index.html#dashboard';
          sessionStorage.removeItem('redirect_after_login');
          window.location.replace(redirect);
        } else {
          isAuthenticating = false;
          signupBtn.disabled = false;
          signupBtn.innerHTML = '<span>Create Account & Start Session</span>';

          alertBox.textContent = res.error;
          alertBox.className = 'auth-alert error';
          alertBox.style.display = 'block';
        }
      } catch (err) {
        isAuthenticating = false;
        signupBtn.disabled = false;
        signupBtn.innerHTML = '<span>Create Account & Start Session</span>';
        alertBox.textContent = err.message || 'An unexpected error occurred during sign up.';
        alertBox.className = 'auth-alert error';
        alertBox.style.display = 'block';
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      try {
        ThemeManager.init();
        Toast.init();
      } catch (e) {
        console.warn('UI init warning:', e);
      }

      // Check URL parameters for tab=signup
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'signup' || window.location.hash === '#signup') {
        switchAuthTab('signup');
      }

      // If user is already authenticated on initial page load, redirect to dashboard
      try {
        auth.onAuthStateChanged((user) => {
          if (user && !isAuthenticating) {
            const redirect = sessionStorage.getItem('redirect_after_login') || 'index.html#dashboard';
            sessionStorage.removeItem('redirect_after_login');
            window.location.replace(redirect);
          }
        });
      } catch (e) {
        console.warn('Auth state check warning:', e);
      }
    });
  