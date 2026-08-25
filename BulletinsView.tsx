import React, { useState, useEffect } from 'react';
import { AppState, Semestre } from '../types';
import { Logic } from '../services/logic';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  FileDown
} from 'lucide-react';

interface Props {
  state: AppState;
  initialMatricule?: string;
  initialSem?: Semestre;
  initialClasse?: string;
}

export const BulletinsView: React.FC<Props> = ({
  state,
  initialMatricule,
  initialSem = 'S1',
  initialClasse
}) => {
  const [semestre, setSemestre] = useState<Semestre>(initialSem);
  const [selectedMatricule, setSelectedMatricule] = useState<string>(
    initialMatricule || state.eleves[0]?.matricule || ''
  );
  const [isBatchMode, setIsBatchMode] = useState<boolean>(Boolean(initialClasse));
  const [batchClasse, setBatchClasse] = useState<string>(initialClasse || state.eleves[0]?.classe || '');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialMatricule) {
      setSelectedMatricule(initialMatricule);
      setIsBatchMode(false);
    }
  }, [initialMatricule]);

  useEffect(() => {
    if (initialSem) {
      setSemestre(initialSem);
    }
  }, [initialSem]);

  useEffect(() => {
    if (initialClasse) {
      setBatchClasse(initialClasse);
      setIsBatchMode(true);
    }
  }, [initialClasse]);

  const distinctClasses = Logic.distinctClasses(state);
  const currentStudent = state.eleves.find(e => e.matricule === selectedMatricule) || state.eleves[0];
  const bulletinData = currentStudent ? Logic.fullBulletinData(state, currentStudent.matricule, semestre) : null;

  // Batch students of chosen class
  const batchStudents = isBatchMode ? Logic.studentsOfClass(state, batchClasse) : [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportSuccess(false);
    setExportProgress('Préparation du document PDF...');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      if (!isBatchMode) {
        if (!currentStudent) {
          throw new Error('Aucun élève sélectionné.');
        }

        const element = document.getElementById(`bulletin-${currentStudent.matricule}`);
        if (!element) {
          throw new Error('Élément de bulletin introuvable.');
        }

        setExportProgress('Rendu haute définition du bulletin...');
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));

        const cleanNom = currentStudent.nom.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `Bulletin_${currentStudent.matricule}_${cleanNom}_${semestre}.pdf`;
        pdf.save(filename);
      } else {
        if (batchStudents.length === 0) {
          throw new Error('Aucun élève dans la classe sélectionnée.');
        }

        for (let i = 0; i < batchStudents.length; i++) {
          const student = batchStudents[i];
          setExportProgress(`Traitement (${i + 1}/${batchStudents.length}) : ${student.nom}...`);

          const element = document.getElementById(`bulletin-${student.matricule}`);
          if (element) {
            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            if (i > 0) {
              pdf.addPage('a4', 'portrait');
            }
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
          }
        }

        const cleanClasse = (batchClasse || 'Classe').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `Bulletins_Classe_${cleanClasse}_${semestre}.pdf`;
        pdf.save(filename);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erreur lors de l’export PDF:', err);
      alert("Erreur lors de la génération du PDF : " + (err?.message || 'Erreur inconnue'));
    } finally {
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  const handleNextStudent = () => {
    const idx = state.eleves.findIndex(e => e.matricule === selectedMatricule);
    if (idx !== -1 && idx < state.eleves.length - 1) {
      setSelectedMatricule(state.eleves[idx + 1].matricule);
    }
  };

  const handlePrevStudent = () => {
    const idx = state.eleves.findIndex(e => e.matricule === selectedMatricule);
    if (idx > 0) {
      setSelectedMatricule(state.eleves[idx - 1].matricule);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" /> Édition des Bulletins Officiels
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Bulletins de Notes Semestriels
          </h2>
          <p className="text-sm text-slate-500">
            Mise en page officielle calibrée pour impression A4 et export direct en PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Semester Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setSemestre('S1')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                semestre === 'S1'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1er Semestre
            </button>
            <button
              onClick={() => setSemestre('S2')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                semestre === 'S2'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2ème Semestre
            </button>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>{isBatchMode ? 'Génération du PDF...' : 'Téléchargement...'}</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PDF Téléchargé !</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-400" />
                <span>{isBatchMode ? `Télécharger PDF Classe (${batchStudents.length})` : 'Télécharger en PDF'}</span>
              </>
            )}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{isBatchMode ? `Imprimer toute la classe (${batchStudents.length})` : 'Imprimer'}</span>
          </button>
        </div>
      </div>

      {/* Generation Progress Notification */}
      {isExportingPdf && exportProgress && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium no-print animate-fade-in shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
          <span>{exportProgress}</span>
        </div>
      )}

      {/* Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Mode :</label>
            <button
              onClick={() => setIsBatchMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !isBatchMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Élève individuel
            </button>
            <button
              onClick={() => {
                setIsBatchMode(true);
                if (!batchClasse && distinctClasses.length > 0) setBatchClasse(distinctClasses[0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isBatchMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toute la classe (lot)
            </button>
          </div>

          {!isBatchMode ? (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Élève :</label>
              <select
                value={selectedMatricule}
                onChange={(e) => setSelectedMatricule(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 focus:border-amber-500 bg-white text-slate-900 min-w-[260px]"
              >
                {distinctClasses.map((c) => (
                  <optgroup key={c} label={`Classe: ${c}`}>
                    {Logic.studentsOfClass(state, c).map((s) => (
                      <option key={s.matricule} value={s.matricule}>
                        {s.nom} ({s.matricule})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevStudent}
                  title="Élève précédent"
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextStudent}
                  title="Élève suivant"
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Classe à imprimer :</label>
              <select
                value={batchClasse}
                onChange={(e) => setBatchClasse(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 focus:border-amber-500 bg-white text-slate-900"
              >
                {distinctClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                ({batchStudents.length} élèves générés)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Render Document(s) */}
      <div className="flex flex-col gap-10 print:gap-0">
        {!isBatchMode ? (
          bulletinData && (
            <BulletinCard key={bulletinData.eleve.matricule} data={bulletinData} state={state} semestre={semestre} />
          )
        ) : (
          batchStudents.map((st) => {
            const data = Logic.fullBulletinData(state, st.matricule, semestre);
            if (!data) return null;
            return (
              <div key={st.matricule} className="print:break-after-page">
                <BulletinCard data={data} state={state} semestre={semestre} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface BulletinCardProps {
  data: any;
  state: AppState;
  semestre: Semestre;
}

const BulletinCard: React.FC<BulletinCardProps> = ({ data, state, semestre }) => {
  const p = state.parametres;
  const e = data.eleve;

  return (
    <div
      id={`bulletin-${e.matricule}`}
      className="bg-white border border-slate-300 rounded-lg p-8 max-w-4xl mx-auto shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none text-slate-900 font-sans"
    >
      {/* Official Letterhead */}
      <div className="text-center space-y-0.5 mb-2">
        <div className="text-xs font-bold tracking-wide uppercase">{p.ligne1}</div>
        <div className="text-[11px] font-semibold text-slate-700">{p.ligne2}</div>
        <div className="text-[10px] text-slate-600 italic mb-2">{p.ligne3}</div>
        <div className="text-base font-serif font-black tracking-wide text-slate-950 uppercase pt-1">
          {p.nomEtablissement}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-amber-700 pt-0.5">
          Bulletin de notes — {semestre === 'S1' ? '1er Semestre' : '2ème Semestre'} — Année scolaire {p.anneeScolaire}
        </div>
      </div>

      <hr className="border-t-2 border-slate-900 my-3" />

      {/* Student Identity Block */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200 mb-3">
        <div className="flex">
          <span className="w-32 text-slate-500 font-medium">Nom et Prénoms :</span>
          <span className="font-bold text-slate-900 uppercase">{e.civilite} {e.nom}</span>
        </div>
        <div className="flex">
          <span className="w-32 text-slate-500 font-medium">Matricule :</span>
          <span className="font-mono font-bold text-slate-900">{e.matricule}</span>
        </div>
        <div className="flex">
          <span className="w-32 text-slate-500 font-medium">Date de naissance :</span>
          <span className="font-medium">{e.dateNaissance || '—'}</span>
        </div>
        <div className="flex">
          <span className="w-32 text-slate-500 font-medium">Niveau / Série :</span>
          <span className="font-bold">{e.niveau} • {e.serie}</span>
        </div>
        <div className="flex">
          <span className="w-32 text-slate-500 font-medium">Lieu de naissance :</span>
          <span>{e.lieuNaissance || '—'}</span>
        </div>
        <div className="flex">
          <span className="w-32 text-slate-500 font-medium">Classe & Effectif :</span>
          <span className="font-bold">{e.classe} ({data.effectifClasse} élèves)</span>
        </div>
      </div>

      {/* Subjects Grades Table */}
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-left text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
              <th className="p-2 border-r border-slate-300">Discipline</th>
              <th className="p-2 text-right border-r border-slate-300 w-16">Moy. Cl</th>
              <th className="p-2 text-right border-r border-slate-300 w-16">Comp.</th>
              <th className="p-2 text-right border-r border-slate-300 w-16">Moy. Sem</th>
              <th className="p-2 text-right border-r border-slate-300 w-12">Coef</th>
              <th className="p-2 text-right border-r border-slate-300 w-20">Moy × Coef</th>
              <th className="p-2 border-r border-slate-300">Appréciation du professeur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.lignes.map((l: any) => (
              <tr key={l.discipline} className="hover:bg-slate-50/50">
                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{l.discipline}</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono">{l.moyClas !== null ? l.moyClas : '—'}</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono">{l.noteComp !== null ? l.noteComp : '—'}</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold bg-slate-50/60">{l.moySem !== null ? l.moySem.toFixed(2) : '—'}</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{l.coef}</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{l.moySemXCoef !== null ? l.moySemXCoef.toFixed(2) : '—'}</td>
                <td className="p-2 border-r border-slate-200 italic text-slate-700">{l.appreciation}</td>
              </tr>
            ))}
            {/* Conduite */}
            <tr className="bg-slate-50/60 border-t border-slate-300">
              <td className="p-2 border-r border-slate-200 font-bold uppercase text-slate-900">CONDUITE</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono">—</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono">—</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold bg-slate-100">{data.conduite.note !== null ? data.conduite.note : '—'}</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{data.conduite.coef}</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{data.conduite.noteXCoef !== null ? data.conduite.noteXCoef.toFixed(2) : '—'}</td>
              <td className="p-2 border-r border-slate-200 italic text-slate-700">{data.conduite.appreciation}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-bold text-xs">
              <td colSpan={4} className="p-2 border-r border-slate-800 text-right uppercase tracking-wider">TOTAL GÉNÉRAL</td>
              <td className="p-2 border-r border-slate-800 text-right font-mono text-amber-300">{data.totalCoef}</td>
              <td className="p-2 border-r border-slate-800 text-right font-mono text-amber-300">{data.totalMoySemXCoef.toFixed(2)}</td>
              <td className="p-2 border-r border-slate-800"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Attendance & Disciplinary Row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
        <div className="p-2 rounded-md border border-slate-200 bg-slate-50">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Retards</div>
          <div className="font-mono font-bold text-slate-900">{data.nbRetards}</div>
        </div>
        <div className="p-2 rounded-md border border-slate-200 bg-slate-50">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Absences constatées</div>
          <div className="font-mono font-bold text-slate-900">
            {data.nbAbsences} ({data.totalJoursAbsence} j)
          </div>
        </div>
        <div className="p-2 rounded-md border border-slate-200 bg-slate-50">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Expulsions / Exclusions</div>
          <div className="font-mono font-bold text-slate-900">{data.nbExpulsions}</div>
        </div>
      </div>

      {/* Main Results Summary */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="p-2.5 rounded-lg border-2 border-amber-500 bg-amber-50/50">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Moyenne Semestrielle</div>
          <div className="text-xl font-serif font-black text-amber-800">
            {data.moyenneSemestrielle !== null ? `${data.moyenneSemestrielle.toFixed(2)}/20` : '—'}
          </div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Rang dans la classe</div>
          <div className="text-base font-serif font-bold text-slate-900 mt-1">{data.rangClasseLabel}</div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Rang Série ({e.niveau}-{e.serie})</div>
          <div className="text-base font-serif font-bold text-slate-900 mt-1">{data.rangNSLabel}</div>
        </div>
      </div>

      {/* Mention Banner */}
      <div className="text-center mb-3">
        <span className="inline-block px-4 py-1 rounded-full text-xs font-bold border border-amber-400 bg-amber-100 text-amber-900 shadow-2xs">
          Mention du conseil de classe : <strong>{data.mention}</strong>
        </span>
      </div>

      {/* Comparison Statistics Boxes */}
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
          <div className="font-bold text-[10px] uppercase text-amber-800 border-b border-slate-200 pb-1">
            Résultats de la classe ({e.classe})
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Moyenne générale de la classe :</span>
            <strong className="font-mono">{data.moyenneClasse !== null ? `${data.moyenneClasse}/20` : '—'}</strong>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Plus forte moyenne :</span>
            <strong className="font-mono text-emerald-700">{data.plusForteClasse}</strong>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Plus faible moyenne :</span>
            <strong className="font-mono text-rose-700">{data.plusFaibleClasse}</strong>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
          <div className="font-bold text-[10px] uppercase text-amber-800 border-b border-slate-200 pb-1">
            Résultats Niveau-Série ({e.niveau} {e.serie})
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Effectif total Niveau-Série :</span>
            <strong className="font-mono">{data.effectifNS} élèves</strong>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Moyenne générale Série :</span>
            <strong className="font-mono">{data.moyenneNS !== null ? `${data.moyenneNS}/20` : '—'}</strong>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Plus forte / Plus faible :</span>
            <strong className="font-mono">{data.plusForteNS} / {data.plusFaibleNS}</strong>
          </div>
        </div>
      </div>

      {/* Annual Summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs p-2 rounded-lg bg-slate-100 border border-slate-300 mb-6">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">1er Semestre</span>
          <strong className="font-mono text-sm">{data.moyS1 !== null ? `${data.moyS1.toFixed(2)}/20` : '—'}</strong>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">2ème Semestre</span>
          <strong className="font-mono text-sm">{data.moyS2 !== null ? `${data.moyS2.toFixed(2)}/20` : '—'}</strong>
        </div>
        <div className="border-l border-slate-300">
          <span className="text-[10px] text-amber-800 uppercase block font-bold">Moyenne Annuelle</span>
          <strong className="font-mono text-sm text-amber-900 font-black">
            {data.moyenneAnnuelle !== null ? `${data.moyenneAnnuelle.toFixed(2)}/20` : '—'}
          </strong>
        </div>
      </div>

      {/* Signatures block */}
      <div className="flex justify-between items-start text-xs pt-4 border-t border-slate-200">
        <div className="text-center w-56 space-y-8">
          <div className="font-bold text-slate-800">Le Parent / Tuteur</div>
          <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-400">
            Signature
          </div>
        </div>

        <div className="text-center w-56 space-y-8">
          <div className="font-bold text-slate-800">
            Fait à {p.ville}, le {new Date().toLocaleDateString('fr-FR')}
            <div className="text-[11px] font-normal text-slate-600">Le Chef d'Établissement</div>
          </div>
          <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-400">
            Signature et Cachet
          </div>
        </div>
      </div>
    </div>
  );
};
