const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js/views/ess-view.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace 1: Toast in punchIn
content = content.replace(
  `Toast.info("Verifying GPS location within 60m office radius...");`,
  `Toast.info("Verifying GPS location within office premises...");`
);

// Replace 2: geofence-error-modal in punchIn
content = content.replace(
  `subtitle: "Mandatory 60-meter office perimeter check",`,
  `subtitle: "Mandatory office location check",`
);

content = content.replace(
  `All employees and roles must be physically present within <strong>60 meters</strong> of the office premises:
                  <br/><strong>Office Premises (GPS: 19.166900, 72.931000)</strong>`,
  `All employees and roles must be physically present within the office premises to punch in.`
);

// Replace 3: errorMsg in punchIn
content = content.replace(
  `const errorMsg = \`Outside Office Perimeter: You are currently \${distanceDisplay} away from the office. Punch-in is strictly restricted to within office premises (60m perimeter).\`;`,
  `const errorMsg = \`Outside Office Perimeter: You are currently \${distanceDisplay} away from the office. Punch-in is strictly restricted to within office premises.\`;`
);

// Replace 4: subtitle in geofence-alert-modal
content = content.replace(
  `subtitle: \`Distance: \${distanceDisplay} (Office Perimeter: \${allowedRadius}m)\`,`,
  `subtitle: \`Distance: \${distanceDisplay}\`,`
);

// Replace 5: geofence-alert-modal body in punchIn
content = content.replace(
  `Company policy strictly requires each and every employee across all roles to be physically located within the office premises (19.166900, 72.931000) to check in.`,
  `Company policy strictly requires each and every employee across all roles to be physically located within the office premises to check in.`
);

content = content.replace(
  `                  <div><strong>Allowed Perimeter:</strong> \${allowedRadius} meters</div>`,
  ``
);

content = content.replace(
  `                    <strong>Designated Office Location:</strong><br/>
                    Office Premises (GPS: 19.166900, 72.931000)
                    <div style="margin-top: 6px;">
                      <a href="https://www.google.com/maps?q=19.166900,72.931000" target="_blank" rel="noopener noreferrer" style="color: var(--primary); font-weight: 600; text-decoration: underline;">View Office Location on Google Maps &rarr;</a>`,
  `                    <strong>Designated Office Location:</strong><br/>
                    Diallo Office Premises
                    <div style="margin-top: 6px;">
                      <a href="\${this.OFFICE_GEOFENCE.mapsUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); font-weight: 600; text-decoration: underline;">View Office Location on Google Maps &rarr;</a>`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('ess-view.js patched successfully for punchIn');
