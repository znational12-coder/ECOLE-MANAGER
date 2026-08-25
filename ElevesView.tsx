import React, { useState, useMemo } from 'react';
import { AppState, Eleve } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Edit2,
  FileText,
  CreditCard,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Layers,
  RefreshCw,
  CheckCircle2,
  Award
} from 'lucide-react';

interface Props {
  state: AppState;
  onNavigate: (route: any, params?: any) => void;
  onOpenImportModal: () => void;
}

export const ElevesView: React.FC<Props> = ({ state, onNavigate, onOpenImportModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterClasse, setFilterClasse] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Bulk Generator Confirmation Modal
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Modal for Add / Edit Student
  const [editingStudent, setEditingStudent] = useState<Eleve | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState<Eleve>({
    matricule: '',
    civilite: 'M.',
    nom: '',
    niveau: state.parametres.niveaux[0] || 'Tle',
    serie: state.parametres.series[0] || 'D',
    classe: 'TD1',
    dateNaissance: '',
    lieuNaissance: '',
    statutInitial: 'Passant(e)',
    telParent1: '',
    telParent2: ''
  });
  const [formError, setFormError] = useState('');

  const distinctClasses = Logic.distinctClasses(state);

  const normalizeStr = (str: string) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Build a normalized search index once per state change. This avoids repeated
  // Unicode normalization for every key stroke across thousands of students.
  const studentIndex = useMemo(() => state.eleves.map(e => ({
    e,
    nom: normalizeStr(e.nom),
    matricule: normalizeStr(e.matricule),
    classe: normalizeStr(e.classe),
  })), [state.eleves]);

  const filteredStudents = useMemo(() => {
    const q = normalizeStr(searchQuery);
    return studentIndex.filter(({e, nom, matricule, classe}) => {
      const matchQ = !q || nom.includes(q) || matricule.includes(q) || classe.includes(q);
      return matchQ && (!filterNiveau || e.niveau === filterNiveau) && (!filterClasse || e.classe === filterClasse);
    }).sort((a, b) => {
      const byClass = a.e.classe.localeCompare(b.e.classe);
      return byClass || a.e.nom.localeCompare(b.e.nom);
    }).map(({e}) => e);
  }, [studentIndex, searchQuery, filterNiveau, filterClasse]);


  // Total pages
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, safeCurrentPage, pageSize]);

  // Only calculate expensive bulletin/status values for the rows currently visible.
  const visibleStudentMetrics = useMemo(() => {
    const map = new Map<string, { moyenne: number|null; statut: string }>();
    for (const e of paginatedStudents) {
      const bS2 = Logic.computeBulletin(state, e.matricule, 'S2');
      map.set(e.matricule, { moyenne: bS2?.moyenneSemestrielle ?? null, statut: Logic.statutFinal(state, e.matricule) });
    }
    return map;
  }, [paginatedStudents, state]);

  // Handle generating 100 students per class (6e to Terminale)
  const handleGenerate100PerClass = () => {
    StorageService.populate100StudentsCohort();
    setIsBulkConfirmOpen(false);
    setBulkSuccessMsg('Génération réussie : 100 élèves par classe ajoutés pour toutes les classes de la 6ème à la Terminale (1 800 élèves au total) avec notes et scolarités !');
    setCurrentPage(1);
    setTimeout(() => setBulkSuccessMsg(''), 6000);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setStudentForm({
      matricule: `LP-${Date.now().toString().slice(-4)}`,
      civilite: 'M.',
      nom: '',
      niveau: filterNiveau || state.parametres.niveaux[0] || 'Tle',
      serie: state.parametres.series[0] || 'D',
      classe: filterClasse || distinctClasses[0] || 'TD1',
      dateNaissance: '2005-01-01',
      lieuNaissance: 'Niamey',
      statutInitial: 'Passant(e)',
      telParent1: '',
      telParent2: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: Eleve) => {
    setEditingStudent(e);
    setStudentForm({ ...e });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = (matricule: string, nom: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'élève ${nom} (${matricule}) ? Toutes ses notes, absences, sanctions et paiements associés seront effacés.`)) {
      const newState = { ...state };
      newState.eleves = newState.eleves.filter(e => e.matricule !== matricule);
      newState.notesS1 = newState.notesS1.filter(n => n.matricule !== matricule);
      newState.notesS2 = newState.notesS2.filter(n => n.matricule !== matricule);
      newState.absences = newState.absences.filter(a => a.matricule !== matricule);
      newState.sanctions = newState.sanctions.filter(s => s.matricule !== matricule);
      newState.paiements = newState.paiements.filter(p => p.matricule !== matricule);
      StorageService.save(newState);
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.matricule.trim() || !studentForm.nom.trim() || !studentForm.classe.trim()) {
      setFormError('Le matricule, le nom et la classe sont obligatoires.');
      return;
    }

    const newState = { ...state };

    if (editingStudent) {
      // Edit existing
      const idx = newState.eleves.findIndex(x => x.matricule === editingStudent.matricule);
      if (idx !== -1) {
        newState.eleves[idx] = { ...studentForm };
      }
    } else {
      // Check for duplicate matricule
      if (newState.eleves.some(x => x.matricule.toLowerCase() === studentForm.matricule.toLowerCase())) {
        setFormError('Ce matricule est déjà attribué à un autre élève.');
        return;
      }
      newState.eleves.push({ ...studentForm });
      Logic.ensureNotesRow(newState, 'S1', studentForm.matricule);
      Logic.ensureNotesRow(newState, 'S2', studentForm.matricule);
    }

    // Ensure class is registered in school classes
    if (studentForm.classe) {
      const classExists = newState.classes.some(c => c.nom === studentForm.classe);
      if (!classExists) {
        newState.classes.push({
          id: `c_${Date.now()}`,
          niveau: studentForm.niveau,
          serie: studentForm.serie,
          nom: studentForm.classe
        });
      }
    }

    StorageService.save(newState);
    setIsModalOpen(false);
  };

  const exportCSV = () => {
    const headers = ['Matricule', 'Civilité', 'Nom et Prénoms', 'Niveau', 'Série', 'Classe', 'Date de Naissance', 'Lieu de Naissance', 'Situation Rentrée', 'Téléphone Parent 1', 'Téléphone Parent 2'];
    const rows = filteredStudents.map(e => [
      e.matricule,
      e.civilite,
      `"${e.nom.replace(/"/g, '""')}"`,
      e.niveau,
      e.serie,
      e.classe,
      e.dateNaissance || '',
      `"${(e.lieuNaissance || '').replace(/"/g, '""')}"`,
      e.statutInitial || 'Passant(e)',
      e.telParent1 || '',
      e.telParent2 || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eleves_la_perseverance_${state.parametres.anneeScolaire}_${filterClasse || 'toutes'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Class student counters
  const classCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.eleves.forEach(e => {
      map[e.classe] = (map[e.classe] || 0) + 1;
    });
    return map;
  }, [state.eleves]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" /> Registre des Inscriptions (6ème à Terminale)
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Gestion des Élèves</h2>
          <p className="text-sm text-slate-500">
            <strong>{state.eleves.length.toLocaleString('fr-FR')}</strong> élève(s) inscrit(s) répartis sur <strong>{distinctClasses.length}</strong> classes • <strong>{filteredStudents.length.toLocaleString('fr-FR')}</strong> affiché(s)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBulkConfirmOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
            title="Générer 100 élèves par classe de la 6e à la Terminale"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Générer 100 élèves / classe (6e à Tle)</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Importer</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Ajouter un élève</span>
          </button>
        </div>
      </div>

      {bulkSuccessMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-medium">{bulkSuccessMsg}</div>
        </div>
      )}

      {/* Quick Class Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Layers className="w-3.5 h-3.5 text-amber-600" /> Classes (100 élèves par classe)
          </div>
          <span className="text-xs text-slate-500">
            {distinctClasses.length} classe(s) actives
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pb-1">
          <button
            onClick={() => {
              setFilterClasse('');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              !filterClasse
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Toutes ({state.eleves.length})
          </button>
          {distinctClasses.map((cls) => {
            const count = classCountMap[cls] || 0;
            const isSelected = filterClasse === cls;
            return (
              <button
                key={cls}
                onClick={() => {
                  setFilterClasse(cls);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cls}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-950 text-white' : count >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, matricule ou classe..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9.5 pr-20 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition bg-slate-50/50 focus:bg-white"
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {filteredStudents.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterNiveau}
            onChange={(e) => {
              setFilterNiveau(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden bg-white text-slate-700"
          >
            <option value="">Tous les niveaux</option>
            {state.parametres.niveaux.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <select
            value={filterClasse}
            onChange={(e) => {
              setFilterClasse(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden bg-white text-slate-700 font-semibold"
          >
            <option value="">Toutes les classes</option>
            {distinctClasses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(searchQuery || filterNiveau || filterClasse) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterNiveau('');
                setFilterClasse('');
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
              title="Réinitialiser tous les filtres"
            >
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-6 py-3.5">Matricule</th>
                <th className="px-4 py-3.5">Nom et Prénoms</th>
                <th className="px-4 py-3.5">Niveau & Série</th>
                <th className="px-4 py-3.5">Classe</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5">Moyenne S2</th>
                <th className="px-4 py-3.5">Décision</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <p className="font-serif text-base text-slate-700 font-bold mb-1">Aucun élève trouvé</p>
                    <p className="text-xs">Modifiez vos filtres ou cliquez sur "Générer 100 élèves / classe".</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((e) => {
                  const metrics = visibleStudentMetrics.get(e.matricule);
                  const moyenne = metrics?.moyenne ?? null;
                  const statut = metrics?.statut || '—';
                  return (
                    <tr key={e.matricule} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">
                        {e.matricule}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <span className="text-slate-500 mr-1 text-xs">{e.civilite}</span>
                        {e.nom}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {e.niveau} • {e.serie}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700 border border-slate-200">
                          {e.classe}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          e.statutInitial === 'Redoublant(e)'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {e.statutInitial || 'Passant(e)'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-700">
                        {moyenne !== null ? `${moyenne}/20` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          statut === 'Passe au niveau supérieur' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          statut === 'Redouble' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          statut === 'Exclu(e)' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {statut}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate('bulletins', { matricule: e.matricule, sem: 'S2' })}
                            title="Consulter le Bulletin"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-amber-100 transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigate('attestations', { matricule: e.matricule })}
                            title="Générer l'Attestation de Scolarité"
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigate('paiements', { matricule: e.matricule })}
                            title="Fiche Financière & Échéances"
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(e)}
                            title="Modifier l'élève"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e.matricule, e.nom)}
                            title="Supprimer l'élève"
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
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

        {/* Pagination Footer */}
        {filteredStudents.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Affichage de <strong>{((safeCurrentPage - 1) * pageSize) + 1}</strong> à <strong>{Math.min(safeCurrentPage * pageSize, filteredStudents.length)}</strong> sur <strong>{filteredStudents.length.toLocaleString('fr-FR')}</strong> élèves</span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span>Par page :</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:border-amber-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                title="Première page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-900 bg-white border border-slate-200 rounded-lg">
                Page {safeCurrentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                title="Dernière page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Generator Confirm Modal */}
      {isBulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base">Génération 100 Élèves par Classe</h3>
              </div>
              <button onClick={() => setIsBulkConfirmOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="font-bold text-sm text-amber-950">Cette opération va générer l'effectif complet :</div>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li><strong>18 classes</strong> de la 6ème à la Terminale (6A, 6B, 5A, 5B, 4A, 4B, 3A, 3B, 2A1, 2A2, 2C1, 2D1, 1A1, 1C1, 1D1, 1D2, TA1, TC1, TD1, TD2)</li>
                  <li><strong>100 élèves par classe</strong> (1 800 élèves au total)</li>
                  <li>Noms et prénoms sahéliens authentiques avec dates de naissance adaptées par niveau</li>
                  <li>Notes réalistes pour le Semestre 1 et le Semestre 2</li>
                  <li>Historique financier et versements de scolarité enregistrés</li>
                </ul>
              </div>

              <p className="text-slate-500 text-xs">
                Souhaitez-vous charger cette cohorte de 1 800 élèves maintenant ?
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkConfirmOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleGenerate100PerClass}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Confirmer la Génération</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base">
                  {editingStudent ? "Modifier les informations de l'élève" : 'Ajouter un nouvel élève'}
                </h3>
                <p className="text-xs text-slate-400">Renseignez les champs obligatoires</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Matricule *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.matricule}
                    onChange={(e) => setStudentForm({ ...studentForm, matricule: e.target.value })}
                    disabled={!!editingStudent}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:border-amber-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Civilité</label>
                  <select
                    value={studentForm.civilite}
                    onChange={(e) => setStudentForm({ ...studentForm, civilite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="M.">M. (Garçon)</option>
                    <option value="Mlle">Mlle (Fille)</option>
                    <option value="Mme">Mme</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Situation Rentrée</label>
                  <select
                    value={studentForm.statutInitial || 'Passant(e)'}
                    onChange={(e) => setStudentForm({ ...studentForm, statutInitial: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Passant(e)">Passant(e)</option>
                    <option value="Redoublant(e)">Redoublant(e)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom et Prénoms *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abdoulaye Mamane Ibrahim"
                  value={studentForm.nom}
                  onChange={(e) => setStudentForm({ ...studentForm, nom: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Niveau *</label>
                  <select
                    value={studentForm.niveau}
                    onChange={(e) => setStudentForm({ ...studentForm, niveau: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {state.parametres.niveaux.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Série *</label>
                  <select
                    value={studentForm.serie}
                    onChange={(e) => setStudentForm({ ...studentForm, serie: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {state.parametres.series.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classe *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 6A, TD1..."
                    value={studentForm.classe}
                    onChange={(e) => setStudentForm({ ...studentForm, classe: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={studentForm.dateNaissance || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, dateNaissance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu de Naissance</label>
                  <input
                    type="text"
                    placeholder="Ex: Niamey, Zinder, Tahoua..."
                    value={studentForm.lieuNaissance || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, lieuNaissance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone Parent 1</label>
                  <input
                    type="tel"
                    placeholder="Ex: +227 90 12 34 56"
                    value={studentForm.telParent1 || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, telParent1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone Parent 2</label>
                  <input
                    type="tel"
                    placeholder="Ex: +227 96 78 90 12"
                    value={studentForm.telParent2 || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, telParent2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition"
                >
                  {editingStudent ? 'Enregistrer les modifications' : 'Ajouter au registre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
