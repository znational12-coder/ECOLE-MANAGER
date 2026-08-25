import React, { useState, useEffect } from 'react';
import { AppState, Semestre, UserSession, Professeur } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import {
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
  Layers,
  Award
} from 'lucide-react';

interface Props {
  state: AppState;
  session: UserSession;
  onNavigate: (route: any, params?: any) => void;
}

export const NotesView: React.FC<Props> = ({ state, session, onNavigate }) => {
  const [semestre, setSemestre] = useState<Semestre>('S1');
  const distinctClasses = Logic.distinctClasses(state);

  const activeIdentity = Logic.identiteActive(state, session);
  const currentProf = activeIdentity.type === 'prof' ? (activeIdentity.record as Professeur) : null;

  // Filter classes according to teacher permissions if teacher is logged in
  const availableClasses = currentProf
    ? Logic.classesOuMatiereEnseignee(state, currentProf)
    : distinctClasses;

  const [selectedClasse, setSelectedClasse] = useState<string>(availableClasses[0] || distinctClasses[0] || '');

  useEffect(() => {
    if (!availableClasses.includes(selectedClasse) && availableClasses.length > 0) {
      setSelectedClasse(availableClasses[0]);
    }
  }, [availableClasses, selectedClasse]);

  const students = selectedClasse ? Logic.studentsOfClass(state, selectedClasse).sort((a, b) => a.nom.localeCompare(b.nom)) : [];
  const eleve0 = students[0];
  const nsKey = eleve0 ? Logic.niveauSerieKey(eleve0) : null;

  // Disciplines available in this class
  const allTaughtDisciplines = nsKey
    ? state.disciplines.filter(d => d !== 'Conduite' && Logic.getCoef(state, d, nsKey) > 0)
    : [];

  // Scoped disciplines for logged-in teacher
  const allowedDisciplines = currentProf
    ? Logic.matieresEnseigneesParProf(state, currentProf, selectedClasse)
    : allTaughtDisciplines;

  const canEditConduite = !currentProf || (currentProf.matieres || []).includes('Conduite');

  // Handle grade change and auto-save
  const handleNoteChange = (matricule: string, discipline: string, field: 'moyClas' | 'noteComp' | 'conduite', valueStr: string) => {
    const newState = { ...state };
    const row = Logic.ensureNotesRow(newState, semestre, matricule);
    const numVal = valueStr === '' ? null : Number(valueStr);

    if (field === 'conduite') {
      (row as any).Conduite = numVal;
    } else {
      if (!row[discipline]) {
        row[discipline] = { moyClas: null, noteComp: null };
      }
      row[discipline][field] = numVal;
    }

    StorageService.save(newState);
  };

  const totalCoefClass = nsKey
    ? allTaughtDisciplines.reduce((sum, d) => sum + Logic.getCoef(state, d, nsKey), 0) + Logic.getCoef(state, 'Conduite', nsKey)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Saisie & Calcul des Notes
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Grille des Évaluations Semestrielles
          </h2>
          <p className="text-sm text-slate-500">
            {currentProf ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Lock className="w-3.5 h-3.5" /> Connecté en tant que <strong>{activeIdentity.label}</strong> (accès restreint à vos matières)
              </span>
            ) : (
              <span>Saisissez les Moyennes de Classe et Notes de Composition pour chaque élève</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Semester Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setSemestre('S1')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                semestre === 'S1'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1er Semestre
            </button>
            <button
              onClick={() => setSemestre('S2')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                semestre === 'S2'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2ème Semestre
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar & Class Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Sélectionner la classe :</span>
          </label>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:border-amber-500 bg-white text-slate-900 shadow-xs"
          >
            {availableClasses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {nsKey && (
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-medium">
              Niveau: <strong>{nsKey}</strong> • Total Coefficients: <strong>{totalCoefClass}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Calcul automatique en direct
          </span>
        </div>
      </div>

      {/* Notes Entry Grid */}
      {availableClasses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
          <Info className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="font-serif text-lg font-bold text-slate-700">Aucune classe assignée</p>
          <p className="text-xs max-w-md mx-auto">
            Aucune des matières déclarées pour votre profil n'est activement enseignée dans les classes actuelles.
          </p>
        </div>
      ) : !selectedClasse || students.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <p className="font-serif text-lg font-bold text-slate-700">Aucun élève dans cette classe</p>
          <p className="text-xs mt-1">Ajoutez des élèves dans l'onglet Élèves pour remplir la grille.</p>
        </div>
      ) : allowedDisciplines.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <p className="font-serif text-lg font-bold text-slate-700">Aucune matière à saisir pour vous dans cette classe</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th rowSpan={2} className="px-4 py-3 min-w-[200px] border-r border-slate-800 font-serif font-bold text-sm">
                    Élèves ({students.length})
                  </th>
                  {allowedDisciplines.map((d) => (
                    <th
                      key={d}
                      colSpan={3}
                      className="px-3 py-2 text-center border-r border-slate-800 font-bold bg-slate-800/80 text-amber-300"
                    >
                      <div className="truncate max-w-[140px] mx-auto">{d}</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        Coef {nsKey ? Logic.getCoef(state, d, nsKey) : 1}
                      </div>
                    </th>
                  ))}
                  {canEditConduite && (
                    <th rowSpan={2} className="px-3 py-2 text-center border-r border-slate-800 bg-slate-800/60 text-amber-200 min-w-[80px]">
                      Conduite
                      <div className="text-[10px] font-normal text-slate-400">/20</div>
                    </th>
                  )}
                  <th rowSpan={2} className="px-4 py-3 text-right font-serif font-bold text-sm bg-slate-950 text-amber-400 min-w-[100px]">
                    Moyenne {semestre}
                  </th>
                </tr>
                <tr className="bg-slate-800 text-slate-300 text-[10px] uppercase tracking-wider">
                  {allowedDisciplines.map((d) => (
                    <React.Fragment key={`${d}-sub`}>
                      <th className="px-1.5 py-1.5 text-center font-medium bg-slate-800 border-r border-slate-700/50">Moy. Cl</th>
                      <th className="px-1.5 py-1.5 text-center font-medium bg-slate-800 border-r border-slate-700/50">Comp.</th>
                      <th className="px-1.5 py-1.5 text-center font-bold bg-slate-700/60 text-amber-200 border-r border-slate-800">Sem.</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {students.map((student) => {
                  const row = Logic.getNotesRow(state, semestre, student.matricule) || {};
                  const bulletin = Logic.computeBulletin(state, student.matricule, semestre);

                  return (
                    <tr key={student.matricule} className="hover:bg-amber-50/40 transition">
                      {/* Student info */}
                      <td className="px-4 py-2.5 border-r border-slate-200 bg-slate-50/50">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {student.nom}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {student.matricule}
                        </div>
                      </td>

                      {/* Disciplines inputs */}
                      {allowedDisciplines.map((d) => {
                        const cell = (row as any)[d] || {};
                        const line = bulletin?.lignes.find(l => l.discipline === d);

                        return (
                          <React.Fragment key={`${student.matricule}-${d}`}>
                            {/* Moyenne Classe */}
                            <td className="p-1 border-r border-slate-100 text-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.25"
                                placeholder="—"
                                value={cell.moyClas !== null && cell.moyClas !== undefined ? cell.moyClas : ''}
                                onChange={(e) => handleNoteChange(student.matricule, d, 'moyClas', e.target.value)}
                                className="w-12 px-1.5 py-1 text-center font-mono text-xs rounded-md border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-hidden bg-white"
                              />
                            </td>

                            {/* Note Composition */}
                            <td className="p-1 border-r border-slate-100 text-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.25"
                                placeholder="—"
                                value={cell.noteComp !== null && cell.noteComp !== undefined ? cell.noteComp : ''}
                                onChange={(e) => handleNoteChange(student.matricule, d, 'noteComp', e.target.value)}
                                className="w-12 px-1.5 py-1 text-center font-mono text-xs rounded-md border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-hidden bg-white"
                              />
                            </td>

                            {/* Moyenne Semestre calculated */}
                            <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono font-bold bg-slate-50/80 text-slate-800">
                              {line && line.moySem !== null ? line.moySem.toFixed(2) : '—'}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Conduite */}
                      {canEditConduite && (
                        <td className="p-1 border-r border-slate-200 text-center bg-slate-50/30">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            placeholder="—"
                            value={(row as any).Conduite !== null && (row as any).Conduite !== undefined ? (row as any).Conduite : ''}
                            onChange={(e) => handleNoteChange(student.matricule, 'Conduite', 'conduite', e.target.value)}
                            className="w-14 px-1.5 py-1 text-center font-mono text-xs font-semibold rounded-md border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-hidden bg-white"
                          />
                        </td>
                      )}

                      {/* Moyenne Semestrielle Total */}
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-sm bg-amber-50/60 text-amber-800">
                        {bulletin && bulletin.moyenneSemestrielle !== null
                          ? `${bulletin.moyenneSemestrielle.toFixed(2)}/20`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
