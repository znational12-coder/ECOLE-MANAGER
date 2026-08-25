import React, { useState, useEffect } from 'react';
import { AppState, ParametresEtablissement } from '../types';
import { Logic } from '../services/logic';
import { StorageService, AutoBackupConfig } from '../services/storage';
import {
  Settings,
  Sliders,
  Database,
  Building,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  HardDriveDownload,
  Play,
  Users
} from 'lucide-react';

interface Props {
  state: AppState;
}

export const ParametresView: React.FC<Props> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'coefs' | 'systeme'>('general');
  const [paramsForm, setParamsForm] = useState<ParametresEtablissement>({ ...state.parametres });
  const [newDiscipline, setNewDiscipline] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => StorageService.getAutoBackupConfig());

  useEffect(() => {
    return StorageService.subscribeAutoBackup((conf) => {
      setAutoBackupConfig(conf);
    });
  }, []);

  const handleUpdateAutoBackup = (updates: Partial<AutoBackupConfig>) => {
    const next = { ...autoBackupConfig, ...updates };
    setAutoBackupConfig(next);
    StorageService.saveAutoBackupConfig(next);
    setSuccessMsg('Configuration de la sauvegarde automatique mise à jour.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleTriggerManualAutoBackup = () => {
    const res = StorageService.triggerBackupDownload('sauvegarde_manuelle');
    if (res.success) {
      setSuccessMsg(`Fichier téléchargé : ${res.filename}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const nsList = Logic.allNiveauSerieKeys(state);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const newState = { ...state, parametres: { ...paramsForm } };
    StorageService.save(newState);
    setSuccessMsg('Paramètres généraux enregistrés avec succès.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCoefChange = (discipline: string, nsKey: string, valStr: string) => {
    const newState = { ...state };
    const num = Number(valStr);
    if (!newState.coefficients[discipline]) {
      newState.coefficients[discipline] = {};
    }
    newState.coefficients[discipline][nsKey] = isNaN(num) || num < 0 ? 0 : num;
    StorageService.save(newState);
  };

  const handleAddDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDiscipline.trim();
    if (!trimmed || state.disciplines.includes(trimmed)) return;

    const newState = { ...state };
    newState.disciplines.push(trimmed);
    newState.coefficients[trimmed] = {};
    nsList.forEach(ns => {
      newState.coefficients[trimmed][ns] = 1;
    });
    StorageService.save(newState);
    setNewDiscipline('');
  };

  const handleDeleteDiscipline = (d: string) => {
    if (d === 'Conduite') {
      alert("La discipline 'Conduite' est requise pour le calcul officiel des bulletins.");
      return;
    }
    if (confirm(`Supprimer la discipline "${d}" ? Ses coefficients associés seront également retirés.`)) {
      const newState = { ...state };
      newState.disciplines = newState.disciplines.filter(x => x !== d);
      delete newState.coefficients[d];
      StorageService.save(newState);
    }
  };

  const handleResetData = () => {
    if (confirm("ATTENTION : Voulez-vous réinitialiser toutes les données aux valeurs par défaut de démonstration ? Toutes les modifications non sauvegardées seront perdues.")) {
      StorageService.resetToSeed();
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `la_perseverance_backup_${state.parametres.anneeScolaire}_${new Date().toISOString().slice(0, 10)}.json`);
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.eleves && parsed.parametres) {
          StorageService.save(parsed);
          alert("Sauvegarde restaurée avec succès !");
        } else {
          alert("Format de fichier invalide.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Settings className="w-3.5 h-3.5" /> Configuration & Barèmes
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Paramètres de l'Établissement
          </h2>
          <p className="text-sm text-slate-500">
            Personnalisation des en-têtes officiels, grille des coefficients et gestion des sauvegardes
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>En-tête & Scolarité</span>
          </button>
          <button
            onClick={() => setActiveTab('coefs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'coefs'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Grille des Coefficients</span>
          </button>
          <button
            onClick={() => setActiveTab('systeme')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'systeme'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sauvegarde & Données</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab: General */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-200 pb-2">
              En-tête Officiel des Bulletins & Certificats
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom de l'établissement *</label>
                <input
                  type="text"
                  required
                  value={paramsForm.nomEtablissement}
                  onChange={(e) => setParamsForm({ ...paramsForm, nomEtablissement: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville de résidence *</label>
                <input
                  type="text"
                  required
                  value={paramsForm.ville}
                  onChange={(e) => setParamsForm({ ...paramsForm, ville: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ligne 1 (République) *</label>
                <input
                  type="text"
                  value={paramsForm.ligne1}
                  onChange={(e) => setParamsForm({ ...paramsForm, ligne1: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ligne 2 (Ministère) *</label>
                <input
                  type="text"
                  value={paramsForm.ligne2}
                  onChange={(e) => setParamsForm({ ...paramsForm, ligne2: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Ligne 3 (Direction Régionale / Inspection)</label>
                <input
                  type="text"
                  value={paramsForm.ligne3}
                  onChange={(e) => setParamsForm({ ...paramsForm, ligne3: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-200 pb-2">
              Année Scolaire & Barèmes de Délibération
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Année Scolaire Active *</label>
                <input
                  type="text"
                  required
                  value={paramsForm.anneeScolaire}
                  onChange={(e) => setParamsForm({ ...paramsForm, anneeScolaire: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono font-bold text-amber-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seuil de Réussite / Passage (/20) *</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  required
                  value={paramsForm.seuilReussite}
                  onChange={(e) => setParamsForm({ ...paramsForm, seuilReussite: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Frais de Scolarité Standard (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={paramsForm.fraisScolariteDefaut || 150000}
                  onChange={(e) => setParamsForm({ ...paramsForm, fraisScolariteDefaut: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Coefs */}
      {activeTab === 'coefs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">Matrice des Coefficients Pédagogiques</h3>
                <p className="text-xs text-slate-500">
                  Modifiez directement les coefficients pour chaque matière et chaque Niveau-Série (0 = non enseigné)
                </p>
              </div>

              {/* Add discipline form */}
              <form onSubmit={handleAddDiscipline} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nouvelle matière..."
                  value={newDiscipline}
                  onChange={(e) => setNewDiscipline(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-4 py-3 min-w-[180px] border-r border-slate-800">Discipline</th>
                    {nsList.map(ns => (
                      <th key={ns} className="px-2.5 py-3 text-center border-r border-slate-800 font-mono font-bold text-amber-300">
                        {ns}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {state.disciplines.map(d => (
                    <tr key={d} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2 font-semibold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                        {d}
                      </td>
                      {nsList.map(ns => {
                        const val = Logic.getCoef(state, d, ns);
                        return (
                          <td key={`${d}-${ns}`} className="p-1 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              min="0"
                              max="15"
                              step="0.5"
                              value={val}
                              onChange={(e) => handleCoefChange(d, ns, e.target.value)}
                              className={`w-12 px-1.5 py-1 text-center font-mono font-bold text-xs rounded-md border ${
                                val > 0 ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        {d !== 'Conduite' && (
                          <button
                            onClick={() => handleDeleteDiscipline(d)}
                            title="Supprimer la discipline"
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Systeme */}
      {activeTab === 'systeme' && (
        <div className="space-y-6 text-xs">
          {/* Automatic Periodic Backup Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>Sauvegarde Automatique Périodique (Anti-Perte)</span>
                    {autoBackupConfig.enabled ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Activée
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                        Désactivée
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Télécharge automatiquement un fichier JSON horodaté sur votre ordinateur à intervalles réguliers pour garantir 100% de sécurité.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerManualAutoBackup}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                  title="Déclencher immédiatement une sauvegarde sans attendre le compte à rebours"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  <span>Sauvegarder maintenant</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Toggle switch */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">État du service :</span>
                  <p className="text-slate-500 text-[11px]">
                    Activer le téléchargement périodique en arrière-plan.
                  </p>
                </div>
                <div className="pt-3">
                  <label className="inline-flex items-center cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      checked={autoBackupConfig.enabled}
                      onChange={(e) => handleUpdateAutoBackup({ enabled: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-800">
                      {autoBackupConfig.enabled ? 'Sauvegarde automatique activée' : 'Sauvegarde désactivée'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Interval selector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Fréquence de téléchargement :</span>
                  <p className="text-slate-500 text-[11px]">
                    Intervalle de temps entre deux exports automatiques.
                  </p>
                </div>
                <div className="pt-3">
                  <select
                    value={autoBackupConfig.intervalMinutes}
                    onChange={(e) => handleUpdateAutoBackup({ intervalMinutes: Number(e.target.value) })}
                    disabled={!autoBackupConfig.enabled}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-amber-500 disabled:opacity-50"
                  >
                    <option value={15}>Toutes les 15 minutes</option>
                    <option value={30}>Toutes les 30 minutes (Recommandé)</option>
                    <option value={60}>Toutes les 60 minutes (1 heure)</option>
                    <option value={120}>Toutes les 2 heures</option>
                    <option value={240}>Toutes les 4 heures</option>
                  </select>
                </div>
              </div>

              {/* Status info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Dernière sauvegarde :</span>
                  <div className="text-slate-700 font-mono text-xs mt-1">
                    {autoBackupConfig.lastBackupTime ? (
                      <span className="text-emerald-700 font-bold">
                        {new Date(autoBackupConfig.lastBackupTime).toLocaleDateString('fr-FR')} à {new Date(autoBackupConfig.lastBackupTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Aucune sauvegarde enregistrée</span>
                    )}
                  </div>
                </div>
                <div className="pt-2 text-[10px] text-slate-400">
                  Format : <code className="font-mono text-slate-600">la_perseverance_sauvegarde_auto_*.json</code>
                </div>
              </div>
            </div>
          </div>

          {/* Backup export & import + Reset cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup export & import */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-600" />
                <span>Export & Importation Manuelle</span>
              </h3>
              <p className="text-slate-600">
                Exportez ou restaurez manuellement l'intégralité de la base de données (élèves, notes S1/S2, paiements, emploi du temps, professeurs, archives).
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter (.json)</span>
                </button>

                <label className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Restaurer (.json)</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>
            </div>

            {/* Reset to Seed & 100 students generator */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-amber-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Régénération & Données d'Établissement</span>
              </h3>
              <p className="text-slate-600">
                Générez ou rechargez la cohorte complète de 100 élèves par classe de la 6ème à la Terminale (1 800 élèves au total, 18 classes).
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Générer et charger 100 élèves par classe de la 6ème à la Terminale (1 800 élèves au total avec notes et scolarités) ?")) {
                      StorageService.populate100StudentsCohort();
                      setSuccessMsg("100 élèves par classe ont été générés avec succès pour les 18 classes (6e à Terminale) !");
                      setTimeout(() => setSuccessMsg(""), 4000);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Users className="w-4 h-4 text-slate-950" />
                  <span>Générer 100 élèves par classe (6e à Tle)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetData}
                  className="w-full px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold transition flex items-center justify-center gap-2 text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Réinitialiser aux données modèles</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
