import React, { useState, useRef } from 'react';
import { AppState, AfficheScolaire, CategorieAffiche, CibleAffiche, ThemeAffiche } from '../types';
import { StorageService } from '../services/storage';
import { MODELES_AFFICHES_DEFAUT } from '../data/modelesPedagogiques';
import {
  Megaphone,
  Plus,
  Search,
  Printer,
  Download,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Layers,
  Sparkles,
  Phone,
  Mail,
  Award,
  Tag,
  Building,
  Eye,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  state: AppState;
  onUpdateState?: ((updater: (prev: AppState) => AppState) => void) | ((newState: AppState) => void);
}

const CATEGORIES: Array<{ id: CategorieAffiche; label: string; icon: string; color: string }> = [
  { id: 'Information', label: 'Information Générale', icon: '📢', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'Urgent', label: 'Avis Urgent', icon: '🚨', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'Paiement', label: 'Frais & Paiements', icon: '💳', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'Examen', label: 'Examens & Évaluations', icon: '📝', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'Reunion', label: 'Réunion & APE', icon: '👥', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'Vacances', label: 'Congés & Vacances', icon: '🌴', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'Discipline', label: 'Discipline & Règles', icon: '⚖️', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'Culture', label: 'Événements & Sport', icon: '🏆', color: 'bg-purple-100 text-purple-800 border-purple-200' }
];

const THEMES: Record<ThemeAffiche, {
  name: string;
  primary: string;
  secondary: string;
  borderClass: string;
  headerBg: string;
  headerText: string;
  badgeBg: string;
  accentBg: string;
  accentBorder: string;
}> = {
  'navy-gold': {
    name: 'Bleu Marine & Or Prestige',
    primary: '#0f172a',
    secondary: '#d97706',
    borderClass: 'border-slate-900 ring-4 ring-amber-500/30',
    headerBg: 'bg-slate-950 text-white',
    headerText: 'text-amber-400',
    badgeBg: 'bg-amber-500 text-slate-950',
    accentBg: 'bg-slate-50',
    accentBorder: 'border-amber-400'
  },
  'emeraude': {
    name: 'Émeraude Républicain',
    primary: '#064e3b',
    secondary: '#059669',
    borderClass: 'border-emerald-900 ring-4 ring-emerald-500/20',
    headerBg: 'bg-emerald-950 text-white',
    headerText: 'text-emerald-300',
    badgeBg: 'bg-emerald-600 text-white',
    accentBg: 'bg-emerald-50/60',
    accentBorder: 'border-emerald-500'
  },
  'rubis': {
    name: 'Rubis & Alerte',
    primary: '#881337',
    secondary: '#e11d48',
    borderClass: 'border-rose-900 ring-4 ring-rose-500/20',
    headerBg: 'bg-rose-950 text-white',
    headerText: 'text-rose-300',
    badgeBg: 'bg-rose-600 text-white',
    accentBg: 'bg-rose-50/60',
    accentBorder: 'border-rose-500'
  },
  'ardoise': {
    name: 'Ardoise Institutionnelle',
    primary: '#1e293b',
    secondary: '#475569',
    borderClass: 'border-slate-800 ring-4 ring-slate-400/20',
    headerBg: 'bg-slate-900 text-white',
    headerText: 'text-slate-200',
    badgeBg: 'bg-slate-700 text-white',
    accentBg: 'bg-slate-100',
    accentBorder: 'border-slate-400'
  },
  'pourpre': {
    name: 'Pourpre Académique',
    primary: '#581c87',
    secondary: '#9333ea',
    borderClass: 'border-purple-900 ring-4 ring-purple-500/20',
    headerBg: 'bg-purple-950 text-white',
    headerText: 'text-purple-300',
    badgeBg: 'bg-purple-600 text-white',
    accentBg: 'bg-purple-50/60',
    accentBorder: 'border-purple-400'
  },
  'ambre': {
    name: 'Ambre Solaire',
    primary: '#78350f',
    secondary: '#d97706',
    borderClass: 'border-amber-900 ring-4 ring-amber-500/30',
    headerBg: 'bg-amber-950 text-white',
    headerText: 'text-amber-300',
    badgeBg: 'bg-amber-600 text-white',
    accentBg: 'bg-amber-50/60',
    accentBorder: 'border-amber-500'
  }
};

