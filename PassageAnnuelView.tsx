import React, { useState, useMemo } from 'react';
import { AppState, ArchiveClasse, StatutFinal } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import { FeuilleArchiveImprimable } from './FeuilleArchiveImprimable';
import {
  UserCheck,
  Award,
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Info,
  Layers,
  Printer,
  Eye,
  RotateCcw,
  CheckCheck,
  Calendar,
  GraduationCap,
  FileText,
  Search
} from 'lucide-react';

interface Props {
  state: AppState;
  onNavigate: (route: any) => void;
}

export const PassageAnnuelView: React.FC<Props> = ({ state, onNavigate }) => {
  const distinctClasses = useMemo(() => Logic.distinctClasses(state), [state]);
  const [selectedClasse, setSelectedClasse] = useState<string>(distinctClasses[0] || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Overrides for student decisions per matricule
  const [overrides, setOverrides] = useState<Record<string, StatutFinal>>({});

  // Modals state
  const [isClassClosingModalOpen, setIsClassClosingModalOpen] = useState(false);
  const [isAllClosingModalOpen, setIsAllClosingModalOpen] = useState(false);
  const [isYearTransitionModalOpen, setIsYearTransitionModalOpen] = useState(false);
  const [previewArchiveClasse, setPreviewArchiveClasse] = useState<ArchiveClasse | null>(null);

  // Signatures inputs for closing
  const [presidentConseil, setPresidentConseil] = useState('Président du Jury de Délibération');
  const [professeurPrincipal, setProfesseurPrincipal] = useState('');
  const [chefEtablissement, setChefEtablissement] = useState(state.parametres.nomEtablissement || 'Le Chef d\'Établissement');
  const [dateCloture, setDateCloture] = useState(() => new Date().toISOString().split('T')[0]);

  // Next school year
  const [nextSchoolYear, setNextSchoolYear] = useState(() => {
    return Logic.suggestNextAnnee(state.parametres.anneeScolaire);
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Classes status summary
  const classesStatus = useMemo(() => {
    const classesCloturees = state.classesCloturees || {};
    const archivesClasses = state.archives?.classes || [];

    return distinctClasses.map(classe => {
      const isCloturee = Boolean(classesCloturees[classe]);
      const clotureInfo = classesCloturees[classe];
      const students = state.eleves.filter(e => e.classe === classe);
      const eleve0 = students[0];
      const deliberation = Logic.getDeliberationsPourClasse(state, classe, overrides);
      const archiveObj = archivesClasses.find(
        a => a.anneeScolaire === state.parametres.anneeScolaire && a.classe === classe
      );

      return {
        classe,
        niveau: eleve0?.niveau || '—',
        serie: eleve0?.serie || 'Unique',
        effectif: students.length,
        isCloturee,
        clotureDate: clotureInfo?.dateCloture || archiveObj?.dateCloture,
        archiveId: clotureInfo?.archiveId || archiveObj?.id,
        archiveObj,
        deliberation
      };
    });
  }, [state, distinctClasses, overrides]);

  const nbClassesCloturees = classesStatus.filter(c => c.isCloturee).length;
  const totalClasses = classesStatus.length;
  const isAllClassesCloturees = totalClasses > 0 && nbClassesCloturees === totalClasses;

  // Active selected class deliberation
  const activeClassData = useMemo(() => {
    if (!selectedClasse) return null;
    return Logic.getDeliberationsPourClasse(state, selectedClasse, overrides);
  }, [state, selectedClasse, overrides]);

  const activeClassStatusInfo = useMemo(() => {
    return classesStatus.find(c => c.classe === selectedClasse);
  }, [classesStatus, selectedClasse]);

  // Filtered students for display in table
  const filteredStudents = useMemo(() => {
    if (!activeClassData) return [];
    const q = searchQuery.trim().toLowerCase();
    return activeClassData.elevesResults.filter(item => {
      if (!q) return true;
      return (
        item.eleve.nom.toLowerCase().includes(q) ||
        item.eleve.matricule.toLowerCase().includes(q) ||
        item.decision.toLowerCase().includes(q)
      );
    });
  }, [activeClassData, searchQuery]);

  const handleDecisionChange = (matricule: string, newDec: StatutFinal) => {
    setOverrides(prev => ({ ...prev, [matricule]: newDec }));
  };

  // Close a single class
  const handleExecuteClotureClasse = () => {
    if (!selectedClasse) return;

    const newState = JSON.parse(JSON.stringify(state)) as AppState;
    const result = Logic.cloturerClasse(newState, selectedClasse, {
      presidentConseil,
      professeurPrincipal,
      chefEtablissement,
      overrides,
      dateCloture
    });

    StorageService.save(newState);
    setIsClassClosingModalOpen(false);
    setNotification({
      type: 'success',
      message: `La classe ${selectedClasse} a été clôturée et archivée avec succès !`
    });

    // Auto show preview of archive sheet
    setPreviewArchiveClasse(result.archiveClasse);
  };

  // Reopen a single class
  const handleRouvrirClasse = (classe: string) => {
    const newState = JSON.parse(JSON.stringify(state)) as AppState;
    const ok = Logic.rouvrirClasse(newState, classe);
    if (ok) {
      StorageService.save(newState);
      setNotification({
        type: 'info',
        message: `La classe ${classe} a été rouverte pour modification des délibérations.`
      });
    }
  };

  // Close ALL classes at once
  const handleExecuteClotureToutesClasses = () => {
    const newState = JSON.parse(JSON.stringify(state)) as AppState;
    const result = Logic.cloturerToutesClasses(newState, {
      presidentConseil,
      chefEtablissement,
      overrides,
      dateCloture
    });

    StorageService.save(newState);
    setIsAllClosingModalOpen(false);
    setNotification({
      type: 'success',
      message: `Toutes les ${result.count} classes ont été clôturées et archivées avec succès !`
    });
  };

  // Transition to next academic year
  const handleExecuteTransitionAnnee = () => {
    const newState = JSON.parse(JSON.stringify(state)) as AppState;

    // Collect all decisions from all classes
    const allDecisions: any[] = [];
    distinctClasses.forEach(cls => {
      const delib = Logic.getDeliberationsPourClasse(newState, cls, overrides);
      delib.elevesResults.forEach(r => {
        let decType: 'passage' | 'redouble' | 'exclusion' | 'diplome' = 'passage';
        if (r.decision === 'Passe au niveau supérieur' || r.decision === 'Passage') decType = 'passage';
        else if (r.decision === 'Redouble' || r.decision === 'Redoublement') decType = 'redouble';
        else if (r.decision === 'Exclu(e)' || r.decision === 'Exclusion') decType = 'exclusion';
        else if (r.decision === 'Diplômé(e)' || r.decision === 'Diplome') decType = 'diplome';

        allDecisions.push({
          matricule: r.eleve.matricule,
          nom: r.eleve.nom,
          classe: r.eleve.classe,
          moyenneAnnuelle: r.moyAnnuelle,
          decision: decType,
          nouveauNiveau: r.nouveauNiveau,
          nouvelleClasse: r.nouvelleClasse
        });
      });
    });

    // Make sure all classes are archived
    Logic.cloturerToutesClasses(newState, {
      presidentConseil,
      chefEtablissement,
      overrides,
      dateCloture
    });

    // Execute year roll
    Logic.executerPassage(newState, allDecisions, nextSchoolYear, dateCloture);
    newState.classesCloturees = {}; // Reset for the brand new year

    StorageService.save(newState);
    setIsYearTransitionModalOpen(false);
    onNavigate('archives');
  };

  return (
    <div className="space-y-6">
      {/* Printable Archive Modal / Full Preview */}
      {previewArchiveClasse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in flex items-start justify-center">
          <div className="max-w-5xl w-full">
            <FeuilleArchiveImprimable
              state={state}
              archiveClasse={previewArchiveClasse}
              onClose={() => setPreviewArchiveClasse(null)}
            />
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 px-2 py-0.5 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" /> Conseil de Délibération & Clôture par Classe
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Passage Annuel & Clôture par Classe
          </h2>
          <p className="text-sm text-slate-500">
            Délibération classe par classe, validation des décisions de passage, archivage officiel et transition vers l'année suivante ({state.parametres.anneeScolaire})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAllClosingModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-amber-400" />
            <span>Clôturer Toutes les Classes</span>
          </button>

          <button
            onClick={() => setIsYearTransitionModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <Archive className="w-4 h-4" />
            <span>Bascule Année Suivante ({nextSchoolYear})</span>
          </button>
        </div>
      </div>

      {/* Class Overview Cards Carousel / Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif font-bold text-sm text-slate-900">
              État d'avancement des Délibérations par Classe
            </h3>
          </div>
          <div className="text-xs font-medium text-slate-500">
            <strong>{nbClassesCloturees}</strong> sur <strong>{totalClasses}</strong> classes clôturées (
            {totalClasses > 0 ? Math.round((nbClassesCloturees / totalClasses) * 100) : 0}%)
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
          {classesStatus.map(c => {
            const isSelected = c.classe === selectedClasse;
            return (
              <div
                key={c.classe}
                onClick={() => setSelectedClasse(c.classe)}
                className={`cursor-pointer p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                    : c.isCloturee
                    ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-sm text-slate-900">{c.classe}</span>
                    {c.isCloturee ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Clôturée
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                        En cours
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Niveau {c.niveau} • {c.effectif} élèves
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Moy: {c.deliberation.statistiques.moyenneClasse !== null ? `${c.deliberation.statistiques.moyenneClasse}` : '—'}</span>
                  <span>Pass: {c.deliberation.statistiques.tauxPassage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Class Workspace */}
      {activeClassData && (
        <div className="space-y-4">
          {/* Class Header Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-mono font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                {selectedClasse}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Conseil de Délibération — Classe {selectedClasse}
                  </h3>
                  {activeClassStatusInfo?.isCloturee ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 flex items-center gap-1 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clôturée le {activeClassStatusInfo.clotureDate}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      En cours de délibération
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Niveau : <strong>{activeClassData.niveau}</strong> • Série : <strong>{activeClassData.serie}</strong> • Effectif : <strong>{activeClassData.statistiques.effectifTotal} élèves</strong>
                </p>
              </div>
            </div>

            {/* Class Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {activeClassStatusInfo?.isCloturee ? (
                <>
                  <button
                    onClick={() => {
                      if (activeClassStatusInfo.archiveObj) {
                        setPreviewArchiveClasse(activeClassStatusInfo.archiveObj);
                      } else {
                        // Generate temporary archive object for display
                        const temp = Logic.getDeliberationsPourClasse(state, selectedClasse, overrides);
                        setPreviewArchiveClasse({
                          id: `ARCH-CLS-${state.parametres.anneeScolaire}-${selectedClasse}`,
                          anneeScolaire: state.parametres.anneeScolaire,
                          classe: selectedClasse,
                          niveau: temp.niveau,
                          serie: temp.serie,
                          dateCloture: activeClassStatusInfo.clotureDate || new Date().toISOString().split('T')[0],
                          eleves: temp.elevesResults.map(r => r.eleve),
                          notesS1: [],
                          notesS2: [],
                          decisions: temp.elevesResults.map(r => ({
                            matricule: r.eleve.matricule,
                            nom: r.eleve.nom,
                            sexe: r.eleve.sexe,
                            classe: selectedClasse,
                            statutInitial: r.eleve.statutInitial,
                            moyS1: r.moyS1,
                            moyS2: r.moyS2,
                            moyenneAnnuelle: r.moyAnnuelle,
                            rang: r.rang,
                            mention: r.mention,
                            decision: r.decision as any,
                            nouveauNiveau: r.nouveauNiveau,
                            nouvelleClasse: r.nouvelleClasse
                          })),
                          statistiques: temp.statistiques
                        });
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer la Feuille d'Archive</span>
                  </button>

                  <button
                    onClick={() => handleRouvrirClasse(selectedClasse)}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
                    title="Rouvrir pour modifier les notes ou décisions"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Rouvrir la Classe</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // Set default principal teacher if assigned in classes
                      const clObj = state.classes.find(c => c.nom === selectedClasse);
                      if (clObj?.responsableId) {
                        const p = state.professeurs.find(x => x.id === clObj.responsableId);
                        if (p) setProfesseurPrincipal(p.nom);
                      }
                      setIsClassClosingModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clôturer & Archiver cette Classe</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Class Live Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Passants (Niveau Sup.)</span>
              <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
                {activeClassData.statistiques.nbPassants}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Taux de réussite : <strong>{activeClassData.statistiques.tauxPassage}%</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Redoublants autorisés</span>
              <div className="text-2xl font-serif font-bold text-amber-800 mt-1">
                {activeClassData.statistiques.nbRedoublants}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Taux de redoublement : <strong>{activeClassData.statistiques.tauxRedoublement}%</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Exclusions (Insuffisance)</span>
              <div className="text-2xl font-serif font-bold text-rose-800 mt-1">
                {activeClassData.statistiques.nbExclus}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Taux d'exclusion : <strong>{activeClassData.statistiques.tauxExclusion}%</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Moyenne Générale</span>
              <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
                {activeClassData.statistiques.moyenneClasse !== null ? `${activeClassData.statistiques.moyenneClasse}/20` : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Max: {activeClassData.statistiques.plusForteMoyenne || '—'} • Min: {activeClassData.statistiques.plusFaibleMoyenne || '—'}
              </div>
            </div>
          </div>

          {/* Search bar inside class */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un élève par nom, matricule ou décision..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="text-xs text-slate-500">
              Seuil officiel d'admission : <strong className="text-emerald-700">≥ {state.parametres.seuilReussite}/20</strong> • Exclusion : <strong className="text-rose-700">&lt; {state.parametres.seuilExclusion}/20</strong>
            </div>
          </div>

          {/* Deliberations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">Rang</th>
                    <th className="px-4 py-3.5 font-mono">Matricule</th>
                    <th className="px-4 py-3.5">Nom et Prénoms</th>
                    <th className="px-3 py-3.5 text-center">Statut Init.</th>
                    <th className="px-4 py-3.5 text-right">Moy. S1</th>
                    <th className="px-4 py-3.5 text-right">Moy. S2</th>
                    <th className="px-4 py-3.5 text-right font-bold text-slate-900">Moy. Annuelle</th>
                    <th className="px-4 py-3.5">Mention</th>
                    <th className="px-6 py-3.5 text-center">Décision Finale du Conseil</th>
                    <th className="px-4 py-3.5">Orientation / Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-slate-400 italic">
                        Aucun élève trouvé dans cette classe.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((r) => {
                      const isPass = r.decision === 'Passe au niveau supérieur' || r.decision === 'Passage';
                      const isRed = r.decision === 'Redouble' || r.decision === 'Redoublement';
                      const isExc = r.decision === 'Exclu(e)' || r.decision === 'Exclusion';

                      return (
                        <tr key={r.eleve.matricule} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                            {r.rang ? (
                              <span className={r.rang === 1 ? 'text-amber-700 font-black' : ''}>
                                {r.rang}{r.rang === 1 ? 'er' : 'e'}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                            {r.eleve.matricule}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {r.eleve.nom}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                r.eleve.statutInitial === 'Redoublant(e)'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.eleve.statutInitial || 'Passant(e)'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                            {r.moyS1 !== null ? Number(r.moyS1).toFixed(2) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                            {r.moyS2 !== null ? Number(r.moyS2).toFixed(2) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-900 bg-amber-50/40">
                            {r.moyAnnuelle !== null ? `${Number(r.moyAnnuelle).toFixed(2)}/20` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-700">
                            {r.mention || '—'}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <select
                              value={r.decision}
                              onChange={(e) => handleDecisionChange(r.eleve.matricule, e.target.value as StatutFinal)}
                              disabled={activeClassStatusInfo?.isCloturee}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-hidden transition ${
                                isPass
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : isRed
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-rose-50 border-rose-300 text-rose-800'
                              } ${activeClassStatusInfo?.isCloturee ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'}`}
                            >
                              <option value="Passe au niveau supérieur">Passe au niveau supérieur</option>
                              <option value="Redouble">Redouble</option>
                              <option value="Exclu(e)">Exclu(e)</option>
                              <option value="Diplômé(e)">Diplômé(e)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-slate-700">
                            {r.nouvelleClasse || r.nouveauNiveau || (isExc ? 'Exclusion' : '—')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Clôture d'une Classe Spécifique */}
      {isClassClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                Clôturer & Archiver la Classe {selectedClasse}
              </h3>
              <button onClick={() => setIsClassClosingModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Validation du Procès-Verbal de la Classe</span>
                </div>
                <p>
                  Les moyennes annuelles et les décisions accordées aux <strong>{activeClassData?.statistiques.effectifTotal} élèves</strong> de la classe <strong>{selectedClasse}</strong> seront scellées dans la <strong>Feuille Officielle d'Archive</strong>.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Date officielle de clôture :
                  </label>
                  <input
                    type="date"
                    value={dateCloture}
                    onChange={(e) => setDateCloture(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Professeur Principal / Rapporteur :
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du Professeur Principal..."
                    value={professeurPrincipal}
                    onChange={(e) => setProfesseurPrincipal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Président du Conseil de Délibération :
                  </label>
                  <input
                    type="text"
                    value={presidentConseil}
                    onChange={(e) => setPresidentConseil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Chef d'Établissement / Proviseur :
                  </label>
                  <input
                    type="text"
                    value={chefEtablissement}
                    onChange={(e) => setChefEtablissement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClassClosingModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClotureClasse}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                >
                  Confirmer et Clôturer la Classe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Clôturer Toutes les Classes */}
      {isAllClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                Clôturer Toutes les Classes ({totalClasses} classes)
              </h3>
              <button onClick={() => setIsAllClosingModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Clôture collective de l'établissement</span>
                </div>
                <p>
                  Cette action va archiver les résultats et procès-verbaux de <strong>toutes les classes</strong> ({distinctClasses.join(', ')}) pour l'année scolaire <strong>{state.parametres.anneeScolaire}</strong>.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Date de clôture :
                </label>
                <input
                  type="date"
                  value={dateCloture}
                  onChange={(e) => setDateCloture(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAllClosingModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClotureToutesClasses}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition"
                >
                  Clôturer Toutes les Classes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bascule Année Scolaire Suivante */}
      {isYearTransitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                Transition vers l'Année Scolaire Suivante
              </h3>
              <button onClick={() => setIsYearTransitionModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Passage automatique des élèves</span>
                </div>
                <p>
                  Les élèves admis passeront dans leur nouvelle classe, les redoublants resteront inscrits dans leur niveau, et les exclus seront archivés.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Nouvelle Année Scolaire de rentrée :
                </label>
                <input
                  type="text"
                  value={nextSchoolYear}
                  onChange={(e) => setNextSchoolYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1 text-slate-600">
                <p>• Les grilles de notes (S1 & S2), absences et sanctions seront réinitialisées pour la rentrée.</p>
                <p>• Toutes les archives de l'année <strong>{state.parametres.anneeScolaire}</strong> resteront consultables et imprimables à tout moment dans l'onglet <strong>Archives</strong>.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsYearTransitionModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransitionAnnee}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition"
                >
                  Bascule & Rentrée Scolaire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
