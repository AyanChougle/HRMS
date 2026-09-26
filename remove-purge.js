const fs = require('fs');

// recruitment-view.js
let rv = fs.readFileSync('js/views/recruitment-view.js', 'utf8');
let idxR = rv.indexOf('Purge Test Candidates');
if (idxR !== -1) {
    let before = rv.lastIndexOf('<button', idxR);
    let after = rv.indexOf('</button>', idxR) + 9;
    rv = rv.substring(0, before) + rv.substring(after);
    fs.writeFileSync('js/views/recruitment-view.js', rv);
    console.log('Fixed recruitment');
}

// people-view.js - multiple buttons
let pv = fs.readFileSync('js/views/people-view.js', 'utf8');
while (pv.indexOf('Purge Demo Records') !== -1) {
    let idx = pv.indexOf('Purge Demo Records');
    let before = pv.lastIndexOf('<button', idx);
    let after = pv.indexOf('</button>', idx) + 9;
    pv = pv.substring(0, before) + pv.substring(after);
}
fs.writeFileSync('js/views/people-view.js', pv);
console.log('Fixed people');

// admin-dashboard-view.js - Purge button? Let's check
let adv = fs.readFileSync('js/views/admin-dashboard-view.js', 'utf8');
while (adv.indexOf('Purge') !== -1) {
    let idx = adv.indexOf('Purge');
    let before = adv.lastIndexOf('<button', idx);
    if (before !== -1 && idx - before < 200) { // Only remove if it's a button nearby
        let after = adv.indexOf('</button>', idx) + 9;
        adv = adv.substring(0, before) + adv.substring(after);
    } else {
        break; // Stop if 'Purge' is not in a button
    }
}
fs.writeFileSync('js/views/admin-dashboard-view.js', adv);
