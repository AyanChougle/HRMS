const fs = require('fs');

let loginHtml = fs.readFileSync('login.html', 'utf8');

// The regex needs to carefully match the whole div containing signup-role
const roleBlockPattern = /<div class="form-group" style="margin-bottom: 14px;">\s*<label class="form-label required">Designated Account Role & Workspace<\/label>\s*<select id="signup-role"[\s\S]*?<\/div>/;

loginHtml = loginHtml.replace(roleBlockPattern, '');
fs.writeFileSync('login.html', loginHtml);
console.log('Removed signup-role from login.html');
