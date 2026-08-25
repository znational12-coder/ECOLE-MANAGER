import { AppState, UserSession } from '../types';
import { SEED_DATA } from '../data/seedData';
import {
  MODELES_CONVOCATIONS_DEFAUT,
  MODELES_SUJETS_DEFAUT,
  MODELES_AFFICHES_DEFAUT,
  MODELES_ATTESTATIONS_DEFAUT
} from '../data/modelesPedagogiques';

const KEY = 'lp_scolaire_state_v2';
const SESSION_KEY = 'lp_scolaire_session_v2';
const AUTOBACKUP_CONFIG_KEY = 'lp_scolaire_autobackup_config_v1';

export interface AutoBackupConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g., 15, 30, 60, 120
  lastBackupTime: number | null; // timestamp in ms
  notificationOnDownload: boolean;
}

export class StorageService {
  private static state: AppState | null = null;
  private static listeners: Array<(state: AppState) => void> = [];
  private static sessionListeners: Array<(session: UserSession) => void> = [];
  private static autoBackupListeners: Array<(config: AutoBackupConfig) => void> = [];
  private static autoBackupIntervalId: any = null;
  private static autoBackupConfig: AutoBackupConfig | null = null;
  private static pendingSave: AppState | null = null;
  private static saveTimer: ReturnType<typeof setTimeout> | null = null;
  private static saveInFlight = false;

  static defaultState(): AppState {
    const def = JSON.parse(JSON.stringify(SEED_DATA));
    def.convocations = JSON.parse(JSON.stringify(MODELES_CONVOCATIONS_DEFAUT));
    def.sujets = JSON.parse(JSON.stringify(MODELES_SUJETS_DEFAUT));
    def.affiches = JSON.parse(JSON.stringify(MODELES_AFFICHES_DEFAUT));
    def.attestations = JSON.parse(JSON.stringify(MODELES_ATTESTATIONS_DEFAUT));
    return def;
  }

  static migrate(s: any): AppState {
    const def = this.defaultState();
    if (!s || typeof s !== 'object') return def;

    // Never replace existing user data based on record counts. Migrations are additive only.
    const eleves = Array.isArray(s.eleves) ? s.eleves : def.eleves;
    const classes = Array.isArray(s.classes) ? s.classes : def.classes;
    const notesS1 = Array.isArray(s.notesS1) ? s.notesS1 : def.notesS1;
    const notesS2 = Array.isArray(s.notesS2) ? s.notesS2 : def.notesS2;
    const paiements = Array.isArray(s.paiements) ? s.paiements : def.paiements;

    const merged: AppState = {
      parametres: { ...def.parametres, ...(s.parametres || {}) },
      disciplines: s.disciplines || def.disciplines,
      coefs: s.coefs || def.coefs,
      eleves,
      notesS1,
      notesS2,
      absences: s.absences || def.absences,
      sanctions: s.sanctions || def.sanctions,
      paiements,
      classes,
      professeurs: s.professeurs || def.professeurs,
      gestionnaires: s.gestionnaires || def.gestionnaires,
      emploiDuTemps: s.emploiDuTemps || def.emploiDuTemps,
      convocations: Array.isArray(s.convocations) && s.convocations.length > 0 ? s.convocations : def.convocations,
      sujets: Array.isArray(s.sujets) && s.sujets.length > 0 ? s.sujets : def.sujets,
      affiches: Array.isArray(s.affiches) && s.affiches.length > 0 ? s.affiches : def.affiches,
      attestations: Array.isArray(s.attestations) && s.attestations.length > 0 ? s.attestations : def.attestations,
      classesCloturees: s.classesCloturees || {},
      archives: {
        annees: [],
        classes: [],
        exclusions: [],
        diplomes: []
      }
    };

    // Ensure all required fields inside archives regardless of previous schema version
    if (Array.isArray(s.archives)) {
      merged.archives.annees = s.archives;
    } else if (s.archives && typeof s.archives === 'object') {
      merged.archives.annees = Array.isArray(s.archives.annees) ? s.archives.annees : [];
      merged.archives.classes = Array.isArray(s.archives.classes) ? s.archives.classes : [];
      merged.archives.exclusions = Array.isArray(s.archives.exclusions) ? s.archives.exclusions : [];
      merged.archives.diplomes = Array.isArray(s.archives.diplomes) ? s.archives.diplomes : [];
    }

    return merged;
  }

  /**
   * Regenerates / populates the full 100 students per class cohort (1,800 students)
   */
  static populate100StudentsCohort(): AppState {
    const fresh = this.defaultState();
    const currentState = this.get();
    const mergedState: AppState = {
      ...currentState,
      classes: fresh.classes,
      eleves: fresh.eleves,
      notesS1: fresh.notesS1,
      notesS2: fresh.notesS2,
      paiements: fresh.paiements
    };
    this.save(mergedState);
    return mergedState;
  }

