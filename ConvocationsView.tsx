import React, { useState, useRef } from 'react';
import { AppState, ConvocationParent } from '../types';
import { MOTIFS_PREDEFINIS_CONVOCATION, MODELES_CONVOCATIONS_DEFAUT, PedagogieImportExport } from '../data/modelesPedagogiques';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Mail,
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
  Clock,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  Building,
  FileText,
  Sparkles,
  RefreshCw,
  Loader2,
  X,
  Send,
  HelpCircle
} from 'lucide-react';

interface Props {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const ConvocationsView: React.FC<Props> = ({ state, onUpdateState }) => {
  const convocations = state.convocations || MODELES_CONVOCATIONS_DEFAUT;
  const [selectedId, setSelectedId] = useState<string>(convocations[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterClasse, setFilterClasse] = useState<string>('');

  // Modals & Editing
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<ConvocationParent | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  // PDF Export
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active item
  const activeConvocation = convocations.find(c => c.id === selectedId) || convocations[0];

  // Distinct classes for filter
  const distinctClasses: string[] = Array.from(new Set<string>(state.eleves.map(e => e.classe))).sort();

  // Filtered list
  const filteredConvocations = convocations.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      c.nomEleve.toLowerCase().includes(q) ||
      c.matricule.toLowerCase().includes(q) ||
      c.nomParent.toLowerCase().includes(q) ||
      c.motif.toLowerCase().includes(q) ||
      c.classe.toLowerCase().includes(q);
    const matchStatut = !filterStatut || c.statut === filterStatut;
    const matchClasse = !filterClasse || c.classe === filterClasse;
    return matchQ && matchStatut && matchClasse;
  });

  const handleCreateNew = () => {
    const firstStudent = state.eleves[0];
    const newConv: ConvocationParent = {
      id: `conv-${Date.now()}`,
      matricule: firstStudent ? firstStudent.matricule : 'TD1-001',
      nomEleve: firstStudent ? firstStudent.nom : 'Nom de l\'élève',
      classe: firstStudent ? firstStudent.classe : 'TD1',
      nomParent: 'Parents de l\'élève',
      contactParent: '+227 ',
      motif: MOTIFS_PREDEFINIS_CONVOCATION[0].titre,
      motifDetail: MOTIFS_PREDEFINIS_CONVOCATION[0].detail,
      dateRdv: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      heureRdv: '09h30',
      lieuRdv: MOTIFS_PREDEFINIS_CONVOCATION[0].lieu,
      signataire: MOTIFS_PREDEFINIS_CONVOCATION[0].signataire,
      dateEmission: new Date().toISOString().split('T')[0],
      statut: 'En attente',
      couponReconnaissance: true
    };
    setEditForm(newConv);
    setIsEditing(true);
  };

