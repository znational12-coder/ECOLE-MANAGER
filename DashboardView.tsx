import React, { useState } from 'react';
import { AppState, Semestre } from '../types';
import { Logic } from '../services/logic';
import {
  Users,
  School,
  TrendingUp,
  Award,
  CreditCard,
  CalendarCheck,
  ChevronRight,
  Printer,
  ArrowUpRight,
  FileQuestion,
  Mail,
  BookOpen
} from 'lucide-react';

interface Props {
  state: AppState;
  onNavigate: (route: any, params?: any) => void;
}

export const DashboardView: React.FC<Props> = ({ state, onNavigate }) => {
  const [semestre, setSemestre] = useState<Semestre>('S1');
  const [selectedClasse, setSelectedClasse] = useState<string>('');

  const distinctClasses = Logic.distinctClasses(state);
  const classRows = Logic.dashboardParClasse(state, semestre);
  const allMats = state.eleves.map(e => e.matricule);
  const globalStats = Logic.groupStats(state, semestre, allMats);

  // Total collected
  const totalCollecte = state.paiements
    .filter(p => p.anneeScolaire === state.parametres.anneeScolaire)
    .reduce((sum, p) => sum + (Number(p.montant) || 0), 0);

  const selectedClassStudents = selectedClasse ? Logic.studentsOfClass(state, selectedClasse) : [];
  const selectedClassStats = selectedClasse ? Logic.groupStats(state, semestre, selectedClassStudents.map(e => e.matricule)) : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <School className="w-3.5 h-3.5" /> {state.parametres.nomEtablissement}
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Tableau de bord de direction</h2>
          <p className="text-sm text-slate-500">
            Année scolaire <strong>{state.parametres.anneeScolaire}</strong> • {state.parametres.ville}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Semester Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setSemestre('S1')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                semestre === 'S1'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1er Semestre
            </button>
            <button
              onClick={() => setSemestre('S2')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                semestre === 'S2'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2ème Semestre
            </button>
          </div>
        </div>
      </div>

      {/* Global Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inscrits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Élèves inscrits</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-bold text-slate-900">
            {state.eleves.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{distinctClasses.length} classes actives</span>
          </div>
        </div>

        {/* Moyenne Générale */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Moyenne Générale</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-bold text-amber-700">
            {globalStats.moyenne !== null ? `${globalStats.moyenne}/20` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Calculée sur {semestre === 'S1' ? 'le 1er' : 'le 2ème'} semestre
          </div>
        </div>

        {/* Taux de Réussite */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Taux de réussite</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-serif font-bold ${
            (globalStats.tauxReussite ?? 0) >= 50 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {globalStats.tauxReussite !== null ? `${globalStats.tauxReussite}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Seuil de passage: ≥ {state.parametres.seuilReussite}/20
          </div>
        </div>

        {/* Total Scolarité */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Frais collectés</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-slate-900 truncate">
            {totalCollecte.toLocaleString('fr-FR')} <span className="text-sm font-sans font-normal text-slate-500">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{state.paiements.length} reçus émis</span>
          </div>
        </div>
      </div>

      {/* Quick Pedagogy & Administration Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate('sujets')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Modèles de Sujets d'Évaluations</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                  {state.sujets?.length || 6} sujets
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Examens officiels (BEPC, Bac A/C/D), Devoirs Surveillés et Interrogations écrites avec barème
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition shrink-0" />
        </div>

        <div
          onClick={() => onNavigate('convocations')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Convocations des Parents</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900">
                  {state.convocations?.length || 3} lettres
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Courriers officiels avec motifs administratifs, date/lieu de RDV et coupon-réponse détachable
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition shrink-0" />
        </div>
      </div>

      {/* Classes Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">Performance par classe</h3>
            <p className="text-xs text-slate-500">Cliquez sur une classe pour explorer la liste et les classements</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('notes')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Saisie des notes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-6 py-3.5">Classe</th>
                <th className="px-4 py-3.5">Niveau & Série</th>
                <th className="px-4 py-3.5 text-right">Effectif</th>
                <th className="px-4 py-3.5 text-right">Moyenne</th>
                <th className="px-4 py-3.5 text-right">+ Forte</th>
                <th className="px-4 py-3.5 text-right">+ Faible</th>
                <th className="px-4 py-3.5 text-right">Réussite</th>
                <th className="px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic">
                    Aucune classe enregistrée. Ajoutez des élèves pour commencer.
                  </td>
                </tr>
              ) : (
                classRows.map((r) => {
                  const isSelected = selectedClasse === r.classe;
                  return (
                    <tr
                      key={r.classe}
                      onClick={() => setSelectedClasse(isSelected ? '' : r.classe)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-amber-50/80 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs">
                          {r.classe}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {r.niveau} • Série {r.serie}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-800">
                        {r.effectif}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-700">
                        {r.moyenne !== null ? `${r.moyenne}/20` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-700">
                        {r.plusForte !== null ? `${r.plusForte}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-rose-600">
                        {r.plusFaible !== null ? `${r.plusFaible}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {r.tauxReussite !== null ? (
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                            r.tauxReussite >= 50
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {r.tauxReussite}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="text-xs text-amber-600 font-semibold hover:underline flex items-center justify-center gap-1">
                          {isSelected ? 'Masquer' : 'Détails'}
                          <ChevronRight className={`w-3.5 h-3.5 transition ${isSelected ? 'rotate-90' : ''}`} />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Class Drilldown */}
      {selectedClasse && selectedClassStats && (
        <div className="bg-white rounded-2xl border-2 border-amber-400/80 shadow-md overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-amber-500 text-slate-950 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg">
                Détail de la classe {selectedClasse} — {semestre === 'S1' ? '1er Semestre' : '2ème Semestre'}
              </h3>
              <p className="text-xs text-slate-900 font-medium">
                Effectif: {selectedClassStats.effectif} élèves • Moyenne classe: {selectedClassStats.moyenne}/20
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('bulletins', { classe: selectedClasse, sem: semestre })}
                className="px-3.5 py-2 rounded-xl bg-slate-950 text-amber-400 hover:bg-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer les bulletins</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3">Rang</th>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom et Prénoms</th>
                  <th className="px-4 py-3 text-right">Moyenne Sem.</th>
                  <th className="px-4 py-3">Mention</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedClassStudents
                  .map((e) => {
                    const moy = selectedClassStats.moyennes[e.matricule];
                    const rang = selectedClassStats.rankOf(e.matricule);
                    const mention = Logic.mentionFor(state, moy);
                    return { eleve: e, moy, rang, mention };
                  })
                  .sort((a, b) => (b.moy ?? -1) - (a.moy ?? -1))
                  .map((row) => (
                    <tr key={row.eleve.matricule} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3 font-mono font-bold text-slate-700">
                        {row.rang !== null ? `${row.rang}${row.rang === 1 ? 'er' : 'e'}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {row.eleve.matricule}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.eleve.civilite} {row.eleve.nom}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                        {row.moy !== null ? `${row.moy}/20` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          row.mention === 'Félicitations' ? 'bg-emerald-100 text-emerald-800' :
                          row.mention === 'Encouragements' || row.mention === "Tableau d'Honneur" ? 'bg-blue-100 text-blue-800' :
                          row.mention === 'Passable' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {row.mention}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => onNavigate('bulletins', { matricule: row.eleve.matricule, sem: semestre })}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-amber-50 hover:border-amber-400 text-xs font-semibold text-slate-700 transition"
                        >
                          Bulletin →
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
