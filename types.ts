export type Semestre = 'S1' | 'S2';

export interface Parametres {
  nomEtablissement: string;
  ligne1: string;
  ligne2: string;
  ligne3: string;
  ville: string;
  anneeScolaire: string;
  bareme: number;
  seuilReussite: number;
  seuilsAppreciation: Array<{ label: string; min: number }>;
  seuilRedoublement: number;
  seuilExclusion: number;
  mentions: Array<{ label: string; min: number }>;
  niveaux: string[];
  series: string[];
  codesNiveaux?: Record<string, string>;
  frais: Record<string, number>;
  creneaux: string[];
  jours: string[];
  creneauxParNiveau?: Record<string, string[]>;
  adminCode?: string;
  codeRecuperation?: string;
}

export type ParametresEtablissement = Parametres;
export type StatutFinal = 'Passe au niveau supérieur' | 'Redouble' | 'Exclu(e)' | string;
export type ArchiveScolaire = any;
export type Discipline = string;

export interface Eleve {
  matricule: string;
  civilite: 'M.' | 'Mlle' | 'Mme' | string;
  nom: string;
  niveau: string;
  serie: string;
  classe: string;
  sexe?: 'M' | 'F' | string;
  dateNaissance?: string;
  lieuNaissance?: string;
  statutInitial?: 'Passant(e)' | 'Redoublant(e)' | string;
  telParent1?: string | null;
  telParent2?: string | null;
  contactParent?: string | null;
}

export interface NoteDiscipline {
  moyClas: number | null;
  noteComp: number | null;
}

export interface NotesRow {
  matricule: string;
  Conduite?: number | null;
  [discipline: string]: any;
}

export interface Absence {
  matricule: string;
  nom: string;
  date: string;
  duree: number;
  motif: string;
  justifiee: 'Oui' | 'Non' | string;
}

export interface Sanction {
  matricule: string;
  nom: string;
  date: string;
  type: 'Retard' | 'Avertissement' | 'Blâme' | 'Consigne' | 'Exclusion temporaire' | 'Expulsion' | string;
  details: string;
  motif: string;
}

export interface Paiement {
  id?: string;
  noRecu?: string;
  date: string;
  matricule: string;
  nom: string;
  classe?: string;
  niveauSerie?: string;
  montant: number;
  mode?: 'Espèces' | 'Mobile Money' | 'Chèque' | 'Virement' | string;
  moyen?: string;
  motif?: string;
  tranche?: 'Inscription' | 'Tranche 1' | 'Tranche 2' | 'Tranche 3' | 'Solde' | 'Totalité' | string;
  anneeScolaire: string;
  observation?: string | null;
}

export interface EcheanceConfig {
  id: string;
  numero: number;
  label: string;
  pourcentage: number;
  dateLimite: string;
  description?: string;
}

export interface EcheanceEleveDetail {
  id: string;
  numero: number;
  label: string;
  dateLimite: string;
  montantTranche: number;
  montantCumuleExigible: number;
  montantPayeAttribue: number;
  montantResteTranche: number;
  statut: 'solde_a_temps' | 'solde_en_retard' | 'retard_non_respecte' | 'a_echoir';
  joursDeRetard: number;
  dateDernierVersement?: string;
}

export interface HistoriqueFinancierEleve {
  eleve: Eleve;
  fraisTotal: number;
  totalPaye: number;
  resteTotal: number;
  tauxPaiement: number;
  totalEnRetard: number;
  nbEcheancesNonRespectees: number;
  nbEcheancesSoldees: number;
  echeances: EcheanceEleveDetail[];
  paiements: Paiement[];
  statutGlobal: 'a_jour' | 'en_retard' | 'non_commence' | 'solde';
}

export interface ClasseItem {
  id: string;
  niveau: string;
  serie: string;
  nom: string;
  responsableId?: string | null;
}
export type Classe = ClasseItem;

export interface Professeur {
  id: string;
  civilite?: string;
  nom: string;
  matieres: string[];
  telephone?: string;
  email?: string;
  code?: string;
}

export interface Gestionnaire {
  id: string;
  nom: string;
  telephone?: string;
  email?: string;
  code?: string;
}

export interface EmploiDuTempsCell {
  id: string;
  classe: string;
  jour: string;
  creneau: string;
  discipline: string;
  professeurId?: string | null;
  professeurNom?: string;
  salle?: string;
}

export interface ArchiveDecisionItem {
  matricule: string;
  nom: string;
  sexe?: string;
  classe: string;
  statutInitial?: string;
  moyS1: number | null;
  moyS2: number | null;
  moyenneAnnuelle: number | null;
  rang?: number | null;
  mention?: string;
  decision: 'Passe au niveau supérieur' | 'Redouble' | 'Exclu(e)' | 'Diplômé(e)' | string;
  nouveauNiveau?: string;
  nouvelleClasse?: string;
  observation?: string;
}

export interface ArchiveStatistiques {
  effectifTotal: number;
  effectifEvalues: number;
  nbPassants: number;
  nbRedoublants: number;
  nbExclus: number;
  nbDiplomes: number;
  tauxPassage: number;
  tauxRedoublement: number;
  tauxExclusion: number;
  moyenneClasse: number | null;
  plusForteMoyenne: number | null;
  plusFaibleMoyenne: number | null;
}

