import React, { useState, useMemo } from 'react';
import { AppState, Eleve, Paiement, HistoriqueFinancierEleve, EcheanceEleveDetail } from '../types';
import { Logic } from '../services/logic';
import {
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  ArrowRight,
  User,
  Phone,
  FileText,
  DollarSign,
  Search,
  ChevronRight,
  ShieldAlert,
  Send,
  Download,
  X
} from 'lucide-react';

interface Props {
  state: AppState;
  selectedMatricule?: string;
  onSelectStudent: (matricule: string) => void;
  onOpenNewPayment: (eleve: Eleve, defaultAmount?: number, defaultMotif?: string) => void;
  onPrintReceipt: (paiement: Paiement) => void;
  onDeletePayment?: (id: string) => void;
}

export const HistoriqueEleveDetail: React.FC<Props> = ({
  state,
  selectedMatricule,
  onSelectStudent,
  onOpenNewPayment,
  onPrintReceipt,
  onDeletePayment
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('');
  const [isPrintStatementOpen, setIsPrintStatementOpen] = useState(false);
  const [isRelanceModalOpen, setIsRelanceModalOpen] = useState(false);

  const distinctClasses = Logic.distinctClasses(state);

  // Default to first student if none selected
  const activeMatricule = selectedMatricule || (state.eleves.length > 0 ? state.eleves[0].matricule : '');

  // Calculate detailed financial history for the active student
  const financialHistory: HistoriqueFinancierEleve | null = useMemo(() => {
    if (!activeMatricule) return null;
    return Logic.calculerHistoriqueFinancierEleve(state, activeMatricule);
  }, [state, activeMatricule]);

  // Filtered list of students for quick switching
  const filteredStudents = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    return (state.eleves || []).filter(e => {
      const matchQ = !q || e.nom.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q);
      const matchC = !selectedClasse || e.classe === selectedClasse;
      return matchQ && matchC;
    });
  }, [state.eleves, searchFilter, selectedClasse]);

  const activeEleve = financialHistory?.eleve;

  const getStatusBadge = (ech: EcheanceEleveDetail) => {
    switch (ech.statut) {
      case 'solde_a_temps':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Soldée à temps
          </span>
        );
      case 'solde_en_retard':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Régularisée avec retard
          </span>
        );
      case 'retard_non_respecte':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Échéance Non Respectée (+{ech.joursDeRetard}j)
          </span>
        );
      case 'a_echoir':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> À échoir
          </span>
        );
    }
  };

  if (!financialHistory || !activeEleve) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-700">Aucun élève sélectionné</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Veuillez sélectionner un élève dans la liste pour consulter l'historique détaillé de ses versements et le suivi de ses échéances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom ou matricule..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
            />
          </div>

          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="">Toutes les classes</option>
            {distinctClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={activeMatricule}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-slate-900 min-w-[220px]"
          >
            {filteredStudents.map(e => (
              <option key={e.matricule} value={e.matricule}>
                {e.nom} ({e.matricule} - {e.classe})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintStatementOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Relevé Financier A4</span>
          </button>

          {financialHistory.nbEcheancesNonRespectees > 0 && (
            <button
              onClick={() => setIsRelanceModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Lettre de Relance</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewPayment(activeEleve, financialHistory.totalEnRetard || financialHistory.resteTotal, 'Régularisation tranche de scolarité')}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Encaisser un versement</span>
          </button>
        </div>
      </div>

      {/* Student Financial Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-serif text-2xl font-bold shrink-0 shadow-md">
                {activeEleve.nom.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-amber-300 font-mono text-xs font-bold tracking-wider">
                    {activeEleve.matricule}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 text-xs font-semibold">
                    Classe : {activeEleve.classe} ({activeEleve.niveau} {activeEleve.serie})
                  </span>
                  {financialHistory.statutGlobal === 'solde' && (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      ✓ Scolarité Soldée (100%)
                    </span>
                  )}
                  {financialHistory.statutGlobal === 'en_retard' && (
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      {financialHistory.nbEcheancesNonRespectees} Échéance(s) Dépassée(s)
                    </span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                  {activeEleve.nom}
                </h3>
                <div className="text-xs text-slate-300 flex flex-wrap items-center gap-4 pt-1">
                  <span>Sexe : {(activeEleve.civilite === 'Mlle' || activeEleve.civilite === 'Mme' || activeEleve.sexe === 'F') ? 'Féminin' : 'Masculin'}</span>
                  {activeEleve.dateNaissance && (
                    <span>Né(e) le : {activeEleve.dateNaissance}</span>
                  )}
                  {(activeEleve.contactParent || activeEleve.telParent1 || activeEleve.telParent2) && (
                    <span className="flex items-center gap-1 text-amber-200">
                      <Phone className="w-3 h-3" /> Contact Parent : {activeEleve.contactParent || activeEleve.telParent1 || activeEleve.telParent2}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Balance Status */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-black/20 p-3.5 rounded-xl border border-white/10 shrink-0">
              <div className="text-right px-3 border-r border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Versé</div>
                <div className="text-lg font-mono font-bold text-emerald-400">
                  {financialHistory.totalPaye.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[10px] text-slate-300">{financialHistory.tauxPaiement}% réglé</div>
              </div>
              <div className="text-right px-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Solde Restant</div>
                <div className="text-lg font-mono font-bold text-rose-400">
                  {financialHistory.resteTotal.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[10px] text-slate-300">sur {financialHistory.fraisTotal.toLocaleString('fr-FR')} FCFA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar of Payment */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              Progression du règlement annuel
            </span>
            <span className="font-mono text-slate-900 font-bold">
              {financialHistory.totalPaye.toLocaleString('fr-FR')} / {financialHistory.fraisTotal.toLocaleString('fr-FR')} FCFA ({financialHistory.tauxPaiement}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                financialHistory.tauxPaiement === 100
                  ? 'bg-emerald-600'
                  : financialHistory.tauxPaiement >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${financialHistory.tauxPaiement}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Frais Scolarité</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-slate-900">
            {financialHistory.fraisTotal.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Année {state.parametres.anneeScolaire}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Montant Encaissé</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700">
            {financialHistory.totalPaye.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{financialHistory.paiements.length} reçu(s) émis</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Reste à Régulariser</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`text-2xl font-serif font-bold ${financialHistory.resteTotal === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
            {financialHistory.resteTotal.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {financialHistory.resteTotal === 0 ? 'Compte parfaitement soldé' : 'Solde débiteur'}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${
          financialHistory.totalEnRetard > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${financialHistory.totalEnRetard > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              Échéances Non Respectées
            </span>
            <ShieldAlert className={`w-4 h-4 ${financialHistory.totalEnRetard > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-serif font-bold ${financialHistory.totalEnRetard > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {financialHistory.totalEnRetard.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className={`text-xs mt-1 ${financialHistory.totalEnRetard > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500'}`}>
            {financialHistory.totalEnRetard > 0
              ? `${financialHistory.nbEcheancesNonRespectees} tranche(s) en souffrance`
              : 'Aucun retard constaté'}
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner if applicable */}
      {financialHistory.totalEnRetard > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Alerte de recouvrement : Échéances non respectées
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Cet élève a accumulé un montant exigible en retard de <strong className="font-mono">{financialHistory.totalEnRetard.toLocaleString('fr-FR')} FCFA</strong> sur les tranches dont la date limite est échue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRelanceModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Générer Lettre de Relance</span>
            </button>
            <button
              onClick={() => onOpenNewPayment(activeEleve, financialHistory.totalEnRetard, 'Régularisation échéance en retard')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Régulariser</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: ÉCHÉANCIER & SUIVI DÉTAILLÉ DES ÉCHÉANCES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <h3 className="font-serif font-bold text-slate-900 text-base">
              Échéancier Officiel & Diagnostic des Échéances
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Découpage réglementaire en 3 tranches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-6 py-3.5">Tranche & Désignation</th>
                <th className="px-4 py-3.5">Date Limite</th>
                <th className="px-4 py-3.5 text-right">Montant Fixé</th>
                <th className="px-4 py-3.5 text-right">Montant Versé</th>
                <th className="px-4 py-3.5 text-right">Reste sur Tranche</th>
                <th className="px-4 py-3.5">Statut de l'Échéance</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialHistory.echeances.map((ech) => {
                const isOverdue = ech.statut === 'retard_non_respecte';
                return (
                  <tr key={ech.id} className={`transition ${isOverdue ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-xs">{ech.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Tranche N° {ech.numero}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {ech.dateLimite}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-800 text-xs">
                      {ech.montantTranche.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-emerald-700 text-xs">
                      {ech.montantPayeAttribue.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-xs">
                      {ech.montantResteTranche === 0 ? (
                        <span className="text-emerald-700">0 FCFA</span>
                      ) : isOverdue ? (
                        <span className="text-rose-700 font-black">{ech.montantResteTranche.toLocaleString('fr-FR')} FCFA</span>
                      ) : (
                        <span className="text-slate-700">{ech.montantResteTranche.toLocaleString('fr-FR')} FCFA</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(ech)}
                      {ech.dateDernierVersement && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Réglé le : {ech.dateDernierVersement}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ech.montantResteTranche > 0 ? (
                        <button
                          onClick={() => onOpenNewPayment(activeEleve, ech.montantResteTranche, `Paiement ${ech.label}`)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold transition shadow-2xs"
                        >
                          Encaisser Tranche
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Soldé
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: JOURNAL CHRONOLOGIQUE DES VERSEMENTS EFFECTUÉS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-700" />
            <h3 className="font-serif font-bold text-slate-900 text-base">
              Historique Chronologique des Reçus de Versement
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {financialHistory.paiements.length} versement(s) au total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-6 py-3.5">N° Reçu</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Motif / Tranche</th>
                <th className="px-4 py-3.5">Mode de Paiement</th>
                <th className="px-4 py-3.5">Observation / Référence</th>
                <th className="px-4 py-3.5 text-right">Montant Versé</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialHistory.paiements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                    Aucun versement n'a encore été enregistré pour cet élève pour l'année scolaire en cours.
                  </td>
                </tr>
              ) : (
                financialHistory.paiements.map((p, idx) => (
                  <tr key={p.id || p.noRecu || idx} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-amber-800">
                      {p.id || p.noRecu || `REC-${idx + 1}`}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{p.date}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 text-xs">
                      {p.motif || p.tranche || 'Versement de scolarité'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {p.mode || p.moyen || 'Espèces'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {p.observation || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 text-sm">
                      {Number(p.montant).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onPrintReceipt(p)}
                          title="Imprimer ce reçu"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {onDeletePayment && (p.id || p.noRecu) && (
                          <button
                            onClick={() => onDeletePayment(p.id || p.noRecu || '')}
                            title="Supprimer ce reçu"
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / PRINTABLE OFFICIAL FINANCIAL STATEMENT (RELEVÉ FINANCIER ÉLÈVE) */}
      {isPrintStatementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-y-auto max-h-[90vh] border border-slate-300 print:shadow-none print:border-none print:max-w-none print:w-full print:max-h-none print:overflow-visible">
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print sticky top-0 z-10">
              <h3 className="font-serif font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                Aperçu du Relevé Financier & Échéancier de Scolarité
              </h3>
              <button onClick={() => setIsPrintStatementOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 text-slate-900 font-sans print:p-0">
              {/* Header */}
              <div className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4">
                <div className="text-[10px] text-slate-700 leading-tight space-y-0.5">
                  <div className="font-bold">{state.parametres.ligne1 || 'RÉPUBLIQUE DU NIGER'}</div>
                  <div>{state.parametres.ligne2 || "MINISTÈRE DE L'ÉDUCATION NATIONALE"}</div>
                  <div>{state.parametres.ligne3 || 'D.R.E.N NIAMEY'}</div>
                  <div className="font-bold text-slate-900 pt-1">{state.parametres.ville || 'Niamey'}</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xs font-serif font-bold text-slate-900 uppercase">
                    {state.parametres.nomEtablissement}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Service Comptabilité & Recouvrement</div>
                </div>

                <div className="text-right text-[10px] text-slate-700 space-y-0.5">
                  <div>Année Scolaire : <strong className="font-mono">{state.parametres.anneeScolaire}</strong></div>
                  <div>Date du relevé : <strong className="font-mono">{new Date().toLocaleDateString('fr-FR')}</strong></div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h2 className="text-lg font-serif font-black tracking-wide text-slate-950 uppercase border-y border-slate-300 py-1.5 bg-slate-50">
                  RELEVÉ DE COMPTE FINANCIER & ÉCHÉANCIER ÉLÈVE
                </h2>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div>Matricule : <span className="font-mono font-bold text-slate-900">{activeEleve.matricule}</span></div>
                  <div>Nom & Prénoms : <strong className="uppercase text-slate-950">{activeEleve.nom}</strong></div>
                  <div>Classe : <span className="font-semibold text-slate-800">{activeEleve.classe}</span> ({activeEleve.niveau} {activeEleve.serie})</div>
                </div>
                <div className="space-y-1">
                  <div>Frais Annuels : <strong className="font-mono">{financialHistory.fraisTotal.toLocaleString('fr-FR')} FCFA</strong></div>
                  <div>Total Versé : <strong className="font-mono text-emerald-800">{financialHistory.totalPaye.toLocaleString('fr-FR')} FCFA</strong></div>
                  <div>Solde Dû : <strong className="font-mono text-rose-800">{financialHistory.resteTotal.toLocaleString('fr-FR')} FCFA</strong></div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. État d'Exécution de l'Échéancier de Paiement
                </div>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Tranche</th>
                      <th className="p-2 border-r border-slate-300">Date Limite</th>
                      <th className="p-2 border-r border-slate-300 text-right">Montant Fixé</th>
                      <th className="p-2 border-r border-slate-300 text-right">Montant Réglé</th>
                      <th className="p-2 border-r border-slate-300 text-right">Reste Dû</th>
                      <th className="p-2">Situation / Retard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {financialHistory.echeances.map((ech) => (
                      <tr key={ech.id}>
                        <td className="p-2 border-r border-slate-300 font-semibold">{ech.label}</td>
                        <td className="p-2 border-r border-slate-300 font-mono">{ech.dateLimite}</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-right">{ech.montantTranche.toLocaleString('fr-FR')} FCFA</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-right">{ech.montantPayeAttribue.toLocaleString('fr-FR')} FCFA</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-right font-bold">
                          {ech.montantResteTranche === 0 ? '0 FCFA' : `${ech.montantResteTranche.toLocaleString('fr-FR')} FCFA`}
                        </td>
                        <td className="p-2 font-semibold">
                          {ech.statut === 'solde_a_temps' && <span className="text-emerald-700">✓ Soldé à temps</span>}
                          {ech.statut === 'solde_en_retard' && <span className="text-amber-700">✓ Régularisé avec retard</span>}
                          {ech.statut === 'retard_non_respecte' && <span className="text-rose-700 font-bold">⚠️ ÉCHÉANCE DÉPASSÉE (+{ech.joursDeRetard} jours)</span>}
                          {ech.statut === 'a_echoir' && <span className="text-blue-700">À échoir</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payments History Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Historique des Versements Encaissés
                </div>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">N° Reçu</th>
                      <th className="p-2 border-r border-slate-300">Date</th>
                      <th className="p-2 border-r border-slate-300">Tranche / Motif</th>
                      <th className="p-2 border-r border-slate-300">Mode</th>
                      <th className="p-2 text-right">Montant Versé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {financialHistory.paiements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                          Aucun versement n'a été enregistré à ce jour.
                        </td>
                      </tr>
                    ) : (
                      financialHistory.paiements.map((p, idx) => (
                        <tr key={p.id || idx}>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold">{p.id || p.noRecu || `REC-${idx + 1}`}</td>
                          <td className="p-2 border-r border-slate-300 font-mono">{p.date}</td>
                          <td className="p-2 border-r border-slate-300">{p.motif || p.tranche || 'Versement de scolarité'}</td>
                          <td className="p-2 border-r border-slate-300">{p.mode || p.moyen || 'Espèces'}</td>
                          <td className="p-2 font-mono font-bold text-right text-emerald-800">
                            {Number(p.montant).toLocaleString('fr-FR')} FCFA
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                    <tr>
                      <td colSpan={4} className="p-2 text-right">TOTAL GÉNÉRAL ENCAISSÉ :</td>
                      <td className="p-2 font-mono text-right text-emerald-900 font-black">
                        {financialHistory.totalPaye.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Overdue Summary Callout */}
              {financialHistory.totalEnRetard > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 font-semibold space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800 uppercase">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Notification d'impayé sur échéances échues :
                  </div>
                  <div>
                    Le montant exigible en retard à régulariser d'urgence s'élève à <strong>{financialHistory.totalEnRetard.toLocaleString('fr-FR')} FCFA</strong>. Prière de vous rapprocher de l'intendance sans délai.
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between items-start text-xs pt-8">
                <div className="text-center w-48 space-y-8">
                  <div className="font-bold text-slate-800">Le Parent / Tuteur Légal</div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
                    Signature précédée de la mention "Lu et approuvé"
                  </div>
                </div>

                <div className="text-center w-48 space-y-8">
                  <div className="font-bold text-slate-800">Le Service de l'Intendance / Caisse</div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
                    Cachet et Signature
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
              <button
                onClick={() => setIsPrintStatementOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le relevé officiel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LETTRE DE RELANCE D'IMPAYÉ */}
      {isRelanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-300 print:shadow-none print:border-none print:max-w-none print:w-full">
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
              <h3 className="font-serif font-bold text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-rose-400" />
                Lettre Officielle de Relance de Paiement
              </h3>
              <button onClick={() => setIsRelanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 text-slate-900 font-sans print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div className="text-[10px] text-slate-700 space-y-0.5">
                  <div className="font-bold">{state.parametres.nomEtablissement}</div>
                  <div>Service Financier & Recouvrement</div>
                  <div>{state.parametres.ville || 'Niamey'}</div>
                </div>
                <div className="text-right text-[10px] text-slate-700">
                  <div>Date : {new Date().toLocaleDateString('fr-FR')}</div>
                  <div>Réf : REL-{activeEleve.matricule}-{new Date().getFullYear()}</div>
                </div>
              </div>

              {/* Recipient */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">À l'attention des Parents / Tuteur de l'élève :</div>
                <div className="text-sm font-serif font-bold text-slate-950 uppercase">{activeEleve.nom}</div>
                <div className="text-slate-600">Matricule : {activeEleve.matricule} — Classe : {activeEleve.classe}</div>
                {(activeEleve.contactParent || activeEleve.telParent1 || activeEleve.telParent2) && (
                  <div className="text-slate-600">Téléphone : {activeEleve.contactParent || activeEleve.telParent1 || activeEleve.telParent2}</div>
                )}
              </div>

              {/* Subject */}
              <div className="border-l-4 border-rose-500 pl-3 py-1 bg-rose-50/50">
                <div className="text-xs font-bold text-rose-950 uppercase">
                  OBJET : RELANCE POUR ÉCHÉANCE(S) DE SCOLARITÉ NON RESPECTÉE(S)
                </div>
              </div>

              {/* Body */}
              <div className="text-xs text-slate-800 space-y-3 leading-relaxed">
                <p>Madame, Monsieur,</p>
                <p>
                  Sauf erreur ou omission de notre part, l'examen des comptes de scolarité de votre enfant <strong>{activeEleve.nom}</strong> (Classe de {activeEleve.classe}) fait apparaître à ce jour un retard de règlement sur les échéances fixées par l'établissement pour l'année scolaire <strong>{state.parametres.anneeScolaire}</strong>.
                </p>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900">Détail des tranches échues en souffrance :</div>
                  {financialHistory.echeances.filter(e => e.statut === 'retard_non_respecte').map(ech => (
                    <div key={ech.id} className="flex justify-between text-slate-700 pl-2 border-l-2 border-rose-400">
                      <span>{ech.label} (Échéance du {ech.dateLimite}) :</span>
                      <span className="font-mono font-bold text-rose-700">{ech.montantResteTranche.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-950 pt-2 border-t border-slate-200">
                    <span>MONTANT TOTAL EXIGIBLE EN RETARD :</span>
                    <span className="font-mono text-rose-700 text-sm">{financialHistory.totalEnRetard.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <p>
                  Nous vous prions de bien vouloir régulariser cette situation auprès de la caisse de l'établissement dans un délai de <strong>8 jours francs</strong> à compter de la réception de la présente.
                </p>
                <p>
                  Comptant sur votre franche collaboration pour la continuité pédagogique de l'élève, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.
                </p>
              </div>

              {/* Signature */}
              <div className="pt-6 flex justify-end text-xs">
                <div className="text-center w-52 space-y-8">
                  <div className="font-bold text-slate-900">La Direction de l'Établissement</div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-400">
                    Signature & Sceau Officiel
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
              <button
                onClick={() => setIsRelanceModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la lettre de relance</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
