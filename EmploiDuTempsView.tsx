import React, { useState } from 'react';
import { AppState, EmploiDuTempsCell, Professeur } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import {
  Calendar,
  Layers,
  GraduationCap,
  Printer,
  Plus,
  Trash2,
  AlertCircle,
  X,
  Check,
  Settings,
  Copy,
  Clock,
  Edit2,
  BookOpen,
  MapPin,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

interface Props {
  state: AppState;
  onUpdateState?: ((updater: (prev: AppState) => AppState) => void) | ((newState: AppState) => void);
}

// Subject color mapping helper for visual distinction
const DISCIPLINE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  'Mathématiques': { bg: 'bg-blue-50/80 hover:bg-blue-100/80', text: 'text-blue-900', border: 'border-blue-200', badge: 'bg-blue-600' },
  'Physique - Chimie': { bg: 'bg-indigo-50/80 hover:bg-indigo-100/80', text: 'text-indigo-900', border: 'border-indigo-200', badge: 'bg-indigo-600' },
  'SVT': { bg: 'bg-emerald-50/80 hover:bg-emerald-100/80', text: 'text-emerald-900', border: 'border-emerald-200', badge: 'bg-emerald-600' },
  'Français': { bg: 'bg-amber-50/80 hover:bg-amber-100/80', text: 'text-amber-900', border: 'border-amber-200', badge: 'bg-amber-600' },
  'Philosophie': { bg: 'bg-purple-50/80 hover:bg-purple-100/80', text: 'text-purple-900', border: 'border-purple-200', badge: 'bg-purple-600' },
  'Histoire - Géographie': { bg: 'bg-orange-50/80 hover:bg-orange-100/80', text: 'text-orange-900', border: 'border-orange-200', badge: 'bg-orange-600' },
  'Anglais': { bg: 'bg-rose-50/80 hover:bg-rose-100/80', text: 'text-rose-900', border: 'border-rose-200', badge: 'bg-rose-600' },
  'EPS': { bg: 'bg-teal-50/80 hover:bg-teal-100/80', text: 'text-teal-900', border: 'border-teal-200', badge: 'bg-teal-600' },
  'Informatique': { bg: 'bg-cyan-50/80 hover:bg-cyan-100/80', text: 'text-cyan-900', border: 'border-cyan-200', badge: 'bg-cyan-600' },
  'Arabe': { bg: 'bg-lime-50/80 hover:bg-lime-100/80', text: 'text-lime-900', border: 'border-lime-200', badge: 'bg-lime-600' },
  'Conduite': { bg: 'bg-slate-50/80 hover:bg-slate-100/80', text: 'text-slate-900', border: 'border-slate-200', badge: 'bg-slate-600' }
};

const getDefaultColor = (name: string) => {
  if (DISCIPLINE_COLORS[name]) return DISCIPLINE_COLORS[name];
  return { bg: 'bg-amber-50/70 hover:bg-amber-100/70', text: 'text-amber-900', border: 'border-amber-200', badge: 'bg-amber-600' };
};

