const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

const OLD_CARD_END = "                    </ul>\n                  </div>\n                </div>\n              </div>\n            `;";
const NEW_CARD_END = "                    </ul>\n                  </div>\n" +
  "                  ${(isTrainer && isCurrent && curDay < 7) ? `\n" +
  "                    <div style=\"margin-top: 16px; border-top: 1px dashed var(--border-main); padding-top: 14px; display: flex; justify-content: flex-end;\">\n" +
  "                      <button class=\"btn btn-primary\" onclick=\"TrainingView.advanceTraineeDay('${myTraineeRecord.id}', ${curDay})\">\n" +
  "                        <svg width=\"16\" height=\"16\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 13l4 4L19 7\"/></svg>\n" +
  "                        Mark Day ${curDay} Complete\n" +
  "                      </button>\n" +
  "                    </div>\n" +
  "                  ` : ''}\n" +
  "                </div>\n              </div>\n            `;";

if (!c.includes(OLD_CARD_END)) { console.error('OLD_CARD_END not found'); process.exit(1); }
c = c.replace(OLD_CARD_END, NEW_CARD_END);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED module mark complete button successfully');
