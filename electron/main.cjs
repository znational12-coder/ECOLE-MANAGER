const { app, BrowserWindow, dialog, session, Menu, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let serverProcess = null;
let mainWindow = null;
let backupTimer = null;
const PORT = 3187;
const LOCAL_SYSTEM_TOKEN = crypto.randomBytes(32).toString('hex');
const BACKUP_INTERVAL_MS = 30 * 60 * 1000;

function getServerPath() {
  return path.join(process.resourcesPath, 'app.asar', 'dist', 'server.cjs');
}
function getWritableDataDir() {
  const dir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function getBackupDir() {
  const dir = path.join(app.getPath('userData'), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function getUpdatesDir() {
  const dir = path.join(app.getPath('userData'), 'updates');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function getDbPath() { return path.join(getWritableDataDir(), 'perseverance.sqlite'); }

function startLocalServer() {
  const serverPath = getServerPath();
  const dataDir = getWritableDataDir();
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(PORT),
      APP_DATA_DIR: dataDir,
      LOCAL_SYSTEM_TOKEN,
      SESSION_PEPPER: process.env.SESSION_PEPPER || undefined,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  serverProcess.stdout.on('data', d => console.log(`[server] ${d}`));
  serverProcess.stderr.on('data', d => console.error(`[server] ${d}`));
  serverProcess.on('exit', code => { if (!app.isQuitting) console.error(`Serveur local arrêté (${code}).`); });
}
async function stopLocalServer() {
  if (!serverProcess || serverProcess.killed) return;
  await new Promise(resolve => {
    const p = serverProcess;
    const done = () => { serverProcess = null; resolve(); };
    p.once('exit', done);
    p.kill();
    setTimeout(() => { try { p.kill('SIGKILL'); } catch (_) {} }, 3000);
  });
}
async function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const response = await fetch(url); if (response.ok) return true; } catch (_) {}
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}
async function requestSystem(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${PORT}${pathname}`, {
    ...options,
    headers: { 'X-Local-System-Token': LOCAL_SYSTEM_TOKEN, ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(await response.text());
  return response;
}
async function createAutomaticBackup(reason = 'automatic') {
  try {
    const response = await requestSystem('/api/system/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    const payload = await response.json();
    console.log(`[backup] ${payload.path}`);
    return payload;
  } catch (error) {
    console.error('[backup] échec:', error.message);
    return null;
  }
}
async function restoreBackup(filePath) {
  await stopLocalServer();
  const target = getDbPath();
  const backup = path.resolve(filePath);
  if (!fs.existsSync(backup)) throw new Error('Fichier de sauvegarde introuvable.');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  for (const suffix of ['', '-wal', '-shm']) { try { fs.unlinkSync(target + suffix); } catch (_) {} }
  fs.copyFileSync(backup, target);
  startLocalServer();
  const ok = await waitForServer(`http://127.0.0.1:${PORT}/api/health`);
  if (!ok) throw new Error('Le serveur local n’a pas redémarré après restauration.');
}
function launchOfflineUpdate(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('Installateur introuvable.');
  const child = spawn(filePath, [], { detached: true, stdio: 'ignore', windowsHide: false });
  child.unref();
  setTimeout(() => app.quit(), 500);
}
function checkOfflineUpdate() {
  const manifestPath = path.join(getUpdatesDir(), 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const current = app.getVersion();
    if (!manifest.version || manifest.version === current) return null;
    const installer = path.join(getUpdatesDir(), manifest.installer || `École Manager-Setup-${manifest.version}.exe`);
    if (!fs.existsSync(installer)) return null;
    return { current, ...manifest, installer };
  } catch (_) { return null; }
}
function buildMenu() {
  const template = [
    { label: 'Fichier', submenu: [
      { label: 'Sauvegarder maintenant', click: async () => { const r = await createAutomaticBackup('manuel'); if (r) dialog.showMessageBox(mainWindow, { type: 'info', title: 'Sauvegarde', message: `Sauvegarde créée.\n\n${r.path}` }); } },
      { label: 'Restaurer une sauvegarde…', click: async () => {
        const picked = await dialog.showOpenDialog(mainWindow, { title: 'Choisir une sauvegarde', filters: [{ name: 'Sauvegardes SQLite', extensions: ['sqlite', 'db'] }], properties: ['openFile'] });
        if (picked.canceled || !picked.filePaths[0]) return;
        const confirm = await dialog.showMessageBox(mainWindow, { type: 'warning', buttons: ['Restaurer', 'Annuler'], defaultId: 1, title: 'Restaurer les données', message: 'Cette opération remplacera les données actuelles par la sauvegarde choisie.' });
        if (confirm.response !== 0) return;
        try { await restoreBackup(picked.filePaths[0]); dialog.showMessageBox(mainWindow, { type: 'info', title: 'Restauration terminée', message: 'Les données ont été restaurées. L’application va se recharger.' }); mainWindow.loadURL(`http://127.0.0.1:${PORT}/`); }
        catch (e) { dialog.showErrorBox('Restauration', e.message || String(e)); startLocalServer(); }
      } },
      { type: 'separator' }, { role: 'quit', label: 'Quitter' }
    ]},
    { label: 'Maintenance', submenu: [
      { label: 'Ouvrir le dossier des sauvegardes', click: () => shell.openPath(getBackupDir()) },
      { label: 'Ouvrir le dossier des mises à jour hors ligne', click: () => shell.openPath(getUpdatesDir()) },
      { label: 'Vérifier une mise à jour hors ligne', click: async () => {
        const update = checkOfflineUpdate();
        if (!update) return dialog.showMessageBox(mainWindow, { type: 'info', title: 'Mise à jour hors ligne', message: 'Aucune mise à jour locale disponible.' });
        const answer = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: ['Installer', 'Annuler'], defaultId: 0, title: 'Mise à jour disponible', message: `Version ${update.version} disponible (version actuelle ${update.current}).` });
        if (answer.response === 0) launchOfflineUpdate(update.installer);
      } }
    ]},
    { label: 'Aide', submenu: [{ role: 'about', label: `À propos d’École Manager ${app.getVersion()}` }] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
async function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 900, minWidth: 1100, minHeight: 700, title: 'École Manager', backgroundColor: '#f8fafc', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  const ok = await waitForServer(`http://127.0.0.1:${PORT}/api/health`);
  if (!ok) { dialog.showErrorBox('École Manager', 'Le serveur local n’a pas pu démarrer.'); app.quit(); return; }
  await mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);
  mainWindow.on('closed', () => { mainWindow = null; });
}
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  buildMenu(); startLocalServer(); await createWindow();
  await createAutomaticBackup('démarrage');
  backupTimer = setInterval(() => createAutomaticBackup('planifiée'), BACKUP_INTERVAL_MS);
  const update = checkOfflineUpdate();
  if (update && mainWindow) setTimeout(() => dialog.showMessageBox(mainWindow, { type: 'info', buttons: ['Ouvrir le dossier', 'Plus tard'], title: 'Mise à jour hors ligne disponible', message: `La version ${update.version} est disponible dans le dossier des mises à jour.` }).then(r => { if (r.response === 0) shell.openPath(getUpdatesDir()); }), 1500);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('before-quit', async () => { app.isQuitting = true; if (backupTimer) clearInterval(backupTimer); await createAutomaticBackup('arrêt'); await stopLocalServer(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