  /**
   * Update password / PIN for a professor
   */
  static async updateProfesseurPin(profId: string, newCode: string): Promise<boolean> {
    await this.changePassword('prof', profId, newCode);
    return true;
  }

  /**
   * Update password / PIN for a gestionnaire
   */
  static async updateGestionnairePin(gestId: string, newCode: string): Promise<boolean> {
    await this.changePassword('gestionnaire', gestId, newCode);
    return true;
  }

  /**
   * Update master admin password
   */
  static async updateAdminCode(newCode: string): Promise<boolean> {
    await this.changePassword('admin', null, newCode);
    return true;
  }

  /**
   * Reset password in case of forgotten password
   */
  static async resetPassword(type: 'prof' | 'gestionnaire' | 'admin', id: string | null, newPin: string): Promise<{ success: boolean; message: string }> {
    try { await this.changePassword(type, id, newPin); return { success: true, message: 'Le mot de passe a été réinitialisé.' }; }
    catch (error: any) { return { success: false, message: error.message || 'Impossible de réinitialiser le mot de passe.' }; }
  }

  private static async changePassword(type: 'prof' | 'gestionnaire' | 'admin', id: string | null, password: string) {
    const response = await fetch('/api/auth/change-password', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id, password }) });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || 'Impossible de modifier le mot de passe.'); }
  }

  static async authenticate(type: UserSession['type'], id: string | null, password: string): Promise<UserSession> {
    if (!type) throw new Error('Profil invalide.');
    const response = await fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id, password }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Identifiant ou mot de passe incorrect.');
    const session = payload.session as UserSession;
    this.notifySession(session);
    await this.hydrateFromServer();
    return session;
  }

  static async hydrateFromServer(): Promise<AppState> {
    const response = await fetch('/api/state', { credentials: 'include' });
    if (!response.ok) throw new Error('Session expirée ou accès refusé.');
    const payload = await response.json();
    this.state = this.migrate(payload.state);
    // The server/database is the source of truth. Do not serialize the full school database into localStorage.
    this.notify(this.state);
    return this.state;
  }

  static async restoreSession(): Promise<UserSession> {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    const payload = await response.json().catch(() => ({}));
    const session = (payload.session || { type: null, id: null }) as UserSession;
    this.notifySession(session);
    if (session.type) await this.hydrateFromServer();
    return session;
  }

  static async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    const empty: UserSession = { type: null, id: null };
    this.notifySession(empty);
  }

  static load(): AppState {
    if (this.state) return this.state;
    this.state = this.defaultState();
    delete (this.state.parametres as any).adminCode;
    delete (this.state.parametres as any).codeRecuperation;
    this.state.professeurs.forEach((p: any) => delete p.code);
    this.state.gestionnaires.forEach((g: any) => delete g.code);
    return this.state;
  }

  static get(): AppState {
    return this.load();
  }

  static save(newState?: AppState): void {
    if (newState) this.state = newState;
    if (!this.state) return;
    const safeState = this.migrate(JSON.parse(JSON.stringify(this.state)));
    delete (safeState.parametres as any).adminCode;
    delete (safeState.parametres as any).codeRecuperation;
    safeState.professeurs.forEach((p: any) => delete p.code);
    safeState.gestionnaires.forEach((g: any) => delete g.code);
    this.state = safeState;
    this.notify(safeState);
    this.pendingSave = safeState;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => { void this.flushSave(); }, 160);
  }

  private static async flushSave(): Promise<void> {
    if (this.saveInFlight || !this.pendingSave) return;
    const payloadState = this.pendingSave;
    this.pendingSave = null;
    this.saveInFlight = true;
    try {
      const response = await fetch('/api/state', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: payloadState }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      if (payload?.state) { this.state = payload.state; this.notify(payload.state); }
    } catch (err) {
      console.warn('[StorageService] Synchronisation serveur échouée:', err);
      // Keep the newest state for a later retry instead of losing a user change.
      if (!this.pendingSave) this.pendingSave = payloadState;
    } finally {
      this.saveInFlight = false;
      if (this.pendingSave) {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => { void this.flushSave(); }, 160);
      }
    }
  }

  static reset(): AppState {
    this.state = this.defaultState();
    this.save();
    return this.state;
  }

  static resetToSeed(): AppState {
    return this.reset();
  }

  static wipe(): AppState {
    const def = this.defaultState();
    this.state = {
      parametres: def.parametres,
      disciplines: def.disciplines,
      coefs: def.coefs,
      eleves: [],
      notesS1: [],
      notesS2: [],
      absences: [],
      sanctions: [],
      paiements: [],
      classes: def.classes,
      professeurs: def.professeurs,
      gestionnaires: def.gestionnaires,
      emploiDuTemps: [],
      archives: { annees: [], exclusions: [], diplomes: [] }
    };
    this.save();
    return this.state;
  }

  static exportJSON(): string {
    return JSON.stringify(this.get(), null, 2);
  }

  /**
   * Downloads a JSON backup file directly to user's device
   */
  static triggerBackupDownload(customPrefix = 'sauvegarde_auto'): { success: boolean; filename: string } {
    try {
      const currentState = this.get();
      const year = currentState.parametres.anneeScolaire.replace(/[^a-zA-Z0-9_-]/g, '-');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `la_perseverance_${customPrefix}_${year}_${dateStr}_${timeStr}.json`;

      const jsonStr = JSON.stringify(currentState, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update config last backup time
      const config = this.getAutoBackupConfig();
      config.lastBackupTime = Date.now();
      this.saveAutoBackupConfig(config);

      return { success: true, filename };
    } catch (e) {
      console.error('Failed to trigger backup download', e);
      return { success: false, filename: '' };
    }
  }

  // --- Auto-backup configuration & scheduling ---

  static defaultAutoBackupConfig(): AutoBackupConfig {
    return {
      enabled: false,
      intervalMinutes: 30, // Every 30 minutes by default
      lastBackupTime: null,
      notificationOnDownload: true
    };
  }

  static getAutoBackupConfig(): AutoBackupConfig {
    if (this.autoBackupConfig) return this.autoBackupConfig;
    try {
      const raw = localStorage.getItem(AUTOBACKUP_CONFIG_KEY);
      if (raw) {
        this.autoBackupConfig = { ...this.defaultAutoBackupConfig(), ...JSON.parse(raw) };
      } else {
        this.autoBackupConfig = this.defaultAutoBackupConfig();
      }
    } catch (e) {
      this.autoBackupConfig = this.defaultAutoBackupConfig();
    }
    return this.autoBackupConfig;
  }

  static saveAutoBackupConfig(config: AutoBackupConfig): void {
    this.autoBackupConfig = config;
    localStorage.setItem(AUTOBACKUP_CONFIG_KEY, JSON.stringify(config));
    this.notifyAutoBackup(config);
    this.restartAutoBackupTimer();
  }

  static initAutoBackup(): void {
    const config = this.getAutoBackupConfig();
    this.restartAutoBackupTimer();

    // Check if initial backup is needed if last backup was long ago
    if (config.enabled && (!config.lastBackupTime || Date.now() - config.lastBackupTime > config.intervalMinutes * 60 * 1000)) {
      // Don't download immediately on first load to prevent surprising the user,
      // but schedule the first check
      console.log(`[StorageService] Auto-backup initialized (interval: ${config.intervalMinutes} mins, enabled: ${config.enabled})`);
    }
  }

  private static restartAutoBackupTimer(): void {
    if (this.autoBackupIntervalId) {
      clearInterval(this.autoBackupIntervalId);
      this.autoBackupIntervalId = null;
    }

    const config = this.getAutoBackupConfig();
    if (!config.enabled) return;

    // Check periodically every minute if interval is reached
    const checkIntervalMs = 60 * 1000; // 1 minute
    this.autoBackupIntervalId = setInterval(() => {
      const currentConfig = this.getAutoBackupConfig();
      if (!currentConfig.enabled) {
        if (this.autoBackupIntervalId) clearInterval(this.autoBackupIntervalId);
        return;
      }

      const now = Date.now();
      const intervalMs = currentConfig.intervalMinutes * 60 * 1000;
      const last = currentConfig.lastBackupTime || 0;

      if (now - last >= intervalMs) {
        console.log('[StorageService] Periodic automatic backup trigger...');
        this.triggerBackupDownload('sauvegarde_auto');
      }
    }, checkIntervalMs);
  }

  static subscribeAutoBackup(fn: (config: AutoBackupConfig) => void): () => void {
    this.autoBackupListeners.push(fn);
    return () => {
      this.autoBackupListeners = this.autoBackupListeners.filter(l => l !== fn);
    };
  }

  private static notifyAutoBackup(config: AutoBackupConfig) {
    this.autoBackupListeners.forEach(fn => fn(config));
  }

  static importJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      this.state = this.migrate(parsed);
      this.save();
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  }

  // Session handling (Role switching)
  static getSession(): UserSession { return { type: null, id: null }; }

  static loadSession(): UserSession {
    return this.getSession();
  }

  static setSession(session: UserSession): void { this.notifySession(session); }

  static saveSession(session: UserSession): void { this.setSession(session); }

  static subscribe(fn: (state: AppState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  static subscribeSession(fn: (session: UserSession) => void): () => void {
    this.sessionListeners.push(fn);
    return () => {
      this.sessionListeners = this.sessionListeners.filter(l => l !== fn);
    };
  }

  private static notify(state: AppState) {
    this.listeners.forEach(fn => fn(state));
  }

  private static notifySession(session: UserSession) {
    this.sessionListeners.forEach(fn => fn(session));
  }
}
