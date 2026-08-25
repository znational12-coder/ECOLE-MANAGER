import React, { useState, useRef } from 'react';
import { AppState, SujetEvaluation, TypeEvaluation, SectionSujet, UserSession } from '../types';
import { MODELES_SUJETS_DEFAUT, PedagogieImportExport } from '../data/modelesPedagogiques';
import { Logic } from '../services/logic';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  Printer,
  FileDown,
  Upload,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Loader2,
  X,
  FileText,
  Copy,
  PenTool,
  CheckSquare,
  AlertTriangle,
  GraduationCap,
  Layers,
  ChevronRight
} from 'lucide-react';

interface Props {
  state: AppState;
  session?: UserSession;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const SujetsView: React.FC<Props> = ({ state, session, onUpdateState }) => {
  const sujets = state.sujets || MODELES_SUJETS_DEFAUT;
  const activeIdentity = session ? Logic.identiteActive(state, session) : null;
  const currentProf = activeIdentity?.type === 'prof' ? (activeIdentity.record as any) : null;

  const [selectedId, setSelectedId] = useState<string>(sujets[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('');
  const [filterDiscipline, setFilterDiscipline] = useState<string>(
    currentProf?.matieres?.[0] || ''
  );
  const [filterNiveau, setFilterNiveau] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCorrige, setShowCorrige] = useState<boolean>(false);

  // Modals & Editing
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<SujetEvaluation | null>(null);

  // Import Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importTab, setImportTab] = useState<'json' | 'rawText' | 'templates'>('templates');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [rawTextContent, setRawTextContent] = useState<string>('');
  const [rawTextMeta, setRawTextMeta] = useState<{
    type: TypeEvaluation;
    discipline: string;
    classe: string;
    titre: string;
  }>({
    type: 'Devoir',
    discipline: currentProf?.matieres?.[0] || 'Mathématiques',
    classe: '3e',
    titre: 'Devoir Surveillé'
  });
  const [importError, setImportError] = useState<string>('');

  // PDF Export
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Subject
  const activeSujet = sujets.find(s => s.id === selectedId) || sujets[0];

  // Distinct disciplines and classes (safe extraction from state)
  const disciplinesList: string[] = Array.from(new Set<string>((state.disciplines || []).filter(Boolean))).sort();
  const classesList: string[] = Array.from(new Set<string>((state.eleves || []).map(e => e.classe).filter(Boolean))).sort();

  // Filtered List
  const filteredSujets = sujets.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      s.titre.toLowerCase().includes(q) ||
      s.discipline.toLowerCase().includes(q) ||
      s.classeOuNiveau.toLowerCase().includes(q) ||
      (s.auteur && s.auteur.toLowerCase().includes(q));
    const matchType = !filterType || s.type === filterType;
    const matchDiscipline = !filterDiscipline || s.discipline === filterDiscipline;
    const matchNiveau = !filterNiveau || s.classeOuNiveau.includes(filterNiveau);
    return matchQ && matchType && matchDiscipline && matchNiveau;
  });

