import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { AppState, UserSession } from '../src/types';
import { SEED_DATA } from '../src/data/seedData';
import { MODELES_CONVOCATIONS_DEFAUT, MODELES_SUJETS_DEFAUT, MODELES_AFFICHES_DEFAUT, MODELES_ATTESTATIONS_DEFAUT } from '../src/data/modelesPedagogiques';
export type Role = 'admin' | 'prof' | 'gestionnaire';
const DATA_DIR = process.env.APP_DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'perseverance.sqlite');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id=1), state_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('admin','prof','gestionnaire')), display_name TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, disabled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, role TEXT, action TEXT NOT NULL, details_json TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS students_index (matricule TEXT PRIMARY KEY, nom TEXT NOT NULL, nom_normalized TEXT NOT NULL, classe TEXT NOT NULL, niveau TEXT NOT NULL, serie TEXT, civilite TEXT, statut_initial TEXT, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_students_nom_normalized ON students_index(nom_normalized);
CREATE INDEX IF NOT EXISTS idx_students_classe ON students_index(classe);
CREATE INDEX IF NOT EXISTS idx_students_niveau ON students_index(niveau);
CREATE INDEX IF NOT EXISTS idx_students_classe_nom ON students_index(classe, nom_normalized);`);
const now=()=>new Date().toISOString();
function hashPassword(password:string,salt=randomBytes(16).toString('hex')){return {salt,hash:scryptSync(password,salt,64).toString('hex')}}
function verifyPassword(password:string,u:any){const a=scryptSync(password,u.password_salt,64),b=Buffer.from(u.password_hash,'hex');return a.length===b.length&&timingSafeEqual(a,b)}
function defaultState():AppState{const d=JSON.parse(JSON.stringify(SEED_DATA));d.convocations=JSON.parse(JSON.stringify(MODELES_CONVOCATIONS_DEFAUT));d.sujets=JSON.parse(JSON.stringify(MODELES_SUJETS_DEFAUT));d.affiches=JSON.parse(JSON.stringify(MODELES_AFFICHES_DEFAUT));d.attestations=JSON.parse(JSON.stringify(MODELES_ATTESTATIONS_DEFAUT));delete d.parametres?.adminCode;delete d.parametres?.codeRecuperation;for(const p of d.professeurs||[])delete p.code;for(const g of d.gestionnaires||[])delete g.code;return d}
function normalizeText(value:string){return (value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
function syncStudentsIndex(state:AppState){
  const rows=db.prepare('SELECT matricule FROM students_index').all() as any[];
  const existing=new Set(rows.map(r=>r.matricule));
  const up=db.prepare(`INSERT INTO students_index(matricule,nom,nom_normalized,classe,niveau,serie,civilite,statut_initial,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(matricule) DO UPDATE SET nom=excluded.nom,nom_normalized=excluded.nom_normalized,classe=excluded.classe,niveau=excluded.niveau,serie=excluded.serie,civilite=excluded.civilite,statut_initial=excluded.statut_initial,updated_at=excluded.updated_at`);
  const at=now();
  for(const e of state.eleves||[]) { up.run(e.matricule,e.nom,normalizeText(e.nom),e.classe,e.niveau,e.serie||'',e.civilite||'',e.statutInitial||'',at); existing.delete(e.matricule); }
  const del=db.prepare('DELETE FROM students_index WHERE matricule=?');
  for(const matricule of existing) del.run(matricule);
}
function ensureUsers(state:AppState){const c=Number((db.prepare('SELECT COUNT(*) c FROM users').get() as any).c||0);if(c)return;const at=now();const admin=process.env.ADMIN_INITIAL_PASSWORD||randomBytes(12).toString('base64url');const staff=process.env.STAFF_INITIAL_PASSWORD||randomBytes(12).toString('base64url');const ah=hashPassword(admin);db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run('admin','admin','Administration Centrale',ah.hash,ah.salt,0,at);for(const p of state.professeurs||[]){const h=hashPassword(staff);db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(p.id,'prof',p.nom,h.hash,h.salt,0,at)}for(const g of state.gestionnaires||[]){const h=hashPassword(staff);db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(g.id,'gestionnaire',g.nom,h.hash,h.salt,0,at)}console.log('\n[SECURITY] Comptes initiaux créés côté serveur.');console.log(`[SECURITY] Administrateur: ${admin}`);console.log(`[SECURITY] Personnel: ${staff}`);console.log('[SECURITY] Changez immédiatement les mots de passe depuis Personnel.\n')}
function sanitizeState(input:AppState):AppState{const s=JSON.parse(JSON.stringify(input));delete s.parametres?.adminCode;delete s.parametres?.codeRecuperation;for(const p of s.professeurs||[])delete p.code;for(const g of s.gestionnaires||[])delete g.code;return s}
if(!(db.prepare('SELECT id FROM app_state WHERE id=1').get()))db.prepare('INSERT INTO app_state VALUES(1,?,?,?)').run(JSON.stringify(defaultState()),1,now());
const initialState=getStateSafe();
syncStudentsIndex(initialState);
ensureUsers(initialState);
export function getStateSafe():AppState{return JSON.parse((db.prepare('SELECT state_json FROM app_state WHERE id=1').get() as any).state_json)}
export function getState():AppState{return getStateSafe()}
export function validateState(state: any): asserts state is AppState {
  if (!state || typeof state !== 'object') throw new Error('État invalide.');
  const arrays = ['eleves','classes','notesS1','notesS2','absences','sanctions','paiements','professeurs','gestionnaires','emploiDuTemps','convocations','sujets','affiches','attestations'];
  for (const key of arrays) if (!Array.isArray(state[key])) throw new Error(`Champ invalide: ${key}.`);
  if (!state.parametres || typeof state.parametres !== 'object') throw new Error('Paramètres invalides.');
  for (const p of state.paiements) if (typeof p.montant !== 'number' || !Number.isFinite(p.montant) || p.montant < 0) throw new Error('Montant de paiement invalide.');
  for (const n of [...(state.notesS1||[]), ...(state.notesS2||[])]) {
    for (const [k,v] of Object.entries(n)) if (k !== 'matricule' && v !== null && v !== undefined) {
      if (typeof v === 'number' && (!Number.isFinite(v) || v < 0 || v > 20)) throw new Error('Note hors limites (0–20).');
      if (typeof v === 'object') for (const value of Object.values(v as any)) if (value !== null && value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 20)) throw new Error('Note hors limites (0–20).');
    }
  }
}
const ALLOWED:Record<Role,string[]|null>={admin:null,prof:['notesS1','notesS2','sujets','affiches','attestations'],gestionnaire:['paiements','attestations']};
export function updateState(next:AppState,user:UserSession){validateState(next);const current=getState(),incoming=sanitizeState(next),merged=JSON.parse(JSON.stringify(current));const keys=ALLOWED[user.type as Role]||[];for(const k of (keys===null?Object.keys(current):keys))if(k in incoming)merged[k]=incoming[k];const changedStudents = JSON.stringify(current.eleves) !== JSON.stringify(merged.eleves);db.prepare('UPDATE app_state SET state_json=?,version=version+1,updated_at=? WHERE id=1').run(JSON.stringify(merged),now());if(changedStudents) syncStudentsIndex(merged);if(user.type==='admin') reconcileUsers(merged);audit(user,'state.update',{fields:keys===null?'all':keys});return merged as AppState}

function reconcileUsers(state: AppState) {
  const desired: Array<{id:string;role:Role;name:string}> = [
    ...(state.professeurs||[]).map(p=>({id:p.id,role:'prof' as Role,name:p.nom})),
    ...(state.gestionnaires||[]).map(g=>({id:g.id,role:'gestionnaire' as Role,name:g.nom})),
  ];
  const at=now();
  for(const u of desired){
    const exists=db.prepare('SELECT id FROM users WHERE id=?').get(u.id);
    if(!exists){
      const temp=randomBytes(12).toString('base64url'); const h=hashPassword(temp);
      db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(u.id,u.role,u.name,h.hash,h.salt,0,at);
      console.log(`[SECURITY] Nouveau compte ${u.role}/${u.id}. Mot de passe temporaire: ${temp}`);
    } else db.prepare('UPDATE users SET display_name=?,disabled=0,updated_at=? WHERE id=?').run(u.name,at,u.id);
  }
  const wanted=new Set(desired.map(u=>u.id).concat(['admin']));
  for(const row of db.prepare('SELECT id FROM users').all() as any[]){ if(!wanted.has(row.id)) db.prepare('UPDATE users SET disabled=1,updated_at=? WHERE id=?').run(at,row.id); }
}
export function authenticate(type:Role,id:string|null,password:string):UserSession|null{const uid=type==='admin'?'admin':String(id||'');const u=db.prepare('SELECT * FROM users WHERE id=? AND role=? AND disabled=0').get(uid,type) as any;if(!u||!verifyPassword(password,u))return null;return {type,id:type==='admin'?null:uid}}
const PEPPER_PATH = path.join(DATA_DIR, '.session-pepper');
function pepper(){
  if(process.env.SESSION_PEPPER) return process.env.SESSION_PEPPER;
  if(process.env.NODE_ENV === 'production') throw new Error('SESSION_PEPPER doit être configuré en production.');
  if(!fs.existsSync(PEPPER_PATH)) fs.writeFileSync(PEPPER_PATH, randomBytes(32).toString('base64url'), { mode: 0o600 });
  return fs.readFileSync(PEPPER_PATH, 'utf8').trim();
}
export function createSession(session:UserSession){const token=randomBytes(32).toString('base64url');const tokenHash=scryptSync(token,pepper(),32).toString('hex');const id=randomBytes(16).toString('hex'),expires=new Date(Date.now()+8*3600_000).toISOString();db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(id,tokenHash,session.type==='admin'?'admin':session.id,expires,now());audit(session,'auth.login');return{token,expires}}
export function sessionFromToken(token?:string):UserSession|null{if(!token)return null;const h=scryptSync(token,pepper(),32).toString('hex');const r=db.prepare('SELECT s.user_id,s.expires_at,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND u.disabled=0').get(h) as any;if(!r||new Date(r.expires_at).getTime()<=Date.now())return null;return{type:r.role,id:r.role==='admin'?null:r.user_id}}
export function destroySession(token?:string){if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(scryptSync(token,pepper(),32).toString('hex'))}
export function changePassword(target:UserSession,newPassword:string,actor:UserSession){if(actor.type!=='admin')throw new Error('Seul un administrateur peut réinitialiser un mot de passe.');if(newPassword.trim().length<8)throw new Error('Le mot de passe doit comporter au moins 8 caractères.');const id=target.type==='admin'?'admin':target.id;if(!id)throw new Error('Utilisateur invalide.');const h=hashPassword(newPassword.trim());db.prepare('UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').run(h.hash,h.salt,now(),id);audit(actor,'auth.password_reset',{target:id})}
export function listUsers(){return(db.prepare('SELECT id,role,display_name name,disabled FROM users ORDER BY role,display_name').all() as any[]).map(u=>({id:u.id,type:u.role,name:u.name,disabled:Boolean(u.disabled)}))}
export function audit(user:UserSession|null,action:string,details:Record<string,unknown>={}){db.prepare('INSERT INTO audit_logs(user_id,role,action,details_json,created_at) VALUES(?,?,?,?,?)').run(user?.id||'system',user?.type||'system',action,JSON.stringify(details),now())}
export function getAuditLogs(limit=100){return db.prepare('SELECT id,user_id,role,action,details_json,created_at FROM audit_logs ORDER BY id DESC LIMIT ?').all(Math.min(Math.max(limit,1),500))}

export function listStudents(params:{q?:string;classe?:string;niveau?:string;limit?:number;offset?:number}){
  const limit=Math.min(Math.max(Number(params.limit)||50,1),200); const offset=Math.max(Number(params.offset)||0,0); const q=normalizeText(params.q||'');
  const where:string[]=[]; const args:any[]=[];
  if(q){where.push('(nom_normalized LIKE ? OR lower(matricule) LIKE ? OR lower(classe) LIKE ?)'); const like='%'+q+'%'; args.push(like,like,like)}
  if(params.classe){where.push('classe=?');args.push(params.classe)}
  if(params.niveau){where.push('niveau=?');args.push(params.niveau)}
  const clause=where.length?' WHERE '+where.join(' AND '):'';
  const total=Number((db.prepare(`SELECT COUNT(*) c FROM students_index${clause}`).get(...args) as any).c||0);
  const rows=db.prepare(`SELECT matricule,nom,nom_normalized,classe,niveau,serie,civilite,statut_initial statutInitial FROM students_index${clause} ORDER BY classe COLLATE NOCASE, nom_normalized COLLATE NOCASE LIMIT ? OFFSET ?`).all(...args,limit,offset) as any[];
  return {rows,total,limit,offset};
}

export function createBackup(reason = 'manual') {
  const backupDir = path.join(DATA_DIR, '..', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const safeReason = String(reason).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 32) || 'backup';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupDir, `ecole-manager-${stamp}-${safeReason}.sqlite`);
  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  const files = fs.readdirSync(backupDir).map(name => ({name, path:path.join(backupDir,name), mtime:fs.statSync(path.join(backupDir,name)).mtimeMs})).sort((a,b)=>b.mtime-a.mtime);
  for (const file of files.slice(20)) { try { fs.unlinkSync(file.path); } catch (_) {} }
  return { ok: true, path: target, createdAt: new Date().toISOString(), reason: safeReason };
}