  const handleEdit = (conv: ConvocationParent) => {
    setEditForm({ ...conv });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette convocation ?')) return;
    onUpdateState(prev => {
      const updated = (prev.convocations || []).filter(c => c.id !== id);
      return { ...prev, convocations: updated };
    });
    if (selectedId === id) {
      const remaining = convocations.filter(c => c.id !== id);
      setSelectedId(remaining[0]?.id || '');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    onUpdateState(prev => {
      const currentList = prev.convocations || [];
      const exists = currentList.some(c => c.id === editForm.id);
      let updated: ConvocationParent[];
      if (exists) {
        updated = currentList.map(c => (c.id === editForm.id ? editForm : c));
      } else {
        updated = [editForm, ...currentList];
      }
      return { ...prev, convocations: updated };
    });

    setSelectedId(editForm.id);
    setIsEditing(false);
    setEditForm(null);
  };

  const handleApplyMotifPreset = (presetIndex: number) => {
    const preset = MOTIFS_PREDEFINIS_CONVOCATION[presetIndex];
    if (!preset || !editForm) return;
    setEditForm({
      ...editForm,
      motif: preset.titre,
      motifDetail: preset.detail,
      lieuRdv: preset.lieu,
      signataire: preset.signataire
    });
  };

  const handleStudentSelect = (matricule: string) => {
    const student = state.eleves.find(e => e.matricule === matricule);
    if (!student || !editForm) return;
    setEditForm({
      ...editForm,
      matricule: student.matricule,
      nomEleve: student.nom,
      classe: student.classe
    });
  };

  const handleExportPDF = async () => {
    if (!activeConvocation || isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfSuccess(false);

    try {
      const element = document.getElementById(`convocation-doc-${activeConvocation.id}`);
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

      const cleanNom = activeConvocation.nomEleve.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Convocation_${activeConvocation.matricule}_${cleanNom}.pdf`);

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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(convocations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Convocations_Parents_LaPerseverance_${new Date().toISOString().split('T')[0]}.json`);
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
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    setImportError('');
    if (!importJsonText.trim()) {
      setImportError('Veuillez coller ou importer un contenu JSON valide.');
      return;
    }

    const result = PedagogieImportExport.parseJSONImport(importJsonText);
    if (result.type === 'convocations' && result.convocations) {
      const newItems = result.convocations;
      onUpdateState(prev => {
        const existing = prev.convocations || [];
        const merged = [...newItems, ...existing.filter(e => !newItems.some(n => n.id === e.id))];
        return { ...prev, convocations: merged };
      });
      setSelectedId(newItems[0]?.id || selectedId);
      setIsImportModalOpen(false);
      setImportJsonText('');
      alert(`Importation réussie : ${newItems.length} convocation(s) importée(s) !`);
    } else {
      setImportError(result.error || 'Le fichier ne contient pas de modèle de convocation valide.');
    }
  };

  const handleLoadDefaults = () => {
    if (!window.confirm('Voulez-vous restaurer les modèles officiels de convocations par défaut ?')) return;
    onUpdateState(prev => ({
      ...prev,
      convocations: JSON.parse(JSON.stringify(MODELES_CONVOCATIONS_DEFAUT))
    }));
    setSelectedId(MODELES_CONVOCATIONS_DEFAUT[0]?.id || '');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-amber-500" />
            Convocations & Courriers aux Parents
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Génération, gestion et impression des lettres officielles de convocation avec coupon-réponse
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleCreateNew}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Convocation</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Importer des convocations ou modèles"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Importer</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Exporter la liste en JSON"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exporter</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={!activeConvocation || isExportingPdf}
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
            disabled={!activeConvocation}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Main Content: Two Columns (List + Official Document Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List & Filters */}
        <div className="lg:col-span-5 space-y-4 no-print">
          {/* Filters card */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par élève, matricule, parent..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterClasse}
                onChange={e => setFilterClasse(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
              >
                <option value="">Toutes les classes</option>
                {distinctClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterStatut}
                onChange={e => setFilterStatut(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
              >
                <option value="">Tous les statuts</option>
                <option value="En attente">En attente</option>
                <option value="Honoré">Honoré</option>
                <option value="Non honoré">Non honoré</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>
          </div>

          {/* List of Convocations */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredConvocations.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">Aucune convocation trouvée pour ces critères.</p>
                <button
                  onClick={handleLoadDefaults}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
                >
                  Charger les modèles par défaut
                </button>
              </div>
            ) : (
              filteredConvocations.map(c => {
                const isSelected = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{c.nomEleve}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {c.classe}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-700 font-medium mt-0.5 truncate">
                          {c.motif}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        c.statut === 'Honoré' ? 'bg-emerald-100 text-emerald-800' :
                        c.statut === 'En attente' ? 'bg-amber-100 text-amber-800' :
                        c.statut === 'Non honoré' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.statut}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        RDV : {c.dateRdv} à {c.heureRdv}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(c);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c.id);
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

        {/* Right Column: Official Letterhead Preview */}
        <div className="lg:col-span-7">
          {activeConvocation ? (
            <div
              id={`convocation-doc-${activeConvocation.id}`}
              className="bg-white border border-slate-300 rounded-xl p-8 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {/* En-tête officiel République du Niger */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-5">
                <div className="text-left space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider">{state.parametres.ligne1}</div>
                  <div className="text-[10px] text-slate-600 uppercase">{state.parametres.ligne2}</div>
                  <div className="text-[10px] text-slate-600">{state.parametres.ligne3}</div>
                  <div className="text-xs font-black text-slate-900 uppercase font-serif mt-1">
                    {state.parametres.nomEtablissement}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-slate-800">
                    {state.parametres.ville}, le {activeConvocation.dateEmission}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Réf : CONV-{activeConvocation.matricule}-{activeConvocation.dateEmission.slice(0, 4)}
                  </div>
                  <div className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded inline-block text-slate-700">
                    Année : {state.parametres.anneeScolaire}
                  </div>
                </div>
              </div>

              {/* Titre du document */}
              <div className="text-center my-6">
                <h1 className="text-lg font-serif font-black uppercase tracking-widest text-slate-950 inline-block border-b-2 border-slate-900 pb-1">
                  CONVOCATION DE PARENT D'ÉLÈVE
                </h1>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  (Document Administratif Officiel - À conserver et à présenter au rendez-vous)
                </div>
              </div>

              {/* Destinataire & Identité Élève */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Destinataire :</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{activeConvocation.nomParent}</div>
                  {activeConvocation.contactParent && (
                    <div className="text-slate-600 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {activeConvocation.contactParent}
                    </div>
                  )}
                </div>

                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500 font-medium">Élève concerné(e) :</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{activeConvocation.nomEleve}</div>
                  <div className="text-slate-600 mt-0.5">
                    Matricule : <span className="font-mono font-semibold">{activeConvocation.matricule}</span> | Classe : <span className="font-bold text-amber-700">{activeConvocation.classe}</span>
                  </div>
                </div>
              </div>

              {/* Corps de la lettre */}
              <div className="text-xs text-slate-800 leading-relaxed space-y-4 mb-8">
                <p>
                  Madame, Monsieur,
                </p>
                <p>
                  L'administration de l'établissement <span className="font-bold">{state.parametres.nomEtablissement}</span> vous prie de bien vouloir vous présenter personnellement à l'administration de l'école :
                </p>

                {/* Encadré Date, Heure, Lieu */}
                <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-4 my-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 w-24">Date du RDV :</span>
                    <span className="font-bold text-amber-900 text-sm">{activeConvocation.dateRdv}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 w-24">Heure précise :</span>
                    <span className="font-bold text-amber-900 text-sm">{activeConvocation.heureRdv}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 w-24">Lieu du RDV :</span>
                    <span className="font-semibold text-slate-800">{activeConvocation.lieuRdv}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 w-24">Motif :</span>
                    <span className="font-bold text-rose-800">{activeConvocation.motif}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-l-4 border-amber-500 rounded-r text-xs text-slate-700 italic">
                  « {activeConvocation.motifDetail} »
                </div>

                <p>
                  Compte tenu de l'importance de cette rencontre pour la continuité pédagogique et la discipline de l'élève, votre présence effective est indispensable.
                </p>
                <p>
                  Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-xs pt-4 mb-8">
                <div className="text-center">
                  <div className="font-bold text-slate-700 mb-12">Le Parent / Tuteur Légal</div>
                  <div className="text-[10px] text-slate-400 italic">(Date et Signature)</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-slate-900 mb-12">{activeConvocation.signataire}</div>
                  <div className="text-[10px] text-slate-500 italic">(Signature et Cachet de l'Établissement)</div>
                </div>
              </div>

              {/* Coupon-réponse détachable */}
              {activeConvocation.couponReconnaissance && (
                <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-400">
                  <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold mb-2">
                    ✂ COUPON-RÉPONSE DÉTACHABLE (À retourner signé à l'administration dès réception)
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] leading-relaxed space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span>Élève : {activeConvocation.nomEleve} ({activeConvocation.classe})</span>
                      <span>Date RDV : {activeConvocation.dateRdv} à {activeConvocation.heureRdv}</span>
                    </div>
                    <p className="text-slate-600">
                      Je soussigné(e), <span className="font-semibold text-slate-900">{activeConvocation.nomParent}</span>, confirme avoir pris connaissance de la convocation concernant mon enfant pour le motif : <span className="italic font-medium">{activeConvocation.motif}</span> et m'engage à être présent(e) au rendez-vous.
                    </p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] text-slate-500">Contact téléphonique : ............................................</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Signature du parent : ............................................</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              Sélectionnez une convocation dans la liste pour visualiser son document officiel.
            </div>
          )}
        </div>
      </div>

      {/* Modal Edition / Creation */}
      {isEditing && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-500" />
                {editForm.id ? 'Éditer la Convocation' : 'Nouvelle Convocation de Parent'}
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
              {/* Presets Quick Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Modèles de motifs administratifs prédéfinis :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIFS_PREDEFINIS_CONVOCATION.map((m, idx) => (
                    <button
                      key={m.titre}
                      type="button"
                      onClick={() => handleApplyMotifPreset(idx)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-[11px] text-slate-700 transition"
                    >
                      {m.titre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Élève & Matricule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Élève concerné :</label>
                  <select
                    value={editForm.matricule}
                    onChange={e => handleStudentSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-medium"
                  >
                    {state.eleves.map(e => (
                      <option key={e.matricule} value={e.matricule}>
                        {e.matricule} - {e.nom} ({e.classe})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom du parent / Destinataire :</label>
                  <input
                    type="text"
                    value={editForm.nomParent}
                    onChange={e => setEditForm({ ...editForm, nomParent: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone / Contact :</label>
                  <input
                    type="text"
                    value={editForm.contactParent}
                    onChange={e => setEditForm({ ...editForm, contactParent: e.target.value })}
                    placeholder="+227 90 00 00 00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut actuel :</label>
                  <select
                    value={editForm.statut}
                    onChange={e => setEditForm({ ...editForm, statut: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-medium"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Honoré">Honoré</option>
                    <option value="Non honoré">Non honoré</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

              {/* Motif & Détails */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intitulé du motif :</label>
                <input
                  type="text"
                  value={editForm.motif}
                  onChange={e => setEditForm({ ...editForm, motif: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Détails explicatifs / Justification :</label>
                <textarea
                  rows={3}
                  value={editForm.motifDetail}
                  onChange={e => setEditForm({ ...editForm, motifDetail: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden leading-relaxed"
                />
              </div>

              {/* RDV Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date du RDV :</label>
                  <input
                    type="date"
                    value={editForm.dateRdv}
                    onChange={e => setEditForm({ ...editForm, dateRdv: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heure du RDV :</label>
                  <input
                    type="text"
                    value={editForm.heureRdv}
                    onChange={e => setEditForm({ ...editForm, heureRdv: e.target.value })}
                    required
                    placeholder="ex: 10h00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu du rendez-vous :</label>
                  <input
                    type="text"
                    value={editForm.lieuRdv}
                    onChange={e => setEditForm({ ...editForm, lieuRdv: e.target.value })}
                    required
                    placeholder="ex: Bureau du Censeur"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Signataire officiel :</label>
                  <input
                    type="text"
                    value={editForm.signataire}
                    onChange={e => setEditForm({ ...editForm, signataire: e.target.value })}
                    required
                    placeholder="ex: Le Censeur des Études"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.couponReconnaissance}
                      onChange={e => setEditForm({ ...editForm, couponReconnaissance: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-semibold text-slate-700">Inclure le coupon-réponse détachable</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  Enregistrer la Convocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importation */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                Importer des Convocations / Modèles
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Vous pouvez importer un fichier <strong>.json</strong> contenant un ou plusieurs modèles de convocation, ou coller directement la structure JSON ci-dessous.
            </p>

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
                <span>Sélectionner un fichier JSON</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contenu JSON :
              </label>
              <textarea
                rows={7}
                value={importJsonText}
                onChange={e => setImportJsonText(e.target.value)}
                placeholder="[{ matricule: '...', nomEleve: '...', motif: '...', dateRdv: '...' }]"
                className="w-full p-3 font-mono text-[11px] rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden bg-slate-50"
              />
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{importError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Valider l'importation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
