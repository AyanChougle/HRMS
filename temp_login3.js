
    

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
        const res = await Promise.race([
          authService.signIn(email, password),
          new Promise((resolve) => setTimeout(() => resolve({ success: false, message: 'Firebase connection timed out. Please check your internet or disable adblockers.' }), 10000))
        ]);

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
    document.addEventListener('DOMContentLoaded', () => {
      try {
        ThemeManager.init();
        Toast.init();
      } catch (e) {
        console.warn('UI init warning:', e);
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
  