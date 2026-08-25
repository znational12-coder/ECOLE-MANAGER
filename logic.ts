import {
  AppState,
  Eleve,
  Semestre,
  NotesRow,
  Professeur,
  UserSession,
  Paiement,
  Absence,
  Sanction,
  EcheanceConfig,
  EcheanceEleveDetail,
  HistoriqueFinancierEleve,
  ArchiveAnnee,
  ArchiveClasse,
  ArchiveDecisionItem,
  ArchiveStatistiques
} from '../types';

export const Logic = {
  round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  },

  niveauSerieKey(eleve: Eleve): string {
    return `${eleve.niveau}-${eleve.serie}`;
  },

  allNiveauSerieKeys(state: AppState): string[] {
    const keys = new Set<string>();
    (state.parametres.niveaux || []).forEach(n => {
      (state.parametres.series || []).forEach(s => {
        keys.add(`${n}-${s}`);
      });
    });
    // Also include any from current students
    (state.eleves || []).forEach(e => {
      if (e.niveau && e.serie) keys.add(`${e.niveau}-${e.serie}`);
    });
    return Array.from(keys);
  },

  getCoef(state: AppState, discipline: string, nsKey: string): number {
    const row = state.coefs[discipline];
    if (!row) return 0;
    const v = row[nsKey];
    return typeof v === 'number' ? v : 0;
  },

  moySem(moyClas: number | null | undefined, noteComp: number | null | undefined): number | null {
    const a = (moyClas === null || moyClas === undefined || (typeof moyClas === 'string' && moyClas === '')) ? null : Number(moyClas);
    const b = (noteComp === null || noteComp === undefined || (typeof noteComp === 'string' && noteComp === '')) ? null : Number(noteComp);
    if (a === null && b === null) return null;
    if (a === null && b !== null) return this.round2(b);
    if (b === null && a !== null) return this.round2(a);
    if (a !== null && b !== null) return this.round2((a + b) / 2);
    return null;
  },

  appreciationFor(value: number | null | undefined, seuils: Array<{ label: string; min: number }>): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const sorted = [...seuils].sort((x, y) => y.min - x.min);
    for (const s of sorted) {
      if (value >= s.min) return s.label;
    }
    return sorted.length ? sorted[sorted.length - 1].label : '—';
  },

  mentionFor(state: AppState, value: number | null | undefined): string {
    return this.appreciationFor(value, state.parametres.mentions);
  },

  appreciationNote(state: AppState, value: number | null | undefined): string {
    return this.appreciationFor(value, state.parametres.seuilsAppreciation);
  },

  conduiteAppreciation(note: number | null | undefined): string {
    if (note === null || note === undefined || isNaN(note)) return '—';
    if (note >= 16) return 'Très bonne conduite';
    if (note >= 12) return 'Bonne conduite';
    if (note >= 10) return 'Conduite passable';
    return 'Conduite à améliorer';
  },

  getNotesRow(state: AppState, semestre: Semestre, matricule: string): NotesRow | null {
    const arr = semestre === 'S1' ? state.notesS1 : state.notesS2;
    return arr.find(r => r.matricule === matricule) || null;
  },

  ensureNotesRow(state: AppState, semestre: Semestre, matricule: string): NotesRow {
    const arr = semestre === 'S1' ? state.notesS1 : state.notesS2;
    let row = arr.find(r => r.matricule === matricule);
    if (!row) {
      row = { matricule, Conduite: null };
      state.disciplines.forEach(d => {
        if (d === 'Conduite') return;
        row![d] = { moyClas: null, noteComp: null };
      });
      arr.push(row);
    }
    return row;
  },

  computeBulletin(state: AppState, matricule: string, semestre: Semestre) {
    const eleve = state.eleves.find(e => e.matricule === matricule);
    if (!eleve) return null;
    const nsKey = this.niveauSerieKey(eleve);
    const notesRow = this.getNotesRow(state, semestre, matricule) || { matricule };

    const matieresEnseignees = state.disciplines.filter(d => d !== 'Conduite' && this.getCoef(state, d, nsKey) > 0);
    const lignes = matieresEnseignees.map(d => {
      const src = (notesRow as any)[d] || {};
      const ms = this.moySem(src.moyClas, src.noteComp);
      const coef = this.getCoef(state, d, nsKey);
      const msxc = ms === null ? null : this.round2(ms * coef);
      return {
        discipline: d,
        moyClas: src.moyClas ?? null,
        noteComp: src.noteComp ?? null,
        moySem: ms,
        coef,
        moySemXCoef: msxc,
        appreciation: this.appreciationNote(state, ms),
      };
    });

    const coefConduite = this.getCoef(state, 'Conduite', nsKey);
    const noteConduite = (notesRow as any).Conduite ?? null;
    const conduiteXCoef = noteConduite === null ? null : this.round2(Number(noteConduite) * coefConduite);

    let totalMoySemXCoef = 0;
    let totalCoef = 0;
    lignes.forEach(l => {
      if (l.moySemXCoef !== null) {
        totalMoySemXCoef += l.moySemXCoef;
        totalCoef += l.coef;
      }
    });
    if (conduiteXCoef !== null) {
      totalMoySemXCoef += conduiteXCoef;
      totalCoef += coefConduite;
    }

    const moyenneSemestrielle = totalCoef > 0 ? this.round2(totalMoySemXCoef / totalCoef) : null;

    return {
      eleve,
      nsKey,
      semestre,
      lignes,
      conduite: {
        note: noteConduite,
        coef: coefConduite,
        noteXCoef: conduiteXCoef,
        appreciation: this.conduiteAppreciation(noteConduite),
      },
      totalMoySemXCoef: this.round2(totalMoySemXCoef),
      totalCoef,
      moyenneSemestrielle,
      mention: this.mentionFor(state, moyenneSemestrielle),
    };
  },

  allMoyennes(state: AppState, semestre: Semestre): Record<string, number | null> {
    const out: Record<string, number | null> = {};
    state.eleves.forEach(e => {
      const b = this.computeBulletin(state, e.matricule, semestre);
      out[e.matricule] = b ? b.moyenneSemestrielle : null;
    });
    return out;
  },

  rankLabel(rank: number | null, total: number): string {
    if (rank === null || total === 0) return '—';
    const suffix = rank === 1 ? 'er' : 'e';
    return `${rank}${suffix} sur ${total}`;
  },

  groupStats(state: AppState, semestre: Semestre, matricules: string[]) {
    const moyennes = this.allMoyennes(state, semestre);
    const values = matricules
      .map(m => moyennes[m])
      .filter((v): v is number => v !== null && v !== undefined);
    const effectif = matricules.length;
    const moyenne = values.length ? this.round2(values.reduce((a, b) => a + b, 0) / values.length) : null;
    const plusForte = values.length ? this.round2(Math.max(...values)) : null;
    const plusFaible = values.length ? this.round2(Math.min(...values)) : null;
    const tauxReussite = values.length
      ? this.round2((values.filter(v => v >= state.parametres.seuilReussite).length / values.length) * 100)
      : null;

    function rankOf(matricule: string): number | null {
      const v = moyennes[matricule];
      if (v === null || v === undefined) return null;
      const better = values.filter(x => x > v).length;
      return better + 1;
    }

    return { effectif, moyenne, plusForte, plusFaible, tauxReussite, moyennes, rankOf, values };
  },

  classmates(state: AppState, classe: string): string[] {
    return state.eleves.filter(e => e.classe === classe).map(e => e.matricule);
  },

  niveauSerieMates(state: AppState, nsKey: string): string[] {
    return state.eleves.filter(e => this.niveauSerieKey(e) === nsKey).map(e => e.matricule);
  },

  fullBulletinData(state: AppState, matricule: string, semestre: Semestre) {
    const b = this.computeBulletin(state, matricule, semestre);
    if (!b) return null;
    const eleve = b.eleve;
    const statsClasse = this.groupStats(state, semestre, this.classmates(state, eleve.classe));
    const statsNS = this.groupStats(state, semestre, this.niveauSerieMates(state, b.nsKey));

    const rangClasse = statsClasse.rankOf(matricule);
    const rangNS = statsNS.rankOf(matricule);

    const s1 = this.computeBulletin(state, matricule, 'S1');
    const s2 = this.computeBulletin(state, matricule, 'S2');
    const moyS1 = s1 ? s1.moyenneSemestrielle : null;
    const moyS2 = s2 ? s2.moyenneSemestrielle : null;
    const moyenneAnnuelle = (moyS1 !== null && moyS2 !== null) ? this.round2((moyS1 + moyS2) / 2) : null;
    const statsClasseS1 = this.groupStats(state, 'S1', this.classmates(state, eleve.classe));

    return {
      ...b,
      rangClasseLabel: this.rankLabel(rangClasse, statsClasse.effectif),
      effectifClasse: statsClasse.effectif,
      moyenneClasse: statsClasse.moyenne,
      plusForteClasse: statsClasse.plusForte,
      plusFaibleClasse: statsClasse.plusFaible,
      rangNSLabel: this.rankLabel(rangNS, statsNS.effectif),
      effectifNS: statsNS.effectif,
      moyenneNS: statsNS.moyenne,
      plusForteNS: statsNS.plusForte,
      plusFaibleNS: statsNS.plusFaible,
      moyS1,
      moyS2,
      moyenneAnnuelle,
      rangS1Label: this.rankLabel(statsClasseS1.rankOf(matricule), statsClasseS1.effectif),
      nbAbsences: this.nbAbsences(state, matricule),
      totalJoursAbsence: this.totalJoursAbsence(state, matricule),
      nbRetards: this.nbRetards(state, matricule),
      nbExpulsions: this.nbExpulsions(state, matricule),
    };
  },

  nbAbsences(state: AppState, matricule: string): number {
    return state.absences.filter(a => a.matricule === matricule).length;
  },

  totalJoursAbsence(state: AppState, matricule: string): number {
    return this.round2(state.absences.filter(a => a.matricule === matricule).reduce((s, a) => s + (Number(a.duree) || 0), 0));
  },

  nbRetards(state: AppState, matricule: string): number {
    return state.sanctions.filter(s => s.matricule === matricule && s.type === 'Retard').length;
  },

  nbExpulsions(state: AppState, matricule: string): number {
    return state.sanctions.filter(s => s.matricule === matricule && /expulsion/i.test(s.type)).length;
  },

  distinctClasses(state: AppState): string[] {
    const list = new Set<string>();
    state.eleves.forEach(e => { if (e.classe) list.add(e.classe); });
    (state.classes || []).forEach(c => { if (c.nom) list.add(c.nom); });
    return Array.from(list).sort();
  },

  studentsOfClass(state: AppState, classe: string): Eleve[] {
    return state.eleves.filter(e => e.classe === classe);
  },

  dashboardParClasse(state: AppState, semestre: Semestre) {
    const classes = this.distinctClasses(state);
    return classes.map(classe => {
      const eleve0 = state.eleves.find(e => e.classe === classe);
      const mats = this.classmates(state, classe);
      const stats = this.groupStats(state, semestre, mats);
      return {
        classe,
        niveau: eleve0?.niveau || '—',
        serie: eleve0?.serie || '—',
        effectif: stats.effectif,
        moyenne: stats.moyenne,
        plusForte: stats.plusForte,
        plusFaible: stats.plusFaible,
        tauxReussite: stats.tauxReussite,
      };
    });
  },

  totalDu(state: AppState, nsKey: string): number {
    return state.parametres.frais[nsKey] ?? 0;
  },

  situationPaiement(state: AppState, matricule: string) {
    const eleve = state.eleves.find(e => e.matricule === matricule);
    if (!eleve) return null;
    const nsKey = this.niveauSerieKey(eleve);
    const annee = state.parametres.anneeScolaire;
    const du = this.totalDu(state, nsKey);
    const payes = state.paiements
      .filter(p => p.matricule === matricule && p.anneeScolaire === annee)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const totalPaye = this.round2(payes.reduce((s, p) => s + (Number(p.montant) || 0), 0));
    return {
      eleve,
      nsKey,
      du,
      totalPaye,
      reste: this.round2(du - totalPaye),
      payes,
    };
  },

  nextReceiptNumber(state: AppState): string {
    const nums = state.paiements
      .map(p => p.noRecu)
      .filter(Boolean)
      .map(n => {
        const m = /(\d+)$/.exec(n);
        return m ? parseInt(m[1], 10) : 0;
      });
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `REC-${String(next).padStart(3, '0')}`;
  },

  computePaiementControle(state: AppState, matricule: string, montant: number, excludeReceiptNo?: string) {
    const eleve = state.eleves.find(e => e.matricule === matricule);
    if (!eleve) return null;
    const nsKey = this.niveauSerieKey(eleve);
    const annee = state.parametres.anneeScolaire;
    const du = this.totalDu(state, nsKey);
    const avant = this.round2(
      state.paiements
        .filter(p => p.matricule === matricule && p.anneeScolaire === annee && p.noRecu !== excludeReceiptNo)
        .reduce((s, p) => s + (Number(p.montant) || 0), 0)
    );
    const cumul = this.round2(avant + (Number(montant) || 0));
    const reste = this.round2(du - cumul);
    const controle = cumul > du ? 'DEPASSEMENT' : 'OK';
    return { du, avant, cumul, reste, controle };
  },

  // Permissions and scoped profiles
  matieresEnseigneesParProf(state: AppState, prof: Professeur, classe: string): string[] {
    if (!prof) return [];
    const eleve0 = state.eleves.find(e => e.classe === classe);
    if (!eleve0) return [];
    const nsKey = this.niveauSerieKey(eleve0);
    const siennes = new Set(prof.matieres || []);
    return state.disciplines.filter(d => d !== 'Conduite' && siennes.has(d) && this.getCoef(state, d, nsKey) > 0);
  },

  classesOuMatiereEnseignee(state: AppState, prof: Professeur): string[] {
    if (!prof) return [];
    const classes = this.distinctClasses(state);
    return classes.filter(c => this.matieresEnseigneesParProf(state, prof, c).length > 0);
  },

  identiteActive(state: AppState, session: UserSession) {
    if (session.type === 'prof') {
      const p = (state.professeurs || []).find(x => x.id === session.id);
      if (p) return { type: 'prof' as const, record: p, label: `${p.civilite ? p.civilite + ' ' : ''}${p.nom}` };
    }
    if (session.type === 'gestionnaire') {
      const g = (state.gestionnaires || []).find(x => x.id === session.id);
      if (g) return { type: 'gestionnaire' as const, record: g, label: g.nom };
    }
    return { type: 'admin' as const, record: null, label: 'Administration' };
  },

  canAccessRoute(state: AppState, session: UserSession, route: string): boolean {
    if (!session?.type) return false;
    const identite = this.identiteActive(state, session);
    if (identite.type === 'admin') return true;

    if (identite.type === 'prof') {
      const allowedTeacherRoutes = ['notes', 'sujets', 'affiches', 'attestations'];
      return allowedTeacherRoutes.includes(route);
    }

    if (identite.type === 'gestionnaire') {
      const allowedFinanceRoutes = ['paiements', 'attestations'];
      return allowedFinanceRoutes.includes(route);
    }

    return false;
  },

  getDefaultRouteForRole(session: UserSession): string {
    if (!session?.type) return 'dashboard';
    if (session.type === 'prof') return 'notes';
    if (session.type === 'gestionnaire') return 'paiements';
    return 'dashboard';
  },

  canEditSubjectGrade(state: AppState, session: UserSession, discipline: string): boolean {
    const identite = this.identiteActive(state, session);
    if (identite.type === 'admin') return true;
    if (identite.type === 'prof') {
      const prof = identite.record as Professeur | null;
      if (!prof) return false;
      if (discipline === 'Conduite') {
        return (prof.matieres || []).includes('Conduite');
      }
      return (prof.matieres || []).includes(discipline);
    }
    return false;
  },

  statutFinal(state: AppState, matricule: string): string {
    const b = this.fullBulletinData(state, matricule, 'S2');
    if (!b || b.moyenneAnnuelle === null) return 'En cours';
    if (b.moyenneAnnuelle < state.parametres.seuilExclusion) return 'Exclu(e)';
    if (b.moyenneAnnuelle < state.parametres.seuilRedoublement) return 'Redouble';
    return 'Passe au niveau supérieur';
  },

  autoGuessCode(niveau: string): string {
    if (!niveau) return '';
    const m = /^\d+/.exec(String(niveau).trim());
    if (m) return m[0];
    return String(niveau).trim().charAt(0).toUpperCase();
  },

  codeNiveau(state: AppState, niveau: string): string {
    const map = (state.parametres && state.parametres.codesNiveaux) || {};
    return map[niveau] || this.autoGuessCode(niveau);
  },

  niveauSuivant(state: AppState, niveau: string): string | null {
    const list = state.parametres.niveaux || [];
    const idx = list.indexOf(niveau);
    if (idx === -1 || idx === list.length - 1) return null;
    return list[idx + 1];
  },

  guessNouvelleClasse(state: AppState, eleve: Eleve, nouveauNiveau: string): string {
    const classe = eleve.classe || '';
    const ancienCode = this.codeNiveau(state, eleve.niveau);
    const nouveauCode = this.codeNiveau(state, nouveauNiveau);
    const serie = eleve.serie && eleve.serie !== 'Unique' ? eleve.serie : '';
    const prefixesToTry = [ancienCode + serie, ancienCode];
    for (const prefix of prefixesToTry) {
      if (prefix && classe.startsWith(prefix)) {
        const reste = classe.slice(prefix.length);
        return `${nouveauCode}${serie}${reste}`;
      }
    }
    return `${nouveauCode}${serie}`;
  },

  suggestNextAnnee(annee: string): string {
    const s = String(annee || '').trim();
    const m = /^(\d{4})\s*-\s*(\d{4})$/.exec(s);
    if (m) return `${parseInt(m[1], 10) + 1}-${parseInt(m[2], 10) + 1}`;
    const m2 = /(\d+)\s*$/.exec(s);
    if (m2) return s.slice(0, m2.index) + (parseInt(m2[1], 10) + 1);
    return s;
  },

  getDeliberationsPourClasse(
    state: AppState,
    classe: string,
    overrides: Record<string, string> = {}
  ): {
    classe: string;
    niveau: string;
    serie: string;
    elevesResults: Array<{
      eleve: Eleve;
      moyS1: number | null;
      moyS2: number | null;
      moyAnnuelle: number | null;
      rang: number | null;
      mention: string;
      statutCalcule: string;
      decision: string;
      nouveauNiveau?: string;
      nouvelleClasse?: string;
    }>;
    statistiques: ArchiveStatistiques;
  } {
    const classStudents = state.eleves.filter(e => e.classe === classe);
    const eleve0 = classStudents[0];
    const niveau = eleve0?.niveau || '—';
    const serie = eleve0?.serie || 'Unique';

    const calculatedList = classStudents.map(eleve => {
      const s1 = this.computeBulletin(state, eleve.matricule, 'S1');
      const s2 = this.computeBulletin(state, eleve.matricule, 'S2');
      const moyS1 = s1 ? s1.moyenneSemestrielle : null;
      const moyS2 = s2 ? s2.moyenneSemestrielle : null;
      let moyAnnuelle: number | null = null;
      if (moyS1 !== null && moyS2 !== null) {
        moyAnnuelle = this.round2((moyS1 + moyS2) / 2);
      } else if (moyS2 !== null) {
        moyAnnuelle = moyS2;
      } else if (moyS1 !== null) {
        moyAnnuelle = moyS1;
      }

      const statutCalcule = this.statutFinal(state, eleve.matricule);
      const overrideDecision = overrides[eleve.matricule];
      const decision = overrideDecision || statutCalcule;
      const mention = this.mentionFor(state, moyAnnuelle);

      let nouveauNiveau: string | undefined = undefined;
      let nouvelleClasse: string | undefined = undefined;

      const suivant = this.niveauSuivant(state, eleve.niveau);
      if (decision === 'Passe au niveau supérieur') {
        if (suivant) {
          nouveauNiveau = suivant;
          nouvelleClasse = this.guessNouvelleClasse(state, eleve, suivant);
        }
      } else if (decision === 'Redouble') {
        nouveauNiveau = eleve.niveau;
        nouvelleClasse = eleve.classe;
      }

      return {
        eleve,
        moyS1,
        moyS2,
        moyAnnuelle,
        rang: null as number | null,
        mention,
        statutCalcule,
        decision,
        nouveauNiveau,
        nouvelleClasse
      };
    });

    // Compute rankings within the class
    const evaluated = calculatedList
      .filter(x => x.moyAnnuelle !== null && !isNaN(x.moyAnnuelle))
      .sort((a, b) => (b.moyAnnuelle || 0) - (a.moyAnnuelle || 0));

    evaluated.forEach((item, idx) => {
      item.rang = idx + 1;
    });

    // Merge rankings back
    calculatedList.sort((a, b) => {
      if (a.rang !== null && b.rang !== null) return a.rang - b.rang;
      if (a.rang !== null) return -1;
      if (b.rang !== null) return 1;
      return (a.eleve.nom || '').localeCompare(b.eleve.nom || '');
    });

    const values = evaluated.map(e => e.moyAnnuelle as number);
    const effectifTotal = classStudents.length;
    const effectifEvalues = evaluated.length;
    const nbPassants = calculatedList.filter(e => e.decision === 'Passe au niveau supérieur' || e.decision === 'Passage').length;
    const nbRedoublants = calculatedList.filter(e => e.decision === 'Redouble' || e.decision === 'Redoublement').length;
    const nbExclus = calculatedList.filter(e => e.decision === 'Exclu(e)' || e.decision === 'Exclusion').length;
    const nbDiplomes = calculatedList.filter(e => e.decision === 'Diplômé(e)' || e.decision === 'Diplome').length;

    const statistiques: ArchiveStatistiques = {
      effectifTotal,
      effectifEvalues,
      nbPassants,
      nbRedoublants,
      nbExclus,
      nbDiplomes,
      tauxPassage: effectifTotal > 0 ? this.round2((nbPassants / effectifTotal) * 100) : 0,
      tauxRedoublement: effectifTotal > 0 ? this.round2((nbRedoublants / effectifTotal) * 100) : 0,
      tauxExclusion: effectifTotal > 0 ? this.round2((nbExclus / effectifTotal) * 100) : 0,
      moyenneClasse: values.length ? this.round2(values.reduce((a, b) => a + b, 0) / values.length) : null,
      plusForteMoyenne: values.length ? this.round2(Math.max(...values)) : null,
      plusFaibleMoyenne: values.length ? this.round2(Math.min(...values)) : null
    };

    return {
      classe,
      niveau,
      serie,
      elevesResults: calculatedList,
      statistiques
    };
  },

  cloturerClasse(
    state: AppState,
    classe: string,
    options?: {
      presidentConseil?: string;
      professeurPrincipal?: string;
      chefEtablissement?: string;
      overrides?: Record<string, string>;
      dateCloture?: string;
    }
  ): { archiveClasse: ArchiveClasse; message: string } {
    state.archives = state.archives || { annees: [], classes: [], exclusions: [], diplomes: [] };
    if (!state.archives.classes) state.archives.classes = [];
    if (!state.classesCloturees) state.classesCloturees = {};

    const anneeScolaire = state.parametres.anneeScolaire;
    const deliberation = this.getDeliberationsPourClasse(state, classe, options?.overrides || {});
    const dateCloture = options?.dateCloture || new Date().toISOString().split('T')[0];

    const classStudents = state.eleves.filter(e => e.classe === classe);
    const classMats = new Set(classStudents.map(e => e.matricule));

    const archiveId = `ARCH-CLS-${anneeScolaire}-${classe}`.replace(/[\s\/]+/g, '-');

    const decisions: ArchiveDecisionItem[] = deliberation.elevesResults.map(r => ({
      matricule: r.eleve.matricule,
      nom: r.eleve.nom,
      sexe: r.eleve.sexe || (r.eleve.civilite === 'Mlle' || r.eleve.civilite === 'Mme' ? 'F' : 'M'),
      classe: r.eleve.classe,
      statutInitial: r.eleve.statutInitial || 'Passant(e)',
      moyS1: r.moyS1,
      moyS2: r.moyS2,
      moyenneAnnuelle: r.moyAnnuelle,
      rang: r.rang,
      mention: r.mention,
      decision: r.decision as any,
      nouveauNiveau: r.nouveauNiveau,
      nouvelleClasse: r.nouvelleClasse
    }));

    const archiveClasse: ArchiveClasse = {
      id: archiveId,
      anneeScolaire,
      classe,
      niveau: deliberation.niveau,
      serie: deliberation.serie,
      dateCloture,
      professeurPrincipal: options?.professeurPrincipal,
      presidentConseil: options?.presidentConseil,
      chefEtablissement: options?.chefEtablissement || state.parametres.nomEtablissement,
      eleves: JSON.parse(JSON.stringify(classStudents)),
      notesS1: JSON.parse(JSON.stringify(state.notesS1.filter(r => classMats.has(r.matricule)))),
      notesS2: JSON.parse(JSON.stringify(state.notesS2.filter(r => classMats.has(r.matricule)))),
      decisions,
      statistiques: deliberation.statistiques
    };

    // Replace if existing or push
    const idx = state.archives.classes.findIndex(c => c.id === archiveId || (c.anneeScolaire === anneeScolaire && c.classe === classe));
    if (idx >= 0) {
      state.archives.classes[idx] = archiveClasse;
    } else {
      state.archives.classes.push(archiveClasse);
    }

    state.classesCloturees[classe] = {
      dateCloture,
      archiveId,
      nbEleves: classStudents.length,
      anneeScolaire
    };

    // Also update / sync year archive if needed
    let yearArch = state.archives.annees.find(a => a.anneeScolaire === anneeScolaire);
    if (!yearArch) {
      yearArch = {
        anneeScolaire,
        dateCloture,
        eleves: [],
        notesS1: [],
        notesS2: [],
        classes: [],
        classesCloturees: [classe]
      };
      state.archives.annees.push(yearArch);
    } else {
      if (!yearArch.classesCloturees) yearArch.classesCloturees = [];
      if (!yearArch.classesCloturees.includes(classe)) yearArch.classesCloturees.push(classe);
    }

    return {
      archiveClasse,
      message: `La classe ${classe} a été clôturée avec succès et archivée pour l'année ${anneeScolaire}.`
    };
  },

  rouvrirClasse(state: AppState, classe: string): boolean {
    if (!state.classesCloturees || !state.classesCloturees[classe]) return false;
    delete state.classesCloturees[classe];

    const anneeScolaire = state.parametres.anneeScolaire;
    const yearArch = state.archives?.annees?.find(a => a.anneeScolaire === anneeScolaire);
    if (yearArch && yearArch.classesCloturees) {
      yearArch.classesCloturees = yearArch.classesCloturees.filter(c => c !== classe);
    }
    return true;
  },

  cloturerToutesClasses(
    state: AppState,
    options?: {
      presidentConseil?: string;
      chefEtablissement?: string;
      overrides?: Record<string, string>;
      dateCloture?: string;
    }
  ): { count: number; messages: string[] } {
    const classes = this.distinctClasses(state);
    const messages: string[] = [];
    let count = 0;
    classes.forEach(cls => {
      const res = this.cloturerClasse(state, cls, options);
      messages.push(res.message);
      count++;
    });
    return { count, messages };
  },

  proposerPassage(state: AppState) {
    return state.eleves.map(eleve => {
      const full = this.fullBulletinData(state, eleve.matricule, 'S2');
      const moyenneAnnuelle = full ? full.moyenneAnnuelle : null;
      const statutCalcule = this.statutFinal(state, eleve.matricule);

      let decision: 'passage' | 'redouble' | 'exclusion' | 'diplome';
      if (statutCalcule === 'Exclu(e)') decision = 'exclusion';
      else if (statutCalcule === 'Redouble') decision = 'redouble';
      else if (statutCalcule === 'En cours') decision = 'redouble';
      else decision = 'passage';

      const suivant = this.niveauSuivant(state, eleve.niveau);
      let nouveauNiveau: string | null = null;
      let nouvelleClasse: string | null = null;
      if (decision === 'passage') {
        if (suivant) {
          nouveauNiveau = suivant;
          nouvelleClasse = this.guessNouvelleClasse(state, eleve, suivant);
        } else {
          decision = 'diplome';
        }
      }

      return {
        matricule: eleve.matricule,
        nom: eleve.nom,
        niveau: eleve.niveau,
        serie: eleve.serie,
        classe: eleve.classe,
        moyenneAnnuelle,
        statutCalcule,
        decision,
        nouveauNiveau,
        nouvelleSerie: eleve.serie,
        nouvelleClasse,
      };
    }).sort((a, b) => (a.classe || '').localeCompare(b.classe || '') || (a.nom || '').localeCompare(b.nom || ''));
  },

  executerPassage(state: AppState, decisions: any[], nouvelleAnneeScolaire: string, dateArchivage: string) {
    const ancienneAnnee = state.parametres.anneeScolaire;
    state.archives = state.archives || { annees: [], exclusions: [], diplomes: [] };

    state.archives.annees.push({
      anneeScolaire: ancienneAnnee,
      dateCloture: dateArchivage,
      eleves: JSON.parse(JSON.stringify(state.eleves)),
      notesS1: JSON.parse(JSON.stringify(state.notesS1)),
      notesS2: JSON.parse(JSON.stringify(state.notesS2)),
      absences: JSON.parse(JSON.stringify(state.absences)),
      sanctions: JSON.parse(JSON.stringify(state.sanctions)),
      paiements: JSON.parse(JSON.stringify(state.paiements)),
    });

    const decisionByMatricule: Record<string, any> = {};
    decisions.forEach(d => { decisionByMatricule[d.matricule] = d; });

    const nouveauxEleves: Eleve[] = [];
    state.eleves.forEach(eleve => {
      const d = decisionByMatricule[eleve.matricule];
      if (!d) {
        nouveauxEleves.push(eleve);
        return;
      }

      if (d.decision === 'exclusion') {
        state.archives.exclusions.push({
          ...eleve,
          anneeScolaire: ancienneAnnee,
          moyenneAnnuelle: d.moyenneAnnuelle,
          dateArchivage,
          motif: d.motif || "Exclu(e) pour insuffisance de résultats",
        });
        return;
      }
      if (d.decision === 'diplome') {
        state.archives.diplomes.push({
          ...eleve,
          anneeScolaire: ancienneAnnee,
          moyenneAnnuelle: d.moyenneAnnuelle,
          dateArchivage,
        });
        return;
      }
      if (d.decision === 'redouble') {
        nouveauxEleves.push({ ...eleve, statutInitial: 'Redoublant(e)' });
        return;
      }
      // passage
      const niveauFinal = d.nouveauNiveau || eleve.niveau;
      const serieFinal = d.nouvelleSerie || eleve.serie;
      const classeFinal = d.nouvelleClasse || eleve.classe;
      nouveauxEleves.push({
        ...eleve,
        niveau: niveauFinal,
        serie: serieFinal,
        classe: classeFinal,
        statutInitial: 'Passant(e)',
      });
    });

    state.eleves = nouveauxEleves;
    state.notesS1 = [];
    state.notesS2 = [];
    nouveauxEleves.forEach(e => {
      this.ensureNotesRow(state, 'S1', e.matricule);
      this.ensureNotesRow(state, 'S2', e.matricule);
    });
    state.absences = [];
    state.sanctions = [];
    state.paiements = [];
    state.parametres.anneeScolaire = nouvelleAnneeScolaire;

    return {
      ancienneAnnee,
      nouvelleAnnee: nouvelleAnneeScolaire,
      nbPassage: decisions.filter(d => d.decision === 'passage').length,
      nbRedouble: decisions.filter(d => d.decision === 'redouble').length,
      nbExclusion: decisions.filter(d => d.decision === 'exclusion').length,
      nbDiplome: decisions.filter(d => d.decision === 'diplome').length,
    };
  },

  annulerDerniereCloture(state: AppState) {
    if (!state.archives || !state.archives.annees.length) return null;
    const archive = state.archives.annees[state.archives.annees.length - 1];

    state.eleves = JSON.parse(JSON.stringify(archive.eleves));
    state.notesS1 = JSON.parse(JSON.stringify(archive.notesS1));
    state.notesS2 = JSON.parse(JSON.stringify(archive.notesS2));
    state.absences = JSON.parse(JSON.stringify(archive.absences));
    state.sanctions = JSON.parse(JSON.stringify(archive.sanctions));
    state.paiements = JSON.parse(JSON.stringify(archive.paiements));

    const anneeAnnulee = state.parametres.anneeScolaire;
    state.parametres.anneeScolaire = archive.anneeScolaire;

    state.archives.exclusions = state.archives.exclusions.filter(
      e => !(e.anneeScolaire === archive.anneeScolaire && e.dateArchivage === archive.dateCloture)
    );
    state.archives.diplomes = state.archives.diplomes.filter(
      e => !(e.anneeScolaire === archive.anneeScolaire && e.dateArchivage === archive.dateCloture)
    );

    state.archives.annees.pop();
    return { anneeRestauree: archive.anneeScolaire, anneeAnnulee };
  },

  conflitProfesseur(state: AppState, jour: string, creneau: string, professeurId: string, excludeId?: string) {
    if (!professeurId) return null;
    return state.emploiDuTemps.find(c => c.id !== excludeId && c.jour === jour && c.creneau === creneau && c.professeurId === professeurId);
  },

  parseAnneeYears(anneeScolaire: string): { year1: number; year2: number } {
    const s = String(anneeScolaire || '').trim();
    const match = /^(\d{4})\s*-\s*(\d{4})$/.exec(s);
    if (match) {
      return { year1: parseInt(match[1], 10), year2: parseInt(match[2], 10) };
    }
    const currentYear = new Date().getFullYear();
    return { year1: currentYear, year2: currentYear + 1 };
  },

  getFraisScolarite(state: AppState, eleve: Eleve): number {
    const nsKey = this.niveauSerieKey(eleve);
    if (state.parametres.frais && state.parametres.frais[nsKey]) {
      return Number(state.parametres.frais[nsKey]) || 150000;
    }
    if (state.parametres.frais && state.parametres.frais[eleve.classe]) {
      return Number(state.parametres.frais[eleve.classe]) || 150000;
    }
    if (state.parametres.frais && state.parametres.frais[eleve.niveau]) {
      return Number(state.parametres.frais[eleve.niveau]) || 150000;
    }
    // Standard default per level
    const niv = (eleve.niveau || '').toLowerCase();
    if (niv.includes('6') || niv.includes('5')) return 100000;
    if (niv.includes('4') || niv.includes('3')) return 110000;
    if (niv.includes('2nd') || niv.includes('1er') || niv.includes('tle')) {
      const serie = (eleve.serie || '').toUpperCase();
      return (serie === 'C' || serie === 'D') ? 200000 : 150000;
    }
    return 150000;
  },

  getConfigEcheances(state: AppState): EcheanceConfig[] {
    const { year1, year2 } = this.parseAnneeYears(state.parametres.anneeScolaire);
    return [
      {
        id: 'ech-1',
        numero: 1,
        label: '1ère Tranche (Inscription / Rentrée)',
        pourcentage: 40,
        dateLimite: `${year1}-10-15`,
        description: 'Exigible à la rentrée scolaire (40% de la scolarité)'
      },
      {
        id: 'ech-2',
        numero: 2,
        label: '2ème Tranche (Mi-Année / Semestre 1)',
        pourcentage: 35,
        dateLimite: `${year2}-01-15`,
        description: 'Exigible avant la fin du Semestre 1 (35% de la scolarité)'
      },
      {
        id: 'ech-3',
        numero: 3,
        label: '3ème Tranche (Solde définitif / Semestre 2)',
        pourcentage: 25,
        dateLimite: `${year2}-04-15`,
        description: 'Solde total exigible avant les examens du Semestre 2 (25% de la scolarité)'
      }
    ];
  },

  calculerHistoriqueFinancierEleve(
    state: AppState,
    matricule: string,
    dateReference: string = new Date().toISOString().split('T')[0]
  ): HistoriqueFinancierEleve | null {
    const eleve = state.eleves.find(e => e.matricule === matricule);
    if (!eleve) return null;

    const fraisTotal = this.getFraisScolarite(state, eleve);
    const configs = this.getConfigEcheances(state);

    // Payments of this student for current year, sorted by date ascending
    const studentPayments = (state.paiements || [])
      .filter(p => p.matricule === matricule && (!p.anneeScolaire || p.anneeScolaire === state.parametres.anneeScolaire))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const totalPaye = studentPayments.reduce((s, p) => s + (Number(p.montant) || 0), 0);
    const resteTotal = Math.max(0, fraisTotal - totalPaye);
    const tauxPaiement = fraisTotal > 0 ? Math.min(100, Math.round((totalPaye / fraisTotal) * 100)) : 100;

    let cumulePayeDisponible = totalPaye;
    let cumuleExigiblePrecedent = 0;
    let totalEnRetard = 0;
    let nbEcheancesNonRespectees = 0;
    let nbEcheancesSoldees = 0;

    const echeances: EcheanceEleveDetail[] = configs.map(cfg => {
      const montantTranche = Math.round((fraisTotal * cfg.pourcentage) / 100);
      const montantCumuleExigible = cumuleExigiblePrecedent + montantTranche;
      cumuleExigiblePrecedent = montantCumuleExigible;

      // Portion of student total paid allocated to this tranche
      const montantPayeAttribue = Math.min(montantTranche, Math.max(0, totalPaye - (montantCumuleExigible - montantTranche)));
      const montantResteTranche = Math.max(0, montantTranche - montantPayeAttribue);

      // Determine date when this tranche was completed (if completed)
      let dateDernierVersement: string | undefined = undefined;
      let sommeP = 0;
      for (const p of studentPayments) {
        sommeP += Number(p.montant) || 0;
        if (sommeP >= montantCumuleExigible) {
          dateDernierVersement = p.date;
          break;
        }
      }

      // Determine status and delay
      let statut: 'solde_a_temps' | 'solde_en_retard' | 'retard_non_respecte' | 'a_echoir' = 'a_echoir';
      let joursDeRetard = 0;

      const dateLimitObj = new Date(cfg.dateLimite);
      const refDateObj = new Date(dateReference);

      if (montantResteTranche === 0) {
        nbEcheancesSoldees++;
        if (dateDernierVersement && new Date(dateDernierVersement) > dateLimitObj) {
          statut = 'solde_en_retard';
        } else {
          statut = 'solde_a_temps';
        }
      } else {
        // Tranche is not fully paid
        if (refDateObj > dateLimitObj) {
          statut = 'retard_non_respecte';
          nbEcheancesNonRespectees++;
          totalEnRetard += montantResteTranche;
          const diffTime = refDateObj.getTime() - dateLimitObj.getTime();
          joursDeRetard = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else {
          statut = 'a_echoir';
        }
      }

      return {
        id: cfg.id,
        numero: cfg.numero,
        label: cfg.label,
        dateLimite: cfg.dateLimite,
        montantTranche,
        montantCumuleExigible,
        montantPayeAttribue,
        montantResteTranche,
        statut,
        joursDeRetard,
        dateDernierVersement
      };
    });

    let statutGlobal: 'a_jour' | 'en_retard' | 'non_commence' | 'solde' = 'a_jour';
    if (resteTotal === 0) {
      statutGlobal = 'solde';
    } else if (totalPaye === 0 && nbEcheancesNonRespectees > 0) {
      statutGlobal = 'non_commence';
    } else if (nbEcheancesNonRespectees > 0) {
      statutGlobal = 'en_retard';
    } else {
      statutGlobal = 'a_jour';
    }

    return {
      eleve,
      fraisTotal,
      totalPaye,
      resteTotal,
      tauxPaiement,
      totalEnRetard,
      nbEcheancesNonRespectees,
      nbEcheancesSoldees,
      echeances,
      paiements: studentPayments,
      statutGlobal
    };
  },

  getAllHistoriquesFinanciers(
    state: AppState,
    dateReference: string = new Date().toISOString().split('T')[0]
  ): HistoriqueFinancierEleve[] {
    return (state.eleves || [])
      .map(e => this.calculerHistoriqueFinancierEleve(state, e.matricule, dateReference))
      .filter((h): h is HistoriqueFinancierEleve => h !== null);
  }
};
