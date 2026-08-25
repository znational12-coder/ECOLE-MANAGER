import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Paiement, Eleve } from '../types';
import { Logic } from '../services/logic';
import { StorageService } from '../services/storage';
import { HistoriqueEleveDetail } from './HistoriqueEleveDetail';
import {
  CreditCard,
  Plus,
  Printer,
  Trash2,
  CheckCircle2,
  DollarSign,
  Receipt,
  Users,
  Search,
  X,
  Check,
  Building,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';

interface Props {
  state: AppState;
  onUpdateState?: (newState: AppState) => void;
  initialMatricule?: string;
}

export const PaiementsView: React.FC<Props> = ({ state, onUpdateState, initialMatricule }) => {
  const [activeTab, setActiveTab] = useState<'recus' | 'solde' | 'detail' | 'alertes'>(
    initialMatricule ? 'detail' : 'solde'
  );
  const [selectedStudentMatricule, setSelectedStudentMatricule] = useState<string>(
    initialMatricule || (state.eleves[0]?.matricule || '')
  );

  useEffect(() => {
    if (initialMatricule) {
      setSelectedStudentMatricule(initialMatricule);
      setActiveTab('detail');
    }
  }, [initialMatricule]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterStatut, setFilterStatut] = useState<'tous' | 'a_jour' | 'en_retard' | 'solde'>('tous');

  const distinctClasses = Logic.distinctClasses(state);

  // Modal for new payment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptToPrint, setSelectedReceiptToPrint] = useState<Paiement | null>(null);

  const [paymentForm, setPaymentForm] = useState<Paiement>({
    id: '',
    matricule: state.eleves[0]?.matricule || '',
    nom: state.eleves[0]?.nom || '',
    montant: 25000,
    motif: 'Frais de Scolarité - Tranche 1',
    tranche: 'Tranche 1',
    date: new Date().toISOString().slice(0, 10),
    moyen: 'Espèces',
    mode: 'Espèces',
    anneeScolaire: state.parametres.anneeScolaire
  });

  const handleOpenAdd = (eleve?: Eleve, defaultMontant?: number, defaultMotif?: string) => {
    const student = eleve || state.eleves.find(e => e.matricule === selectedStudentMatricule) || state.eleves[0];
    const defaultAmount = defaultMontant && defaultMontant > 0 ? defaultMontant : 25000;
    const motif = defaultMotif || 'Versement Frais de Scolarité';

    setPaymentForm({
      id: `REC-${Date.now().toString().slice(-6)}`,
      matricule: student?.matricule || '',
      nom: student?.nom || '',
      classe: student?.classe || '',
      montant: defaultAmount,
      motif: motif,
      tranche: (motif.includes('Tranche 1') || motif.includes('1ère')) ? 'Tranche 1' : (motif.includes('Tranche 2') || motif.includes('2ème')) ? 'Tranche 2' : (motif.includes('Tranche 3') || motif.includes('Solde')) ? 'Tranche 3' : 'Inscription',
      date: new Date().toISOString().slice(0, 10),
      moyen: 'Espèces',
      mode: 'Espèces',
      anneeScolaire: state.parametres.anneeScolaire
    });
    setIsModalOpen(true);
  };

  const handleStudentSelectInForm = (mat: string) => {
    const student = state.eleves.find(e => e.matricule === mat);
    setPaymentForm(prev => ({
      ...prev,
      matricule: mat,
      nom: student?.nom || '',
      classe: student?.classe || ''
    }));
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.matricule || !paymentForm.montant) return;

    const student = state.eleves.find(st => st.matricule === paymentForm.matricule);
    const newPaymentRecord: Paiement = {
      ...paymentForm,
      nom: student?.nom || paymentForm.nom,
      classe: student?.classe || paymentForm.classe,
      noRecu: paymentForm.id || paymentForm.noRecu || `REC-${Date.now().toString().slice(-6)}`,
      mode: paymentForm.mode || paymentForm.moyen || 'Espèces',
      moyen: paymentForm.mode || paymentForm.moyen || 'Espèces',
      motif: paymentForm.motif || paymentForm.tranche || 'Versement Scolarité'
    };

    const newState: AppState = {
      ...state,
      paiements: [newPaymentRecord, ...(state.paiements || [])]
    };

    if (onUpdateState) {
      onUpdateState(newState);
    } else {
      StorageService.save(newState);
    }

    setIsModalOpen(false);
    setSelectedReceiptToPrint(newPaymentRecord);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm("Confirmer la suppression de ce reçu de versement ?")) {
      const newState = {
        ...state,
        paiements: (state.paiements || []).filter(p => p.id !== id && p.noRecu !== id)
      };
      if (onUpdateState) {
        onUpdateState(newState);
      } else {
        StorageService.save(newState);
      }
    }
  };

  // Compute all students financial profiles
  const allFinancialHistories = useMemo(() => {
    return Logic.getAllHistoriquesFinanciers(state);
  }, [state]);

  // Overall financial stats
  const statsOverview = useMemo(() => {
    const totalCollected = (state.paiements || [])
      .filter(p => !p.anneeScolaire || p.anneeScolaire === state.parametres.anneeScolaire)
      .reduce((s, p) => s + (Number(p.montant) || 0), 0);

    const totalDue = allFinancialHistories.reduce((s, h) => s + h.fraisTotal, 0);
    const totalOverdueMissed = allFinancialHistories.reduce((s, h) => s + h.totalEnRetard, 0);
    const nbSoldeComplet = allFinancialHistories.filter(h => h.statutGlobal === 'solde').length;
    const nbEnRetard = allFinancialHistories.filter(h => h.nbEcheancesNonRespectees > 0).length;

    return {
      totalCollected,
      totalDue,
      totalOverdueMissed,
      nbSoldeComplet,
      nbEnRetard,
      tauxRecouvrement: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0
    };
  }, [state.paiements, state.parametres.anneeScolaire, allFinancialHistories]);

  // Filtered receipts list
  const filteredPayments = useMemo(() => {
    return (state.paiements || []).filter(p => {
      const q = searchQuery.toLowerCase();
      const matchQ =
        !q ||
        (p.nom || '').toLowerCase().includes(q) ||
        (p.matricule || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.noRecu || '').toLowerCase().includes(q);

      const student = state.eleves.find(e => e.matricule === p.matricule);
      const matchC = !filterClasse || (student?.classe === filterClasse || p.classe === filterClasse);
      return matchQ && matchC;
    });
  }, [state.paiements, state.eleves, searchQuery, filterClasse]);

  // Filtered student financial histories for the balances table
  const filteredBalances = useMemo(() => {
    return allFinancialHistories.filter(h => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || h.eleve.nom.toLowerCase().includes(q) || h.eleve.matricule.toLowerCase().includes(q);
      const matchC = !filterClasse || h.eleve.classe === filterClasse;
      const matchS =
        filterStatut === 'tous' ||
        (filterStatut === 'solde' && h.statutGlobal === 'solde') ||
        (filterStatut === 'en_retard' && h.nbEcheancesNonRespectees > 0) ||
        (filterStatut === 'a_jour' && h.nbEcheancesNonRespectees === 0 && h.statutGlobal !== 'solde');

      return matchQ && matchC && matchS;
    });
  }, [allFinancialHistories, searchQuery, filterClasse, filterStatut]);

  // Students specifically with overdue installments
  const overdueStudents = useMemo(() => {
    return allFinancialHistories.filter(h => h.nbEcheancesNonRespectees > 0).sort((a, b) => b.totalEnRetard - a.totalEnRetard);
  }, [allFinancialHistories]);

  const handleOpenStudentDetail = (matricule: string) => {
    setSelectedStudentMatricule(matricule);
    setActiveTab('detail');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <CreditCard className="w-3.5 h-3.5" /> Gestion Financière & Caisse Scolaire
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Frais de Scolarité & Échéances de Paiement
          </h2>
          <p className="text-sm text-slate-500">
            Suivi individuel des versements, diagnostic des échéances non respectées et émission des reçus officiels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('solde')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'solde'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>État des Soldes</span>
            </button>

            <button
              onClick={() => setActiveTab('detail')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'detail'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Historique Détaillé Élève</span>
            </button>

            <button
              onClick={() => setActiveTab('alertes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 relative ${
                activeTab === 'alertes'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${statsOverview.nbEnRetard > 0 ? 'text-rose-500' : ''}`} />
              <span>Échéances Dépassées</span>
              {statsOverview.nbEnRetard > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  {statsOverview.nbEnRetard}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('recus')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'recus'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Journal des Reçus</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Versement</span>
          </button>
        </div>
      </div>

      {/* Global Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Encaissé</div>
          <div className="text-2xl font-serif font-bold text-emerald-700">
            {statsOverview.totalCollected.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Taux de recouvrement global : <strong className="text-slate-900">{statsOverview.tauxRecouvrement}%</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Frais Annuels Attendus</div>
          <div className="text-2xl font-serif font-bold text-slate-900">
            {statsOverview.totalDue.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Sur l'effectif des {state.eleves.length} élèves
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Élèves en Règle (Soldés)</div>
          <div className="text-2xl font-serif font-bold text-blue-700">
            {statsOverview.nbSoldeComplet} <span className="text-xs font-sans font-normal text-slate-500">/ {state.eleves.length}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {state.eleves.length > 0 ? Math.round((statsOverview.nbSoldeComplet / state.eleves.length) * 100) : 0}% de l'effectif total soldé
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${
          statsOverview.totalOverdueMissed > 0
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${statsOverview.totalOverdueMissed > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              Échéances Non Respectées
            </span>
            <ShieldAlert className={`w-4 h-4 ${statsOverview.totalOverdueMissed > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-serif font-bold ${statsOverview.totalOverdueMissed > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {statsOverview.totalOverdueMissed.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className={`text-xs mt-1 ${statsOverview.totalOverdueMissed > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500'}`}>
            {statsOverview.nbEnRetard} élève(s) en souffrance de paiement
          </div>
        </div>
      </div>

      {/* TAB 1: DETAILED STUDENT FINANCIAL PASSPORT & SCHEDULE VIEW */}
      {activeTab === 'detail' && (
        <HistoriqueEleveDetail
          state={state}
          selectedMatricule={selectedStudentMatricule}
          onSelectStudent={(mat) => setSelectedStudentMatricule(mat)}
          onOpenNewPayment={(el, amount, motif) => handleOpenAdd(el, amount, motif)}
          onPrintReceipt={(p) => setSelectedReceiptToPrint(p)}
          onDeletePayment={(id) => handleDeletePayment(id)}
        />
      )}

      {/* TAB 2: OVERDUE / MISSED INSTALLMENTS ALERT DASHBOARD */}
      {activeTab === 'alertes' && (
        <div className="space-y-4 no-print">
          <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                  Tableau de Recouvrement des Échéances Non Respectées
                </h3>
                <p className="text-xs text-rose-700 mt-1">
                  Cette vue répertorie exclusivement les élèves présentant au moins une échéance échue non réglée. Vous pouvez ouvrir leur fiche financière détaillée, leur imprimer une lettre de relance officielle ou encaisser un versement de régularisation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800">
                {overdueStudents.length} élève(s) en retard de paiement constaté
              </div>
              <div className="text-xs font-mono font-bold text-rose-700">
                Total exigible en retard : {statsOverview.totalOverdueMissed.toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-6 py-3.5">Matricule</th>
                    <th className="px-4 py-3.5">Nom et Prénoms</th>
                    <th className="px-4 py-3.5">Classe</th>
                    <th className="px-4 py-3.5">Tranches en Retard</th>
                    <th className="px-4 py-3.5 text-right">Montant en Retard</th>
                    <th className="px-4 py-3.5 text-right">Reste Total Annuel</th>
                    <th className="px-4 py-3.5">Contact Parent</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-emerald-700">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        <div className="font-bold">Excellente nouvelle !</div>
                        <div className="text-xs text-slate-500 mt-0.5">Aucune échéance n'est actuellement en retard pour l'ensemble des élèves.</div>
                      </td>
                    </tr>
                  ) : (
                    overdueStudents.map((h) => {
                      const missedTranches = h.echeances.filter(e => e.statut === 'retard_non_respecte');
                      return (
                        <tr key={h.eleve.matricule} className="hover:bg-rose-50/40 transition">
                          <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900">
                            {h.eleve.matricule}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            {h.eleve.nom}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                            {h.eleve.classe}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              {missedTranches.map(t => (
                                <div key={t.id} className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                  <span>{t.label} (+{t.joursDeRetard}j)</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-black text-rose-700 text-sm">
                            {h.totalEnRetard.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600">
                            {h.resteTotal.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {h.eleve.contactParent || '—'}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenStudentDetail(h.eleve.matricule)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Fiche & Échéancier</span>
                              </button>
                              <button
                                onClick={() => handleOpenAdd(h.eleve, h.totalEnRetard, 'Régularisation retard de paiement')}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-2xs"
                              >
                                Encaisser
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

      {/* TAB 3: GLOBAL BALANCES & INSTALLMENT OVERVIEW */}
      {activeTab === 'solde' && (
        <div className="space-y-4 no-print">
          {/* Toolbar filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un élève par nom, prénom ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterClasse}
                onChange={(e) => setFilterClasse(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 bg-white text-slate-700 font-semibold"
              >
                <option value="">Toutes les classes</option>
                {distinctClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 bg-white text-slate-700 font-semibold"
              >
                <option value="tous">Tous les statuts</option>
                <option value="en_retard">⚠️ Échéance(s) Non Respectée(s)</option>
                <option value="a_jour">✓ À jour des échéances</option>
                <option value="solde">✓ 100% Soldé</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-6 py-3.5">Matricule</th>
                    <th className="px-4 py-3.5">Nom et Prénoms</th>
                    <th className="px-4 py-3.5">Classe</th>
                    <th className="px-4 py-3.5 text-right">Frais Annuel</th>
                    <th className="px-4 py-3.5 text-right">Total Versé</th>
                    <th className="px-4 py-3.5 text-right">Solde Restant</th>
                    <th className="px-4 py-3.5">Diagnostic Échéances</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic">
                        Aucun élève ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredBalances.map((b) => (
                      <tr key={b.eleve.matricule} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {b.eleve.matricule}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {b.eleve.nom}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                          {b.eleve.classe}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-700 text-xs">
                          {b.fraisTotal.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 text-xs">
                          {b.totalPaye.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-xs">
                          {b.resteTotal === 0 ? (
                            <span className="text-emerald-700 font-bold">0 FCFA</span>
                          ) : (
                            <span className="text-rose-700 font-bold">{b.resteTotal.toLocaleString('fr-FR')} FCFA</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {b.statutGlobal === 'solde' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Soldé (100%)
                            </span>
                          ) : b.nbEcheancesNonRespectees > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {b.nbEcheancesNonRespectees} échéance(s) en retard ({b.totalEnRetard.toLocaleString('fr-FR')} F)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3" /> À jour ({b.tauxPaiement}%)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenStudentDetail(b.eleve.matricule)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1"
                              title="Voir l'historique et l'échéancier détaillé"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Historique</span>
                            </button>
                            <button
                              onClick={() => handleOpenAdd(b.eleve, b.totalEnRetard || b.resteTotal, 'Versement de scolarité')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition"
                            >
                              Encaisser
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECEIPTS REPOSITORIES */}
      {activeTab === 'recus' && (
        <div className="space-y-4 no-print">
          {/* Toolbar filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par numéro de reçu, nom d'élève ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterClasse}
                onChange={(e) => setFilterClasse(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 bg-white text-slate-700 font-semibold"
              >
                <option value="">Toutes les classes</option>
                {distinctClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-6 py-3.5">N° Reçu</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Matricule</th>
                    <th className="px-4 py-3.5">Nom de l'élève</th>
                    <th className="px-4 py-3.5">Motif / Tranche</th>
                    <th className="px-4 py-3.5">Mode</th>
                    <th className="px-4 py-3.5 text-right">Montant</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic">
                        Aucun reçu de paiement trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p, idx) => (
                      <tr key={p.id || p.noRecu || idx} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-amber-800">
                          {p.id || p.noRecu || `REC-${idx + 1}`}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{p.date}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{p.matricule}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">{p.nom}</td>
                        <td className="px-4 py-3.5 text-slate-700 text-xs">
                          {p.motif || p.tranche || 'Versement Scolarité'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {p.mode || p.moyen || 'Espèces'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                          {Number(p.montant).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedReceiptToPrint(p)}
                              title="Imprimer le reçu officiel"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenStudentDetail(p.matricule)}
                              title="Consulter l'historique complet de cet élève"
                              className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(p.id || p.noRecu || '')}
                              title="Supprimer le reçu"
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Enregistrer un versement de scolarité
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° Reçu</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-amber-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Élève bénéficiaire *</label>
                <select
                  value={paymentForm.matricule}
                  onChange={(e) => handleStudentSelectInForm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {distinctClasses.map(c => (
                    <optgroup key={c} label={`Classe: ${c}`}>
                      {Logic.studentsOfClass(state, c).map(s => (
                        <option key={s.matricule} value={s.matricule}>
                          {s.nom} ({s.matricule})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant (FCFA) *</label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    required
                    value={paymentForm.montant}
                    onChange={(e) => setPaymentForm({ ...paymentForm, montant: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mode de règlement</label>
                  <select
                    value={paymentForm.mode || paymentForm.moyen || 'Espèces'}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value, moyen: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money (Airtel / Moov)</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Virement">Virement Bancaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif / Tranche visée</label>
                <input
                  type="text"
                  placeholder="Ex: 1ère Tranche, 2ème Tranche, Solde scolarité..."
                  value={paymentForm.motif}
                  onChange={(e) => setPaymentForm({ ...paymentForm, motif: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
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
                  Valider et Imprimer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceiptToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300 print:shadow-none print:border-none print:max-w-none print:w-full">
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <h3 className="font-serif font-bold text-sm">Aperçu du Reçu Officiel</h3>
              <button onClick={() => setSelectedReceiptToPrint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-4 font-sans text-slate-900">
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-slate-300 pb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {state.parametres.nomEtablissement}
                </div>
                <div className="text-lg font-serif font-bold text-slate-950">REÇU DE PAIEMENT DE SCOLARITÉ</div>
                <div className="text-xs text-amber-800 font-mono font-bold">N° {selectedReceiptToPrint.id || selectedReceiptToPrint.noRecu}</div>
                <div className="text-[10px] text-slate-500">Année scolaire : {selectedReceiptToPrint.anneeScolaire || state.parametres.anneeScolaire}</div>
              </div>

              {/* Details */}
              <div className="text-xs space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date d'émission :</span>
                  <span className="font-mono font-bold">{selectedReceiptToPrint.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Matricule élève :</span>
                  <span className="font-mono font-bold">{selectedReceiptToPrint.matricule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nom de l'élève :</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedReceiptToPrint.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Motif du versement :</span>
                  <span className="font-medium">{selectedReceiptToPrint.motif || selectedReceiptToPrint.tranche || 'Versement scolarité'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode de règlement :</span>
                  <span className="font-medium">{selectedReceiptToPrint.mode || selectedReceiptToPrint.moyen || 'Espèces'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-800">Montant versé :</span>
                  <span className="font-mono font-black text-amber-800 text-base">
                    {Number(selectedReceiptToPrint.montant).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-start text-xs pt-4">
                <div className="text-center w-36 space-y-6">
                  <div className="font-bold text-slate-700">Le Payeur</div>
                  <div className="border-t border-dashed border-slate-300 pt-1 text-[9px] text-slate-400">Signature</div>
                </div>
                <div className="text-center w-36 space-y-6">
                  <div className="font-bold text-slate-700">Le Caissier / Économe</div>
                  <div className="border-t border-dashed border-slate-300 pt-1 text-[9px] text-slate-400">Cachet & Signature</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
              <button
                onClick={() => setSelectedReceiptToPrint(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
