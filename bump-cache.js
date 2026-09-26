const fs = require('fs');
const htmlPath = 'D:/AYAN/HRMS/index.html';
let content = fs.readFileSync(htmlPath, 'utf8');

// Replace any existing ?v=... and add a new timestamp version
const version = '?v=' + Date.now();

// Match any script src or stylesheet href ending in .js or .css, with or without ?v=...
content = content.replace(/(src|href)="([^"]+\.(?:js|css))(?:[^"]*)?"/g, (match, attr, path) => {
    // Ignore external URLs
    if (path.startsWith('http') || path.startsWith('//')) {
        return match;
    }
    return `${attr}="${path}${version}"`;
});

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Bumped cache version for all local scripts and stylesheets in index.html to', version);
