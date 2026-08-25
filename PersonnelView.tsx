import React, { useState } from 'react';
import { AppState, Professeur, Gestionnaire } from '../types';
import { StorageService } from '../services/storage';
import {
  GraduationCap,
  Users,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Layers,
  X,
  Check,
  Phone,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Props {
  state: AppState;
}

export const PersonnelView: React.FC<Props> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'profs' | 'gestionnaires' | 'securite'>('profs');

  // Modal states
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professeur | null>(null);
  const [profForm, setProfForm] = useState<Professeur>({
    id: '',
    civilite: 'M.',
    nom: '',
    matieres: [],
    telephone: '',
    email: '',
    code: ''
  });

  const [isGestModalOpen, setIsGestModalOpen] = useState(false);
  const [editingGest, setEditingGest] = useState<Gestionnaire | null>(null);
  const [gestForm, setGestForm] = useState<Gestionnaire>({
    id: '',
    nom: '',
    telephone: '',
    email: '',
    code: ''
  });

  // Direct PIN quick editor modal
  const [pinTargetUser, setPinTargetUser] = useState<{
    type: 'prof' | 'gestionnaire';
    id: string;
    nom: string;
    code: string;
  } | null>(null);
  const [newTargetPin, setNewTargetPin] = useState('');
  const [showPinValue, setShowPinValue] = useState(true);

  // Admin security code state
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminSecuritySuccess, setAdminSecuritySuccess] = useState(false);

  const handleOpenAddProf = () => {
    setEditingProf(null);
    setProfForm({
      id: `p_${Date.now()}`,
      civilite: 'M.',
      nom: '',
      matieres: [state.disciplines[0] || 'Mathématiques'],
      telephone: '',
      email: '',
      code: ''
    });
    setIsProfModalOpen(true);
  };

  const handleOpenEditProf = (p: Professeur) => {
    setEditingProf(p);
    setProfForm({ ...p });
    setIsProfModalOpen(true);
  };

  const handleDeleteProf = (id: string, name: string) => {
    if (confirm(`Supprimer ${name} de la liste des professeurs ?`)) {
      const newState = { ...state };
      newState.professeurs = newState.professeurs.filter(p => p.id !== id);
      newState.classes.forEach(c => {
        if (c.responsableId === id) c.responsableId = null;
      });
      StorageService.save(newState);
    }
  };

  const handleSaveProf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profForm.nom.trim()) return;

    const newState = { ...state };
    if (editingProf) {
      const idx = newState.professeurs.findIndex(p => p.id === editingProf.id);
      if (idx !== -1) newState.professeurs[idx] = { ...profForm };
    } else {
      newState.professeurs.push({ ...profForm });
    }
    StorageService.save(newState);
    setIsProfModalOpen(false);
  };

  const handleToggleMatiere = (mat: string) => {
    const exists = profForm.matieres.includes(mat);
    if (exists) {
      setProfForm({ ...profForm, matieres: profForm.matieres.filter(m => m !== mat) });
    } else {
      setProfForm({ ...profForm, matieres: [...profForm.matieres, mat] });
    }
  };

  const handleClassResponsableChange = (classId: string, profId: string) => {
    const newState = { ...state };
    const targetClass = newState.classes.find(c => c.id === classId);
    if (targetClass) {
      targetClass.responsableId = profId || null;
      StorageService.save(newState);
    }
  };

  // Gestionnaires
  const handleOpenAddGest = () => {
    setEditingGest(null);
    setGestForm({
      id: `g_${Date.now()}`,
      nom: '',
      telephone: '',
      email: '',
      code: ''
    });
    setIsGestModalOpen(true);
  };

  const handleOpenEditGest = (g: Gestionnaire) => {
    setEditingGest(g);
    setGestForm({ ...g });
    setIsGestModalOpen(true);
  };

  const handleDeleteGest = (id: string, name: string) => {
    if (confirm(`Supprimer le compte gestionnaire de ${name} ?`)) {
      const newState = { ...state };
      newState.gestionnaires = newState.gestionnaires.filter(g => g.id !== id);
      StorageService.save(newState);
    }
  };

  const handleSaveGest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gestForm.nom.trim()) return;

    const newState = { ...state };
    if (editingGest) {
      const idx = newState.gestionnaires.findIndex(g => g.id === editingGest.id);
      if (idx !== -1) newState.gestionnaires[idx] = { ...gestForm };
    } else {
      newState.gestionnaires.push({ ...gestForm });
    }
    StorageService.save(newState);
    setIsGestModalOpen(false);
  };

  // Quick PIN modal handlers
  const handleOpenQuickPin = (type: 'prof' | 'gestionnaire', id: string, nom: string, code?: string) => {
    setPinTargetUser({ type, id, nom, code: code || '' });
    setNewTargetPin(code || '');
    setShowPinValue(true);
  };

  const handleGenerateRandomPin = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setNewTargetPin(randomPin);
  };

  const handleSaveQuickPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTargetUser || newTargetPin.trim().length < 8) { alert('Le mot de passe doit comporter au moins 8 caractères.'); return; }
    try {
      if (pinTargetUser.type === 'prof') await StorageService.updateProfesseurPin(pinTargetUser.id, newTargetPin);
      else await StorageService.updateGestionnairePin(pinTargetUser.id, newTargetPin);
      setPinTargetUser(null);
    } catch (error: any) { alert(error.message || 'Impossible de modifier le mot de passe.'); }
  };

  const handleSaveAdminSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCodeInput.trim().length < 8) { alert('Le mot de passe administrateur doit comporter au moins 8 caractères.'); return; }
    try { await StorageService.updateAdminCode(adminCodeInput.trim()); setAdminCodeInput(''); setAdminSecuritySuccess(true); setTimeout(() => setAdminSecuritySuccess(false), 3000); }
    catch (error: any) { alert(error.message || 'Impossible de modifier le mot de passe administrateur.'); }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <GraduationCap className="w-3.5 h-3.5" /> Personnel de l'Établissement
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Corps Enseignant, Caisse & Sécurité</h2>
          <p className="text-sm text-slate-500">
            Gestion des professeurs, professeurs principaux, comptes caisse et réinitialisation des mots de passe / PINs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('profs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'profs'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Professeurs ({state.professeurs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('gestionnaires')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'gestionnaires'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Gestionnaires ({state.gestionnaires.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('securite')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'securite'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Sécurité & Mots de passe</span>
            </button>
          </div>

          {activeTab !== 'securite' && (
            <button
              onClick={activeTab === 'profs' ? handleOpenAddProf : handleOpenAddGest}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'profs' ? 'Ajouter un professeur' : 'Ajouter un gestionnaire'}</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'profs' && (
        <div className="space-y-6">
          {/* Teachers list table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">Liste des Enseignants</h3>
                <p className="text-xs text-slate-500">Chaque enseignant dispose de son code PIN et de ses matières assignées.</p>
              </div>
              <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                💡 Cliquez sur le cadenas / PIN pour modifier ou réinitialiser immédiatement le code d'un enseignant
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-6 py-3.5">Nom de l'enseignant</th>
                    <th className="px-4 py-3.5">Matières assignées</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Professeur Principal de</th>
                    <th className="px-4 py-3.5">Code PIN</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.professeurs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                        Aucun enseignant enregistré.
                      </td>
                    </tr>
                  ) : (
                    state.professeurs.map((p) => {
                      const classesResp = state.classes.filter(c => c.responsableId === p.id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-3.5 font-semibold text-slate-900">
                            {p.civilite ? `${p.civilite} ` : ''}{p.nom}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {p.matieres.map(m => (
                                <span key={m} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {p.telephone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {p.telephone}</div>}
                            {p.email && <div className="flex items-center gap-1 text-slate-500"><Mail className="w-3 h-3 text-slate-400" /> {p.email}</div>}
                          </td>
                          <td className="px-4 py-3.5">
                            {classesResp.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {classesResp.map(c => (
                                  <span key={c.id} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                                    {c.nom}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => handleOpenQuickPin('prof', p.id, `${p.civilite ? p.civilite + ' ' : ''}${p.nom}`, p.code)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition"
                              title="Cliquer pour modifier ou réinitialiser le mot de passe"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>{p.code ? p.code : 'Aucun (libre)'}</span>
                            </button>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenQuickPin('prof', p.id, `${p.civilite ? p.civilite + ' ' : ''}${p.nom}`, p.code)}
                                title="Modifier le mot de passe / code PIN"
                                className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditProf(p)}
                                title="Modifier les informations"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProf(p.id, p.nom)}
                                title="Supprimer"
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coordinators by Class */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-serif font-bold text-base text-slate-900">Professeur Principal par Classe</h3>
              <p className="text-xs text-slate-500">Désignez l'enseignant responsable pour chaque classe (6e à Terminale)</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {state.classes.map(c => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-serif text-base">{c.nom}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        {c.niveau} • {c.serie}
                      </span>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Responsable :</label>
                      <select
                        value={c.responsableId || ''}
                        onChange={(e) => handleClassResponsableChange(c.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:border-amber-500"
                      >
                        <option value="">— Non désigné —</option>
                        {state.professeurs.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.civilite ? `${p.civilite} ` : ''}{p.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gestionnaires' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">Comptes Gestionnaires & Caissiers</h3>
              <p className="text-xs text-slate-500">Accès restreint à l'enregistrement et aux reçus de scolarité</p>
            </div>
            <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              💡 Cliquez sur le code PIN pour le réinitialiser ou le changer
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Nom et Prénoms</th>
                  <th className="px-4 py-3.5">Téléphone</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Code PIN</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.gestionnaires.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                      Aucun gestionnaire enregistré. Ajoutez un compte pour le personnel de caisse.
                    </td>
                  </tr>
                ) : (
                  state.gestionnaires.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3.5 font-semibold text-slate-900">{g.nom}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{g.telephone || '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{g.email || '—'}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleOpenQuickPin('gestionnaire', g.id, g.nom, g.code)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition"
                          title="Cliquer pour modifier ou réinitialiser le mot de passe"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span>{g.code ? g.code : 'Aucun (libre)'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenQuickPin('gestionnaire', g.id, g.nom, g.code)}
                            title="Modifier le code PIN"
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditGest(g)}
                            title="Modifier les informations"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGest(g.id, g.nom)}
                            title="Supprimer"
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'securite' && (
        <div className="space-y-6">
          {/* Master Admin Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Sécurité Globale & Déverrouillage d'Urgence</h3>
                <p className="text-xs text-slate-500">
                  Définissez le mot de passe administrateur et la clé de secours en cas d'oubli de mot de passe par les utilisateurs
                </p>
              </div>
            </div>

            {adminSecuritySuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-sm font-semibold">Paramètres de sécurité enregistrés avec succès !</div>
              </div>
            )}

            <form onSubmit={handleSaveAdminSecurity} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Mot de passe Administrateur Principal</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Mot de passe administrateur vérifié côté serveur. Il n’est jamais affiché ni stocké dans le navigateur.
                </p>
                <div>
                  <input
                    type="text"
                    value={adminCodeInput}
                    onChange={(e) => setAdminCodeInput(e.target.value)}
                    placeholder="Saisir un nouveau mot de passe (8 caractères minimum)"
                    className="w-full font-mono text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Un mot de passe est obligatoire.</span>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Modifier le mot de passe administrateur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick PIN Modal */}
      {pinTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm">Modifier le Code PIN</h3>
              </div>
              <button onClick={() => setPinTargetUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPin} className="p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Utilisateur</span>
                <div className="font-bold text-slate-900 text-base">{pinTargetUser.nom}</div>
                <div className="text-xs text-slate-500">
                  {pinTargetUser.type === 'prof' ? 'Enseignant' : 'Gestionnaire'}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Nouveau Code PIN :</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Générer 4 chiffres
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPinValue ? 'text' : 'password'}
                    value={newTargetPin}
                    onChange={(e) => setNewTargetPin(e.target.value)}
                    placeholder="Ex: 1234 (ou vide)"
                    className="w-full text-center font-mono text-lg font-bold tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinValue(!showPinValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPinValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Laissez le champ vide si vous souhaitez retirer le mot de passe (libre accès).
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPinTargetUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition text-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Valider le code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prof Modal */}
      {isProfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                {editingProf ? "Modifier l'enseignant" : "Ajouter un enseignant"}
              </h3>
              <button onClick={() => setIsProfModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProf} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Civilité</label>
                  <select
                    value={profForm.civilite}
                    onChange={(e) => setProfForm({ ...profForm, civilite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                    <option value="Mlle">Mlle</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nom et Prénoms *</label>
                  <input
                    type="text"
                    required
                    value={profForm.nom}
                    onChange={(e) => setProfForm({ ...profForm, nom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Matière(s) enseignée(s) *</label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto">
                  {state.disciplines.map(d => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={profForm.matieres.includes(d)}
                        onChange={() => handleToggleMatiere(d)}
                        className="rounded-sm text-amber-600 focus:ring-amber-400"
                      />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={profForm.telephone || ''}
                    onChange={(e) => setProfForm({ ...profForm, telephone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profForm.email || ''}
                    onChange={(e) => setProfForm({ ...profForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Code d'accès PIN (optionnel)</label>
                  <button
                    type="button"
                    onClick={() => setProfForm({ ...profForm, code: String(Math.floor(1000 + Math.random() * 9000)) })}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold"
                  >
                    🎲 Générer aléatoirement
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ex: 1234"
                  value={profForm.code || ''}
                  onChange={(e) => setProfForm({ ...profForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono tracking-wider"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProfModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gest Modal */}
      {isGestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                {editingGest ? "Modifier le gestionnaire" : "Ajouter un gestionnaire"}
              </h3>
              <button onClick={() => setIsGestModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGest} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom et Prénoms *</label>
                <input
                  type="text"
                  required
                  value={gestForm.nom}
                  onChange={(e) => setGestForm({ ...gestForm, nom: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={gestForm.telephone || ''}
                    onChange={(e) => setGestForm({ ...gestForm, telephone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={gestForm.email || ''}
                    onChange={(e) => setGestForm({ ...gestForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Code d'accès PIN (optionnel)</label>
                  <button
                    type="button"
                    onClick={() => setGestForm({ ...gestForm, code: String(Math.floor(1000 + Math.random() * 9000)) })}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold"
                  >
                    🎲 Générer aléatoirement
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ex: 0000"
                  value={gestForm.code || ''}
                  onChange={(e) => setGestForm({ ...gestForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono tracking-wider"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGestModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