export const EmploiDuTempsView: React.FC<Props> = ({ state, onUpdateState }) => {
  const [viewMode, setViewMode] = useState<'classe' | 'prof'>('classe');
  const distinctClasses = Logic.distinctClasses(state);
  const [selectedClasse, setSelectedClasse] = useState<string>(distinctClasses[0] || 'TD2');
  const [selectedProfId, setSelectedProfId] = useState<string>(state.professeurs[0]?.id || '');

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const saveState = (newState: AppState) => {
    StorageService.save(newState);
    if (onUpdateState) {
      try {
        (onUpdateState as any)((prev: AppState) => newState);
      } catch {
        (onUpdateState as any)(newState);
      }
    }
  };

  // Editing single slot modal (Par Classe)
  const [editingCell, setEditingCell] = useState<{ jour: string; creneau: string } | null>(null);
  const [cellForm, setCellForm] = useState<{ discipline: string; professeurId: string; salle: string; isCustomMatiere: boolean; customMatiere: string }>({
    discipline: '',
    professeurId: '',
    salle: '',
    isCustomMatiere: false,
    customMatiere: ''
  });
  const [conflictMsg, setConflictMsg] = useState('');

  // Editing slot modal (Par Enseignant)
  const [editingProfCell, setEditingProfCell] = useState<{ jour: string; creneau: string; existingCellId?: string } | null>(null);
  const [profCellForm, setProfCellForm] = useState<{ classe: string; discipline: string; salle: string }>({
    classe: distinctClasses[0] || '',
    discipline: '',
    salle: ''
  });
  const [profConflictMsg, setProfConflictMsg] = useState('');

  // Modals for global schedule settings
  const [isConfigSlotsModalOpen, setIsConfigSlotsModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);
  const [duplicateSourceClasse, setDuplicateSourceClasse] = useState(distinctClasses.filter(c => c !== selectedClasse)[0] || '');

  // Form state for slot & days configuration
  const [configCreneaux, setConfigCreneaux] = useState<string[]>(
    state.parametres.creneaux || ['07h30 - 08h30', '08h30 - 09h30', '09h45 - 10h45', '10h45 - 11h45', '15h00 - 16h00', '16h00 - 17h00']
  );
  const [configJours, setConfigJours] = useState<string[]>(
    state.parametres.jours || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  );
  const [newCreneauInput, setNewCreneauInput] = useState('');
  const [newJourInput, setNewJourInput] = useState('');

  const eleve0 = selectedClasse ? Logic.studentsOfClass(state, selectedClasse)[0] : null;
  const nsKey = eleve0 ? Logic.niveauSerieKey(eleve0) : null;
  const matieresClasse = nsKey
    ? state.disciplines.filter(d => Logic.getCoef(state, d, nsKey) > 0)
    : state.disciplines;

  const creneauxNiveau = eleve0?.niveau && state.parametres.creneauxParNiveau?.[eleve0.niveau]?.length
    ? state.parametres.creneauxParNiveau[eleve0.niveau]
    : (state.parametres.creneaux && state.parametres.creneaux.length ? state.parametres.creneaux : [
        '07h30 - 08h30',
        '08h30 - 09h30',
        '09h45 - 10h45',
        '10h45 - 11h45',
        '15h00 - 16h00',
        '16h00 - 17h00'
      ]);

  const jours = state.parametres.jours && state.parametres.jours.length
    ? state.parametres.jours
    : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Current class stats
  const classCells = state.emploiDuTemps.filter(c => c.classe === selectedClasse);
  const totalHeuresClasse = classCells.length;
  const disciplinesCountMap: Record<string, number> = {};
  classCells.forEach(c => {
    if (c.discipline) {
      disciplinesCountMap[c.discipline] = (disciplinesCountMap[c.discipline] || 0) + 1;
    }
  });

  // Current prof stats
  const currentProf = state.professeurs.find(p => p.id === selectedProfId);
  const profCells = state.emploiDuTemps.filter(c => c.professeurId === selectedProfId);
  const totalHeuresProf = profCells.length;
  const profClassesMap: Record<string, number> = {};
  profCells.forEach(c => {
    profClassesMap[c.classe] = (profClassesMap[c.classe] || 0) + 1;
  });

  // --- Handlers for Editing Cell in "Par Classe" mode ---
  const handleOpenCell = (jour: string, creneau: string) => {
    const existing = state.emploiDuTemps.find(
      c => c.classe === selectedClasse && c.jour === jour && c.creneau === creneau
    );
    setEditingCell({ jour, creneau });
    const isCustom = existing?.discipline ? !state.disciplines.includes(existing.discipline) : false;
    setCellForm({
      discipline: isCustom ? '' : (existing?.discipline || ''),
      professeurId: existing?.professeurId || '',
      salle: existing?.salle || '',
      isCustomMatiere: isCustom,
      customMatiere: isCustom ? (existing?.discipline || '') : ''
    });
    setConflictMsg('');
  };

  const handleDisciplineChangeInCell = (discipline: string) => {
    if (discipline === '__CUSTOM__') {
      setCellForm(prev => ({ ...prev, isCustomMatiere: true, discipline: '' }));
      return;
    }
    setCellForm(prev => {
      const next = { ...prev, discipline, isCustomMatiere: false };
      // Auto-suggest teacher who teaches this subject if none selected
      if (!prev.professeurId && discipline) {
        const matchingProf = state.professeurs.find(p => p.matieres && p.matieres.includes(discipline));
        if (matchingProf) {
          next.professeurId = matchingProf.id;
          // Check conflict
          if (editingCell) {
            const existing = state.emploiDuTemps.find(
              c => c.classe === selectedClasse && c.jour === editingCell.jour && c.creneau === editingCell.creneau
            );
            const conflict = Logic.conflitProfesseur(state, editingCell.jour, editingCell.creneau, matchingProf.id, existing?.id);
            if (conflict) {
              setConflictMsg(`Attention : ${matchingProf.nom} a déjà cours en classe ${conflict.classe} à ce créneau.`);
            } else {
              setConflictMsg('');
            }
          }
        }
      }
      return next;
    });
  };

  const handleProfChangeInCell = (profId: string) => {
    setCellForm(prev => ({ ...prev, professeurId: profId }));
    if (editingCell && profId) {
      const existing = state.emploiDuTemps.find(
        c => c.classe === selectedClasse && c.jour === editingCell.jour && c.creneau === editingCell.creneau
      );
      const conflict = Logic.conflitProfesseur(state, editingCell.jour, editingCell.creneau, profId, existing?.id);
      if (conflict) {
        const prof = state.professeurs.find(p => p.id === profId);
        setConflictMsg(`Attention : ${prof?.nom || 'Ce professeur'} est déjà programmé(e) en classe ${conflict.classe} à ce même créneau.`);
      } else {
        setConflictMsg('');
      }
    } else {
      setConflictMsg('');
    }
  };

  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    const finalDiscipline = cellForm.isCustomMatiere ? cellForm.customMatiere.trim() : cellForm.discipline;

    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    const existingIndex = newState.emploiDuTemps.findIndex(
      c => c.classe === selectedClasse && c.jour === editingCell.jour && c.creneau === editingCell.creneau
    );
    const existing = existingIndex >= 0 ? newState.emploiDuTemps[existingIndex] : null;

    if (finalDiscipline && cellForm.professeurId) {
      const conflict = Logic.conflitProfesseur(newState, editingCell.jour, editingCell.creneau, cellForm.professeurId, existing?.id);
      if (conflict) {
        setConflictMsg(`Impossible : Ce professeur a déjà cours en classe ${conflict.classe} à cette heure.`);
        return;
      }
    }

    if (!finalDiscipline) {
      // Empty slot -> Remove
      if (existingIndex >= 0) {
        newState.emploiDuTemps.splice(existingIndex, 1);
      }
      showToast(`Créneau ${editingCell.jour} (${editingCell.creneau}) libéré.`);
    } else if (existing) {
      const prof = state.professeurs.find(p => p.id === cellForm.professeurId);
      existing.discipline = finalDiscipline;
      existing.professeurId = cellForm.professeurId || null;
      existing.professeurNom = prof?.nom || '';
      existing.salle = cellForm.salle.trim();
      showToast(`Cours de ${finalDiscipline} mis à jour.`);
    } else {
      const prof = state.professeurs.find(p => p.id === cellForm.professeurId);
      newState.emploiDuTemps.push({
        id: `edt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        classe: selectedClasse,
        jour: editingCell.jour,
        creneau: editingCell.creneau,
        discipline: finalDiscipline,
        professeurId: cellForm.professeurId || null,
        professeurNom: prof?.nom || '',
        salle: cellForm.salle.trim()
      });
      showToast(`Cours de ${finalDiscipline} ajouté avec succès.`);
    }

    saveState(newState);
    setEditingCell(null);
  };

  const handleQuickDeleteCell = (e: React.MouseEvent, jour: string, creneau: string) => {
    e.stopPropagation();
    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    const filtered = newState.emploiDuTemps.filter(
      c => !(c.classe === selectedClasse && c.jour === jour && c.creneau === creneau)
    );
    newState.emploiDuTemps = filtered;
    saveState(newState);
    showToast(`Créneau ${jour} ${creneau} vidé.`);
  };

  const handleClearCellModal = () => {
    if (!editingCell) return;
    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    newState.emploiDuTemps = newState.emploiDuTemps.filter(
      c => !(c.classe === selectedClasse && c.jour === editingCell.jour && c.creneau === editingCell.creneau)
    );
    saveState(newState);
    showToast(`Créneau ${editingCell.jour} ${editingCell.creneau} vidé.`);
    setEditingCell(null);
  };

  // --- Handlers for Editing Cell in "Par Enseignant" mode ---
  const handleOpenProfCell = (jour: string, creneau: string) => {
    const existing = state.emploiDuTemps.find(
      c => c.professeurId === selectedProfId && c.jour === jour && c.creneau === creneau
    );
    setEditingProfCell({ jour, creneau, existingCellId: existing?.id });
    const defaultMatiere = currentProf?.matieres?.[0] || existing?.discipline || '';
    setProfCellForm({
      classe: existing?.classe || distinctClasses[0] || '',
      discipline: existing?.discipline || defaultMatiere,
      salle: existing?.salle || ''
    });
    setProfConflictMsg('');
  };

  const handleSaveProfCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfCell || !selectedProfId) return;

    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    const existingIndex = newState.emploiDuTemps.findIndex(
      c => c.professeurId === selectedProfId && c.jour === editingProfCell.jour && c.creneau === editingProfCell.creneau
    );
    const existing = existingIndex >= 0 ? newState.emploiDuTemps[existingIndex] : null;

    if (!profCellForm.classe || !profCellForm.discipline) {
      // Clear slot
      if (existingIndex >= 0) {
        newState.emploiDuTemps.splice(existingIndex, 1);
      }
      showToast(`Créneau ${editingProfCell.jour} ${editingProfCell.creneau} libéré pour l'enseignant.`);
    } else {
      // Check if target class already has another lesson with another teacher at this slot
      const classConflict = newState.emploiDuTemps.find(
        c => c.classe === profCellForm.classe &&
             c.jour === editingProfCell.jour &&
             c.creneau === editingProfCell.creneau &&
             c.id !== existing?.id
      );

      if (classConflict) {
        setProfConflictMsg(`Attention : La classe ${profCellForm.classe} a déjà cours de ${classConflict.discipline} (${classConflict.professeurNom || 'Sans prof'}) à ce même créneau.`);
        return;
      }

      if (existing) {
        existing.classe = profCellForm.classe;
        existing.discipline = profCellForm.discipline;
        existing.salle = profCellForm.salle.trim();
        existing.professeurId = selectedProfId;
        existing.professeurNom = currentProf?.nom || '';
        showToast(`Cours mis à jour en classe ${profCellForm.classe}.`);
      } else {
        newState.emploiDuTemps.push({
          id: `edt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          classe: profCellForm.classe,
          jour: editingProfCell.jour,
          creneau: editingProfCell.creneau,
          discipline: profCellForm.discipline,
          professeurId: selectedProfId,
          professeurNom: currentProf?.nom || '',
          salle: profCellForm.salle.trim()
        });
        showToast(`Cours programmé en classe ${profCellForm.classe}.`);
      }
    }

    saveState(newState);
    setEditingProfCell(null);
  };

  const handleClearProfCellModal = () => {
    if (!editingProfCell) return;
    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    newState.emploiDuTemps = newState.emploiDuTemps.filter(
      c => !(c.professeurId === selectedProfId && c.jour === editingProfCell.jour && c.creneau === editingProfCell.creneau)
    );
    saveState(newState);
    showToast(`Créneau libéré.`);
    setEditingProfCell(null);
  };

  // --- Handlers for Global Actions (Vider, Dupliquer, Configurer Créneaux) ---
  const handleClearEntireClassSchedule = () => {
    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    newState.emploiDuTemps = newState.emploiDuTemps.filter(c => c.classe !== selectedClasse);
    saveState(newState);
    setIsClearConfirmModalOpen(false);
    showToast(`L'emploi du temps de la classe ${selectedClasse} a été entièrement vidé.`, 'info');
  };

  const handleDuplicateSchedule = () => {
    if (!duplicateSourceClasse || duplicateSourceClasse === selectedClasse) return;

    const sourceCells = state.emploiDuTemps.filter(c => c.classe === duplicateSourceClasse);
    if (sourceCells.length === 0) {
      showToast(`La classe source ${duplicateSourceClasse} n'a aucun cours programmé.`, 'error');
      return;
    }

    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    // Remove existing cells of target class
    newState.emploiDuTemps = newState.emploiDuTemps.filter(c => c.classe !== selectedClasse);

    // Copy source cells with new IDs for target class
    let conflictsCount = 0;
    sourceCells.forEach(cell => {
      // Check if teacher is conflicting
      let finalProfId = cell.professeurId;
      let finalProfNom = cell.professeurNom;

      if (cell.professeurId) {
        const conflict = Logic.conflitProfesseur(newState, cell.jour, cell.creneau, cell.professeurId);
        if (conflict) {
          conflictsCount++;
          // Unassign conflicting prof to prevent overlapping
          finalProfId = null;
          finalProfNom = '';
        }
      }

      newState.emploiDuTemps.push({
        id: `edt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        classe: selectedClasse,
        jour: cell.jour,
        creneau: cell.creneau,
        discipline: cell.discipline,
        professeurId: finalProfId,
        professeurNom: finalProfNom,
        salle: cell.salle || ''
      });
    });

    saveState(newState);
    setIsDuplicateModalOpen(false);

    if (conflictsCount > 0) {
      showToast(`Emploi du temps dupliqué depuis ${duplicateSourceClasse}. Note: ${conflictsCount} assignations de professeurs ont été détachées en raison de conflits d'horaires.`, 'info');
    } else {
      showToast(`Emploi du temps dupliqué avec succès depuis ${duplicateSourceClasse}.`);
    }
  };

  // Quick auto-assistant to assign subjects
  const handleAutoFillSubjects = () => {
    if (matieresClasse.length === 0) return;
    const newState = { ...state, emploiDuTemps: [...state.emploiDuTemps] };
    let addedCount = 0;

    jours.forEach(j => {
      creneauxNiveau.forEach(cr => {
        const existing = newState.emploiDuTemps.find(c => c.classe === selectedClasse && c.jour === j && c.creneau === cr);
        if (!existing) {
          // pick a subject that has least scheduled hours so far
          const currentCounts: Record<string, number> = {};
          matieresClasse.forEach(m => { currentCounts[m] = 0; });
          newState.emploiDuTemps.filter(c => c.classe === selectedClasse).forEach(c => {
            if (currentCounts[c.discipline] !== undefined) {
              currentCounts[c.discipline]++;
            }
          });

          // Sort by count ascending
          const sortedMatieres = [...matieresClasse].sort((a, b) => (currentCounts[a] || 0) - (currentCounts[b] || 0));
          const chosenMatiere = sortedMatieres[0];

          // Find a non-conflicting teacher
          const candidateProfs = state.professeurs.filter(p => p.matieres && p.matieres.includes(chosenMatiere));
          let assignedProf: Professeur | null = null;
          for (const p of candidateProfs) {
            const conflict = Logic.conflitProfesseur(newState, j, cr, p.id);
            if (!conflict) {
              assignedProf = p;
              break;
            }
          }

          newState.emploiDuTemps.push({
            id: `edt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            classe: selectedClasse,
            jour: j,
            creneau: cr,
            discipline: chosenMatiere,
            professeurId: assignedProf?.id || null,
            professeurNom: assignedProf?.nom || '',
            salle: ''
          });
          addedCount++;
        }
      });
    });

    if (addedCount > 0) {
      saveState(newState);
      showToast(`Assistant : ${addedCount} créneaux vides ont été remplis automatiquement.`);
    } else {
      showToast(`Tous les créneaux de la classe ${selectedClasse} sont déjà occupés.`, 'info');
    }
  };

  // --- Save Config Slots & Days ---
  const handleSaveSlotsConfig = () => {
    if (configCreneaux.length === 0) {
      showToast('Il faut au moins un créneau horaire.', 'error');
      return;
    }
    if (configJours.length === 0) {
      showToast('Il faut au moins un jour de cours.', 'error');
      return;
    }

    const newState = {
      ...state,
      parametres: {
        ...state.parametres,
        creneaux: configCreneaux,
        jours: configJours
      }
    };

    saveState(newState);
    setIsConfigSlotsModalOpen(false);
    showToast('Grille des créneaux horaires et jours mise à jour.');
  };

  const handleAddConfigCreneau = () => {
    if (!newCreneauInput.trim()) return;
    if (configCreneaux.includes(newCreneauInput.trim())) {
      showToast('Ce créneau existe déjà.', 'error');
      return;
    }
    setConfigCreneaux([...configCreneaux, newCreneauInput.trim()]);
    setNewCreneauInput('');
  };

  const handleRemoveConfigCreneau = (idx: number) => {
    const next = [...configCreneaux];
    next.splice(idx, 1);
    setConfigCreneaux(next);
  };

  const handleAddConfigJour = () => {
    if (!newJourInput.trim()) return;
    if (configJours.includes(newJourInput.trim())) {
      showToast('Ce jour existe déjà.', 'error');
      return;
    }
    setConfigJours([...configJours, newJourInput.trim()]);
    setNewJourInput('');
  };

  const handleRemoveConfigJour = (idx: number) => {
    const next = [...configJours];
    next.splice(idx, 1);
    setConfigJours(next);
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-fade-in text-xs font-semibold ${
          toastMsg.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-800' :
          toastMsg.type === 'error' ? 'bg-rose-950 text-rose-100 border-rose-800' :
          'bg-slate-900 text-slate-100 border-slate-700'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
           toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> :
           <Info className="w-4 h-4 text-amber-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" /> Planification Pédagogique Interactive
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Emploi du Temps Modifiable</h2>
          <p className="text-sm text-slate-500">
            Éditez directement chaque case, gérez les créneaux, dupliquez les grilles et évitez les conflits d'enseignants
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View mode switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('classe')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'classe'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Par Classe</span>
            </button>
            <button
              onClick={() => setViewMode('prof')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'prof'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Par Enseignant</span>
            </button>
          </div>

          {/* Config slots button */}
          <button
            onClick={() => {
              setConfigCreneaux(state.parametres.creneaux || ['07h30 - 08h30', '08h30 - 09h30', '09h45 - 10h45', '10h45 - 11h45', '15h00 - 16h00', '16h00 - 17h00']);
              setConfigJours(state.parametres.jours || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']);
              setIsConfigSlotsModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            title="Modifier les horaires et jours de la semaine"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Créneaux & Jours</span>
          </button>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Class / Teacher Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {viewMode === 'classe' ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Classe :</label>
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-amber-500 min-w-[140px]"
              >
                {distinctClasses.map(c => (
                  <option key={c} value={c}>Classe {c}</option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                {totalHeuresClasse}h / semaine
              </span>
              <span className="text-xs text-slate-500">
                (Cliquez sur une case pour la modifier ou l'assigner)
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Enseignant :</label>
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-amber-500 min-w-[220px]"
              >
                {state.professeurs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.civilite ? `${p.civilite} ` : ''}{p.nom} {p.matieres.length ? `(${p.matieres.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 text-xs font-bold">
                {totalHeuresProf}h d'enseignement
              </span>
              <span className="text-xs text-slate-500">
                (Cliquez sur n'importe quel créneau pour programmer ou déplacer un cours)
              </span>
            </div>
          </div>
        )}

        {/* Action buttons for class */}
        {viewMode === 'classe' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoFillSubjects}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition flex items-center gap-1.5"
              title="Compléter automatiquement les créneaux vides"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Assistant</span>
            </button>

            <button
              onClick={() => {
                setDuplicateSourceClasse(distinctClasses.filter(c => c !== selectedClasse)[0] || '');
                setIsDuplicateModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
              title="Copier l'emploi du temps depuis une autre classe"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>Dupliquer</span>
            </button>

            <button
              onClick={() => setIsClearConfirmModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
              title="Effacer tous les cours de cette classe"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Vider</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Chips for class disciplines (Par Classe view) */}
      {viewMode === 'classe' && Object.keys(disciplinesCountMap).length > 0 && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2 text-xs no-print">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Volume horaire :
          </span>
          {Object.entries(disciplinesCountMap).map(([discipline, hours]) => {
            const color = getDefaultColor(discipline);
            return (
              <span
                key={discipline}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 ${color.bg} ${color.text} ${color.border}`}
              >
                <span>{discipline}</span>
                <span className="font-mono font-bold bg-white/70 px-1.5 py-0.2 rounded-md text-[10px]">
                  {hours}h
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* Timetable Interactive Grid */}
      <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-md print:shadow-none print:border-none print:p-0">
        {/* Printable Header */}
        <div className="text-center mb-6 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {state.parametres.nomEtablissement}
          </div>
          <div className="text-xl font-serif font-bold text-slate-900">
            {viewMode === 'classe'
              ? `EMPLOI DU TEMPS HEBDOMADAIRE — CLASSE ${selectedClasse}`
              : `EMPLOI DU TEMPS HEBDOMADAIRE — ${currentProf?.civilite ? currentProf.civilite + ' ' : ''}${currentProf?.nom || 'ENSEIGNANT'}`}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Année Scolaire {state.parametres.anneeScolaire} • {viewMode === 'classe' ? `Total : ${totalHeuresClasse}h de cours / semaine` : `Total : ${totalHeuresProf}h d'enseignement / semaine`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 border border-slate-700 w-32 font-serif text-xs">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Créneaux</span>
                  </div>
                </th>
                {jours.map(j => (
                  <th key={j} className="p-3 border border-slate-700 font-bold uppercase text-xs tracking-wide">
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creneauxNiveau.map((cr, rIdx) => (
                <tr key={cr} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  {/* Slot column */}
                  <td className="p-2.5 border border-slate-300 font-mono font-bold text-slate-700 bg-slate-100/90 text-[11px] whitespace-nowrap">
                    {cr}
                  </td>

                  {/* Day columns */}
                  {jours.map(j => {
                    if (viewMode === 'classe') {
                      const cell = state.emploiDuTemps.find(
                        c => c.classe === selectedClasse && c.jour === j && c.creneau === cr
                      );
                      const color = cell ? getDefaultColor(cell.discipline) : null;

                      return (
                        <td
                          key={`${j}-${cr}`}
                          onClick={() => handleOpenCell(j, cr)}
                          className={`p-2 border border-slate-300 h-20 align-middle cursor-pointer transition relative group ${
                            cell
                              ? `${color?.bg} border-slate-300`
                              : 'hover:bg-amber-50/60 bg-transparent'
                          }`}
                          title="Cliquer pour modifier ou assigner un cours"
                        >
                          {cell ? (
                            <div className="space-y-1 relative">
                              {/* Quick delete button on hover */}
                              <button
                                type="button"
                                onClick={(e) => handleQuickDeleteCell(e, j, cr)}
                                title="Vider ce créneau"
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow-xs border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition no-print"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              <div className={`font-bold text-xs leading-tight ${color?.text}`}>
                                {cell.discipline}
                              </div>

                              {cell.professeurNom ? (
                                <div className="text-[10px] text-slate-700 font-medium truncate flex items-center justify-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span>{cell.professeurNom}</span>
                                </div>
                              ) : (
                                <div className="text-[9px] text-amber-700 italic">
                                  Enseignant non assigné
                                </div>
                              )}

                              {cell.salle && (
                                <div className="text-[9px] text-slate-500 font-mono flex items-center justify-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>{cell.salle}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-300 group-hover:text-amber-600 transition">
                              <Plus className="w-4 h-4 mb-0.5" />
                              <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition no-print">
                                Ajouter
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    } else {
                      // Par Enseignant view (Editable on click too!)
                      const cell = state.emploiDuTemps.find(
                        c => c.professeurId === selectedProfId && c.jour === j && c.creneau === cr
                      );
                      const color = cell ? getDefaultColor(cell.discipline) : null;

                      return (
                        <td
                          key={`${j}-${cr}`}
                          onClick={() => handleOpenProfCell(j, cr)}
                          className={`p-2 border border-slate-300 h-20 align-middle cursor-pointer transition relative group ${
                            cell
                              ? `${color?.bg} hover:bg-opacity-90`
                              : 'hover:bg-indigo-50/60 bg-transparent'
                          }`}
                          title="Cliquer pour programmer un cours pour cet enseignant"
                        >
                          {cell ? (
                            <div className="space-y-1">
                              <div className={`font-bold text-xs ${color?.text}`}>
                                {cell.discipline}
                              </div>
                              <div className="text-[10px] font-bold text-slate-900 bg-white/90 border border-slate-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-md shadow-2xs">
                                <Layers className="w-2.5 h-2.5 text-indigo-600" />
                                <span>Classe {cell.classe}</span>
                              </div>
                              {cell.salle && (
                                <div className="text-[9px] text-slate-500 font-mono flex items-center justify-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>{cell.salle}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-300 group-hover:text-indigo-600 transition">
                              <Plus className="w-4 h-4 mb-0.5" />
                              <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition no-print">
                                Programmer
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Printable Footer with Signatures */}
        <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="font-bold text-slate-800">Le Professeur Principal</div>
            <div className="h-14"></div>
            <div className="text-[10px] text-slate-400 italic">(Signature)</div>
          </div>
          <div>
            <div className="font-bold text-slate-800">Le Censeur / Directeur des Études</div>
            <div className="h-14"></div>
            <div className="text-[10px] text-slate-400 italic">(Sceau & Visa)</div>
          </div>
          <div>
            <div className="font-bold text-slate-800">Le Chef d'Établissement / Proviseur</div>
            <div className="h-14"></div>
            <div className="text-[10px] text-slate-400 italic">(Sceau Officiel)</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modal 1: Edit Slot in "Par Classe" mode                                    */}
      {/* ========================================================================= */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Modifier le cours</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Classe {selectedClasse} • {editingCell.jour} • {editingCell.creneau}
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="p-6 space-y-4 text-xs">
              {conflictMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-medium">{conflictMsg}</span>
                </div>
              )}

              {/* Discipline selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Matière / Discipline</label>
                {!cellForm.isCustomMatiere ? (
                  <div className="space-y-2">
                    <select
                      value={cellForm.discipline}
                      onChange={(e) => handleDisciplineChangeInCell(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 bg-white font-semibold text-slate-900"
                    >
                      <option value="">— Case vide / Aucun cours —</option>
                      <optgroup label="Disciplines de la classe">
                        {matieresClasse.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Toutes les disciplines">
                        {state.disciplines.filter(d => !matieresClasse.includes(d)).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </optgroup>
                      <option value="__CUSTOM__">✍️ Saisir un intitulé personnalisé...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Étude dirigée, TP Informatique, Devoir Général..."
                        value={cellForm.customMatiere}
                        onChange={(e) => setCellForm({ ...cellForm, customMatiere: e.target.value })}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setCellForm(prev => ({ ...prev, isCustomMatiere: false, customMatiere: '' }))}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        Liste
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Teacher selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Enseignant assigné</label>
                <select
                  value={cellForm.professeurId}
                  onChange={(e) => handleProfChangeInCell(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 bg-white font-semibold text-slate-900"
                >
                  <option value="">— Non assigné —</option>
                  {state.professeurs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.civilite ? `${p.civilite} ` : ''}{p.nom} {p.matieres.length > 0 ? `(${p.matieres.join(', ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room (Salle) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Salle de cours (optionnel)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Ex: Salle 4, Labo SVT, Terrain Sport..."
                    value={cellForm.salle}
                    onChange={(e) => setCellForm({ ...cellForm, salle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[`Salle ${selectedClasse}`, 'Salle Info', 'Labo SVT/PC', 'Terrain EPS', 'Amphi'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCellForm(prev => ({ ...prev, salle: s }))}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearCellModal}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider la case</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 2: Edit Slot in "Par Enseignant" mode                                */}
      {/* ========================================================================= */}
      {editingProfCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-300" />
                  <span>Programmer pour {currentProf?.nom || 'l\'enseignant'}</span>
                </h3>
                <p className="text-xs text-indigo-200">
                  {editingProfCell.jour} • {editingProfCell.creneau}
                </p>
              </div>
              <button
                onClick={() => setEditingProfCell(null)}
                className="text-indigo-300 hover:text-white p-1 rounded-lg hover:bg-indigo-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfCell} className="p-6 space-y-4 text-xs">
              {profConflictMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-medium">{profConflictMsg}</span>
                </div>
              )}

              {/* Class selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Classe ciblée</label>
                <select
                  value={profCellForm.classe}
                  onChange={(e) => setProfCellForm({ ...profCellForm, classe: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 bg-white font-bold text-slate-900"
                >
                  <option value="">— Aucun cours / Libérer créneau —</option>
                  {distinctClasses.map(c => (
                    <option key={c} value={c}>Classe {c}</option>
                  ))}
                </select>
              </div>

              {/* Discipline selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Matière enseignée</label>
                <select
                  value={profCellForm.discipline}
                  onChange={(e) => setProfCellForm({ ...profCellForm, discipline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 bg-white font-semibold text-slate-900"
                >
                  <option value="">— Sélectionner une matière —</option>
                  {currentProf?.matieres?.map(m => (
                    <option key={m} value={m}>{m} (Spécialité)</option>
                  ))}
                  {state.disciplines.filter(d => !currentProf?.matieres?.includes(d)).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Room (Salle) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Salle (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Salle 3, Labo..."
                  value={profCellForm.salle}
                  onChange={(e) => setProfCellForm({ ...profCellForm, salle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearProfCellModal}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition font-bold"
                >
                  Libérer
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfCell(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Valider</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 3: Config Créneaux & Jours                                           */}
      {/* ========================================================================= */}
      {isConfigSlotsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Configuration des Créneaux Horaires & Jours</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Personnalisez la structure hebdomadaire de l'établissement
                </p>
              </div>
              <button
                onClick={() => setIsConfigSlotsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Créneaux Horaires list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Créneaux Horaires ({configCreneaux.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Heures de début et fin de cours</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {configCreneaux.map((cr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-slate-800 text-xs">{cr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveConfigCreneau(idx)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        title="Supprimer ce créneau"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ex: 07h30 - 08h30 ou 17h00 - 18h00"
                    value={newCreneauInput}
                    onChange={(e) => setNewCreneauInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddConfigCreneau(); } }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddConfigCreneau}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>

              {/* Jours de la semaine list */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Jours de cours ({configJours.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Jours ouvrés dans l'emploi du temps</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {configJours.map((jour, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                      <span>{jour}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveConfigJour(idx)}
                        className="text-amber-700 hover:text-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ex: Samedi, Dimanche..."
                    value={newJourInput}
                    onChange={(e) => setNewJourInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddConfigJour(); } }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleAddConfigJour}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter jour</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setConfigCreneaux(['07h30 - 08h30', '08h30 - 09h30', '09h45 - 10h45', '10h45 - 11h45', '15h00 - 16h00', '16h00 - 17h00']);
                  setConfigJours(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']);
                }}
                className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Valeurs par défaut</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigSlotsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlotsConfig}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer la grille</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 4: Duplicate Schedule Modal                                         */}
      {/* ========================================================================= */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Dupliquer l'emploi du temps</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Vers la classe cible : <strong>Classe {selectedClasse}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Sélectionner la classe source :</label>
                <select
                  value={duplicateSourceClasse}
                  onChange={(e) => setDuplicateSourceClasse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 font-bold text-slate-900 bg-white"
                >
                  {distinctClasses.filter(c => c !== selectedClasse).map(c => (
                    <option key={c} value={c}>
                      Classe {c} ({state.emploiDuTemps.filter(x => x.classe === c).length}h de cours)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-semibold mb-1">ℹ️ Gestion intelligente des conflits :</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Tous les cours seront recopiés. Si un professeur assigné à la classe source a déjà cours à la même heure, son assignation sera automatiquement détachée pour éviter les doublons.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateSchedule}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Confirmer la duplication</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 5: Clear Schedule Confirmation Modal                                */}
      {/* ========================================================================= */}
      {isClearConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>Vider l'emploi du temps</span>
                </h3>
                <p className="text-xs text-rose-100">
                  Classe {selectedClasse}
                </p>
              </div>
              <button
                onClick={() => setIsClearConfirmModalOpen(false)}
                className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-rose-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                Êtes-vous sûr de vouloir supprimer tous les cours programmés pour la <strong>Classe {selectedClasse}</strong> ({totalHeuresClasse}h de cours) ?
              </p>
              <p className="text-slate-500 text-[11px]">
                Cette action libérera également les créneaux des enseignants concernés.
              </p>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClearConfirmModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleClearEntireClassSchedule}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Oui, vider la grille</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
