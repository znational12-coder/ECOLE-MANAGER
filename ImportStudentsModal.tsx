import React, { useState } from 'react';
import { AppState, Eleve } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import {
  Upload,
  X,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

export const ImportStudentsModal: React.FC<Props> = ({ isOpen, onClose, state }) => {
  const [pasteText, setPasteText] = useState('');
  const [parsedStudents, setParsedStudents] = useState<Eleve[]>([]);
  const [targetClass, setTargetClass] = useState(Logic.distinctClasses(state)[0] || 'TD1');
  const [targetNiveau, setTargetNiveau] = useState(state.parametres.niveaux[0] || 'Tle');
  const [targetSerie, setTargetSerie] = useState(state.parametres.series[0] || 'D');

  if (!isOpen) return null;

  const handleParse = () => {
    const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const results: Eleve[] = [];

    lines.forEach((line, idx) => {
      // Split by tab or semicolon or comma
      let parts = line.includes('\t') ? line.split('\t') : line.includes(';') ? line.split(';') : line.split(',');
      parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 1) {
        // If line is header, skip
        if (parts[0].toLowerCase().includes('matricule') || parts[0].toLowerCase().includes('nom')) {
          return;
        }

        let matricule = '';
        let civilite: 'M.' | 'Mlle' | 'Mme' = 'M.';
        let nom = '';

        if (parts.length === 1) {
          nom = parts[0];
          matricule = `LP-${Date.now().toString().slice(-4)}${idx + 1}`;
        } else if (parts.length === 2) {
          if (parts[0].startsWith('LP-') || parts[0].length <= 8) {
            matricule = parts[0];
            nom = parts[1];
          } else {
            nom = parts[0];
            matricule = parts[1];
          }
        } else {
          matricule = parts[0] || `LP-${Date.now().toString().slice(-4)}${idx + 1}`;
          const civCandidate = parts[1];
          if (civCandidate === 'M.' || civCandidate === 'Mlle' || civCandidate === 'Mme') {
            civilite = civCandidate;
            nom = parts[2] || '';
          } else {
            nom = parts[1] || '';
          }
        }

        if (nom) {
          results.push({
            matricule,
            civilite,
            nom,
            niveau: targetNiveau,
            serie: targetSerie,
            classe: targetClass,
            statutInitial: 'Passant(e)'
          });
        }
      }
    });

    setParsedStudents(results);
  };

  const handleCommit = () => {
    if (parsedStudents.length === 0) return;

    const newState = { ...state };
    parsedStudents.forEach(st => {
      // Check if student exists
      const existingIdx = newState.eleves.findIndex(e => e.matricule === st.matricule);
      if (existingIdx !== -1) {
        newState.eleves[existingIdx] = st;
      } else {
        newState.eleves.push(st);
      }
      Logic.ensureNotesRow(newState, 'S1', st.matricule);
      Logic.ensureNotesRow(newState, 'S2', st.matricule);
    });

    // Ensure target class is registered
    if (!newState.classes.some(c => c.nom === targetClass)) {
      newState.classes.push({
        id: `c_${Date.now()}`,
        niveau: targetNiveau,
        serie: targetSerie,
        nom: targetClass
      });
    }

    StorageService.save(newState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base">Assistant d'Importation d'Élèves</h3>
            <p className="text-xs text-slate-400">Copiez/collez une liste depuis Excel ou un tableau texte</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Target class selectors */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Niveau</label>
              <select
                value={targetNiveau}
                onChange={(e) => setTargetNiveau(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {state.parametres.niveaux.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Série</label>
              <select
                value={targetSerie}
                onChange={(e) => setTargetSerie(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {state.parametres.series.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Classe de destination</label>
              <input
                type="text"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                placeholder="Ex: TD1"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Collez vos données (Format: "Nom Prénom" ou "Matricule [TAB] Nom Prénom") :
            </label>
            <textarea
              rows={5}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`LP-2001\tM.\tAbdoulaye Nadia\nLP-2002\tMlle\tBoubacar Aissata\n...`}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleParse}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
              >
                Analyser la liste
              </button>
            </div>
          </div>

          {/* Parsed list preview */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-slate-900">
                  Aperçu des {parsedStudents.length} élèves reconnus :
                </h4>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2">Matricule</th>
                      <th className="p-2">Civilité</th>
                      <th className="p-2">Nom et Prénoms</th>
                      <th className="p-2">Classe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStudents.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-slate-700">{st.matricule}</td>
                        <td className="p-2">{st.civilite}</td>
                        <td className="p-2 font-semibold text-slate-900">{st.nom}</td>
                        <td className="p-2 font-mono">{st.classe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={parsedStudents.length === 0}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Importer {parsedStudents.length} élèves</span>
          </button>
        </div>
      </div>
    </div>
  );
};
