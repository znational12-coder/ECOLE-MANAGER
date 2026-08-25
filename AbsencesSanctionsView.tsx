import React, { useState } from 'react';
import { AppState, Absence, Sanction } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import {
  ClockAlert,
  UserX,
  AlertOctagon,
  Plus,
  Trash2,
  Calendar,
  X,
  Check
} from 'lucide-react';

interface Props {
  state: AppState;
}

export const AbsencesSanctionsView: React.FC<Props> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'absences' | 'sanctions'>('absences');
  const distinctClasses = Logic.distinctClasses(state);
  const [filterClasse, setFilterClasse] = useState('');

  // Modals
  const [isAbsModalOpen, setIsAbsModalOpen] = useState(false);
  const [absForm, setAbsForm] = useState<Absence>({
    matricule: state.eleves[0]?.matricule || '',
    nom: state.eleves[0]?.nom || '',
    date: new Date().toISOString().slice(0, 10),
    duree: 1,
    motif: 'Maladie',
    justifiee: 'Oui'
  });

  const [isSancModalOpen, setIsSancModalOpen] = useState(false);
  const [sancForm, setSancForm] = useState<Sanction>({
    matricule: state.eleves[0]?.matricule || '',
    nom: state.eleves[0]?.nom || '',
    date: new Date().toISOString().slice(0, 10),
    type: 'Retard',
    details: '15 min',
    motif: 'Retard au premier cours'
  });

  const filteredAbsences = state.absences.filter(a => {
    if (!filterClasse) return true;
    const student = state.eleves.find(e => e.matricule === a.matricule);
    return student?.classe === filterClasse;
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const filteredSanctions = state.sanctions.filter(s => {
    if (!filterClasse) return true;
    const student = state.eleves.find(e => e.matricule === s.matricule);
    return student?.classe === filterClasse;
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleStudentSelectAbs = (mat: string) => {
    const student = state.eleves.find(e => e.matricule === mat);
    setAbsForm(prev => ({ ...prev, matricule: mat, nom: student?.nom || '' }));
  };

  const handleStudentSelectSanc = (mat: string) => {
    const student = state.eleves.find(e => e.matricule === mat);
    setSancForm(prev => ({ ...prev, matricule: mat, nom: student?.nom || '' }));
  };

  const handleSaveAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    const newState = { ...state };
    newState.absences.unshift({ ...absForm });
    StorageService.save(newState);
    setIsAbsModalOpen(false);
  };

  const handleDeleteAbsence = (index: number) => {
    if (confirm("Supprimer l'enregistrement de cette absence ?")) {
      const newState = { ...state };
      newState.absences.splice(index, 1);
      StorageService.save(newState);
    }
  };

  const handleSaveSanction = (e: React.FormEvent) => {
    e.preventDefault();
    const newState = { ...state };
    newState.sanctions.unshift({ ...sancForm });
    StorageService.save(newState);
    setIsSancModalOpen(false);
  };

  const handleDeleteSanction = (index: number) => {
    if (confirm("Supprimer l'enregistrement de cette sanction ?")) {
      const newState = { ...state };
      newState.sanctions.splice(index, 1);
      StorageService.save(newState);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <ClockAlert className="w-3.5 h-3.5" /> Vie Scolaire & Discipline
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Suivi des Absences & Sanctions
          </h2>
          <p className="text-sm text-slate-500">
            Enregistrement des retards, absences justifiées/injustifiées et décisions de discipline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('absences')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'absences'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Absences ({state.absences.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sanctions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'sanctions'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Sanctions & Retards ({state.sanctions.length})</span>
            </button>
          </div>

          <button
            onClick={() => activeTab === 'absences' ? setIsAbsModalOpen(true) : setIsSancModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'absences' ? 'Enregistrer une absence' : 'Enregistrer une sanction'}</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Filtrer par classe :</label>
          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-amber-500"
          >
            <option value="">Toutes les classes</option>
            {distinctClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'absences' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Matricule</th>
                  <th className="px-4 py-3.5">Nom de l'élève</th>
                  <th className="px-4 py-3.5 text-right">Durée (jours)</th>
                  <th className="px-4 py-3.5">Motif</th>
                  <th className="px-4 py-3.5">Justifiée</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                      Aucune absence enregistrée.
                    </td>
                  </tr>
                ) : (
                  filteredAbsences.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-700">
                        {a.date ? a.date.slice(0, 10) : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{a.matricule}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{a.nom}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">{a.duree} j</td>
                      <td className="px-4 py-3.5 text-slate-600">{a.motif || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.justifiee === 'Oui' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {a.justifiee}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteAbsence(idx)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Matricule</th>
                  <th className="px-4 py-3.5">Nom de l'élève</th>
                  <th className="px-4 py-3.5">Type de sanction</th>
                  <th className="px-4 py-3.5">Détails</th>
                  <th className="px-4 py-3.5">Motif</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSanctions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                      Aucune sanction enregistrée.
                    </td>
                  </tr>
                ) : (
                  filteredSanctions.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-700">
                        {s.date ? s.date.slice(0, 10) : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{s.matricule}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{s.nom}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.type === 'Retard' ? 'bg-amber-100 text-amber-800' :
                          s.type === 'Avertissement' ? 'bg-orange-100 text-orange-800' :
                          s.type === 'Expulsion' || s.type === 'Exclusion temporaire' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 text-xs font-medium">{s.details || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-600">{s.motif || '—'}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteSanction(idx)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absence Modal */}
      {isAbsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">Enregistrer une absence</h3>
              <button onClick={() => setIsAbsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAbsence} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Élève *</label>
                <select
                  value={absForm.matricule}
                  onChange={(e) => handleStudentSelectAbs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {distinctClasses.map(c => (
                    <optgroup key={c} label={`Classe: ${c}`}>
                      {Logic.studentsOfClass(state, c).map(s => (
                        <option key={s.matricule} value={s.matricule}>
                          {s.nom} ({s.matricule})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={absForm.date}
                    onChange={(e) => setAbsForm({ ...absForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Durée (jours) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={absForm.duree}
                    onChange={(e) => setAbsForm({ ...absForm, duree: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif</label>
                <input
                  type="text"
                  placeholder="Ex: Maladie, rendez-vous médical..."
                  value={absForm.motif}
                  onChange={(e) => setAbsForm({ ...absForm, motif: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justifiée</label>
                <select
                  value={absForm.justifiee}
                  onChange={(e) => setAbsForm({ ...absForm, justifiee: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Oui">Oui (Certificat médical / autorisation)</option>
                  <option value="Non">Non (Injustifiée)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAbsModalOpen(false)}
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

      {/* Sanction Modal */}
      {isSancModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">Enregistrer une sanction / retard</h3>
              <button onClick={() => setIsSancModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSanction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Élève *</label>
                <select
                  value={sancForm.matricule}
                  onChange={(e) => handleStudentSelectSanc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {distinctClasses.map(c => (
                    <optgroup key={c} label={`Classe: ${c}`}>
                      {Logic.studentsOfClass(state, c).map(s => (
                        <option key={s.matricule} value={s.matricule}>
                          {s.nom} ({s.matricule})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={sancForm.date}
                    onChange={(e) => setSancForm({ ...sancForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type de sanction *</label>
                  <select
                    value={sancForm.type}
                    onChange={(e) => setSancForm({ ...sancForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="Retard">Retard</option>
                    <option value="Avertissement">Avertissement</option>
                    <option value="Blâme">Blâme</option>
                    <option value="Consigne">Consigne / Heure de retenue</option>
                    <option value="Exclusion temporaire">Exclusion temporaire</option>
                    <option value="Expulsion">Expulsion définitive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Détails</label>
                <input
                  type="text"
                  placeholder="Ex: 15 min, 3 jours d'exclusion..."
                  value={sancForm.details}
                  onChange={(e) => setSancForm({ ...sancForm, details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif</label>
                <input
                  type="text"
                  placeholder="Ex: Retard répété, bavardage, indiscipline..."
                  value={sancForm.motif}
                  onChange={(e) => setSancForm({ ...sancForm, motif: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSancModalOpen(false)}
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
