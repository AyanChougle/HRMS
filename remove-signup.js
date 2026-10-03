const fs = require('fs');

let loginHtml = fs.readFileSync('login.html', 'utf8');

// 1. Remove auth-tabs div
loginHtml = loginHtml.replace(/<div class="auth-tabs">[\s\S]*?<\/div>/, '');

// 2. Remove Signup Form completely
const signupFormStart = loginHtml.indexOf('<form id="signup-form"');
const signupFormEnd = loginHtml.indexOf('</form>', signupFormStart) + 7;
if (signupFormStart !== -1) {
  loginHtml = loginHtml.slice(0, signupFormStart) + loginHtml.slice(signupFormEnd);
}

// 3. Remove switchAuthTab function from the script
loginHtml = loginHtml.replace(/function switchAuthTab\(tab\) {[\s\S]*?}/, '');

// 4. Remove handleSignupSubmit function
loginHtml = loginHtml.replace(/async function handleSignupSubmit\(event\) {[\s\S]*?(?=document\.addEventListener)/, '');

// 5. Remove urlParams check for signup
loginHtml = loginHtml.replace(/\/\/ Check URL parameters for tab=signup[\s\S]*?switchAuthTab\('signup'\);\s*}/, '');

// 6. Update titles
loginHtml = loginHtml.replace('<title>Sign In & Sign Up — Diallo HRMS Enterprise Cloud</title>', '<title>Sign In — Diallo HRMS Enterprise Cloud</title>');
loginHtml = loginHtml.replace('<div class="auth-title">Create Organization Account</div>', '<div class="auth-title">Sign In</div>');
loginHtml = loginHtml.replace('<p class="auth-subtitle">Register a new administrator or employee account in Firebase</p>', '<p class="auth-subtitle">Access your organization workspace</p>');

fs.writeFileSync('login.html', loginHtml);
console.log('Removed Create Account flow from login.html');
