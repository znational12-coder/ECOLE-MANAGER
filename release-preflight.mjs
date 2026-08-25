import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const expected = pkg.version;
const requiredFiles = [
  'electron/main.cjs',
  'installer/installer.nsh',
  'build/icon.ico',
  'scripts/security-audit.mjs',
  'server.ts',
  'server/db.ts',
];
let failed = false;
const check = (ok, label, detail='') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed = true;
};

check(/^\d+\.\d+\.\d+$/.test(expected), 'semantic version', expected);
for (const file of requiredFiles) check(fs.existsSync(path.join(root, file)), `required file: ${file}`);
check(pkg.main === 'electron/main.cjs', 'Electron entry point');
check(pkg.build?.win?.target?.some(t => (typeof t === 'string' ? t : t.target) === 'nsis'), 'NSIS target');
check(pkg.build?.win?.target?.some(t => (typeof t === 'string' ? t : t.target) === 'portable'), 'portable target');
check(pkg.build?.nsis?.createDesktopShortcut === true, 'desktop shortcut');
check(pkg.build?.nsis?.createStartMenuShortcut === true, 'Start Menu shortcut');
check(pkg.build?.nsis?.deleteAppDataOnUninstall === false, 'preserve app data on uninstall');
check(pkg.scripts?.['dist:win']?.includes('electron-builder --win nsis'), 'Windows distribution script');
check(pkg.scripts?.['dist:portable']?.includes('electron-builder --win portable'), 'portable distribution script');

const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const electron = read('electron/main.cjs');
const readme = read('README-WINDOWS-OFFLINE.md');
check(electron.includes('BACKUP_INTERVAL_MS'), 'automatic backup scheduler');
check(electron.includes('LOCAL_SYSTEM_TOKEN'), 'local system token');
check(electron.includes('127.0.0.1'), 'loopback-only server');
check(readme.includes(expected), 'documentation version', expected);
check(!readme.includes('1.1.0'), 'no stale 1.1.0 documentation');
check(!readme.includes('1.0.0'), 'no stale 1.0.0 documentation');

const forbiddenNetwork = /(https?:\/\/(?!127\.0\.0\.1|localhost)|axios\.|XMLHttpRequest)/i;
const sourceFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules','dist','release','.git'].includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx|cjs|mjs|html)$/.test(name)) sourceFiles.push(full);
  }
}
walk(root);
const external = sourceFiles.filter(f => { const rel = path.relative(root,f); if (rel === 'scripts/release-preflight.mjs' || rel === 'server.ts' || rel === 'electron/main.cjs') return false; return forbiddenNetwork.test(fs.readFileSync(f,'utf8')); });

check(external.length === 0, 'no obvious external network endpoints in application source', external.map(f=>path.relative(root,f)).join(', '));

process.exitCode = failed ? 1 : 0;