export const AffichesView: React.FC<Props> = ({ state, onUpdateState }) => {
  const affiches = state.affiches || [];
  const [selectedAfficheId, setSelectedAfficheId] = useState<string>(affiches[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');
  const [targetFilter, setTargetFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');

  // Modal editor states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAffiche, setEditingAffiche] = useState<AfficheScolaire | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Poster Editor Form state
  const [formData, setFormData] = useState<AfficheScolaire>({
    id: '',
    numeroRef: '',
    titre: '',
    sousTitre: '',
    categorie: 'Information',
    cible: 'Tous',
    classesCiblees: [],
    dateEmission: new Date().toISOString().slice(0, 10),
    dateEvenement: '',
    heureEvenement: '',
    lieuEvenement: '',
    corpsPrincipal: '',
    pointsCles: [''],
    consignesImportantes: [''],
    contactBureau: 'Secrétariat Général : (+227) 20 73 00 00 / contact@laperseverance-niamey.ne',
    signataire: 'Le Proviseur',
    nomSignataire: 'Dr. M. SOULEYMANE',
    statut: 'Publié',
    themeCouleur: 'navy-gold',
    badgeSpecial: 'COMMUNIQUÉ OFFICIEL',
    afficherLogo: true,
    afficherTampon: true
  });

  const posterPreviewRef = useRef<HTMLDivElement>(null);

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

  const selectedAffiche = affiches.find(a => a.id === selectedAfficheId) || affiches[0];

  // Filtering
  const filteredAffiches = affiches.filter(a => {
    const matchesSearch =
      searchQuery === '' ||
      a.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.sousTitre && a.sousTitre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.numeroRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.corpsPrincipal.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === 'Tous' || a.categorie === categoryFilter;
    const matchesTarget = targetFilter === 'Tous' || a.cible === targetFilter;
    const matchesStatus = statusFilter === 'Tous' || a.statut === statusFilter;

    return matchesSearch && matchesCat && matchesTarget && matchesStatus;
  });

  const handleOpenCreate = () => {
    const nextNum = String(affiches.length + 1).padStart(3, '0');
    setEditingAffiche(null);
    setFormData({
      id: `aff_${Date.now()}`,
      numeroRef: `COMMUNIQUÉ N° ${nextNum}/CSP-LP/DIR/2026`,
      titre: '',
      sousTitre: '',
      categorie: 'Information',
      cible: 'Tous',
      classesCiblees: [],
      dateEmission: new Date().toISOString().slice(0, 10),
      dateEvenement: '',
      heureEvenement: '',
      lieuEvenement: "Enceinte du Complexe Scolaire",
      corpsPrincipal: '',
      pointsCles: [''],
      consignesImportantes: [''],
      contactBureau: 'Secrétariat Général : (+227) 20 73 00 00 / 90 12 34 56',
      signataire: 'Le Proviseur',
      nomSignataire: 'Dr. M. SOULEYMANE',
      statut: 'Publié',
      themeCouleur: 'navy-gold',
      badgeSpecial: 'COMMUNIQUÉ OFFICIEL',
      afficherLogo: true,
      afficherTampon: true
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (affiche: AfficheScolaire) => {
    setEditingAffiche(affiche);
    setFormData({
      ...affiche,
      pointsCles: affiche.pointsCles && affiche.pointsCles.length > 0 ? [...affiche.pointsCles] : [''],
      consignesImportantes: affiche.consignesImportantes && affiche.consignesImportantes.length > 0 ? [...affiche.consignesImportantes] : [''],
      classesCiblees: affiche.classesCiblees ? [...affiche.classesCiblees] : []
    });
    setIsEditorOpen(true);
  };

  const handleDuplicate = (affiche: AfficheScolaire) => {
    const newId = `aff_${Date.now()}`;
    const newAffiche: AfficheScolaire = {
      ...affiche,
      id: newId,
      numeroRef: `${affiche.numeroRef} (Copie)`,
      titre: `${affiche.titre} (Copie)`,
      statut: 'Brouillon'
    };

    const newState = {
      ...state,
      affiches: [newAffiche, ...(state.affiches || [])]
    };
    saveState(newState);
    setSelectedAfficheId(newId);
    showToast(`Affiche dupliquée sous forme de brouillon.`);
  };

  const handleDelete = (id: string, titre: string) => {
    if (confirm(`Confirmer la suppression définitive de l'affiche "${titre}" ?`)) {
      const remaining = (state.affiches || []).filter(a => a.id !== id);
      const newState = {
        ...state,
        affiches: remaining
      };
      saveState(newState);
      if (selectedAfficheId === id) {
        setSelectedAfficheId(remaining[0]?.id || '');
      }
      showToast(`Affiche supprimée avec succès.`);
    }
  };

  const handleToggleStatut = (affiche: AfficheScolaire) => {
    const nextStatut: 'Publié' | 'Brouillon' | 'Archivé' =
      affiche.statut === 'Publié' ? 'Archivé' : affiche.statut === 'Archivé' ? 'Brouillon' : 'Publié';

    const newState = {
      ...state,
      affiches: (state.affiches || []).map(a => (a.id === affiche.id ? { ...a, statut: nextStatut } : a))
    };
    saveState(newState);
    showToast(`Statut mis à jour : ${nextStatut}`);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titre.trim()) {
      showToast('Le titre de l\'affiche est obligatoire.', 'error');
      return;
    }

    const cleanPointsCles = formData.pointsCles.filter(p => p.trim() !== '');
    const cleanConsignes = (formData.consignesImportantes || []).filter(c => c.trim() !== '');

    const finalAffiche: AfficheScolaire = {
      ...formData,
      pointsCles: cleanPointsCles.length > 0 ? cleanPointsCles : ['Prendre note des dispositions énoncées.'],
      consignesImportantes: cleanConsignes
    };

    let updatedAffiches = [...(state.affiches || [])];
    if (editingAffiche) {
      updatedAffiches = updatedAffiches.map(a => (a.id === editingAffiche.id ? finalAffiche : a));
    } else {
      updatedAffiches = [finalAffiche, ...updatedAffiches];
    }

    const newState = {
      ...state,
      affiches: updatedAffiches
    };

    saveState(newState);
    setSelectedAfficheId(finalAffiche.id);
    setIsEditorOpen(false);
    showToast(editingAffiche ? 'Affiche modifiée avec succès.' : 'Nouvelle affiche créée et enregistrée.');
  };

  const handleLoadDefaultModels = () => {
    if (confirm('Voulez-vous réinitialiser et recharger les 5 modèles officiels d\'affiches scolaires ?')) {
      const newState = {
        ...state,
        affiches: JSON.parse(JSON.stringify(MODELES_AFFICHES_DEFAUT))
      };
      saveState(newState);
      setSelectedAfficheId(MODELES_AFFICHES_DEFAUT[0].id);
      showToast('Modèles officiels d\'affiches rechargés.');
    }
  };

  // Printing handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export handler using jsPDF + html2canvas
  const handleExportPDF = async () => {
    if (!posterPreviewRef.current) return;
    try {
      setIsGeneratingPdf(true);
      showToast('Génération du PDF grand format en cours...', 'info');

      const canvas = await html2canvas(posterPreviewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeTitle = (selectedAffiche?.titre || 'affiche_scolaire')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 35);
      pdf.save(`affiche_${safeTitle}_2026.pdf`);
      showToast('Affiche exportée en PDF A4 avec succès.');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la génération du PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const currentTheme = selectedAffiche ? THEMES[selectedAffiche.themeCouleur] || THEMES['navy-gold'] : THEMES['navy-gold'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-medium transition-all ${
            toastMsg.type === 'error'
              ? 'bg-rose-600 text-white'
              : toastMsg.type === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toastMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-serif">Affiches & Panneau d'Affichage</h2>
              <p className="text-xs text-slate-500">
                Création, personnalisation et tirage grand format des avis, communiqués et circulaires officielles
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleLoadDefaultModels}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Charger les modèles prédéfinis"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Modèles Types ({MODELES_AFFICHES_DEFAUT.length})
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Créer une Affiche
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between no-print">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, référence ou mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:border-amber-500 outline-hidden"
          >
            <option value="Tous">Toutes Catégories</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>

          {/* Target Filter */}
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:border-amber-500 outline-hidden"
          >
            <option value="Tous">Tous Publics Cibles</option>
            <option value="Tous">Toute l'école</option>
            <option value="Parents">Parents d'élèves</option>
            <option value="Eleves">Élèves</option>
            <option value="Enseignants">Corps Enseignant</option>
            <option value="Classes">Classes Spécifiques</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:border-amber-500 outline-hidden"
          >
            <option value="Tous">Tous Statuts</option>
            <option value="Publié">Publiés</option>
            <option value="Brouillon">Brouillons</option>
            <option value="Archivé">Archivés</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left Column (List) & Right Column (High-Definition Poster Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List (Col 5) */}
        <div className="lg:col-span-5 space-y-3 no-print">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            <span>Affiches Enregistrées ({filteredAffiches.length})</span>
            <span>Sélectionner pour afficher</span>
          </div>

          {filteredAffiches.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">Aucune affiche trouvée</div>
              <p className="text-xs text-slate-500">Modifiez vos critères de recherche ou créez une nouvelle affiche.</p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Créer maintenant
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
              {filteredAffiches.map((a) => {
                const isSelected = a.id === selectedAffiche?.id;
                const catObj = CATEGORIES.find(c => c.id === a.categorie);
                const themeObj = THEMES[a.themeCouleur] || THEMES['navy-gold'];

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAfficheId(a.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-3 relative group ${
                      isSelected
                        ? 'bg-amber-50/40 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catObj?.color || 'bg-slate-100 text-slate-700'}`}>
                          {catObj?.icon} {a.categorie}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatut(a);
                          }}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition ${
                            a.statut === 'Publié'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.statut === 'Brouillon'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                          title="Cliquer pour changer le statut"
                        >
                          ● {a.statut}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">{a.numeroRef}</span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">{a.titre}</h4>
                      {a.sousTitre && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{a.sousTitre}</p>}
                    </div>

                    {/* Details pill */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {a.dateEmission}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" /> Cible : {a.cible}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(a);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                          title="Modifier l'affiche"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(a);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                          title="Dupliquer l'affiche"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(a.id, a.titre);
                          }}
                          className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition"
                          title="Supprimer l'affiche"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: High-Definition Live Poster Preview (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedAffiche ? (
            <>
              {/* Preview Action Header */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2 no-print">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Aperçu officiel de tirage :</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Format A4 / Panneau Mural
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(selectedAffiche)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Modifier
                  </button>

                  <button
                    onClick={handleExportPDF}
                    disabled={isGeneratingPdf}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" /> {isGeneratingPdf ? 'Génération...' : 'PDF'}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimer
                  </button>
                </div>
              </div>

              {/* POSTER CANVAS (A4 Ratio Frame) */}
              <div
                ref={posterPreviewRef}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all p-8 md:p-10 space-y-6 text-slate-900 relative ${currentTheme.borderClass}`}
                style={{ minHeight: '880px' }}
              >
                {/* Top Official School Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex items-start justify-between text-center gap-2">
                    <div className="w-1/3 text-left">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">RÉPUBLIQUE DU NIGER</div>
                      <div className="text-[9px] text-slate-600">Fraternité - Travail - Progrès</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">Ministère de l'Éducation Nationale</div>
                      <div className="text-[9px] text-slate-600">DREN Niamey • Ville de Niamey</div>
                    </div>

                    <div className="w-1/3 flex flex-col items-center justify-center">
                      {selectedAffiche.afficherLogo !== false && (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-serif font-black text-2xl shadow-md border-2 border-slate-900 mb-1">
                          LP
                        </div>
                      )}
                      <div className="text-xs font-black tracking-tight text-slate-900 uppercase">
                        {state.parametres.nomEtablissement || 'CSP La Persévérance'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
                        Discipline • Rigueur • Excellence
                      </div>
                    </div>

                    <div className="w-1/3 text-right">
                      <div className="text-[11px] font-bold text-slate-900 uppercase">Année Scolaire</div>
                      <div className="text-xs font-black text-amber-600">{state.parametres.anneeScolaire}</div>
                      <div className="text-[9px] text-slate-500 mt-1 font-mono">Date : {selectedAffiche.dateEmission}</div>
                      <div className="text-[9px] font-bold text-slate-700 font-mono mt-0.5">{selectedAffiche.numeroRef}</div>
                    </div>
                  </div>
                </div>

                {/* Badge & Category Ribbon */}
                <div className="flex items-center justify-center">
                  <div className={`px-5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-md flex items-center gap-2 ${currentTheme.badgeBg}`}>
                    <span>★</span>
                    <span>{selectedAffiche.badgeSpecial || 'COMMUNIQUÉ OFFICIEL'}</span>
                    <span>★</span>
                  </div>
                </div>

                {/* Main Headline & Subtitle Banner */}
                <div className={`p-6 rounded-2xl text-center space-y-2 ${currentTheme.headerBg} shadow-inner`}>
                  <h1 className={`text-xl md:text-2xl font-black uppercase font-serif tracking-tight leading-snug ${currentTheme.headerText}`}>
                    {selectedAffiche.titre}
                  </h1>
                  {selectedAffiche.sousTitre && (
                    <p className="text-xs md:text-sm text-slate-300 font-medium max-w-xl mx-auto italic">
                      « {selectedAffiche.sousTitre} »
                    </p>
                  )}
                </div>

                {/* Event Highlights Callout (Date, Time, Location) if present */}
                {(selectedAffiche.dateEvenement || selectedAffiche.heureEvenement || selectedAffiche.lieuEvenement) && (
                  <div className={`p-4 rounded-xl border-l-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold ${currentTheme.accentBg} ${currentTheme.accentBorder}`}>
                    {selectedAffiche.dateEvenement && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Date / Période</div>
                          <div className="text-slate-900">{selectedAffiche.dateEvenement}</div>
                        </div>
                      </div>
                    )}
                    {selectedAffiche.heureEvenement && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Heure / Horaires</div>
                          <div className="text-slate-900">{selectedAffiche.heureEvenement}</div>
                        </div>
                      </div>
                    )}
                    {selectedAffiche.lieuEvenement && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Lieu</div>
                          <div className="text-slate-900">{selectedAffiche.lieuEvenement}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Body Text */}
                <div className="text-sm text-slate-800 leading-relaxed font-sans text-justify space-y-3 px-2">
                  <p>{selectedAffiche.corpsPrincipal}</p>
                </div>

                {/* Key Points Section */}
                {selectedAffiche.pointsCles && selectedAffiche.pointsCles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Points Importants & Dispositions Applicables :</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-800 pl-2">
                      {selectedAffiche.pointsCles.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Important Rules / Warning Callout */}
                {selectedAffiche.consignesImportantes && selectedAffiche.consignesImportantes.length > 0 && (
                  <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 uppercase text-[11px] text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Consignes Impératives :</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-800 pl-1 text-[11px]">
                      {selectedAffiche.consignesImportantes.map((cons, idx) => (
                        <li key={idx}>{cons}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Audience Pill & Contact */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-700">Public Destinataire : </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                      {selectedAffiche.cible === 'Tous'
                        ? 'Toute la communauté éducative'
                        : selectedAffiche.cible === 'Parents'
                        ? 'Parents & Tuteurs d\'élèves'
                        : selectedAffiche.cible === 'Eleves'
                        ? 'Élèves de l\'établissement'
                        : selectedAffiche.cible === 'Enseignants'
                        ? 'Corps Enseignant'
                        : `Classes : ${selectedAffiche.classesCiblees?.join(', ') || 'Sélectionnées'}`}
                    </span>
                  </div>
                  {selectedAffiche.contactBureau && (
                    <div className="text-[10px] text-slate-500 italic">
                      {selectedAffiche.contactBureau}
                    </div>
                  )}
                </div>

                {/* Signature & Official Stamp Section */}
                <div className="pt-6 flex items-end justify-between">
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div className="font-mono">Document officiel certifié</div>
                    <div>CSP La Persévérance • Niamey</div>
                    <div className="w-24 h-5 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[9px] font-mono text-slate-500">
                      ||| |||| || |||||||
                    </div>
                  </div>

                  {/* Signatory & Round Stamp Graphic */}
                  <div className="text-center relative pr-4">
                    <div className="text-xs font-bold text-slate-800">
                      Pour la Direction de l'Établissement,
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mb-8">
                      {selectedAffiche.signataire}
                    </div>

                    {/* Official Stamp Overlay */}
                    {selectedAffiche.afficherTampon !== false && (
                      <div className="absolute -top-1 right-2 w-28 h-28 rounded-full border-2 border-dashed border-rose-600/80 text-rose-700 flex flex-col items-center justify-center p-1.5 rotate-[-12deg] pointer-events-none select-none opacity-85 shadow-xs">
                        <div className="text-[8px] font-extrabold uppercase tracking-tight text-center leading-tight">
                          RÉPUBLIQUE DU NIGER
                        </div>
                        <div className="text-[9px] font-black uppercase text-center text-rose-800 my-0.5">
                          LA PERSÉVÉRANCE
                        </div>
                        <div className="text-[7px] font-bold tracking-widest uppercase text-center">
                          ★ DIRECTION ★
                        </div>
                        <div className="text-[6px] font-mono mt-0.5">NIAMEY-NIGER</div>
                      </div>
                    )}

                    <div className="text-xs font-bold text-slate-900 font-serif border-t border-slate-300 pt-1 mt-2">
                      {selectedAffiche.nomSignataire || 'Dr. M. SOULEYMANE'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-700">Sélectionnez une affiche pour voir l'aperçu</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vous pouvez également créer une affiche sur mesure ou recharger les modèles types d'informations scolaires.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN / MODAL POSTER EDITOR */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-slate-100">
                    {editingAffiche ? 'Modifier l\'Affiche Scolaire' : 'Créer une Affiche d\'Information Scolaire'}
                  </h3>
                  <p className="text-xs text-slate-400">Édition des informations, mise en page et charte graphique</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Row 1: Ref, Category, Theme */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Numéro de Référence :</label>
                  <input
                    type="text"
                    required
                    value={formData.numeroRef}
                    onChange={(e) => setFormData({ ...formData, numeroRef: e.target.value })}
                    placeholder="Ex: COMMUNIQUÉ N° 025/CSP-LP/2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Catégorie :</label>
                  <select
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value as CategorieAffiche })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Thème Visuel & Couleurs :</label>
                  <select
                    value={formData.themeCouleur}
                    onChange={(e) => setFormData({ ...formData, themeCouleur: e.target.value as ThemeAffiche })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden bg-white"
                  >
                    {Object.entries(THEMES).map(([k, v]) => (
                      <option key={k} value={k}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Title & Subtitle */}
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grand Titre de l'Affiche (En majuscules de préférence) :</label>
                  <input
                    type="text"
                    required
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    placeholder="Ex: CALENDRIER OFFICIEL DES EXAMENS DU DEUXIÈME SEMESTRE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 font-bold text-sm outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sous-titre / Précision :</label>
                  <input
                    type="text"
                    value={formData.sousTitre || ''}
                    onChange={(e) => setFormData({ ...formData, sousTitre: e.target.value })}
                    placeholder="Ex: Session générale de rattrapage et validation des dossiers d'examen"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Row 3: Target, Badge Special, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Public Cible :</label>
                  <select
                    value={formData.cible}
                    onChange={(e) => setFormData({ ...formData, cible: e.target.value as CibleAffiche })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden bg-white"
                  >
                    <option value="Tous">Toute la communauté éducative</option>
                    <option value="Parents">Parents & Tuteurs d'élèves</option>
                    <option value="Eleves">Élèves</option>
                    <option value="Enseignants">Corps Enseignant</option>
                    <option value="Classes">Classes spécifiques</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ruban / Badge Supérieur :</label>
                  <input
                    type="text"
                    value={formData.badgeSpecial || ''}
                    onChange={(e) => setFormData({ ...formData, badgeSpecial: e.target.value })}
                    placeholder="Ex: URGENT, AVIS AUX PARENTS, EXAMEN"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Statut de l'Affiche :</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden bg-white font-semibold"
                  >
                    <option value="Publié">Publié (Affiché et actif)</option>
                    <option value="Brouillon">Brouillon (En cours de rédaction)</option>
                    <option value="Archivé">Archivé (Historique)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Event Date, Time, Location */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-700">Informations de Date, Horaires et Lieu (Optionnel) :</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">Date / Période :</label>
                    <input
                      type="text"
                      value={formData.dateEvenement || ''}
                      onChange={(e) => setFormData({ ...formData, dateEvenement: e.target.value })}
                      placeholder="Ex: Samedi 28 Mars 2026"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Heure / Horaires :</label>
                    <input
                      type="text"
                      value={formData.heureEvenement || ''}
                      onChange={(e) => setFormData({ ...formData, heureEvenement: e.target.value })}
                      placeholder="Ex: Dès 08h00 précises"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Lieu / Salle :</label>
                    <input
                      type="text"
                      value={formData.lieuEvenement || ''}
                      onChange={(e) => setFormData({ ...formData, lieuEvenement: e.target.value })}
                      placeholder="Ex: Salle Polyvalente & Pavillon Central"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Main Body Narrative */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Corps du Texte Principal (Présentation et explications) :</label>
                <textarea
                  rows={4}
                  required
                  value={formData.corpsPrincipal}
                  onChange={(e) => setFormData({ ...formData, corpsPrincipal: e.target.value })}
                  placeholder="Rédigez le texte du communiqué officiel..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden leading-relaxed text-xs"
                />
              </div>

              {/* Row 6: Dynamic Key Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Points Clés / Dispositions Particulières :</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pointsCles: [...formData.pointsCles, ''] })}
                    className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un point
                  </button>
                </div>
                {formData.pointsCles.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => {
                        const next = [...formData.pointsCles];
                        next[idx] = e.target.value;
                        setFormData({ ...formData, pointsCles: next });
                      }}
                      placeholder={`Point n° ${idx + 1}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 outline-hidden"
                    />
                    {formData.pointsCles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = formData.pointsCles.filter((_, i) => i !== idx);
                          setFormData({ ...formData, pointsCles: next });
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Row 7: Dynamic Imperative Rules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Consignes Impératives / Sanctions & Remarques :</label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        consignesImportantes: [...(formData.consignesImportantes || []), '']
                      })
                    }
                    className="text-rose-700 hover:text-rose-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une consigne
                  </button>
                </div>
                {(formData.consignesImportantes || []).map((cons, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold shrink-0">
                      !
                    </span>
                    <input
                      type="text"
                      value={cons}
                      onChange={(e) => {
                        const next = [...(formData.consignesImportantes || [])];
                        next[idx] = e.target.value;
                        setFormData({ ...formData, consignesImportantes: next });
                      }}
                      placeholder={`Consigne importante n° ${idx + 1}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-rose-200 outline-hidden bg-rose-50/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (formData.consignesImportantes || []).filter((_, i) => i !== idx);
                        setFormData({ ...formData, consignesImportantes: next });
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Row 8: Signatory & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Qualité du Signataire :</label>
                  <select
                    value={formData.signataire}
                    onChange={(e) => setFormData({ ...formData, signataire: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden bg-white"
                  >
                    <option value="Le Proviseur">Le Proviseur</option>
                    <option value="Le Censeur des Études">Le Censeur des Études</option>
                    <option value="L'Économe / Le Gestionnaire">L'Économe / Le Gestionnaire</option>
                    <option value="Le Surveillant Général">Le Surveillant Général</option>
                    <option value="Le Président de l'APE">Le Président de l'APE</option>
                    <option value="La Direction Générale">La Direction Générale</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nom du Signataire :</label>
                  <input
                    type="text"
                    value={formData.nomSignataire || ''}
                    onChange={(e) => setFormData({ ...formData, nomSignataire: e.target.value })}
                    placeholder="Ex: Dr. M. SOULEYMANE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact & Téléphone :</label>
                  <input
                    type="text"
                    value={formData.contactBureau || ''}
                    onChange={(e) => setFormData({ ...formData, contactBureau: e.target.value })}
                    placeholder="Ex: Secrétariat : (+227) 20 73 00 00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              {/* Row 9: Visual Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.afficherLogo !== false}
                    onChange={(e) => setFormData({ ...formData, afficherLogo: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-400"
                  />
                  <span className="font-medium text-slate-700">Afficher le Logo de l'École</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.afficherTampon !== false}
                    onChange={(e) => setFormData({ ...formData, afficherTampon: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-400"
                  />
                  <span className="font-medium text-slate-700">Afficher le Cachet / Tampon Officiel</span>
                </label>
              </div>

              {/* Form Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition text-xs"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-600/20 transition text-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingAffiche ? 'Mettre à jour l\'affiche' : 'Créer et publier l\'affiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