  const handleCreateNew = (type: TypeEvaluation = 'Devoir') => {
    const newSujet: SujetEvaluation = {
      id: `sujet-${Date.now()}`,
      type,
      titre: `${type === 'Examen' ? 'Examen Blanc' : type === 'Devoir' ? 'Devoir Surveillé N°1' : 'Interrogation Écrite N°1'} — ${disciplinesList[0] || 'Mathématiques'}`,
      discipline: disciplinesList[0] || 'Mathématiques',
      classeOuNiveau: state.parametres.niveaux[3] || '3e',
      duree: type === 'Examen' ? '4 heures' : type === 'Devoir' ? '2 heures' : '45 minutes',
      coefficient: type === 'Examen' ? 4 : type === 'Devoir' ? 3 : 1,
      dateEvaluation: new Date().toISOString().split('T')[0],
      anneeScolaire: state.parametres.anneeScolaire,
      session: type === 'Examen' ? 'Session Officielle 2026' : undefined,
      baremeTotal: 20,
      auteur: 'Équipe Pédagogique',
      consignes: [
        "L'usage de la calculatrice scientifique non programmable est autorisé.",
        "La clarté de la rédaction et la rigueur des justifications seront prises en compte."
      ],
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          titre: 'Exercice 1 : Questions de cours et applications directes',
          points: 8,
          contenu: '1. Définir les concepts fondamentaux.\n2. Énoncer le théorème principal et donner un exemple concret.'
        },
        {
          id: `sec-${Date.now()}-2`,
          titre: 'Exercice 2 : Problème d\'analyse et synthèse',
          points: 12,
          contenu: 'Soit la fonction définie sur son ensemble de validité...\n1. Étudier les limites et les variations.\n2. Dresser le tableau de variation et conclure.'
        }
      ]
    };
    setEditForm(newSujet);
    setIsEditing(true);
  };

  const handleEdit = (sujet: SujetEvaluation) => {
    setEditForm(JSON.parse(JSON.stringify(sujet)));
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce sujet d\'évaluation ?')) return;
    onUpdateState(prev => {
      const updated = (prev.sujets || []).filter(s => s.id !== id);
      return { ...prev, sujets: updated };
    });
    if (selectedId === id) {
      const remaining = sujets.filter(s => s.id !== id);
      setSelectedId(remaining[0]?.id || '');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    // Recalculate total points
    const totalPts = editForm.sections.reduce((acc, sec) => acc + (Number(sec.points) || 0), 0);
    const updatedSujet = {
      ...editForm,
      baremeTotal: totalPts > 0 ? totalPts : editForm.baremeTotal || 20
    };

    onUpdateState(prev => {
      const currentList = prev.sujets || [];
      const exists = currentList.some(s => s.id === updatedSujet.id);
      let updated: SujetEvaluation[];
      if (exists) {
        updated = currentList.map(s => (s.id === updatedSujet.id ? updatedSujet : s));
      } else {
        updated = [updatedSujet, ...currentList];
      }
      return { ...prev, sujets: updated };
    });

    setSelectedId(updatedSujet.id);
    setIsEditing(false);
    setEditForm(null);
  };

  const handleAddSection = () => {
    if (!editForm) return;
    const newSec: SectionSujet = {
      id: `sec-${Date.now()}`,
      titre: `Exercice ${editForm.sections.length + 1}`,
      points: 5,
      contenu: 'Énoncé de l\'exercice...'
    };
    setEditForm({
      ...editForm,
      sections: [...editForm.sections, newSec]
    });
  };

  const handleRemoveSection = (secId: string) => {
    if (!editForm) return;
    if (editForm.sections.length <= 1) {
      alert('Un sujet doit comporter au moins une partie ou exercice.');
      return;
    }
    setEditForm({
      ...editForm,
      sections: editForm.sections.filter(s => s.id !== secId)
    });
  };

  const handleUpdateSection = (secId: string, updates: Partial<SectionSujet>) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      sections: editForm.sections.map(s => (s.id === secId ? { ...s, ...updates } : s))
    });
  };

  const handleExportPDF = async () => {
    if (!activeSujet || isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfSuccess(false);

    try {
      const element = document.getElementById(`sujet-doc-${activeSujet.id}`);
      if (!element) throw new Error('Document introuvable.');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));

      const cleanTitre = activeSujet.titre.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Sujet_${activeSujet.type}_${activeSujet.discipline}_${cleanTitre}.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err: any) {
      alert('Erreur lors de la génération du PDF : ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sujets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Sujets_Evaluations_LaPerseverance_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportJsonText(text);
        setImportTab('json');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessJSONImport = () => {
    setImportError('');
    if (!importJsonText.trim()) {
      setImportError('Veuillez coller un texte JSON valide.');
      return;
    }

    const result = PedagogieImportExport.parseJSONImport(importJsonText);
    if (result.type === 'sujets' && result.sujets) {
      const newItems = result.sujets;
      onUpdateState(prev => {
        const existing = prev.sujets || [];
        const merged = [...newItems, ...existing.filter(e => !newItems.some(n => n.id === e.id))];
        return { ...prev, sujets: merged };
      });
      setSelectedId(newItems[0]?.id || selectedId);
      setIsImportModalOpen(false);
      setImportJsonText('');
      alert(`Importation réussie : ${newItems.length} sujet(s) importé(s) avec succès !`);
    } else {
      setImportError(result.error || 'Le format ne correspond pas à un sujet d\'évaluation valide.');
    }
  };

  const handleProcessRawTextImport = () => {
    setImportError('');
    if (!rawTextContent.trim()) {
      setImportError('Veuillez coller le contenu du sujet dans la zone de texte.');
      return;
    }

    const parsedSubject = PedagogieImportExport.parseRawTextSubject(rawTextContent, rawTextMeta);
    onUpdateState(prev => {
      const existing = prev.sujets || [];
      return { ...prev, sujets: [parsedSubject, ...existing] };
    });

    setSelectedId(parsedSubject.id);
    setIsImportModalOpen(false);
    setRawTextContent('');
    alert(`Sujet structuré et importé avec succès : "${parsedSubject.titre}" avec ${parsedSubject.sections.length} partie(s) !`);
  };

  const handleLoadPredefinedTemplate = (template: SujetEvaluation) => {
    const cloned: SujetEvaluation = {
      ...JSON.parse(JSON.stringify(template)),
      id: `sujet-${Date.now()}`
    };

    onUpdateState(prev => {
      const existing = prev.sujets || [];
      return { ...prev, sujets: [cloned, ...existing] };
    });

    setSelectedId(cloned.id);
    setIsImportModalOpen(false);
    alert(`Modèle officiel "${cloned.titre}" chargé avec succès !`);
  };

  const handleLoadDefaults = () => {
    if (!window.confirm('Voulez-vous restaurer tous les sujets modèles officiels par défaut ?')) return;
    onUpdateState(prev => ({
      ...prev,
      sujets: JSON.parse(JSON.stringify(MODELES_SUJETS_DEFAUT))
    }));
    setSelectedId(MODELES_SUJETS_DEFAUT[0]?.id || '');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2.5">
            <FileQuestion className="w-6 h-6 text-amber-500" />
            Modèles de Sujets d'Évaluations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Examens officiels (BEPC, Bac), Devoirs Surveillés et Interrogations écrites conformes aux programmes
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* New Subject Buttons */}
          <div className="relative inline-block group">
            <button
              onClick={() => handleCreateNew('Devoir')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Sujet</span>
            </button>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Importer des sujets ou charger des modèles"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Importer / Modèles</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Exporter tous les sujets en JSON"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={!activeSujet || isExportingPdf}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : pdfSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <FileDown className="w-4 h-4 text-amber-400" />
            )}
            <span>{pdfSuccess ? 'Téléchargé !' : 'Export PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!activeSujet}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Type Quick Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print overflow-x-auto">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterType === ''
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tous les sujets ({sujets.length})</span>
        </button>

        <button
          onClick={() => setFilterType('Examen')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterType === 'Examen'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Examens & Bac ({sujets.filter(s => s.type === 'Examen').length})</span>
        </button>

        <button
          onClick={() => setFilterType('Devoir')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterType === 'Devoir'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Devoirs Surveillés DS ({sujets.filter(s => s.type === 'Devoir').length})</span>
        </button>

        <button
          onClick={() => setFilterType('Interrogation')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterType === 'Interrogation'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Interrogations Écrites ({sujets.filter(s => s.type === 'Interrogation').length})</span>
        </button>
      </div>

      {/* Main Grid: Subject Selector & Document Render */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter & List */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par titre, matière, niveau..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterDiscipline}
                onChange={e => setFilterDiscipline(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
              >
                <option value="">Toutes les matières</option>
                {disciplinesList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={filterNiveau}
                onChange={e => setFilterNiveau(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
              >
                <option value="">Tous les niveaux</option>
                {state.parametres.niveaux.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Subjects */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredSujets.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <FileQuestion className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">Aucun sujet trouvé pour ces critères.</p>
                <button
                  onClick={handleLoadDefaults}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
                >
                  Restaurer les modèles officiels
                </button>
              </div>
            ) : (
              filteredSujets.map(s => {
                const isSelected = s.id === selectedId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            s.type === 'Examen' ? 'bg-indigo-100 text-indigo-800' :
                            s.type === 'Devoir' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.type}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {s.classeOuNiveau}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Coef {s.coefficient} • {s.duree}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mt-1 leading-snug truncate">
                          {s.titre}
                        </h4>
                        <div className="text-[11px] text-amber-700 font-medium mt-0.5 truncate">
                          {s.discipline} • {s.sections.length} partie(s) • Total /{s.baremeTotal} pts
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{s.dateEvaluation || s.anneeScolaire}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(s);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition"
                          title="Modifier le sujet"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(s.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Official Exam Sheet Document View */}
        <div className="lg:col-span-7 space-y-3">
          {activeSujet && (
            <div className="flex items-center justify-between bg-white p-2.5 px-4 rounded-xl border border-slate-200 no-print text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Options d'affichage :</span>
                {activeSujet.corrigeIndicatif && (
                  <button
                    onClick={() => setShowCorrige(!showCorrige)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      showCorrige
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {showCorrige ? 'Masquer le corrigé' : 'Afficher le corrigé indicatif'}
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                Format officiel A4 conforme Ministère
              </div>
            </div>
          )}

          {activeSujet ? (
            <div
              id={`sujet-doc-${activeSujet.id}`}
              className="bg-white border border-slate-300 rounded-xl p-8 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {/* En-tête officiel République du Niger */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
                <div className="text-left space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider">{state.parametres.ligne1}</div>
                  <div className="text-[10px] text-slate-600 uppercase">{state.parametres.ligne2}</div>
                  <div className="text-[10px] text-slate-600">{state.parametres.ligne3}</div>
                  <div className="text-xs font-black text-slate-900 uppercase font-serif mt-1">
                    {state.parametres.nomEtablissement}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-slate-800 uppercase font-serif">
                    {activeSujet.type === 'Examen' ? 'EXAMEN OFFICIEL / BLANC' : activeSujet.type === 'Devoir' ? 'DEVOIR SURVEILLÉ' : 'INTERROGATION ÉCRITE'}
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold">
                    Année Scolaire : {activeSujet.anneeScolaire}
                  </div>
                  {activeSujet.session && (
                    <div className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded inline-block text-slate-700">
                      {activeSujet.session}
                    </div>
                  )}
                </div>
              </div>

              {/* Titre de l'épreuve & métadonnées */}
              <div className="border-2 border-slate-900 rounded-lg p-3.5 mb-5 bg-slate-50/50">
                <div className="text-center mb-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">ÉPREUVE DE</div>
                  <h1 className="text-base font-serif font-black uppercase text-slate-950 tracking-wide">
                    {activeSujet.discipline}
                  </h1>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-300 text-xs text-center font-medium">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CLASSE / SÉRIE</span>
                    <span className="font-bold text-slate-900">{activeSujet.classeOuNiveau}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DURÉE</span>
                    <span className="font-bold text-slate-900">{activeSujet.duree}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">COEFFICIENT</span>
                    <span className="font-bold text-slate-900">{activeSujet.coefficient}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">BARÈME TOTAL</span>
                    <span className="font-bold text-amber-800">/{activeSujet.baremeTotal} Points</span>
                  </div>
                </div>
              </div>

              {/* Cartouche d'identification de l'élève (Pour composition) */}
              <div className="border border-slate-300 rounded p-2.5 mb-5 bg-white text-[11px] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-8 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-600">Nom et Prénom(s) du Candidat :</span>
                    <span className="text-slate-300"> ..........................................................................</span>
                  </div>
                  <div className="flex gap-4">
                    <span><span className="font-semibold text-slate-600">Matricule :</span> ...................</span>
                    <span><span className="font-semibold text-slate-600">Classe :</span> {activeSujet.classeOuNiveau}</span>
                    <span><span className="font-semibold text-slate-600">Date :</span> {activeSujet.dateEvaluation}</span>
                  </div>
                </div>

                <div className="sm:col-span-4 border-l border-slate-200 pl-3 text-center">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Note Obtenue</span>
                  <div className="text-lg font-mono font-bold text-slate-800 mt-0.5">
                    ........ / {activeSujet.baremeTotal}
                  </div>
                </div>
              </div>

              {/* Consignes officielles */}
              {activeSujet.consignes && activeSujet.consignes.length > 0 && (
                <div className="bg-amber-50/50 border-l-4 border-amber-500 p-2.5 rounded-r text-[11px] text-slate-700 italic space-y-0.5 mb-5">
                  <span className="font-bold text-amber-900 not-italic uppercase text-[10px] block">
                    Consignes importantes aux candidats :
                  </span>
                  {activeSujet.consignes.map((c, idx) => (
                    <div key={idx}>• {c}</div>
                  ))}
                </div>
              )}

              {/* Sections / Exercices */}
              <div className="space-y-6 text-xs text-slate-900 leading-relaxed">
                {activeSujet.sections.map((section, idx) => (
                  <div key={section.id || idx} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                      <h3 className="font-serif font-bold text-xs uppercase tracking-wide text-slate-950">
                        {section.titre}
                      </h3>
                      {section.points !== undefined && section.points > 0 && (
                        <span className="text-[11px] font-bold text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ({section.points} point{section.points > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>

                    <div className="whitespace-pre-line text-slate-800 pl-1 font-sans">
                      {section.contenu}
                    </div>
                  </div>
                ))}
              </div>

              {/* Corrigé Indicatif (Toggle) */}
              {showCorrige && activeSujet.corrigeIndicatif && (
                <div className="mt-8 pt-4 border-t-2 border-dashed border-emerald-500 bg-emerald-50/60 p-4 rounded-lg">
                  <div className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Corrigé Indicatif & Éléments de Réponse (Réservé aux Enseignants)
                  </div>
                  <div className="text-xs text-emerald-950 whitespace-pre-line leading-relaxed">
                    {activeSujet.corrigeIndicatif}
                  </div>
                </div>
              )}

              {/* Footer Note */}
              <div className="mt-10 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
                <span>{state.parametres.nomEtablissement} — Niamey</span>
                <span className="italic">Page 1 / 1</span>
                <span>{activeSujet.auteur ? `Auteur : ${activeSujet.auteur}` : 'Équipe Pédagogique'}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              Sélectionnez un sujet pour afficher le document complet.
            </div>
          )}
        </div>
      </div>

      {/* Modal Edition / Creation of Subject */}
      {isEditing && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-amber-500" />
                {editForm.id ? 'Édition du Sujet d\'Évaluation' : 'Créer un Nouveau Sujet'}
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Type, Discipline, Classe */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type d'évaluation :</label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value as TypeEvaluation })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-medium"
                  >
                    <option value="Examen">Examen (Blanc / Officiel / BEPC / Bac)</option>
                    <option value="Devoir">Devoir Surveillé (DS)</option>
                    <option value="Interrogation">Interrogation Écrite (Interro)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Matière / Discipline :</label>
                  <select
                    value={editForm.discipline}
                    onChange={e => setEditForm({ ...editForm, discipline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-medium"
                  >
                    {disciplinesList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classe / Niveau :</label>
                  <input
                    type="text"
                    value={editForm.classeOuNiveau}
                    onChange={e => setEditForm({ ...editForm, classeOuNiveau: e.target.value })}
                    placeholder="ex: 3e, Terminale D, 1ere A"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Titre & Auteur */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Intitulé du sujet :</label>
                  <input
                    type="text"
                    value={editForm.titre}
                    onChange={e => setEditForm({ ...editForm, titre: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Auteur / Enseignant :</label>
                  <input
                    type="text"
                    value={editForm.auteur || ''}
                    onChange={e => setEditForm({ ...editForm, auteur: e.target.value })}
                    placeholder="ex: M. Salifou"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Durée, Coef, Session, Date */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Durée :</label>
                  <input
                    type="text"
                    value={editForm.duree}
                    onChange={e => setEditForm({ ...editForm, duree: e.target.value })}
                    required
                    placeholder="ex: 2 heures"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coefficient :</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.coefficient}
                    onChange={e => setEditForm({ ...editForm, coefficient: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date d'évaluation :</label>
                  <input
                    type="date"
                    value={editForm.dateEvaluation}
                    onChange={e => setEditForm({ ...editForm, dateEvaluation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Session :</label>
                  <input
                    type="text"
                    value={editForm.session || ''}
                    onChange={e => setEditForm({ ...editForm, session: e.target.value })}
                    placeholder="ex: Session 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Exercices & Sections Manager */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Exercices / Parties de l'Épreuve ({editForm.sections.length})
                  </label>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un Exercice</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {editForm.sections.map((sec, idx) => (
                    <div key={sec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sec.titre}
                          onChange={e => handleUpdateSection(sec.id, { titre: e.target.value })}
                          placeholder="ex: Exercice 1 : Géométrie"
                          className="flex-1 px-2.5 py-1.5 font-bold text-xs rounded-lg border border-slate-300 focus:border-amber-500 outline-hidden bg-white"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] text-slate-500 font-semibold">Points :</span>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={sec.points || 0}
                            onChange={e => handleUpdateSection(sec.id, { points: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 focus:border-amber-500 outline-hidden bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(sec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Supprimer cet exercice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={4}
                        value={sec.contenu}
                        onChange={e => handleUpdateSection(sec.id, { contenu: e.target.value })}
                        placeholder="Texte et énoncé de l'exercice..."
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:border-amber-500 outline-hidden bg-white font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Corrigé indicatif optionnel */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Corrigé indicatif / Barème détaillé (Optionnel) :
                </label>
                <textarea
                  rows={3}
                  value={editForm.corrigeIndicatif || ''}
                  onChange={e => setEditForm({ ...editForm, corrigeIndicatif: e.target.value })}
                  placeholder="Éléments de réponse, démarches attendues, barème par sous-question..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  Enregistrer le Sujet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importation & Modèles Prédéfinis */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                Importer des Sujets d'Évaluations
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs for import */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setImportTab('templates')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  importTab === 'templates'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Modèles Officiels Prédéfinis</span>
              </button>

              <button
                type="button"
                onClick={() => setImportTab('rawText')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  importTab === 'rawText'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Coller du texte brut (Word / Sujet)</span>
              </button>

              <button
                type="button"
                onClick={() => setImportTab('json')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  importTab === 'json'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Fichier JSON</span>
              </button>
            </div>

            {/* TAB 1: Predefined templates gallery */}
            {importTab === 'templates' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Sélectionnez un modèle d'examen, devoir ou interrogation issu du programme officiel nigérien pour l'importer instantanément dans votre espace :
                </p>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {MODELES_SUJETS_DEFAUT.map(m => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition flex items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                            {m.type}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {m.titre}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {m.discipline} • {m.classeOuNiveau} • Coef {m.coefficient} • {m.duree} • {m.sections.length} exercices
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoadPredefinedTemplate(m)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shrink-0"
                      >
                        Charger ce modèle
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Raw text parser */}
            {importTab === 'rawText' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Collez simplement le texte d'un sujet (depuis Word, PDF ou document). L'assistant découpera automatiquement le sujet en exercices et calculera les points.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Type :</label>
                    <select
                      value={rawTextMeta.type}
                      onChange={e => setRawTextMeta({ ...rawTextMeta, type: e.target.value as TypeEvaluation })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300"
                    >
                      <option value="Examen">Examen</option>
                      <option value="Devoir">Devoir Surveillé</option>
                      <option value="Interrogation">Interrogation Écrite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Matière :</label>
                    <select
                      value={rawTextMeta.discipline}
                      onChange={e => setRawTextMeta({ ...rawTextMeta, discipline: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300"
                    >
                      {disciplinesList.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Classe :</label>
                    <input
                      type="text"
                      value={rawTextMeta.classe}
                      onChange={e => setRawTextMeta({ ...rawTextMeta, classe: e.target.value })}
                      placeholder="ex: 3e ou Tle-D"
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Coller le texte du sujet (avec Exercice 1 (4 pts), etc.) :
                  </label>
                  <textarea
                    rows={8}
                    value={rawTextContent}
                    onChange={e => setRawTextContent(e.target.value)}
                    placeholder={`Exercice 1 : Nombres et opérations (6 pts)\n1. Résoudre l'équation suivante...\n2. Développer l'expression...\n\nExercice 2 : Géométrie (14 pts)\nSoit un triangle ABC...`}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-mono focus:border-amber-500 outline-hidden bg-slate-50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleProcessRawTextImport}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                  >
                    Analyser et Importer le Sujet
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: JSON Import */}
            {importTab === 'json' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Choisir un fichier .JSON</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ou collez le JSON brut :
                  </label>
                  <textarea
                    rows={7}
                    value={importJsonText}
                    onChange={e => setImportJsonText(e.target.value)}
                    placeholder="[{ titre: '...', type: 'Examen', discipline: '...', sections: [...] }]"
                    className="w-full p-3 font-mono text-[11px] rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden bg-slate-50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleProcessJSONImport}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                  >
                    Valider le JSON
                  </button>
                </div>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
