const fs = require('fs');
let txt = fs.readFileSync('login.html', 'utf8');

if (!txt.includes('Promise.race')) {
  txt = txt.replace(
    'const res = await authService.signIn(email, password);',
    `const res = await Promise.race([
          authService.signIn(email, password),
          new Promise((resolve) => setTimeout(() => resolve({ success: false, message: 'Firebase connection timed out. Please check your internet or disable adblockers.' }), 10000))
        ]);`
  );
  fs.writeFileSync('login.html', txt);
  console.log('Added timeout to login.html');
}
