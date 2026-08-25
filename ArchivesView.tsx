import React, { useState, useMemo } from 'react';
import { AppState, ArchiveClasse, ArchiveDecisionItem, ArchiveEleve } from '../types';
import { FeuilleArchiveImprimable } from './FeuilleArchiveImprimable';
import {
  History,
  Archive,
  Calendar,
  Users,
  Search,
  Eye,
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  GraduationCap,
  XCircle,
  Award,
  Layers
} from 'lucide-react';

interface Props {
  state: AppState;
}

export const ArchivesView: React.FC<Props> = ({ state }) => {
  // Normalize archives object safely
  const archivesObj = useMemo(() => {
    const raw = state.archives;
    if (!raw) {
      return { annees: [], classes: [], exclusions: [], diplomes: [] };
    }
    if (Array.isArray(raw)) {
      return { annees: raw, classes: [], exclusions: [], diplomes: [] };
    }
    return {
      annees: Array.isArray(raw.annees) ? raw.annees : [],
      classes: Array.isArray(raw.classes) ? raw.classes : [],
      exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : [],
      diplomes: Array.isArray(raw.diplomes) ? raw.diplomes : []
    };
  }, [state.archives]);

  // Extract all distinct school years available in archives
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    archivesObj.annees.forEach(a => { if (a.anneeScolaire) years.add(a.anneeScolaire); });
    archivesObj.classes.forEach(c => { if (c.anneeScolaire) years.add(c.anneeScolaire); });
    archivesObj.exclusions.forEach(e => { if (e.anneeScolaire) years.add(e.anneeScolaire); });
    archivesObj.diplomes.forEach(d => { if (d.anneeScolaire) years.add(d.anneeScolaire); });

    // Also include current school year if any class is closed
    if (state.classesCloturees && Object.keys(state.classesCloturees).length > 0) {
      years.add(state.parametres.anneeScolaire);
    }

    const list = Array.from(years);
    return list.length > 0 ? list : [state.parametres.anneeScolaire];
  }, [archivesObj, state]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || state.parametres.anneeScolaire);
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'feuille' | 'tableau' | 'exclusions' | 'diplomes'>('feuille');
  const [searchQuery, setSearchQuery] = useState('');
  const [printableModalClasse, setPrintableModalClasse] = useState<ArchiveClasse | null>(null);

  // Available classes for selected year
  const classesForYear = useMemo(() => {
    const classesList = new Set<string>();
    archivesObj.classes
      .filter(c => c.anneeScolaire === selectedYear)
      .forEach(c => { if (c.classe) classesList.add(c.classe); });

    // Also check year archives
    const yearArch = archivesObj.annees.find(a => a.anneeScolaire === selectedYear);
    if (yearArch?.classesCloturees) {
      yearArch.classesCloturees.forEach(c => classesList.add(c));
    }
    if (yearArch?.eleves) {
      yearArch.eleves.forEach(e => { if (e.classe) classesList.add(e.classe); });
    }

    return Array.from(classesList).sort();
  }, [archivesObj, selectedYear]);

  // Pick or synthesize active archive classe object
  const currentArchiveClasse = useMemo<ArchiveClasse | null>(() => {
    if (classesForYear.length === 0) return null;

    const targetClass = selectedClasse === 'all' ? classesForYear[0] : selectedClasse;

    // Check if directly in archivesObj.classes
    const direct = archivesObj.classes.find(
      c => c.anneeScolaire === selectedYear && c.classe === targetClass
    );
    if (direct) return direct;

    // Otherwise construct from year archive
    const yearArch = archivesObj.annees.find(a => a.anneeScolaire === selectedYear);
    if (yearArch) {
      const classStudents = (yearArch.eleves || []).filter(e => e.classe === targetClass);
      const decisions: ArchiveDecisionItem[] = (yearArch.decisions || [])
        .filter(d => d.classe === targetClass)
        .map(d => ({
          matricule: d.matricule,
          nom: d.nom,
          sexe: d.sexe,
          classe: d.classe,
          statutInitial: d.statutInitial,
          moyS1: d.moyS1 ?? null,
          moyS2: d.moyS2 ?? null,
          moyenneAnnuelle: d.moyenneAnnuelle ?? null,
          rang: d.rang ?? null,
          mention: d.mention || '—',
          decision: d.decision as any || 'Passe au niveau supérieur',
          nouveauNiveau: d.nouveauNiveau,
          nouvelleClasse: d.nouvelleClasse
        }));

      const eleve0 = classStudents[0];
      const evaluated = decisions.filter(d => d.moyenneAnnuelle !== null);
      const values = evaluated.map(d => d.moyenneAnnuelle as number);
      const nbPass = decisions.filter(d => d.decision === 'Passe au niveau supérieur' || d.decision === 'Passage').length;
      const nbRed = decisions.filter(d => d.decision === 'Redouble' || d.decision === 'Redoublement').length;
      const nbExc = decisions.filter(d => d.decision === 'Exclu(e)' || d.decision === 'Exclusion').length;

      return {
        id: `ARCH-CLS-${selectedYear}-${targetClass}`,
        anneeScolaire: selectedYear,
        classe: targetClass,
        niveau: eleve0?.niveau || '—',
        serie: eleve0?.serie || 'Unique',
        dateCloture: yearArch.dateCloture || '—',
        chefEtablissement: state.parametres.nomEtablissement,
        eleves: classStudents,
        notesS1: yearArch.notesS1 || [],
        notesS2: yearArch.notesS2 || [],
        decisions,
        statistiques: {
          effectifTotal: classStudents.length || decisions.length,
          effectifEvalues: evaluated.length,
          nbPassants: nbPass,
          nbRedoublants: nbRed,
          nbExclus: nbExc,
          nbDiplomes: decisions.filter(d => d.decision === 'Diplômé(e)').length,
          tauxPassage: decisions.length ? Math.round((nbPass / decisions.length) * 100) : 0,
          tauxRedoublement: decisions.length ? Math.round((nbRed / decisions.length) * 100) : 0,
          tauxExclusion: decisions.length ? Math.round((nbExc / decisions.length) * 100) : 0,
          moyenneClasse: values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null,
          plusForteMoyenne: values.length ? Math.max(...values) : null,
          plusFaibleMoyenne: values.length ? Math.min(...values) : null
        }
      };
    }

    return null;
  }, [archivesObj, selectedYear, selectedClasse, classesForYear, state.parametres.nomEtablissement]);

  // Filtered decisions list for tabular view
  const allDecisionsForYear = useMemo(() => {
    const list: ArchiveDecisionItem[] = [];

    // From classes archives
    archivesObj.classes
      .filter(c => c.anneeScolaire === selectedYear)
      .forEach(c => {
        if (selectedClasse === 'all' || c.classe === selectedClasse) {
          (c.decisions || []).forEach(d => list.push(d));
        }
      });

    // If empty, from year archives
    if (list.length === 0) {
      const ya = archivesObj.annees.find(a => a.anneeScolaire === selectedYear);
      if (ya?.decisions) {
        ya.decisions.forEach(d => {
          if (selectedClasse === 'all' || d.classe === selectedClasse) {
            list.push(d);
          }
        });
      }
    }

    const q = searchQuery.trim().toLowerCase();
    return list.filter(d => {
      if (!q) return true;
      return (
        d.nom.toLowerCase().includes(q) ||
        d.matricule.toLowerCase().includes(q) ||
        d.classe.toLowerCase().includes(q) ||
        d.decision.toLowerCase().includes(q)
      );
    });
  }, [archivesObj, selectedYear, selectedClasse, searchQuery]);

  // Exclusions for selected year
  const exclusionsForYear = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return archivesObj.exclusions
      .filter(e => e.anneeScolaire === selectedYear)
      .filter(e => {
        if (!q) return true;
        return e.nom.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q);
      });
  }, [archivesObj.exclusions, selectedYear, searchQuery]);

  // Diplomes for selected year
  const diplomesForYear = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return archivesObj.diplomes
      .filter(d => d.anneeScolaire === selectedYear)
      .filter(d => {
        if (!q) return true;
        return d.nom.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q);
      });
  }, [archivesObj.diplomes, selectedYear, searchQuery]);

  // Export CSV function
  const handleExportCSV = () => {
    if (allDecisionsForYear.length === 0) return;

    const headers = ['Rang', 'Matricule', 'Nom et Prénoms', 'Sexe', 'Classe', 'Statut Initial', 'Moyenne S1', 'Moyenne S2', 'Moyenne Annuelle', 'Mention', 'Decision', 'Orientation'];
    const rows = allDecisionsForYear.map(d => [
      d.rang || '',
      `"${d.matricule}"`,
      `"${d.nom}"`,
      d.sexe || '',
      `"${d.classe}"`,
      `"${d.statutInitial || ''}"`,
      d.moyS1 ?? '',
      d.moyS2 ?? '',
      d.moyenneAnnuelle ?? '',
      `"${d.mention || ''}"`,
      `"${d.decision || ''}"`,
      `"${d.nouvelleClasse || d.nouveauNiveau || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Archives_${selectedYear}_${selectedClasse}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasAnyArchives = archivesObj.classes.length > 0 || archivesObj.annees.length > 0 || archivesObj.exclusions.length > 0;

  return (
    <div className="space-y-6">
      {/* Printable Modal */}
      {printableModalClasse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in flex items-start justify-center">
          <div className="max-w-5xl w-full">
            <FeuilleArchiveImprimable
              state={state}
              archiveClasse={printableModalClasse}
              onClose={() => setPrintableModalClasse(null)}
            />
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <History className="w-3.5 h-3.5" /> Registre Général des Archives Scolaires
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Archives & Feuilles Officielles de Délibération
          </h2>
          <p className="text-sm text-slate-500">
            Consultation immuable des résultats par classe, impression des procès-verbaux d'archives et registres officiels
          </p>
        </div>

        {currentArchiveClasse && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintableModalClasse(currentArchiveClasse)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Feuille d'Archive</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Year & Class selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <label className="text-xs font-bold text-slate-700">Année Scolaire :</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedClasse('all');
              }}
              className="px-3 py-1.5 text-xs font-bold font-mono rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-amber-500"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <label className="text-xs font-bold text-slate-700">Classe :</label>
            <select
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold font-mono rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-amber-500"
            >
              <option value="all">Toutes les classes ({classesForYear.length})</option>
              {classesForYear.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: View mode tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
          <button
            onClick={() => setActiveTab('feuille')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'feuille'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Feuille d'Archive Officielle</span>
          </button>

          <button
            onClick={() => setActiveTab('tableau')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'tableau'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Tableau des Résultats</span>
          </button>

          <button
            onClick={() => setActiveTab('exclusions')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'exclusions'
                ? 'bg-white text-rose-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Exclusions ({exclusionsForYear.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('diplomes')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'diplomes'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Diplômés ({diplomesForYear.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasAnyArchives && classesForYear.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2 shadow-xs">
          <Archive className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-slate-700">Aucune archive scolaire trouvée</h3>
          <p className="text-xs max-w-md mx-auto text-slate-500">
            Pour générer les archives officielles de l'établissement, rendez-vous dans l'onglet <strong>Passage Annuel</strong> et effectuez la clôture de vos classes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mode 1: Printable Official Archive Sheet */}
          {activeTab === 'feuille' && (
            <div>
              {currentArchiveClasse ? (
                <FeuilleArchiveImprimable
                  state={state}
                  archiveClasse={currentArchiveClasse}
                  showPrintButton={false}
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                  <p>Sélectionnez une classe archivée pour afficher sa feuille d'archive officielle.</p>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Interactive Table */}
          {activeTab === 'tableau' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer les élèves archivés..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                  />
                </div>
                <div className="text-xs text-slate-500 font-semibold">
                  {allDecisionsForYear.length} élève(s) affiché(s) pour {selectedYear}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-12">Rang</th>
                        <th className="px-4 py-3.5 font-mono">Matricule</th>
                        <th className="px-4 py-3.5">Nom et Prénoms</th>
                        <th className="px-4 py-3.5">Classe</th>
                        <th className="px-4 py-3.5 text-right">Moy. S1</th>
                        <th className="px-4 py-3.5 text-right">Moy. S2</th>
                        <th className="px-4 py-3.5 text-right font-bold text-slate-900">Moy. Annuelle</th>
                        <th className="px-4 py-3.5">Mention</th>
                        <th className="px-6 py-3.5 text-center">Décision Enregistrée</th>
                        <th className="px-4 py-3.5">Destination / Niveau</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allDecisionsForYear.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-8 text-center text-slate-400 italic">
                            Aucun enregistrement d'archive pour ces critères.
                          </td>
                        </tr>
                      ) : (
                        allDecisionsForYear.map((d, index) => {
                          const isPass = d.decision === 'Passe au niveau supérieur' || d.decision === 'Passage';
                          const isRed = d.decision === 'Redouble' || d.decision === 'Redoublement';
                          const isExc = d.decision === 'Exclu(e)' || d.decision === 'Exclusion';
                          const isDip = d.decision === 'Diplômé(e)' || d.decision === 'Diplome';

                          return (
                            <tr key={`${d.matricule}-${index}`} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                                {d.rang ? `${d.rang}${d.rang === 1 ? 'er' : 'e'}` : '—'}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                                {d.matricule}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-slate-900">
                                {d.nom}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                                {d.classe}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                                {d.moyS1 !== null && d.moyS1 !== undefined ? Number(d.moyS1).toFixed(2) : '—'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                                {d.moyS2 !== null && d.moyS2 !== undefined ? Number(d.moyS2).toFixed(2) : '—'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-900 bg-amber-50/40">
                                {d.moyenneAnnuelle !== null && d.moyenneAnnuelle !== undefined ? `${Number(d.moyenneAnnuelle).toFixed(2)}/20` : '—'}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-700">
                                {d.mention || '—'}
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    isPass
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : isRed
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : isExc
                                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                      : isDip
                                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {d.decision}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-xs font-mono text-slate-700">
                                {d.nouvelleClasse || d.nouveauNiveau || (isDip ? 'Diplômé' : isExc ? 'Radiation' : '—')}
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

          {/* Mode 3: Exclusions */}
          {activeTab === 'exclusions' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <h4 className="font-serif font-bold text-sm text-rose-950">
                    Registre des Radiations & Exclusions ({selectedYear})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-rose-800">
                  {exclusionsForYear.length} élève(s) radié(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3.5">Matricule</th>
                      <th className="px-4 py-3.5">Nom et Prénoms</th>
                      <th className="px-4 py-3.5">Dernière Classe</th>
                      <th className="px-4 py-3.5 text-right">Moyenne Finale</th>
                      <th className="px-4 py-3.5">Date de Décision</th>
                      <th className="px-6 py-3.5">Motif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exclusionsForYear.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                          Aucune exclusion enregistrée pour cette année scolaire.
                        </td>
                      </tr>
                    ) : (
                      exclusionsForYear.map((e) => (
                        <tr key={e.matricule} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">{e.matricule}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">{e.nom}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{e.classe}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-700">
                            {e.moyenneAnnuelle !== null && e.moyenneAnnuelle !== undefined ? `${e.moyenneAnnuelle}/20` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">{e.dateArchivage || '—'}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-700">{e.motif || 'Insuffisance de résultats'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mode 4: Diplomes */}
          {activeTab === 'diplomes' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-serif font-bold text-sm text-indigo-950">
                    Registre des Lauréats & Diplômés ({selectedYear})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-indigo-800">
                  {diplomesForYear.length} lauréat(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3.5">Matricule</th>
                      <th className="px-4 py-3.5">Nom et Prénoms</th>
                      <th className="px-4 py-3.5">Classe / Série</th>
                      <th className="px-4 py-3.5 text-right">Moyenne du Bac/Brevet</th>
                      <th className="px-4 py-3.5">Date de Clôture</th>
                      <th className="px-6 py-3.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {diplomesForYear.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                          Aucun diplômé enregistré pour cette promotion.
                        </td>
                      </tr>
                    ) : (
                      diplomesForYear.map((d) => (
                        <tr key={d.matricule} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">{d.matricule}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">{d.nom}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{d.classe} ({d.serie})</td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                            {d.moyenneAnnuelle !== null && d.moyenneAnnuelle !== undefined ? `${d.moyenneAnnuelle}/20` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">{d.dateArchivage || '—'}</td>
                          <td className="px-6 py-3.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                              Cycle Terminé avec Succès
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
