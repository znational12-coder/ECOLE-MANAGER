import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const files = ['server.ts','server/db.ts','src/services/storage.ts','src/components/UserSwitcherModal.tsx','src/data/seedData.ts','src/services/logic.ts'];
const text = files.map(f => fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const checks = [
  ['legacy master key', /PERSEVERANCE-MASTER-2026/],
  ['legacy admin password', /admin123/],
  ['legacy role header trust', /x-session-role/],
  ['legacy hard-coded staff PIN', /code:\s*['"](?:1234|0000)['"]/],
  ['count-based destructive migration', /length\s*>=\s*(?:100|50)/],
];
let failed = false;
for (const [name,re] of checks) {
  const hit = re.test(text); console.log(`${hit ? 'FAIL' : 'PASS'}  ${name}`); failed ||= hit;
}
for (const required of ['sessionFromToken','sqlite','scrypt','HttpOnly','audit_logs','validateState']) {
  const hit = text.includes(required); console.log(`${hit ? 'PASS' : 'FAIL'}  required control: ${required}`); failed ||= !hit;
}
process.exitCode = failed ? 1 : 0;
