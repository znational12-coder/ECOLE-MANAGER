import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppState, Eleve, AttestationScolaire, TypeAttestation } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import { MOTIFS_PREDEFINIS_ATTESTATION, ORGANISMES_PREDEFINIS_ATTESTATION } from '../data/modelesPedagogiques';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Award,
  FileCheck2,
  Printer,
  Download,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  ShieldCheck,
  QrCode,
  Sparkles,
  Layers,
  FileText,
  UserCheck,
  Calendar,
  Building,
  Stamp,
  AlertCircle,
  Copy,
  ChevronRight,
  Filter,
  Check,
  RefreshCw,
  Eye,
  Edit3
} from 'lucide-react';

interface Props {
  state: AppState;
  initialMatricule?: string;
  onUpdateState: (newState: AppState) => void;
  onNavigate?: (route: any, params?: any) => void;
}

export const AttestationsView: React.FC<Props> = ({
  state,
  initialMatricule,
  onUpdateState,
  onNavigate
}) => {
  // Navigation tabs: 'unitaire' | 'lot' | 'registre'
  const [activeTab, setActiveTab] = useState<'unitaire' | 'lot' | 'registre'>('unitaire');

  // Selected student for single certificate
  const [selectedMatricule, setSelectedMatricule] = useState<string>(
    initialMatricule || state.eleves[0]?.matricule || ''
  );

  useEffect(() => {
    if (initialMatricule) {
      setSelectedMatricule(initialMatricule);
      setActiveTab('unitaire');
    }
  }, [initialMatricule]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TypeAttestation>('Scolarite');

  // Batch generation state
  const [batchClasse, setBatchClasse] = useState<string>(state.eleves[0]?.classe || 'TD1');
  const [batchType, setBatchType] = useState<TypeAttestation>('Scolarite');
  const [batchMotif, setBatchMotif] = useState<string>('Pour servir et valoir ce que de droit');
  const [batchOrganisme, setBatchOrganisme] = useState<string>('Toute administration compétente');
  const [batchSignataire, setBatchSignataire] = useState<string>('Le Proviseur');
  const [batchNomSignataire, setBatchNomSignataire] = useState<string>('Dr. M. SOULEYMANE');

  // Certificate form values
  const currentStudent = useMemo(() => {
    return state.eleves.find(e => e.matricule === selectedMatricule) || state.eleves[0];
  }, [state.eleves, selectedMatricule]);

  const [numeroRef, setNumeroRef] = useState<string>(() => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `ATT-${new Date().getFullYear()}/${randomNum}/CSP-LP/DIR`;
  });
  const [dateDelivrance, setDateDelivrance] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [motifDestination, setMotifDestination] = useState<string>(
    'Pour servir et valoir ce que de droit'
  );
  const [organismeDestinataire, setOrganismeDestinataire] = useState<string>(
    'Toute administration compétente'
  );
  const [signataire, setSignataire] = useState<string>('Le Proviseur');
  const [nomSignataire, setNomSignataire] = useState<string>('Dr. M. SOULEYMANE');
  const [observations, setObservations] = useState<string>(
    'Élève assidu(e), ponctuel(le) et faisant preuve d\'une conduite exemplaire.'
  );
  const [mentionPaiement, setMentionPaiement] = useState<string>(
    'En règle vis-à-vis des obligations financières scolaires.'
  );
  const [nationalite, setNationalite] = useState<string>('Nigérienne');
  const [dateSortie, setDateSortie] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nouvelEtablissement, setNouvelEtablissement] = useState<string>('');

  // Visual options
  const [afficherLogo, setAfficherLogo] = useState<boolean>(true);
  const [afficherTampon, setAfficherTampon] = useState<boolean>(true);
  const [afficherFiligrane, setAfficherFiligrane] = useState<boolean>(true);
  const [afficherCodeSecurite, setAfficherCodeSecurite] = useState<boolean>(true);

  // PDF Export state
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Register of issued certificates
  const attestationsList = state.attestations || [];
  const [registreSearch, setRegistreSearch] = useState('');
  const [registreFilterType, setRegistreFilterType] = useState<string>('all');

  const distinctClasses = useMemo(() => Logic.distinctClasses(state), [state]);

  // Search filtered students for quick picker
  const filteredStudents = useMemo(() => {
    if (!searchStudentQuery.trim()) return state.eleves.slice(0, 15);
    const q = searchStudentQuery.toLowerCase().trim();
    return state.eleves.filter(
      e =>
        e.nom.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        e.classe.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [state.eleves, searchStudentQuery]);

  // Batch students of selected class
  const batchStudents = useMemo(() => {
    return state.eleves.filter(e => e.classe === batchClasse);
  }, [state.eleves, batchClasse]);

  // Auto regenerate Ref number when student or type changes
  const handleSelectStudent = (matricule: string) => {
    setSelectedMatricule(matricule);
    const stu = state.eleves.find(e => e.matricule === matricule);
    if (stu) {
      const codeType =
        selectedType === 'Scolarite'
          ? 'ATT'
          : selectedType === 'Frequentation'
          ? 'CERT'
          : selectedType === 'Inscription'
          ? 'INSC'
          : selectedType === 'Radiation'
          ? 'RAD'
          : 'SUCC';
      const rand = Math.floor(100 + Math.random() * 900);
      setNumeroRef(`${codeType}-${new Date().getFullYear()}/${rand}/CSP-LP/DIR`);
    }
  };

  const handleChangeType = (type: TypeAttestation) => {
    setSelectedType(type);
    const codeType =
      type === 'Scolarite'
        ? 'ATT'
        : type === 'Frequentation'
        ? 'CERT'
        : type === 'Inscription'
        ? 'INSC'
        : type === 'Radiation'
        ? 'RAD'
        : 'SUCC';
    const rand = Math.floor(100 + Math.random() * 900);
    setNumeroRef(`${codeType}-${new Date().getFullYear()}/${rand}/CSP-LP/DIR`);

    // Auto update default purpose and observations based on type
    if (type === 'Frequentation') {
      setMotifDestination('Dossier d\'Allocations Familiales & Prise en Charge');
      setOrganismeDestinataire('Caisse Nationale de Sécurité Sociale (CNSS)');
      setObservations('Fréquente assidûment et régulièrement les cours de l\'établissement.');
    } else if (type === 'Inscription') {
      setMotifDestination('Dossier de Bourse & Prise en Charge Employeur');
      setOrganismeDestinataire('Agence Nationale des Bourses du Niger (ANAB)');
      setObservations('Régulièrement inscrit(e) sur les registres matricules officiels.');
    } else if (type === 'Radiation') {
      setMotifDestination('Transfert d\'établissement pour cause de déménagement');
      setOrganismeDestinataire('Direction du nouvel établissement scolaire');
      setObservations('Quitte l\'établissement libre de tout engagement financier et disciplinaire.');
    } else if (type === 'Reussite') {
      setMotifDestination('Candidature aux Concours et Examens Supérieurs');
      setOrganismeDestinataire('Commissions d\'Admissibilité et d\'Orientation');
      setObservations('A satisfait à l\'ensemble des conditions pédagogiques requises avec distinction.');
    } else {
      setMotifDestination('Pour servir et valoir ce que de droit');
      setOrganismeDestinataire('Toute administration compétente');
      setObservations('Élève assidu(e), ponctuel(le) et faisant preuve d\'une conduite exemplaire.');
    }
  };

  // Save current certificate to Register
  const handleSaveToRegister = () => {
    if (!currentStudent) return;

    const newAttestation: AttestationScolaire = {
      id: `att-${Date.now()}`,
      numeroRef,
      typeAttestation: selectedType,
      matricule: currentStudent.matricule,
      nomEleve: currentStudent.nom,
      sexe: currentStudent.sexe || 'M',
      dateNaissance: currentStudent.dateNaissance || '2008-01-01',
      lieuNaissance: currentStudent.lieuNaissance || 'Niamey',
      nationalite,
      classe: currentStudent.classe,
      niveau: currentStudent.niveau,
      serie: currentStudent.serie,
      anneeScolaire: state.parametres.anneeScolaire || '2025-2026',
      dateDelivrance,
      motifDestination,
      organismeDestinataire,
      signataire,
      nomSignataire,
      observations,
      mentionPaiement,
      statutEleve: currentStudent.statutInitial || 'Passant(e)',
      dateSortie: selectedType === 'Radiation' ? dateSortie : undefined,
      nouvelEtablissement: selectedType === 'Radiation' ? nouvelEtablissement : undefined,
      afficherLogo,
      afficherTampon,
      afficherFiligrane,
      afficherCodeSecurite
    };

    const currentList = state.attestations || [];
    const updatedList = [newAttestation, ...currentList.filter(a => a.numeroRef !== numeroRef)];
    const newState = { ...state, attestations: updatedList };
    StorageService.save(newState);
    onUpdateState(newState);

    setSuccessToast(`Attestation enregistrée au registre sous le N° ${numeroRef}`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Delete certificate from Register
  const handleDeleteFromRegister = (id: string) => {
    if (!confirm('Confirmez-vous la suppression de cette attestation du registre ?')) return;
    const currentList = state.attestations || [];
    const updatedList = currentList.filter(a => a.id !== id);
    const newState = { ...state, attestations: updatedList };
    StorageService.save(newState);
    onUpdateState(newState);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export PDF Handler
  const handleExportPDF = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportProgress('Génération du document officiel PDF A4...');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      if (activeTab === 'unitaire') {
        const element = document.getElementById('attestation-a4-preview');
        if (!element) throw new Error('Élément d\'attestation introuvable.');

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(`attestation_${currentStudent?.matricule || 'scolarite'}_${currentStudent?.nom?.replace(/\s+/g, '_') || 'eleve'}.pdf`);
      } else if (activeTab === 'lot') {
        const studentElements = document.querySelectorAll('.batch-attestation-item');
        if (studentElements.length === 0) throw new Error('Aucun élève trouvé pour cette classe.');

        for (let i = 0; i < studentElements.length; i++) {
          setExportProgress(`Rendu de l'attestation ${i + 1} sur ${studentElements.length}...`);
          const el = studentElements[i] as HTMLElement;
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        pdf.save(`attestations_classe_${batchClasse}_${state.parametres.anneeScolaire}.pdf`);
      }

      setSuccessToast('Exportation PDF terminée avec succès !');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert(`Erreur lors de l'exportation PDF : ${err.message}`);
    } finally {
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  // Filtered register records
  const filteredRegister = useMemo(() => {
    return attestationsList.filter(item => {
      const matchType = registreFilterType === 'all' || item.typeAttestation === registreFilterType;
      const q = registreSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        item.nomEleve.toLowerCase().includes(q) ||
        item.matricule.toLowerCase().includes(q) ||
        item.numeroRef.toLowerCase().includes(q) ||
        item.classe.toLowerCase().includes(q);
      return matchType && matchQ;
    });
  }, [attestationsList, registreFilterType, registreSearch]);

  const getTypeBadgeLabel = (type: TypeAttestation) => {
    switch (type) {
      case 'Scolarite':
        return { label: 'Attestation de Scolarité', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'Frequentation':
        return { label: 'Certificat de Fréquentation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Inscription':
        return { label: 'Attestation d\'Inscription', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Radiation':
        return { label: 'Certificat de Radiation', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'Reussite':
        return { label: 'Attestation de Réussite', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast message */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Attestations & Certificats de Scolarité</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Officiel DREN
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Génération, personnalisation, signature officielle et impression des documents de scolarité conformes au Ministère
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{exportProgress || 'Génération PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exporter PDF (A4)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('unitaire')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'unitaire'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            Édition & Émission Unitaire
          </button>
          <button
            onClick={() => setActiveTab('lot')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'lot'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            Tirage en Lot par Classe
          </button>
          <button
            onClick={() => setActiveTab('registre')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'registre'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            Registre des Attestations ({attestationsList.length})
          </button>
        </div>

        {activeTab === 'unitaire' && (
          <button
            onClick={handleSaveToRegister}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Enregistrer dans le Registre
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UNITARY EDITION / PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'unitaire' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Customization Controls (4 cols on lg) */}
          <div className="lg:col-span-5 space-y-6 no-print">
            {/* Student Selector Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  1. Sélection de l'Élève
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {state.eleves.length} élèves inscrits
                </span>
              </div>

              {/* Student Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, matricule, classe..."
                  value={searchStudentQuery}
                  onChange={e => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick Student Results Dropdown/List */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredStudents.map(eleve => {
                  const isSelected = eleve.matricule === selectedMatricule;
                  return (
                    <button
                      key={eleve.matricule}
                      onClick={() => handleSelectStudent(eleve.matricule)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold truncate">{eleve.nom}</div>
                        <div className="text-[10px] opacity-80">
                          Matricule: {eleve.matricule} • Classe: {eleve.classe}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        isSelected ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {eleve.classe}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Type & Reference Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                2. Type de Document & Référence
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { type: 'Scolarite', label: 'Attestation de Scolarité' },
                    { type: 'Frequentation', label: 'Certificat de Fréquentation' },
                    { type: 'Inscription', label: 'Attestation d\'Inscription' },
                    { type: 'Radiation', label: 'Certificat de Radiation' },
                    { type: 'Reussite', label: 'Attestation de Réussite' }
                  ] as Array<{ type: TypeAttestation; label: string }>
                ).map(item => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleChangeType(item.type)}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-left transition border ${
                      selectedType === item.type
                        ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    N° d'Enregistrement Officiel
                  </label>
                  <input
                    type="text"
                    value={numeroRef}
                    onChange={e => setNumeroRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Date de Délivrance
                  </label>
                  <input
                    type="date"
                    value={dateDelivrance}
                    onChange={e => setDateDelivrance(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Purpose & Destination Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-600" />
                3. Destinataire & Motivations
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Motif / Formule de Délivrance
                </label>
                <div className="flex gap-1.5 mb-1.5">
                  <select
                    onChange={e => {
                      if (e.target.value) setMotifDestination(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 font-medium text-slate-700"
                  >
                    <option value="">-- Choisir un motif prédéfini --</option>
                    {MOTIFS_PREDEFINIS_ATTESTATION.map((m, idx) => (
                      <option key={idx} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={motifDestination}
                  onChange={e => setMotifDestination(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Organisme Destinataire
                </label>
                <div className="flex gap-1.5 mb-1.5">
                  <select
                    onChange={e => {
                      if (e.target.value) setOrganismeDestinataire(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 font-medium text-slate-700"
                  >
                    <option value="">-- Choisir un organisme --</option>
                    {ORGANISMES_PREDEFINIS_ATTESTATION.map((o, idx) => (
                      <option key={idx} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={organismeDestinataire}
                  onChange={e => setOrganismeDestinataire(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-amber-500"
                />
              </div>

              {selectedType === 'Radiation' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Spécificités Radiation / Transfert
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-800">
                      Date effective de sortie / radiation
                    </label>
                    <input
                      type="date"
                      value={dateSortie}
                      onChange={e => setDateSortie(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-rose-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-800">
                      Nouvel Établissement d'accueil (Optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Lycée Privé d'Excellence de Tahoua"
                      value={nouvelEtablissement}
                      onChange={e => setNouvelEtablissement(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-rose-300 bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Observations / Conduite de l'élève
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-amber-500"
                />
              </div>
            </div>

            {/* Signatures & Security Options */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-amber-600" />
                4. Signataire & Éléments d'Authenticité
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Titre Signataire</label>
                  <select
                    value={signataire}
                    onChange={e => setSignataire(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="Le Proviseur">Le Proviseur</option>
                    <option value="Le Directeur Général">Le Directeur Général</option>
                    <option value="Le Censeur des Études">Le Censeur des Études</option>
                    <option value="Le Secrétaire Général">Le Secrétaire Général</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom du Signataire</label>
                  <input
                    type="text"
                    value={nomSignataire}
                    onChange={e => setNomSignataire(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={afficherLogo}
                    onChange={e => setAfficherLogo(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Logo Établissement
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={afficherTampon}
                    onChange={e => setAfficherTampon(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Cachet Rond & Sceau
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={afficherFiligrane}
                    onChange={e => setAfficherFiligrane(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Filigrane de Sécurité
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={afficherCodeSecurite}
                    onChange={e => setAfficherCodeSecurite(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Code QR & Traçabilité
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity A4 Certificate Preview (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Document Container */}
            <div className="w-full max-w-[760px] bg-slate-300 p-2 sm:p-4 rounded-3xl shadow-md border border-slate-300">
              <div
                id="attestation-a4-preview"
                className="bg-white text-slate-900 w-full min-h-[980px] p-8 sm:p-12 rounded-2xl shadow-xl relative flex flex-col justify-between border-4 border-double border-slate-800"
                style={{
                  fontFamily: 'serif',
                  backgroundImage: afficherFiligrane
                    ? 'radial-gradient(circle, rgba(217, 119, 6, 0.03) 0%, rgba(255,255,255,0) 70%)'
                    : 'none'
                }}
              >
                {/* Security Watermark Background Text */}
                {afficherFiligrane && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
                    <span className="text-8xl font-black rotate-[-35deg] uppercase tracking-widest text-slate-900">
                      LA PERSÉVÉRANCE
                    </span>
                  </div>
                )}

                {/* Top Section: Official Header */}
                <div className="relative z-10 space-y-4">
                  {/* Republic / Ministry Banner */}
                  <div className="grid grid-cols-12 gap-2 items-center text-center pb-3 border-b-2 border-slate-900">
                    {/* Left: Ministry & District */}
                    <div className="col-span-5 text-left text-[11px] leading-tight space-y-0.5">
                      <div className="font-bold uppercase tracking-wider text-slate-900">
                        {state.parametres.ligne1 || 'RÉPUBLIQUE DU NIGER'}
                      </div>
                      <div className="text-[10px] text-slate-700 italic">
                        Fraternité - Travail - Progrès
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-slate-800 pt-0.5">
                        {state.parametres.ligne2 || "MINISTÈRE DE L'ÉDUCATION NATIONALE"}
                      </div>
                      <div className="text-[9.5px] text-slate-600">
                        {state.parametres.ligne3 || 'D.R.E.N NIAMEY / I.E.S NIAMEY III'}
                      </div>
                    </div>

                    {/* Center: School Emblem / Logo */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      {afficherLogo ? (
                        <div className="w-16 h-16 rounded-full border-2 border-amber-600 bg-amber-50 p-1 flex flex-col items-center justify-center shadow-xs text-amber-900">
                          <Award className="w-7 h-7 text-amber-700" />
                          <span className="text-[8px] font-black tracking-tighter uppercase">CSP-LP</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400">
                          SCEAU
                        </div>
                      )}
                    </div>

                    {/* Right: School Name & Info */}
                    <div className="col-span-5 text-right text-[11px] leading-tight space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs tracking-wide">
                        {state.parametres.nomEtablissement || 'COMPLEXE SCOLAIRE PRIVÉ "LA PERSÉVÉRANCE"'}
                      </div>
                      <div className="text-[10px] text-slate-700">
                        Enseignement Général & Technique
                      </div>
                      <div className="text-[9.5px] text-slate-600">
                        B.P. 11 845 Niamey — Tél : (+227) 20 73 00 00
                      </div>
                      <div className="text-[9.5px] font-semibold text-amber-900">
                        Année Scolaire : {state.parametres.anneeScolaire || '2025-2026'}
                      </div>
                    </div>
                  </div>

                  {/* Reference Number & Date Line */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                      N° {numeroRef}
                    </span>
                    <span className="text-slate-700 italic">
                      {state.parametres.ville || 'Niamey'}, le {new Date(dateDelivrance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Document Title Banner */}
                  <div className="text-center py-4 my-2">
                    <div className="inline-block relative">
                      <div className="px-8 py-2 border-y-2 border-slate-900 bg-amber-50/50">
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-slate-950 font-serif">
                          {selectedType === 'Scolarite' && 'ATTESTATION DE SCOLARITÉ'}
                          {selectedType === 'Frequentation' && 'CERTIFICAT DE FRÉQUENTATION ET D\'ASSIDUITÉ'}
                          {selectedType === 'Inscription' && 'ATTESTATION D\'INSCRIPTION FORMELLE'}
                          {selectedType === 'Radiation' && 'CERTIFICAT DE RADIATION ET DE TRANSFERT'}
                          {selectedType === 'Reussite' && 'ATTESTATION DE RÉUSSITE & PASSAGE'}
                        </h2>
                      </div>
                      <div className="text-[11px] text-slate-600 italic tracking-wider mt-1">
                        Délivrée sous le sceau de la Direction des Études
                      </div>
                    </div>
                  </div>

                  {/* Legal Body Paragraphs */}
                  <div className="text-sm text-slate-900 leading-relaxed space-y-4 pt-2 text-justify">
                    <p>
                      {signataire === 'Le Proviseur' && 'Le Proviseur soussigné'}
                      {signataire === 'Le Directeur Général' && 'Le Directeur Général soussigné'}
                      {signataire === 'Le Censeur des Études' && 'Le Censeur des Études soussigné'}
                      {signataire === 'Le Secrétaire Général' && 'Le Secrétaire Général soussigné'}
                      {' '}du Complexe Scolaire Privé « <strong className="font-semibold">LA PERSÉVÉRANCE</strong> », établissement d'enseignement secondaire et technique autorisé par arrêté ministériel, certifie et atteste que :
                    </p>

                    {/* Student Identity Card in Document */}
                    <div className="my-3 p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <span className="text-slate-500">Nom et Prénom(s) : </span>
                          <strong className="text-sm font-bold text-slate-950 uppercase">{currentStudent?.nom || '—'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Numéro Matricule : </span>
                          <strong className="font-mono font-bold text-amber-800">{currentStudent?.matricule || '—'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Né(e) le : </span>
                          <strong className="text-slate-900">
                            {currentStudent?.dateNaissance
                              ? new Date(currentStudent.dateNaissance).toLocaleDateString('fr-FR')
                              : '12 Avril 2008'}
                          </strong>
                          {' à '}
                          <strong className="text-slate-900">{currentStudent?.lieuNaissance || 'Niamey'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Sexe : </span>
                          <strong className="text-slate-900">
                            {currentStudent?.sexe === 'F' || currentStudent?.civilite === 'Mlle' || currentStudent?.civilite === 'Mme'
                              ? 'Féminin'
                              : 'Masculin'}
                          </strong>
                          {' • Nationalité : '}
                          <strong className="text-slate-900">{nationalite}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Academic Statement */}
                    {selectedType === 'Scolarite' && (
                      <p>
                        Est régulièrement inscrit(e) sur les registres matricules officiels de l'établissement et poursuit assidûment ses études pour le compte de l'année scolaire <strong className="font-bold">{state.parametres.anneeScolaire || '2025-2026'}</strong>, en classe de :
                      </p>
                    )}

                    {selectedType === 'Frequentation' && (
                      <p>
                        Fréquente avec assiduité et de manière ininterrompue les enseignements théoriques et pratiques dispensés au sein de notre établissement pour l'année scolaire <strong className="font-bold">{state.parametres.anneeScolaire || '2025-2026'}</strong>, en classe de :
                      </p>
                    )}

                    {selectedType === 'Inscription' && (
                      <p>
                        A régulièrement satisfait à l'ensemble des formalités administratives et financières d'inscription pour l'année scolaire <strong className="font-bold">{state.parametres.anneeScolaire || '2025-2026'}</strong>, au titre de la classe de :
                      </p>
                    )}

                    {selectedType === 'Radiation' && (
                      <p>
                        A été régulièrement inscrit(e) et a suivi les cours jusqu'à la date du <strong className="font-bold">{new Date(dateSortie).toLocaleDateString('fr-FR')}</strong> en classe de :
                      </p>
                    )}

                    {selectedType === 'Reussite' && (
                      <p>
                        A accompli avec succès son cursus académique au titre de l'année scolaire <strong className="font-bold">{state.parametres.anneeScolaire || '2025-2026'}</strong> en classe de :
                      </p>
                    )}

                    {/* Class Highlight Banner */}
                    <div className="text-center py-2 bg-slate-100 rounded-lg border border-slate-300">
                      <span className="text-base font-black text-slate-900 tracking-wider">
                        CLASSE DE {currentStudent?.classe?.toUpperCase() || '—'}
                      </span>
                      <span className="text-xs text-slate-600 ml-2">
                        (Niveau : {currentStudent?.niveau || 'Secondaire'} — Série : {currentStudent?.serie || 'Générale'})
                      </span>
                    </div>

                    {/* Special Observations */}
                    <div className="text-xs space-y-1 pt-1">
                      <div>
                        <span className="font-semibold text-slate-800">Observations & Conduite : </span>
                        <span className="text-slate-700">{observations}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Situation financière : </span>
                        <span className="text-slate-700">{mentionPaiement}</span>
                      </div>
                      {selectedType === 'Radiation' && nouvelEtablissement && (
                        <div>
                          <span className="font-semibold text-slate-800">Motif & Destination : </span>
                          <span className="text-slate-700">{motifDestination} (Nouvel établissement : {nouvelEtablissement})</span>
                        </div>
                      )}
                    </div>

                    {/* Final Concluding Legal Formula */}
                    <p className="pt-2 italic">
                      En foi de quoi, la présente {selectedType === 'Frequentation' || selectedType === 'Radiation' ? 'attestation' : 'attestation de scolarité'} lui est délivrée pour <strong>{motifDestination}</strong>, auprès de <strong>{organismeDestinataire}</strong>.
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Date, Signature Box, Seal & QR Code */}
                <div className="relative z-10 pt-8 mt-6 border-t border-slate-200">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    {/* Left: Security QR & Digital Seal */}
                    <div className="col-span-5 text-left space-y-1">
                      {afficherCodeSecurite && (
                        <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg w-fit">
                          <QrCode className="w-10 h-10 text-slate-800" />
                          <div className="text-[9px] leading-tight text-slate-600 font-mono">
                            <div>DOC-ID: {numeroRef.replace(/[^a-zA-Z0-9]/g, '')}</div>
                            <div>CERTIFIÉ CONFORME</div>
                            <div className="text-amber-800 font-semibold">CSP LA PERSÉVÉRANCE</div>
                          </div>
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 italic">
                        Ce document comporte des dispositifs de traçabilité et ne peut être falsifié.
                      </div>
                    </div>

                    {/* Right: Signature & Stamp Box */}
                    <div className="col-span-7 text-center relative">
                      <div className="text-xs text-slate-800 font-medium mb-1">
                        Fait à {state.parametres.ville || 'Niamey'}, le {new Date(dateDelivrance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs font-bold uppercase text-slate-900 mb-12">
                        {signataire}
                      </div>

                      {/* Official Round Stamp in blue ink */}
                      {afficherTampon && (
                        <div className="absolute right-6 bottom-4 pointer-events-none opacity-85 rotate-[-8deg]">
                          <div className="w-28 h-28 rounded-full border-4 border-dashed border-blue-700 flex flex-col items-center justify-center p-1 text-blue-800 font-serif text-center shadow-xs">
                            <span className="text-[8px] font-black tracking-widest uppercase">REP. DU NIGER</span>
                            <span className="text-[9px] font-bold uppercase px-1">CSP LA PERSÉVÉRANCE</span>
                            <span className="text-[7.5px] font-bold text-amber-700 uppercase">DIRECTION GÉNÉRALE</span>
                            <span className="text-[8px] font-mono mt-0.5">{new Date(dateDelivrance).getFullYear()}</span>
                          </div>
                        </div>
                      )}

                      <div className="text-xs font-bold text-slate-950 uppercase underline decoration-1 underline-offset-4">
                        {nomSignataire}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Helper under preview */}
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-2 no-print">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Format optimisé pour impression A4 haute résolution et archivage administratif.</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BATCH PRINTING BY CLASS (TIRAGE DE MASSE) */}
      {/* ========================================================================= */}
      {activeTab === 'lot' && (
        <div className="space-y-6">
          {/* Class Picker & Parameters Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  Génération en Lot pour une Classe Entière
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Générez et imprimez en une seule opération toutes les attestations des élèves de la classe sélectionnée.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Classe cible :</span>
                <select
                  value={batchClasse}
                  onChange={e => setBatchClasse(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-amber-50 text-slate-900 focus:border-amber-500"
                >
                  {distinctClasses.map(cls => (
                    <option key={cls} value={cls}>
                      {cls} ({state.eleves.filter(e => e.classe === cls).length} élèves)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Batch Customization Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Type d'Attestation</label>
                <select
                  value={batchType}
                  onChange={e => setBatchType(e.target.value as TypeAttestation)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Scolarite">Attestation de Scolarité Standard</option>
                  <option value="Frequentation">Certificat de Fréquentation (CNSS)</option>
                  <option value="Inscription">Attestation d'Inscription Formelle</option>
                  <option value="Reussite">Attestation de Réussite</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Motif de Délivrance</label>
                <input
                  type="text"
                  value={batchMotif}
                  onChange={e => setBatchMotif(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Signataire Officiel</label>
                <input
                  type="text"
                  value={batchNomSignataire}
                  onChange={e => setBatchNomSignataire(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-600">
                Total à générer : <strong className="text-slate-900">{batchStudents.length} attestations</strong> pour la classe de <strong>{batchClasse}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer le Lot ({batchStudents.length})
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPdf}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter tout en PDF
                </button>
              </div>
            </div>
          </div>

          {/* Batch Print Preview Stream */}
          <div className="space-y-8">
            {batchStudents.map((eleve, index) => {
              const refItem = `ATT-${new Date().getFullYear()}/${String(index + 1).padStart(3, '0')}-${batchClasse}/CSP-LP`;
              return (
                <div
                  key={eleve.matricule}
                  className="batch-attestation-item bg-white text-slate-900 w-full max-w-[760px] mx-auto min-h-[980px] p-8 sm:p-12 rounded-2xl shadow-md border-4 border-double border-slate-800 flex flex-col justify-between"
                  style={{
                    fontFamily: 'serif',
                    pageBreakAfter: 'always'
                  }}
                >
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-2 items-center text-center pb-3 border-b-2 border-slate-900">
                      <div className="col-span-5 text-left text-[11px] leading-tight space-y-0.5">
                        <div className="font-bold uppercase tracking-wider text-slate-900">
                          {state.parametres.ligne1 || 'RÉPUBLIQUE DU NIGER'}
                        </div>
                        <div className="text-[10px] text-slate-700 italic">
                          Fraternité - Travail - Progrès
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-slate-800 pt-0.5">
                          {state.parametres.ligne2 || "MINISTÈRE DE L'ÉDUCATION NATIONALE"}
                        </div>
                        <div className="text-[9.5px] text-slate-600">
                          {state.parametres.ligne3 || 'D.R.E.N NIAMEY / I.E.S NIAMEY III'}
                        </div>
                      </div>

                      <div className="col-span-2 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-full border-2 border-amber-600 bg-amber-50 p-1 flex flex-col items-center justify-center text-amber-900">
                          <Award className="w-6 h-6 text-amber-700" />
                          <span className="text-[7.5px] font-black uppercase">CSP-LP</span>
                        </div>
                      </div>

                      <div className="col-span-5 text-right text-[11px] leading-tight space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {state.parametres.nomEtablissement || 'COMPLEXE SCOLAIRE PRIVÉ "LA PERSÉVÉRANCE"'}
                        </div>
                        <div className="text-[10px] text-slate-700">
                          Enseignement Secondaire & Technique
                        </div>
                        <div className="text-[9.5px] font-semibold text-amber-900">
                          Année Scolaire : {state.parametres.anneeScolaire || '2025-2026'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        N° {refItem}
                      </span>
                      <span className="text-slate-700 italic">
                        {state.parametres.ville || 'Niamey'}, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="text-center py-3">
                      <div className="px-6 py-2 border-y-2 border-slate-900 bg-amber-50/50 inline-block">
                        <h2 className="text-xl font-black uppercase tracking-widest text-slate-950 font-serif">
                          ATTESTATION DE SCOLARITÉ
                        </h2>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="text-sm text-slate-900 leading-relaxed space-y-3 pt-1 text-justify">
                      <p>
                        {batchSignataire} soussigné du Complexe Scolaire Privé « <strong>LA PERSÉVÉRANCE</strong> », certifie que :
                      </p>

                      <div className="my-2 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs space-y-1.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Nom et Prénom : <strong className="text-sm font-bold uppercase">{eleve.nom}</strong></div>
                          <div>Matricule : <strong className="font-mono text-amber-800">{eleve.matricule}</strong></div>
                          <div>Né(e) le : <strong>{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR') : '12/04/2008'}</strong> à <strong>{eleve.lieuNaissance || 'Niamey'}</strong></div>
                          <div>Classe : <strong className="text-slate-950">{eleve.classe}</strong> ({eleve.niveau} - {eleve.serie})</div>
                        </div>
                      </div>

                      <p>
                        Est régulièrement inscrit(e) et poursuit ses études pour l'année scolaire <strong className="font-bold">{state.parametres.anneeScolaire || '2025-2026'}</strong> en classe de <strong className="font-bold">{eleve.classe}</strong>.
                      </p>

                      <p className="italic">
                        En foi de quoi, la présente attestation lui est délivrée pour <strong>{batchMotif}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-6 mt-4 border-t border-slate-200 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6 text-left">
                      <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600">
                        <QrCode className="w-8 h-8 text-slate-800" />
                        <div>DOC-ID: {refItem.replace(/[^a-zA-Z0-9]/g, '')}<br />AUTHENTIQUE & CONFORME</div>
                      </div>
                    </div>
                    <div className="col-span-6 text-center relative">
                      <div className="text-xs font-bold uppercase text-slate-900 mb-8">{batchSignataire}</div>
                      <div className="text-xs font-bold text-slate-950 uppercase">{batchNomSignataire}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REGISTER OF ISSUED CERTIFICATES */}
      {/* ========================================================================= */}
      {activeTab === 'registre' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par élève, matricule, référence N°..."
                  value={registreSearch}
                  onChange={e => setRegistreSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={registreFilterType}
                  onChange={e => setRegistreFilterType(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="all">Tous les types ({attestationsList.length})</option>
                  <option value="Scolarite">Attestation de Scolarité</option>
                  <option value="Frequentation">Certificat de Fréquentation</option>
                  <option value="Inscription">Attestation d'Inscription</option>
                  <option value="Radiation">Certificat de Radiation</option>
                  <option value="Reussite">Attestation de Réussite</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('unitaire')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle Attestation
            </button>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3.5">N° Référence</th>
                    <th className="px-4 py-3.5">Élève & Matricule</th>
                    <th className="px-4 py-3.5">Classe</th>
                    <th className="px-4 py-3.5">Type de Document</th>
                    <th className="px-4 py-3.5">Date Délivrance</th>
                    <th className="px-4 py-3.5">Motif / Organisme</th>
                    <th className="px-4 py-3.5">Signataire</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegister.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <div className="text-sm font-semibold text-slate-600">Aucune attestation trouvée</div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Enregistrez de nouvelles attestations depuis l'onglet d'édition unitaire.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRegister.map(item => {
                      const badge = getTypeBadgeLabel(item.typeAttestation);
                      return (
                        <tr key={item.id} className="hover:bg-amber-50/40 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            {item.numeroRef}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{item.nomEleve}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.matricule}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {item.classe}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {new Date(item.dateDelivrance).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                            <div className="truncate font-medium">{item.motifDestination}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.organismeDestinataire || 'Toute administration'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="font-semibold">{item.nomSignataire}</div>
                            <div className="text-[10px] text-slate-400">{item.signataire}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSelectedMatricule(item.matricule);
                                  setSelectedType(item.typeAttestation);
                                  setNumeroRef(item.numeroRef);
                                  setDateDelivrance(item.dateDelivrance);
                                  setMotifDestination(item.motifDestination);
                                  setOrganismeDestinataire(item.organismeDestinataire || 'Toute administration');
                                  setSignataire(item.signataire);
                                  setNomSignataire(item.nomSignataire);
                                  setObservations(item.observations || '');
                                  setActiveTab('unitaire');
                                }}
                                title="Ouvrir & Réimprimer"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFromRegister(item.id)}
                                title="Supprimer du registre"
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        </div>
      )}
    </div>
  );
};
