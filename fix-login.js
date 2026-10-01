const fs = require('fs');
let txt = fs.readFileSync('login.html', 'utf8');

txt = txt.replace(
  '<input type="password" id="login-password" class="form-control" placeholder="••••••••" required>',
  '<input type="password" id="login-password" class="form-control" placeholder="••••••••" autocomplete="current-password" required>'
);

txt = txt.replace(
  '<input type="password" id="signup-password" class="form-control" placeholder="Minimum 6 characters" minlength="6" required>',
  '<input type="password" id="signup-password" class="form-control" placeholder="Minimum 6 characters" minlength="6" autocomplete="new-password" required>'
);

txt = txt.replace(
  '<input type="password" id="signup-confirm-password" class="form-control" placeholder="Re-enter password" minlength="6" required>',
  '<input type="password" id="signup-confirm-password" class="form-control" placeholder="Re-enter password" minlength="6" autocomplete="new-password" required>'
);

fs.writeFileSync('login.html', txt);
console.log('Fixed login.html');
