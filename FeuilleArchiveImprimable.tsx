import React from 'react';
import { AppState, ArchiveClasse, ArchiveDecisionItem, ArchiveStatistiques } from '../types';
import { Award, CheckCircle2, FileText, Printer, ShieldCheck, Users } from 'lucide-react';

interface Props {
  state: AppState;
  archiveClasse: ArchiveClasse;
  onClose?: () => void;
  showPrintButton?: boolean;
}

export const FeuilleArchiveImprimable: React.FC<Props> = ({
  state,
  archiveClasse,
  onClose,
  showPrintButton = true
}) => {
  const params = state.parametres;
  const decisions = archiveClasse.decisions || [];
  const stats = archiveClasse.statistiques || {
    effectifTotal: decisions.length,
    effectifEvalues: decisions.filter(d => d.moyenneAnnuelle !== null).length,
    nbPassants: decisions.filter(d => d.decision === 'Passe au niveau supérieur' || d.decision === 'Passage').length,
    nbRedoublants: decisions.filter(d => d.decision === 'Redouble' || d.decision === 'Redoublement').length,
    nbExclus: decisions.filter(d => d.decision === 'Exclu(e)' || d.decision === 'Exclusion').length,
    nbDiplomes: decisions.filter(d => d.decision === 'Diplômé(e)' || d.decision === 'Diplome').length,
    tauxPassage: 0,
    tauxRedoublement: 0,
    tauxExclusion: 0,
    moyenneClasse: null,
    plusForteMoyenne: null,
    plusFaibleMoyenne: null
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar (no-print) */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl no-print shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm">
              Feuille d'Archive & Procès-Verbal — Classe {archiveClasse.classe} ({archiveClasse.anneeScolaire})
            </h4>
            <p className="text-xs text-slate-400">
              Document officiel certifié conforme pour les registres d'archives scolaires
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Feuille d'Archive</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition font-medium"
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      {/* Official Archive Sheet Page (A4 Formatted) */}
      <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none print:rounded-none max-w-5xl mx-auto">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="grid grid-cols-3 gap-4 items-start text-center">
            {/* Left Header: National Ministry */}
            <div className="text-left space-y-0.5">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
                {params.ligne1 || 'RÉPUBLIQUE DU NIGER'}
              </p>
              <p className="text-[10px] font-semibold text-slate-700">
                {params.ligne2 || "MINISTÈRE DE L'ÉDUCATION NATIONALE"}
              </p>
              <p className="text-[9px] text-slate-600">
                {params.ligne3 || 'D.R.E.N NIAMEY / I.E.S NIAMEY III'}
              </p>
              <p className="text-[9px] text-slate-500 italic mt-1">
                Ville : {params.ville || 'Niamey'}
              </p>
            </div>

            {/* Center: School Brand */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-serif font-black text-xl flex items-center justify-center border border-amber-500/40 mb-1 shadow-xs">
                LP
              </div>
              <h1 className="font-serif font-black text-sm uppercase tracking-tight text-slate-900 leading-tight">
                {params.nomEtablissement || 'COMPLEXE SCOLAIRE PRIVÉ LA PERSÉVÉRANCE'}
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mt-0.5">
                Discipline • Travail • Succès
              </p>
            </div>

            {/* Right: Reference & Date */}
            <div className="text-right space-y-0.5">
              <div className="inline-block bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 font-mono text-[10px] font-bold text-slate-800">
                ANNÉE : {archiveClasse.anneeScolaire}
              </div>
              <p className="text-[10px] font-medium text-slate-600 mt-1">
                Date de clôture : <strong>{archiveClasse.dateCloture || new Date().toLocaleDateString('fr-FR')}</strong>
              </p>
              <p className="text-[9px] font-mono text-slate-400">
                Réf : {archiveClasse.id || `ARC-${archiveClasse.classe}`}
              </p>
            </div>
          </div>
        </div>

        {/* Title Banner */}
        <div className="text-center bg-slate-100 border border-slate-300 py-2.5 px-4 rounded-xl mb-6">
          <h2 className="font-serif font-black text-base uppercase tracking-wider text-slate-900">
            FEUILLE OFFICIELLE D'ARCHIVES & PROCÈS-VERBAL DE DÉLIBÉRATION ANNUELLE
          </h2>
          <div className="flex items-center justify-center gap-6 mt-1 text-xs font-semibold text-slate-700">
            <span>Classe : <strong className="text-slate-950 font-mono">{archiveClasse.classe}</strong></span>
            <span>•</span>
            <span>Niveau : <strong className="text-slate-950">{archiveClasse.niveau}</strong></span>
            <span>•</span>
            <span>Série : <strong className="text-slate-950">{archiveClasse.serie}</strong></span>
            <span>•</span>
            <span>Effectif total : <strong className="text-slate-950">{decisions.length} élèves</strong></span>
          </div>
        </div>

        {/* Official Results Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-serif uppercase tracking-wider text-[10px]">
                <th className="py-2 px-2 text-center border-r border-slate-700 w-10">Rang</th>
                <th className="py-2 px-2.5 border-r border-slate-700 font-mono">Matricule</th>
                <th className="py-2 px-3 border-r border-slate-700">Nom et Prénoms</th>
                <th className="py-2 px-2 text-center border-r border-slate-700 w-10">Sexe</th>
                <th className="py-2 px-2 text-center border-r border-slate-700">Statut</th>
                <th className="py-2 px-2 text-right border-r border-slate-700">Moy. S1</th>
                <th className="py-2 px-2 text-right border-r border-slate-700">Moy. S2</th>
                <th className="py-2 px-2.5 text-right border-r border-slate-700 bg-slate-900 text-amber-400 font-bold">Moy. Ann.</th>
                <th className="py-2 px-2.5 border-r border-slate-700">Mention</th>
                <th className="py-2 px-3 text-center border-r border-slate-700 font-bold">Décision du Conseil</th>
                <th className="py-2 px-2.5">Classe Suivante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-400 italic">
                    Aucun élève enregistré dans cette archive de classe.
                  </td>
                </tr>
              ) : (
                decisions.map((d, index) => {
                  const isPassant = d.decision === 'Passe au niveau supérieur' || d.decision === 'Passage';
                  const isRedoublant = d.decision === 'Redouble' || d.decision === 'Redoublement';
                  const isExclu = d.decision === 'Exclu(e)' || d.decision === 'Exclusion';
                  const isDiplome = d.decision === 'Diplômé(e)' || d.decision === 'Diplome';

                  return (
                    <tr
                      key={d.matricule || index}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                    >
                      <td className="py-2 px-2 text-center font-bold font-mono text-slate-800 border-r border-slate-200">
                        {d.rang ? (
                          <span className={d.rang === 1 ? 'text-amber-700 font-black' : ''}>
                            {d.rang}{d.rang === 1 ? 'er' : 'e'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[11px] font-semibold text-slate-800 border-r border-slate-200">
                        {d.matricule}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                        {d.nom}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600 font-medium border-r border-slate-200">
                        {d.sexe || '—'}
                      </td>
                      <td className="py-2 px-2 text-center text-[10px] text-slate-600 border-r border-slate-200">
                        {d.statutInitial || 'Passant(e)'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                        {d.moyS1 !== null && d.moyS1 !== undefined ? Number(d.moyS1).toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                        {d.moyS2 !== null && d.moyS2 !== undefined ? Number(d.moyS2).toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950 bg-amber-50/60 border-r border-slate-200">
                        {d.moyenneAnnuelle !== null && d.moyenneAnnuelle !== undefined
                          ? `${Number(d.moyenneAnnuelle).toFixed(2)}/20`
                          : '—'}
                      </td>
                      <td className="py-2 px-2.5 text-slate-700 border-r border-slate-200 text-[11px]">
                        {d.mention || '—'}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isPassant
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isRedoublant
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isExclu
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : isDiplome
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {d.decision}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-[11px] font-mono text-slate-700">
                        {d.nouvelleClasse || d.nouveauNiveau || (isDiplome ? 'Cycle Terminé' : isExclu ? 'Radiation' : '—')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Statistical Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Effectif & Évalués</span>
            <div className="font-bold text-slate-900">
              {stats.effectifTotal} élèves (dont {stats.effectifEvalues} évalués)
            </div>
            <div className="text-[10px] text-slate-500">
              Moyenne de classe : <strong>{stats.moyenneClasse !== null ? `${stats.moyenneClasse}/20` : '—'}</strong>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Passage au niveau sup.</span>
            <div className="font-bold text-emerald-800">
              {stats.nbPassants} élève(s) • <span className="underline">{stats.tauxPassage}%</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Plus forte moyenne : <strong>{stats.plusForteMoyenne !== null ? `${stats.plusForteMoyenne}/20` : '—'}</strong>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Redoublements</span>
            <div className="font-bold text-amber-800">
              {stats.nbRedoublants} élève(s) • <span className="underline">{stats.tauxRedoublement}%</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Plus faible moyenne : <strong>{stats.plusFaibleMoyenne !== null ? `${stats.plusFaibleMoyenne}/20` : '—'}</strong>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Exclusions / Diplômes</span>
            <div className="font-bold text-rose-800">
              {stats.nbExclus} exclus ({stats.tauxExclusion}%)
              {stats.nbDiplomes > 0 && <span> • {stats.nbDiplomes} diplômés</span>}
            </div>
            <div className="text-[10px] text-slate-500">
              Seuil d'admission : ≥ {params.seuilReussite}/20
            </div>
          </div>
        </div>

        {/* Signatures & Certification Block */}
        <div className="border border-slate-300 rounded-xl p-5 bg-white">
          <div className="text-center font-serif text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-8">
            CERTIFICATION & SIGNATURES DU CONSEIL DE DÉLIBÉRATION
          </div>

          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            {/* Signature 1 */}
            <div className="flex flex-col justify-between h-28 border-r border-slate-200 pr-4">
              <div>
                <p className="font-bold text-slate-900">Le Professeur Principal</p>
                <p className="text-[10px] text-slate-500 italic">Rapporteur du Conseil</p>
                {archiveClasse.professeurPrincipal && (
                  <p className="text-[10px] font-semibold text-slate-800 mt-1">{archiveClasse.professeurPrincipal}</p>
                )}
              </div>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto" />
            </div>

            {/* Signature 2 */}
            <div className="flex flex-col justify-between h-28 border-r border-slate-200 pr-4">
              <div>
                <p className="font-bold text-slate-900">Le Directeur des Études / Censeur</p>
                <p className="text-[10px] text-slate-500 italic">Contrôle de conformité</p>
              </div>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto" />
            </div>

            {/* Signature 3 */}
            <div className="flex flex-col justify-between h-28">
              <div>
                <p className="font-bold text-slate-900">Le Chef d'Établissement / Proviseur</p>
                <p className="text-[10px] text-slate-500 italic">Signature & Sceau officiel</p>
              </div>
              <div className="text-[9px] text-slate-400 italic">
                (Cachet de l'établissement)
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-[9px] text-slate-400 print:text-[8px] flex items-center justify-between border-t border-slate-200 pt-2">
          <span>Complexe Scolaire Privé "La Persévérance" — Registre Général des Archives</span>
          <span>Imprimé le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </div>
  );
};
