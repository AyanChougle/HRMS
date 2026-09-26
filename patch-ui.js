const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('fonts.googleapis.com')) {
  html = html.replace(
    '<link rel="stylesheet" href="css/variables.css',
    '<link rel="preconnect" href="https://fonts.googleapis.com">\\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\\n    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\\n    <link rel="stylesheet" href="css/variables.css'
  );
  fs.writeFileSync('index.html', html, 'utf8');
}

let dashboardCss = fs.readFileSync('css/dashboard.css', 'utf8');
dashboardCss = dashboardCss.replace(
  'font-size: 1.85rem;',
  'font-size: 1.55rem; /* Reduced for textual KPI values */'
);
fs.writeFileSync('css/dashboard.css', dashboardCss, 'utf8');
console.log('UI cleaned and fonts configured');
