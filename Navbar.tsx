import React, { useState, useEffect } from 'react';
import { UserSession, AppState } from '../types';
import { Logic } from '../services/logic';
import { StorageService, AutoBackupConfig } from '../services/storage';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  Calendar,
  ClockAlert,
  CreditCard,
  History,
  Settings,
  UserCheck,
  LogOut,
  Mail,
  FileQuestion,
  ShieldCheck,
  Download,
  Megaphone,
  Award
} from 'lucide-react';

export type NavRoute =
  | 'dashboard'
  | 'eleves'
  | 'notes'
  | 'bulletins'
  | 'attestations'
  | 'sujets'
  | 'affiches'
  | 'convocations'
  | 'edt'
  | 'personnel'
  | 'absences'
  | 'paiements'
  | 'passage'
  | 'archives'
  | 'parametres';

interface Props {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  state: AppState;
  session: UserSession;
  onOpenUserSwitcher: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentRoute,
  onNavigate,
  state,
  session,
  onOpenUserSwitcher
}) => {
  const activeIdentity = Logic.identiteActive(state, session);

  const allNavItems: Array<{ route: NavRoute; label: string; icon: React.FC<any>; badge?: string; roles?: Array<'admin' | 'prof' | 'gestionnaire'> }> = [
    { route: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin'] },
    { route: 'eleves', label: 'Élèves', icon: Users, roles: ['admin'] },
    { route: 'notes', label: 'Saisie des notes', icon: FileSpreadsheet, roles: ['admin', 'prof'] },
    { route: 'bulletins', label: 'Bulletins', icon: FileText, roles: ['admin'] },
    { route: 'attestations', label: 'Attestations & Certificats', icon: Award, badge: 'Officiel', roles: ['admin', 'prof', 'gestionnaire'] },
    { route: 'sujets', label: 'Sujets & Évaluations', icon: FileQuestion, roles: ['admin', 'prof'] },
    { route: 'affiches', label: 'Affiches & Avis', icon: Megaphone, roles: ['admin', 'prof'] },
    { route: 'convocations', label: 'Convocations Parents', icon: Mail, roles: ['admin'] },
    { route: 'edt', label: 'Emploi du temps', icon: Calendar, roles: ['admin'] },
    { route: 'personnel', label: 'Personnel', icon: GraduationCap, roles: ['admin'] },
    { route: 'absences', label: 'Absences & Sanctions', icon: ClockAlert, roles: ['admin'] },
    { route: 'paiements', label: 'Paiements & Caisse', icon: CreditCard, roles: ['admin', 'gestionnaire'] },
    { route: 'passage', label: 'Passage annuel', icon: UserCheck, roles: ['admin'] },
    { route: 'archives', label: 'Archives', icon: History, roles: ['admin'] },
    { route: 'parametres', label: 'Paramètres', icon: Settings, roles: ['admin'] },
  ];

  const currentRole = activeIdentity.type;
  const filteredNavItems = allNavItems.filter(item => !item.roles || item.roles.includes(currentRole));

  const [backupConfig, setBackupConfig] = useState<AutoBackupConfig>(() => StorageService.getAutoBackupConfig());
  const [downloadFlash, setDownloadFlash] = useState(false);

  useEffect(() => {
    return StorageService.subscribeAutoBackup((conf) => {
      setBackupConfig(conf);
    });
  }, []);

  const handleQuickBackup = () => {
    setDownloadFlash(true);
    StorageService.triggerBackupDownload('sauvegarde_rapide');
    setTimeout(() => setDownloadFlash(false), 2000);
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800 select-none no-print">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-serif font-black text-lg shadow-md shadow-amber-500/20 shrink-0">
          LP
        </div>
        <div className="min-w-0">
          <h1 className="font-serif font-bold text-sm text-slate-100 leading-tight truncate">
            La Persévérance
          </h1>
          <p className="text-xs text-amber-400/90 font-medium tracking-wide truncate">
            Gestion Scolaire • {state.parametres.anneeScolaire}
          </p>
        </div>
      </div>

      {/* Active User Badge Card */}
      <div className="px-3 py-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <div className="min-w-0 flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              activeIdentity.type === 'admin' ? 'bg-indigo-400 ring-2 ring-indigo-400/20' :
              activeIdentity.type === 'prof' ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-amber-400 ring-2 ring-amber-400/20'
            }`} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{activeIdentity.label}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {activeIdentity.type === 'admin' ? 'Accès Administrateur' :
                 activeIdentity.type === 'prof' ? 'Accès Enseignant' : 'Accès Gestion Caisse'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenUserSwitcher}
            title="Changer d'utilisateur"
            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;
          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info with Auto-Backup Status */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${backupConfig.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div className="truncate text-[10px]">
              <span className="text-slate-300 font-semibold">Auto-Backup</span>
              <span className="text-slate-500 ml-1">({backupConfig.enabled ? `${backupConfig.intervalMinutes}m` : 'Off'})</span>
            </div>
          </div>
          <button
            onClick={handleQuickBackup}
            title="Télécharger immédiatement une sauvegarde JSON"
            className={`p-1 rounded-lg text-slate-300 hover:text-white transition shrink-0 ${
              downloadFlash ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <Download className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
          <span>Niamey, Niger</span>
          <span className="font-mono text-[10px]">v3.2</span>
        </div>
      </div>
    </aside>
  );
};
