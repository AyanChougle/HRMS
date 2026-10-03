const fs = require('fs');
let txt = fs.readFileSync('login.html', 'utf8');

// The original replace left:
// // Tab switching logic
//      else {
//         loginForm.style.display = 'block';
//         signupForm.style.display = 'none';
//         tabLoginBtn.classList.add('active');
//         tabSignupBtn.classList.remove('active');
//         authTitle.textContent = 'Welcome Back';
//         authSubtitle.textContent = 'Sign in to access your organization workspace';
//       }
//     }

const toRemove = /\/\/\s*Tab switching logic\s*else\s*{[\s\S]*?}\s*}/;
txt = txt.replace(toRemove, '');
fs.writeFileSync('login.html', txt);
console.log('Fixed dangling else');