export interface ArchiveClasse {
  id: string;
  anneeScolaire: string;
  classe: string;
  niveau: string;
  serie: string;
  dateCloture: string;
  professeurPrincipal?: string;
  presidentConseil?: string;
  chefEtablissement?: string;
  eleves: Eleve[];
  notesS1: NotesRow[];
  notesS2: NotesRow[];
  decisions: ArchiveDecisionItem[];
  statistiques: ArchiveStatistiques;
}

export interface ArchiveAnnee {
  anneeScolaire: string;
  dateCloture: string;
  classe?: string;
  eleves: Eleve[];
  notesS1: NotesRow[];
  notesS2: NotesRow[];
  absences?: Absence[];
  sanctions?: Sanction[];
  paiements?: Paiement[];
  decisions?: ArchiveDecisionItem[];
  statistiques?: ArchiveStatistiques;
  classes?: ArchiveClasse[];
  classesCloturees?: string[];
}

export interface ArchiveEleve extends Eleve {
  anneeScolaire: string;
  moyenneAnnuelle?: number | null;
  dateArchivage: string;
  motif?: string;
}

export interface ConvocationParent {
  id: string;
  matricule: string;
  nomEleve: string;
  classe: string;
  nomParent: string;
  contactParent: string;
  motif: string;
  motifDetail: string;
  dateRdv: string;
  heureRdv: string;
  lieuRdv: string;
  signataire: string;
  dateEmission: string;
  statut: 'En attente' | 'Honoré' | 'Annulé' | 'Non honoré';
  couponReconnaissance: boolean;
}

export type TypeEvaluation = 'Examen' | 'Devoir' | 'Interrogation';

export interface SectionSujet {
  id: string;
  titre: string;
  points?: number;
  contenu: string;
  consignesSpecifiques?: string;
}

export interface SujetEvaluation {
  id: string;
  type: TypeEvaluation;
  titre: string;
  discipline: string;
  classeOuNiveau: string;
  duree: string;
  coefficient: number;
  dateEvaluation: string;
  anneeScolaire: string;
  session?: string;
  consignes: string[];
  sections: SectionSujet[];
  baremeTotal: number;
  corrigeIndicatif?: string;
  auteur?: string;
}

export type CategorieAffiche =
  | 'Information'
  | 'Urgent'
  | 'Paiement'
  | 'Examen'
  | 'Reunion'
  | 'Vacances'
  | 'Discipline'
  | 'Culture';

export type CibleAffiche =
  | 'Tous'
  | 'Parents'
  | 'Eleves'
  | 'Enseignants'
  | 'Classes specifiques';

export type ThemeAffiche =
  | 'navy-gold'
  | 'emeraude'
  | 'rubis'
  | 'ardoise'
  | 'pourpre'
  | 'ambre';

export interface AfficheScolaire {
  id: string;
  numeroRef: string;
  titre: string;
  sousTitre?: string;
  categorie: CategorieAffiche;
  cible: CibleAffiche;
  classesCiblees?: string[];
  dateEmission: string;
  dateEvenement?: string;
  heureEvenement?: string;
  lieuEvenement?: string;
  corpsPrincipal: string;
  pointsCles: string[];
  consignesImportantes?: string[];
  contactBureau?: string;
  signataire: string;
  nomSignataire?: string;
  statut: 'Publié' | 'Brouillon' | 'Archivé';
  themeCouleur: ThemeAffiche;
  badgeSpecial?: string;
  afficherLogo?: boolean;
  afficherTampon?: boolean;
}

export type TypeAttestation =
  | 'Scolarite'
  | 'Frequentation'
  | 'Inscription'
  | 'Radiation'
  | 'Reussite';

export interface AttestationScolaire {
  id: string;
  numeroRef: string;
  typeAttestation: TypeAttestation;
  matricule: string;
  nomEleve: string;
  sexe?: 'M' | 'F' | string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  classe: string;
  niveau: string;
  serie?: string;
  anneeScolaire: string;
  dateDelivrance: string;
  motifDestination: string;
  organismeDestinataire?: string;
  signataire: string;
  nomSignataire: string;
  observations?: string;
  mentionPaiement?: string;
  statutEleve?: string;
  dateSortie?: string;
  nouvelEtablissement?: string;
  afficherLogo?: boolean;
  afficherTampon?: boolean;
  afficherFiligrane?: boolean;
  afficherCodeSecurite?: boolean;
}

export interface AppState {
  parametres: Parametres;
  disciplines: Discipline[];
  coefs: Record<string, Record<string, number>>;
  eleves: Eleve[];
  notesS1: NotesRow[];
  notesS2: NotesRow[];
  absences: Absence[];
  sanctions: Sanction[];
  paiements: Paiement[];
  classes: ClasseItem[];
  professeurs: Professeur[];
  gestionnaires: Gestionnaire[];
  emploiDuTemps: EmploiDuTempsCell[];
  convocations?: ConvocationParent[];
  sujets?: SujetEvaluation[];
  affiches?: AfficheScolaire[];
  attestations?: AttestationScolaire[];
  classesCloturees?: Record<string, { dateCloture: string; archiveId?: string; nbEleves?: number; anneeScolaire?: string }>;
  archives: {
    annees: ArchiveAnnee[];
    classes?: ArchiveClasse[];
    exclusions: ArchiveEleve[];
    diplomes: ArchiveEleve[];
  };
}

export interface UserSession {
  type: 'admin' | 'prof' | 'gestionnaire' | null;
  id: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}
