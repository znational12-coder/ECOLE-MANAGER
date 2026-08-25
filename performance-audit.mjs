import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['SQLite student index', fs.existsSync(path.join(root, 'server/db.ts')) && fs.readFileSync(path.join(root, 'server/db.ts'), 'utf8').includes('students_index')],
  ['SQLite indexes', fs.readFileSync(path.join(root, 'server/db.ts'), 'utf8').includes('idx_students_classe_nom')],
  ['Server pagination endpoint', read('server.ts').includes("app.get('/api/students'")],
  ['No full state localStorage cache', !read('src/services/storage.ts').includes('localStorage.setItem(KEY')],
  ['Debounced state writes', read('src/services/storage.ts').includes('flushSave')],
  ['Student search memoization', read('src/components/ElevesView.tsx').includes('studentIndex')],
  ['Visible-row bulletin calculation', read('src/components/ElevesView.tsx').includes('visibleStudentMetrics')],
];
let failed = 0;
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`), failed += ok ? 0 : 1;
process.exitCode = failed ? 1 : 0;
