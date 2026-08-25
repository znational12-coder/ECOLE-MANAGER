import { ConvocationParent, SujetEvaluation, AfficheScolaire, AttestationScolaire } from '../types';

export const MODELES_ATTESTATIONS_DEFAUT: AttestationScolaire[] = [
  {
    id: 'att-001',
    numeroRef: 'ATT-2026/0142/CSP-LP/DIR',
    typeAttestation: 'Scolarite',
    matricule: 'TD1-001',
    nomEleve: 'Djibo Aïssatou',
    sexe: 'F',
    dateNaissance: '2008-04-12',
    lieuNaissance: 'Niamey',
    nationalite: 'Nigérienne',
    classe: 'TD1',
    niveau: 'Tle',
    serie: 'D',
    anneeScolaire: '2025-2026',
    dateDelivrance: '2026-03-01',
    motifDestination: 'Pour servir et valoir ce que de droit',
    organismeDestinataire: 'Toute administration compétente',
    signataire: 'Le Proviseur',
    nomSignataire: 'Dr. M. SOULEYMANE',
    observations: 'Élève assidue, ponctuelle et très appliquée.',
    mentionPaiement: 'En règle vis-à-vis des frais de scolarité',
    statutEleve: 'Passant(e)',
    afficherLogo: true,
    afficherTampon: true,
    afficherFiligrane: true,
    afficherCodeSecurite: true
  },
  {
    id: 'att-002',
    numeroRef: 'CERT-2026/0088/CSP-LP/DIR',
    typeAttestation: 'Frequentation',
    matricule: 'TD1-002',
    nomEleve: 'Elhadji Souley',
    sexe: 'M',
    dateNaissance: '2007-09-25',
    lieuNaissance: 'Maradi',
    nationalite: 'Nigérienne',
    classe: 'TD1',
    niveau: 'Tle',
    serie: 'D',
    anneeScolaire: '2025-2026',
    dateDelivrance: '2026-03-02',
    motifDestination: 'Dossier d\'Allocations Familiales & Prise en Charge',
    organismeDestinataire: 'Caisse Nationale de Sécurité Sociale (CNSS)',
    signataire: 'Le Proviseur',
    nomSignataire: 'Dr. M. SOULEYMANE',
    observations: 'Fréquente régulièrement les cours théoriques et pratiques.',
    mentionPaiement: 'Scolarité soldée',
    statutEleve: 'Passant(e)',
    afficherLogo: true,
    afficherTampon: true,
    afficherFiligrane: true,
    afficherCodeSecurite: true
  },
  {
    id: 'att-003',
    numeroRef: 'ATT-2026/0204/CSP-LP/DIR',
    typeAttestation: 'Inscription',
    matricule: 'TD2-001',
    nomEleve: 'Abdoulaye Abdou Nadia',
    sexe: 'F',
    dateNaissance: '2008-01-18',
    lieuNaissance: 'Zinder',
    nationalite: 'Nigérienne',
    classe: 'TD2',
    niveau: 'Tle',
    serie: 'D',
    anneeScolaire: '2025-2026',
    dateDelivrance: '2026-02-15',
    motifDestination: 'Dossier de Bourse & Prise en Charge Employeur',
    organismeDestinataire: 'Agence Nationale des Bourses du Niger (ANAB)',
    signataire: 'Le Directeur Général',
    nomSignataire: 'Dr. M. SOULEYMANE',
    observations: 'Régulièrement inscrite au registre matricule sous le N° TD2-001.',
    mentionPaiement: 'Frais d\'inscription et 1ère tranche entièrement régularisés',
    statutEleve: 'Passant(e)',
    afficherLogo: true,
    afficherTampon: true,
    afficherFiligrane: true,
    afficherCodeSecurite: true
  },
  {
    id: 'att-004',
    numeroRef: 'RAD-2026/0019/CSP-LP/DIR',
    typeAttestation: 'Radiation',
    matricule: 'TD2-002',
    nomEleve: 'Boureima Oumarou Salim',
    sexe: 'M',
    dateNaissance: '2007-11-03',
    lieuNaissance: 'Tahoua',
    nationalite: 'Nigérienne',
    classe: 'TD2',
    niveau: 'Tle',
    serie: 'D',
    anneeScolaire: '2025-2026',
    dateDelivrance: '2026-02-20',
    motifDestination: 'Transfert d\'établissement pour cause de mutation parentale',
    organismeDestinataire: 'Direction du nouvel établissement d\'accueil',
    signataire: 'Le Proviseur',
    nomSignataire: 'Dr. M. SOULEYMANE',
    observations: 'Quitte l\'établissement libre de tout engagement financier. Bonne conduite.',
    mentionPaiement: 'Compte financier soldé au 20 Février 2026',
    statutEleve: 'Rayé(e) des contrôles',
    dateSortie: '2026-02-20',
    nouvelEtablissement: 'Lycée Privé d\'Excellence de Tahoua',
    afficherLogo: true,
    afficherTampon: true,
    afficherFiligrane: true,
    afficherCodeSecurite: true
  },
  {
    id: 'att-005',
    numeroRef: 'SUCC-2026/0067/CSP-LP/DIR',
    typeAttestation: 'Reussite',
    matricule: 'TD1-003',
    nomEleve: 'Garba Mahamadou Fadel',
    sexe: 'M',
    dateNaissance: '2008-06-30',
    lieuNaissance: 'Niamey',
    nationalite: 'Nigérienne',
    classe: 'TD1',
    niveau: 'Tle',
    serie: 'D',
    anneeScolaire: '2025-2026',
    dateDelivrance: '2026-03-01',
    motifDestination: 'Candidature aux Concours d\'Entrée dans les Grandes Écoles',
    organismeDestinataire: 'Commissions d\'Orientation Universitaire',
    signataire: 'Le Proviseur',
    nomSignataire: 'Dr. M. SOULEYMANE',
    observations: 'A obtenu le Tableau d\'Honneur avec Félicitations du Conseil des Professeurs.',
    mentionPaiement: 'Scolarité à jour',
    statutEleve: 'Admis(e) avec Mention',
    afficherLogo: true,
    afficherTampon: true,
    afficherFiligrane: true,
    afficherCodeSecurite: true
  }
];

export const MOTIFS_PREDEFINIS_ATTESTATION = [
  'Pour servir et valoir ce que de droit',
  'Caisse Nationale de Sécurité Sociale (CNSS) - Allocations familiales',
  'Dossier de Bourse Nationale (ANAB) & Aides aux études',
  'Demande de Passeport & Carte Nationale d\'Identité',
  'Dossier Consulaire & Demande de Visa d\'études',
  'Comité d\'Entreprise & Prise en Charge Employeur',
  'Organisme d\'Assurance Médicale & Mutuelle de Santé',
  'Dossier Bancaire & Ouverture de Compte Épargne Mineur',
  'Transfert scolaire & Inscription dans un autre établissement',
  'Inscription aux Concours Nationaux & Écoles Militaires/Civiles'
];

export const ORGANISMES_PREDEFINIS_ATTESTATION = [
  'Toute administration compétente',
  'Caisse Nationale de Sécurité Sociale (CNSS)',
  'Agence Nationale des Bourses du Niger (ANAB)',
  'Direction de la Surveillance du Territoire (Passeports)',
  'Service des Affaires Sociales / Ministère',
  'Ambassade / Consulat',
  'Banque / Institution de Microfinance',
  'Direction Régionale de l\'Éducation Nationale (DREN)'
];

export const MODELES_AFFICHES_DEFAUT: AfficheScolaire[] = [
  {
    id: 'aff-001',
    numeroRef: 'COMMUNIQUÉ N° 024/CSP-LP/DIR/2026',
    titre: 'CALENDRIER DES ÉPREUVES DU BACCALAURÉAT BLANC & BEPC BLANC',
    sousTitre: 'Session Préparatoire Officielle 2025-2026 — Séries A, C, D & Troisième',
    categorie: 'Examen',
    cible: 'Tous',
    classesCiblees: ['3e', '1ere-A', '1ere-D', 'Tle-A', 'Tle-C', 'Tle-D'],
    dateEmission: '2026-03-01',
    dateEvenement: 'Du Lundi 18 au Vendredi 22 Mai 2026',
    heureEvenement: 'Dès 07h30 précises chaque matin',
    lieuEvenement: 'Salles d\'examen du Pavillon Central & Cour A',
    corpsPrincipal: "La Direction Générale et le Censorat des Études du Complexe Scolaire Privé La Persévérance informent l'ensemble des élèves candidats et leurs parents du déroulement officiel de la session des examens blancs régionaux. Cette session est un baromètre déterminant pour la validation des dossiers d'examen d'État.",
    pointsCles: [
      "Convocation obligatoire et port de l'uniforme officiel complet dès 07h00.",
      "Accès aux salles strictement verrouillé 15 minutes avant le début de chaque épreuve.",
      "Calculatrices scientifiques autorisées uniquement pour les épreuves de Mathématiques, Sciences Physiques et SVT.",
      "La présence de tous les candidats est impérative sous peine d'une note éliminatoire de zéro."
    ],
    consignesImportantes: [
      "Téléphones portables et tout objet connecté strictement prohibés dans les salles d'examen.",
      "Présenter obligatoirement la carte scolaire en cours de validité avec photo récente.",
      "Les résultats et corrigés détaillés seront proclamés le Vendredi 29 Mai 2026."
    ],
    contactBureau: 'Secrétariat Général & Censorat : (+227) 20 73 00 00 / 90 12 34 56',
    signataire: 'Le Proviseur',
    nomSignataire: 'Dr. M. SOULEYMANE',
    statut: 'Publié',
    themeCouleur: 'navy-gold',
    badgeSpecial: 'OFFICIEL & IMPÉRATIF',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-002',
    numeroRef: 'AVIS N° 018/CSP-LP/INT/2026',
    titre: 'AVIS DE RECOUVREMENT : ÉCHÉANCE DE LA 2ÈME TRANCHE DE SCOLARITÉ',
    sousTitre: 'Régularisation financière obligatoire avant la clôture du 2ème Semestre',
    categorie: 'Paiement',
    cible: 'Parents',
    dateEmission: '2026-02-15',
    dateEvenement: 'Date Limite : 10 Mars 2026',
    heureEvenement: 'Guichets ouverts de 07h30 à 16h30',
    lieuEvenement: 'Bureau de la Comptabilité & Guichets Caisse',
    corpsPrincipal: "L'Économe et la Direction Administrative rappellent à l'aimable attention des parents d'élèves que l'échéance de versement de la deuxième tranche des frais de scolarité pour l'année scolaire 2025-2026 est fixée au 10 Mars 2026. Tout retard expose l'élève à une suspension temporaire d'accès aux évaluations semestrielles.",
    pointsCles: [
      "Modes de règlement acceptés : Espèces à la caisse de l'école, Virement bancaire, ou Mobile Money (Airtel Money / Moov Money).",
      "Délivrance immédiate d'un reçu officiel numéroté pour tout paiement effectué.",
      "Pour tout accord de moratoire ou plan échelonné, veuillez vous rapprocher d'urgence de la Direction."
    ],
    consignesImportantes: [
      "Conservez soigneusement votre reçu pour toute vérification lors du retrait des bulletins de notes.",
      "Les chèques sans provision feront l'objet de poursuites et de frais de rejet administratifs."
    ],
    contactBureau: 'Service de l\'Intendance et Caisse : (+227) 96 11 22 33',
    signataire: 'L\'Économe / Le Gestionnaire',
    nomSignataire: 'M. I. HAROUNA',
    statut: 'Publié',
    themeCouleur: 'rubis',
    badgeSpecial: 'RAPPEL ÉCHÉANCE',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-003',
    numeroRef: 'CONVOCATION N° 009/APE-CSP/2026',
    titre: 'ASSEMBLÉE GÉNÉRALE ANNUELLE DE L\'ASSOCIATION DES PARENTS D\'ÉLÈVES',
    sousTitre: 'Bilan Pédagogique à mi-parcours, Projets d\'infrastructure & Élection du Bureau',
    categorie: 'Reunion',
    cible: 'Parents',
    dateEmission: '2026-03-05',
    dateEvenement: 'Samedi 28 Mars 2026',
    heureEvenement: 'À partir de 09h00 précises',
    lieuEvenement: 'Grande Salle de Conférence du Complexe',
    corpsPrincipal: "Le Bureau Exécutif de l'Association des Parents d'Élèves (APE) en accord avec la Direction de l'Établissement a l'honneur de convier tous les parents et tuteurs légaux d'élèves à la session ordinaire de l'Assemblée Générale annuelle.",
    pointsCles: [
      "Ordre du jour : 1. Rapport d'activités et bilan financier 2025-2026.",
      "2. Point sur les performances scolaires et les cours de renforcement.",
      "3. Projet d'équipement du laboratoire d'informatique et de sciences.",
      "4. Questions diverses et cocktail de fraternité."
    ],
    consignesImportantes: [
      "Votre présence et vos contributions sont essentielles pour l'avenir et l'épanouissement de nos enfants.",
      "Possibilité d'émargement et d'échange direct avec les enseignants à la fin de la séance."
    ],
    contactBureau: 'Secrétariat APE : (+227) 92 33 44 55',
    signataire: 'Le Président de l\'APE & Le Proviseur',
    nomSignataire: 'Elhadj B. MAHAMAN & Dr. M. SOULEYMANE',
    statut: 'Publié',
    themeCouleur: 'emeraude',
    badgeSpecial: 'AVIS AUX FAMILLES',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-004',
    numeroRef: 'NOTE CIRCULAIRE N° 031/CSP-LP/SURV/2026',
    titre: 'RÈGLEMENT DE DISCIPLINE : PORT DE L\'UNIFORME & PONCTUALITÉ',
    sousTitre: 'Rappel des règles de vie scolaire et respect des valeurs d\'excellence',
    categorie: 'Discipline',
    cible: 'Eleves',
    dateEmission: '2026-02-01',
    dateEvenement: 'Application immédiate et permanente',
    heureEvenement: 'Fermeture du portail à 07h30',
    lieuEvenement: 'Ensemble de l\'enceinte scolaire',
    corpsPrincipal: "Il a été constaté un relâchement inacceptable concernant le respect de la tenue scolaire réglementaire et des retards répétés lors du rassemblement matinal de la montée des couleurs nationales. La Direction rappelle avec fermeté que la discipline est le socle de la réussite.",
    pointsCles: [
      "Port de la chemise bleue ciel réglementaire et du pantalon/jupe bleu marine strictement obligatoire.",
      "Coiffures excentriques, bijoux voyants, sandales et vêtements civils formellement interdits.",
      "Rassemblement et montée du drapeau national chaque lundi à 07h25 en présence de tous les élèves et professeurs."
    ],
    consignesImportantes: [
      "Tout élève en retard ou en tenue non conforme sera refoulé ou consigné le samedi matin.",
      "Les parents sont invités à veiller au départ ponctuel de leurs enfants depuis le domicile."
    ],
    contactBureau: 'Bureau de la Surveillance Générale',
    signataire: 'Le Surveillant Général',
    nomSignataire: 'M. O. TANKO',
    statut: 'Publié',
    themeCouleur: 'ardoise',
    badgeSpecial: 'DISCIPLINE & RIGUEUR',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-005',
    numeroRef: 'COMMUNIQUÉ N° 045/CSP-LP/DIR/2026',
    titre: 'CALENDRIER DES CONGÉS DE FIN DU 2ÈME TRIMESTRE & REPRISE DES COURS',
    sousTitre: 'Arrêt des cours, devoirs de vacances et dates officielles de reprise',
    categorie: 'Vacances',
    cible: 'Tous',
    dateEmission: '2026-03-20',
    dateEvenement: 'Du Vendredi 03 Avril après les cours au Lundi 20 Avril 2026',
    heureEvenement: 'Reprise des cours le Lundi 20 Avril à 07h30',
    lieuEvenement: 'Toutes les classes',
    corpsPrincipal: "La Direction du Complexe Scolaire Privé La Persévérance porte à la connaissance des élèves, des enseignants et des parents que les congés de fin de deuxième trimestre débuteront le Vendredi 03 Avril 2026 après les cours de l'après-midi. La reprise des cours est impérativement fixée au Lundi 20 Avril 2026 à 07h30.",
    pointsCles: [
      "Remise des fascicules de devoirs de vacances obligatoire pour les classes d'examen (3e et Terminales).",
      "Permanence administrative et comptable assurée tous les matins ouvrables de 08h00 à 13h00.",
      "Séances de soutien scolaire intensif gratuites organisées pour les candidats au BAC et BEPC du 08 au 15 Avril."
    ],
    consignesImportantes: [
      "Les élèves sont tenus de réviser méthodiquement l'ensemble des programmes en vue des examens finaux.",
      "Toute absence non justifiée dès le premier jour de la reprise fera l'objet d'une sanction exemplaire."
    ],
    contactBureau: 'Direction Générale : contact@laperseverance-niamey.ne',
    signataire: 'Le Proviseur',
    nomSignataire: 'Dr. M. SOULEYMANE',
    statut: 'Publié',
    themeCouleur: 'pourpre',
    badgeSpecial: 'AVIS DE VACANCES',
    afficherLogo: true,
    afficherTampon: true
  }
];

export const MODELES_CONVOCATIONS_DEFAUT: ConvocationParent[] = [
  {
    id: 'conv-001',
    matricule: 'TD2-001',
    nomEleve: 'Abdoulaye Abdou Nadia',
    classe: 'TD2',
    nomParent: 'M. Abdoulaye Abdou',
    contactParent: '+227 90 12 34 56',
    motif: 'Retards et absences répétés',
    motifDetail: 'Nous constatons des absences répétées et des retards injustifiés au cours de la première heure de cours (Mathématiques et Sciences Physiques). Une concertation avec les parents est requise.',
    dateRdv: '2026-03-05',
    heureRdv: '10h00',
    lieuRdv: 'Bureau du Censeur des Études',
    signataire: 'Le Censeur des Études',
    dateEmission: '2026-02-28',
    statut: 'En attente',
    couponReconnaissance: true
  },
  {
    id: 'conv-002',
    matricule: 'TD1-002',
    nomEleve: 'Elhadji Souley',
    classe: 'TD1',
    nomParent: 'M. Souley Mamane',
    contactParent: '+227 96 44 22 11',
    motif: 'Conseil de Discipline & Manquement au Règlement',
    motifDetail: 'Suite à des actes d\'indiscipline caractérisée et perturbation récurrente des cours en salle de classe, vous êtes prié de vous présenter personnellement pour l\'audition préalable au Conseil de Discipline.',
    dateRdv: '2026-03-10',
    heureRdv: '09h30',
    lieuRdv: 'Salle du Conseil (Direction)',
    signataire: 'Le Proviseur',
    dateEmission: '2026-03-01',
    statut: 'En attente',
    couponReconnaissance: true
  },
  {
    id: 'conv-003',
    matricule: 'TD1-001',
    nomEleve: 'Djibo Aïssatou',
    classe: 'TD1',
    nomParent: 'Mme Djibo Fatouma',
    contactParent: '+227 91 88 77 66',
    motif: 'Entretien pédagogique et Orientation Post-Bac',
    motifDetail: 'Dans le cadre du suivi de l\'excellence et de la préparation aux concours internationaux et bourses d\'études supérieures, la direction sollicite un entretien d\'orientation.',
    dateRdv: '2026-03-12',
    heureRdv: '15h00',
    lieuRdv: 'Bureau du Proviseur',
    signataire: 'Le Proviseur',
    dateEmission: '2026-03-02',
    statut: 'Honoré',
    couponReconnaissance: true
  }
];

export const MOTIFS_PREDEFINIS_CONVOCATION = [
  {
    titre: 'Retards et absences injustifiés',
    signataire: 'Le Censeur des Études',
    lieu: 'Bureau du Censeur des Études',
    detail: 'Constat d\'absences récurrentes non justifiées et retards portant préjudice au bon déroulement de la scolarité de l\'élève.'
  },
  {
    titre: 'Baisse notable des résultats scolaires & Remédiation',
    signataire: 'Le Censeur des Études',
    lieu: 'Bureau du Censeur des Études',
    detail: 'Une baisse significative de la moyenne générale a été constatée au cours de ce semestre. Une mise au point pédagogique avec la famille est nécessaire.'
  },
  {
    titre: 'Indiscipline et manquement au règlement intérieur',
    signataire: 'Le Surveillant Général',
    lieu: 'Bureau de la Vie Scolaire',
    detail: 'Comportement non conforme aux exigences du règlement intérieur de l\'établissement. Un avertissement formel et une prise d\'engagement sont requis.'
  },
  {
    titre: 'Audition pour Conseil de Discipline',
    signataire: 'Le Proviseur',
    lieu: 'Salle de réunion de la Direction',
    detail: 'Convocation formelle des représentants légaux de l\'élève devant les membres du Conseil de Discipline statuant sur des faits graves.'
  },
  {
    titre: 'Régularisation des frais de scolarité',
    signataire: 'L\'Économe / Le Gestionnaire',
    lieu: 'Bureau de la Comptabilité',
    detail: 'Dépassement du délai de paiement convenu pour la scolarité. Veuillez vous présenter d\'urgence pour convenir d\'un moratoire ou solder les frais.'
  },
  {
    titre: 'Orientation et suivi des examens d\'État (BEPC / Baccalauréat)',
    signataire: 'Le Proviseur',
    lieu: 'Bureau du Proviseur',
    detail: 'Échange constructif sur le projet d\'orientation de l\'élève et validation des pièces du dossier d\'examen officiel.'
  }
];

export const MODELES_SUJETS_DEFAUT: SujetEvaluation[] = [
  {
    id: 'sujet-bac-d-maths',
    type: 'Examen',
    titre: 'Examen Blanc Régional du Baccalauréat — Série D',
    discipline: 'Mathématiques',
    classeOuNiveau: 'Tle-D',
    duree: '4 heures',
    coefficient: 5,
    dateEvaluation: '2026-05-15',
    anneeScolaire: '2025-2026',
    session: 'Session de Mai 2026',
    baremeTotal: 20,
    auteur: 'Inspection Pédagogique Régionale de Niamey',
    consignes: [
      "L'usage de la calculatrice scientifique non programmable est strictement autorisé.",
      "La clarté de la rédaction, le soin apporté aux figures et la rigueur des raisonnements seront pris en compte dans l'évaluation.",
      "Le candidat doit traiter obligatoirement les deux exercices et le problème."
    ],
    sections: [
      {
        id: 'sec-1',
        titre: 'Exercice 1 : Nombres complexes et Géométrie plane',
        points: 4,
        contenu: `1. Résoudre dans l'ensemble ℂ des nombres complexes l'équation :
   z² - 2(√3 + i)z + 4 + 4i√3 = 0.
2. Soit les points A, B et C d'affixes respectives :
   z_A = √3 + i,  z_B = 1 + i√3,  z_C = 2√3 - 2i.
   a) Écrire z_A et z_B sous forme trigonométrique et exponentielle.
   b) Déterminer la nature exacte du triangle OAB.
   c) Démontrer que les points A, B, C et l'origine O appartiennent à un même cercle (Γ) dont on précisera le centre et le rayon.`
      },
      {
        id: 'sec-2',
        titre: 'Exercice 2 : Probabilités et Variables Aléatoires',
        points: 4,
        contenu: `Une urne contient 4 boules blanches numérotées de 1 à 4, 3 boules noires numérotées de 1 à 3, et 2 boules vertes numérotées 1 et 2. Toutes les boules sont indiscernables au toucher.
On tire simultanément et au hasard 3 boules de l'urne.

1. Calculer la probabilité des événements suivants :
   - A : « Obtenir trois boules de la même couleur »
   - B : « Obtenir au moins une boule blanche »
   - C : « Obtenir un produit des trois numéros tirés égal à 6 »
2. Soit X la variable aléatoire désignant le nombre de boules blanches obtenues parmi les 3 tirées.
   a) Déterminer la loi de probabilité de X.
   b) Calculer l'espérance mathématique E(X) et la variance V(X).`
      },
      {
        id: 'sec-3',
        titre: 'Problème : Étude d\'une fonction logarithmique et Calcul d\'Aire',
        points: 12,
        contenu: `Partie A :
Soit g la fonction numérique définie sur ]0, +∞[ par : g(x) = x² - 2 + 2 ln(x).
1. Étudier les variations de g sur ]0, +∞[ et dresser son tableau de variation.
2. Démontrer que l'équation g(x) = 0 admet une unique solution α dans l'intervalle [1, 1.5]. Donner un encadrement de α à 10⁻² près.
3. En déduire le signe de g(x) sur ]0, +∞[.

Partie B :
Soit f la fonction définie sur ]0, +∞[ par : f(x) = x - 2 - (2 ln(x)) / x.
On note (C_f) sa courbe représentative dans un repère orthonormé (O, i, j) (unité graphique : 2 cm).
1. Calculer la limite de f en 0⁺ et en +∞. Interpréter graphiquement.
2. Démontrer que la droite (D) d'équation y = x - 2 est asymptote oblique à (C_f) en +∞. Étudier la position relative de (C_f) par rapport à (D).
3. Démontrer que pour tout x > 0, f'(x) = g(x) / x². En déduire le tableau de variation de f.
4. Tracer soigneusement la droite (D) et la courbe (C_f).
5. Calculer en cm² l'aire du domaine délimité par la courbe (C_f), la droite (D) et les droites d'équations x = 1 et x = e.`
      }
    ],
    corrigeIndicatif: "Partie A : g'(x) = 2x + 2/x > 0 sur ]0, +∞[. Racine unique α ≈ 1.28. Partie B : Asymptote oblique y = x - 2, intégrale de ln(x)/x = [1/2 ln(x)²]."
  },
  {
    id: 'sujet-bepc-francais',
    type: 'Examen',
    titre: 'Examen Blanc du Brevet d\'Études du Premier Cycle (BEPC)',
    discipline: 'Français',
    classeOuNiveau: '3e',
    duree: '2 heures',
    coefficient: 3,
    dateEvaluation: '2026-05-20',
    anneeScolaire: '2025-2026',
    session: 'Session Officielle 2026',
    baremeTotal: 20,
    auteur: 'Commission Nationale des Examens',
    consignes: [
      "Le sujet comprend une épreuve de compréhension/maniement de la langue et un sujet d'expression écrite au choix.",
      "L'usage du dictionnaire n'est pas autorisé.",
      "Soignez votre écriture et évitez les ratures."
    ],
    sections: [
      {
        id: 'sec-texte',
        titre: 'Texte d\'appui : L\'importance de l\'éducation pour la jeunesse',
        points: 0,
        contenu: `« Dans les villages sahéliens comme dans les cités urbaines modernes, l'école demeure le phare inestimable qui éclaire l'avenir des peuples. Un jeune instruit ne subit pas passivement le monde ; il le comprend, l'analyse et devient l'artisan de sa propre liberté. À travers les sciences, l'histoire et les lettres, il bâtit les ponts de la concorde, combat la précarité et protège l'environnement fragile qui nous nourrit. Chaque cahier ouvert est une porte fermée à l'ignorance. »\n\n— D'après une tribune sur le développement durable au Sahel.`
      },
      {
        id: 'sec-comp',
        titre: 'I. Compréhension du texte et Vocabulaire',
        points: 6,
        contenu: `1. Proposez un titre adapté à ce texte et justifiez votre choix en deux lignes. (2 pts)
2. Selon l'auteur, pourquoi un jeune instruit est-il qualifié d'« artisan de sa propre liberté » ? (2 pts)
3. Donnez un synonyme du mot « inestimable » et expliquez le sens de l'expression : « phare inestimable ». (2 pts)`
      },
      {
        id: 'sec-gramm',
        titre: 'II. Maniement et Grammaire de la langue',
        points: 6,
        contenu: `1. Donnez la nature et la fonction grammaticale des mots soulignés : « inestimable », « qui nous nourrit ». (2 pts)
2. Soit la phrase : « Un jeune instruit comprend le monde, il devient l'artisan de sa liberté. »
   Transformez cette proposition juxtaposée en une proposition complexe exprimant une relation de conséquence. (2 pts)
3. Mettez la phrase suivante au subjonctif présent : « Il faut que chaque élève (comprendre) l'importance du savoir et (faire) honneur à sa patrie. » (2 pts)`
      },
      {
        id: 'sec-redaction',
        titre: 'III. Expression Écrite / Rédaction (Traiter un seul sujet au choix)',
        points: 8,
        contenu: `Sujet 1 (Texte argumentatif) :
« De nos jours, certains jeunes négligent leurs études au profit des réseaux sociaux et des gains faciles. »
Dans un texte argumenté et bien structuré d'une vingtaine de lignes, vous démontrerez à vos camarades l'importance cruciale d'une formation scolaire rigoureuse pour réussir sa vie.

Sujet 2 (Texte narratif) :
Racontez une journée mémorable où une action collective d'élèves de votre établissement (reboisement, nettoyage, aide à un camarade) a positivement transformé votre école.`
      }
    ]
  },
  {
    id: 'sujet-ds-sp-tle-d',
    type: 'Devoir',
    titre: 'Devoir Surveillé N°1 du 1er Semestre — Sciences Physiques',
    discipline: 'Sciences Physiques',
    classeOuNiveau: 'Tle-D',
    duree: '2 heures',
    coefficient: 4,
    dateEvaluation: '2025-11-20',
    anneeScolaire: '2025-2026',
    baremeTotal: 20,
    auteur: 'M. Moumouni Salifou (Professeur Principal)',
    consignes: [
      "Les deux parties (Chimie et Physique) sont obligatoires.",
      "Toutes les grandeurs doivent être exprimées avec leurs unités correctes dans le Système International."
    ],
    sections: [
      {
        id: 'sec-chimie',
        titre: 'Partie 1 : Chimie Générale — Cinétique et Dosage Acido-Basique',
        points: 8,
        contenu: `On réalise le dosage d'un volume V_A = 20 mL d'une solution d'acide chlorhydrique (H3O⁺ + Cl⁻) de concentration molaire C_A inconnue par une solution d'hydroxyde de sodium (Na⁺ + OH⁻) de concentration C_B = 0,10 mol/L.

1. Écrire l'équation-bilan de la réaction support de ce dosage. (1 pt)
2. Définir l'équivalence acido-basique. (1 pt)
3. À l'équivalence, le volume de base versé est V_BE = 15,4 mL. Calculer la concentration C_A de la solution acide. (2 pts)
4. On s'intéresse à présent à la cinétique de dismutation des ions thiosulfate. Donner la définition d'un facteur cinétique et citer deux facteurs permettant d'accélérer cette réaction. (4 pts)`
      },
      {
        id: 'sec-physique',
        titre: 'Partie 2 : Physique — Mouvement dans un Champ Électrique Uniforme',
        points: 12,
        contenu: `Un proton de masse m = 1,67 × 10⁻²⁷ kg et de charge q = +1,6 × 10⁻¹⁹ C pénètre en un point O avec une vitesse horizontale v_0 = 2 × 10⁵ m/s entre deux plaques planes parallèles horizontales P₁ et P₂ distantes de d = 5 cm et de longueur L = 10 cm. Une tension U = V_P1 - V_P2 = 500 V est appliquée entre les armatures.

1. Déterminer les caractéristiques (sens, direction, norme) du champ électrostatique E créé entre les deux plaques. (2 pts)
2. En appliquant le théorème du centre d'inertie (2e loi de Newton) au proton dans le repère (O, i, j), établir les équations horaires de la trajectoire x(t) et y(t). (4 pts)
3. En déduire l'équation cartésienne de la trajectoire du proton entre les armatures. (2 pts)
4. Calculer la déviation verticale subie par le proton à la sortie des plaques (x = L). Le proton heurte-t-il l'une des plaques ? (4 pts)`
      }
    ]
  },
  {
    id: 'sujet-ds-svt-3e',
    type: 'Devoir',
    titre: 'Devoir Surveillé N°2 du 2nd Semestre — SVT',
    discipline: 'Sciences de la Vie et de la Terre',
    classeOuNiveau: '3e',
    duree: '1 heure 30 minutes',
    coefficient: 2,
    dateEvaluation: '2026-03-18',
    anneeScolaire: '2025-2026',
    baremeTotal: 20,
    auteur: 'Mme Amina Zeinabou',
    consignes: [
      "Répondez avec précision et clarté aux questions posées.",
      "Soignez les schémas demandés."
    ],
    sections: [
      {
        id: 'sec-svt-1',
        titre: 'I. Restitution Organisée des Connaissances',
        points: 8,
        contenu: `1. Définir les termes suivants : Antigène, Anticorps, Phagocytose, Sérothérapie. (4 pts)
2. Établir sous forme de tableau comparatif les différences fondamentales entre la vaccination et la sérothérapie (principe, délai d'action, durée de protection). (4 pts)`
      },
      {
        id: 'sec-svt-2',
        titre: 'II. Raisonnement Scientifique et Analyse de Documents',
        points: 12,
        contenu: `Lors d'une blessure cutanée survenue au cours d'un travail manuel, une rougeur, un gonflement et une sensation de chaleur apparaissent rapidement.

1. Nommer cette réaction initiale de défense de l'organisme et indiquer les cellules immunitaires qui interviennent en premier. (3 pts)
2. Décrire précisément les 4 étapes de la phagocytose en réalisant un schéma annoté. (5 pts)
3. Expliquer pourquoi la mémoire immunitaire permet à l'organisme d'éliminer plus rapidement un microbe lors d'un second contact. (4 pts)`
      }
    ]
  },
  {
    id: 'sujet-interro-hg-1ere',
    type: 'Interrogation',
    titre: 'Interrogation Écrite N°1 — Histoire & Géographie',
    discipline: 'Histoire-Géographie',
    classeOuNiveau: '1ere-A',
    duree: '45 minutes',
    coefficient: 2,
    dateEvaluation: '2025-10-28',
    anneeScolaire: '2025-2026',
    baremeTotal: 20,
    auteur: 'Département des Sciences Humaines',
    consignes: [
      "Répondez directement sur votre copie.",
      "Durée stricte de 45 minutes."
    ],
    sections: [
      {
        id: 'sec-hg-qcm',
        titre: 'Partie 1 : Contrôle des Définitions et Repères Historiques',
        points: 6,
        contenu: `1. En quelle année s'est tenue la Conférence de Berlin et quel était son objectif principal ? (2 pts)
2. Définir : Impérialisme, Protectorat, Colonie de peuplement. (3 pts)
3. Citer deux grandes figures historiques de la résistance nigérienne face à la pénétration coloniale. (1 pt)`
      },
      {
        id: 'sec-hg-synth',
        titre: 'Partie 2 : Question de Synthèse et Analyse Géographique',
        points: 14,
        contenu: `À partir de vos connaissances personnelles, expliquez en une quinzaine de lignes les principaux atouts et contraintes physiques du climat sahélien sur les activités agro-pastorales au Niger. Vous mettrez en relief les stratégies d'adaptation développées par les populations locales (cultures irriguées, barrages hydro-agricoles, récupération des terres dégradées). (14 pts)`
      }
    ]
  },
  {
    id: 'sujet-interro-philo-tle',
    type: 'Interrogation',
    titre: 'Interrogation Écrite — Philosophie : La Conscience et l\'Inconscient',
    discipline: 'Philosophie',
    classeOuNiveau: 'Tle-A',
    duree: '45 minutes',
    coefficient: 5,
    dateEvaluation: '2025-11-14',
    anneeScolaire: '2025-2026',
    baremeTotal: 20,
    auteur: 'M. Harouna Ousmane',
    consignes: [
      "La précision conceptuelle et l'emploi pertinent des citations philosophiques sont exigés."
    ],
    sections: [
      {
        id: 'sec-philo-1',
        titre: 'Questions de Cours et Analyse Conceptuelle',
        points: 8,
        contenu: `1. Expliquez le célèbre aphorisme cartésien : « Cogito ergo sum » (Je pense, donc je suis). En quoi fonde-t-il la certitude première de la conscience ? (4 pts)
2. Distinguez nettement la conscience immédiate (ou spontanée) de la conscience réfléchie (ou morale). (4 pts)`
      },
      {
        id: 'sec-philo-2',
        titre: 'Mini-Dissertation / Commentaire Philosophique',
        points: 12,
        contenu: `Commentez cette affirmation de Sigmund Freud : « Le Moi n'est pas maître dans sa propre maison. »
Développez la structure de la seconde topique freudienne (Ça, Moi, Surmoi) et montrez comment la théorie de l'inconscient psychique bouleverse la conception classique de l'homme comme être purement souverain et rationnel. (12 pts)`
      }
    ]
  }
];

export class PedagogieImportExport {
  /**
   * Parse a JSON string containing either a single or list of Subjects or Convocations
   */
  static parseJSONImport(jsonString: string): {
    type: 'sujets' | 'convocations' | 'unknown';
    sujets?: SujetEvaluation[];
    convocations?: ConvocationParent[];
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      const dataArr = Array.isArray(parsed) ? parsed : [parsed];

      // Detect if items are SujetEvaluation
      if (dataArr.some(item => item.type && item.discipline && (item.sections || item.titre))) {
        const validatedSujets: SujetEvaluation[] = dataArr.map((item, idx) => ({
          id: item.id || `sujet-import-${Date.now()}-${idx}`,
          type: ['Examen', 'Devoir', 'Interrogation'].includes(item.type) ? item.type : 'Devoir',
          titre: item.titre || 'Sujet d\'évaluation importé',
          discipline: item.discipline || 'Matière générale',
          classeOuNiveau: item.classeOuNiveau || '3e',
          duree: item.duree || '2 heures',
          coefficient: Number(item.coefficient) || 2,
          dateEvaluation: item.dateEvaluation || new Date().toISOString().split('T')[0],
          anneeScolaire: item.anneeScolaire || '2025-2026',
          session: item.session || '',
          consignes: Array.isArray(item.consignes) ? item.consignes : ['Traiter tous les exercices.'],
          sections: Array.isArray(item.sections) ? item.sections.map((s: any, sIdx: number) => ({
            id: s.id || `sec-${sIdx + 1}`,
            titre: s.titre || `Exercice ${sIdx + 1}`,
            points: Number(s.points) || 0,
            contenu: s.contenu || '',
            consignesSpecifiques: s.consignesSpecifiques || ''
          })) : [
            {
              id: 'sec-1',
              titre: 'Épreuve principale',
              points: 20,
              contenu: typeof item.contenu === 'string' ? item.contenu : 'Énoncé du sujet.'
            }
          ],
          baremeTotal: Number(item.baremeTotal) || 20,
          corrigeIndicatif: item.corrigeIndicatif || '',
          auteur: item.auteur || 'Enseignant'
        }));

        return { type: 'sujets', sujets: validatedSujets };
      }

      // Detect if items are ConvocationParent
      if (dataArr.some(item => item.motif || item.nomEleve || item.dateRdv)) {
        const validatedConvocations: ConvocationParent[] = dataArr.map((item, idx) => ({
          id: item.id || `conv-import-${Date.now()}-${idx}`,
          matricule: item.matricule || 'EXT-001',
          nomEleve: item.nomEleve || 'Élève concerné',
          classe: item.classe || 'Classe',
          nomParent: item.nomParent || 'Parents de l\'élève',
          contactParent: item.contactParent || '',
          motif: item.motif || 'Convocation administrative',
          motifDetail: item.motifDetail || 'Entretien avec la direction de l\'établissement.',
          dateRdv: item.dateRdv || new Date().toISOString().split('T')[0],
          heureRdv: item.heureRdv || '09h00',
          lieuRdv: item.lieuRdv || 'Bureau du Censeur',
          signataire: item.signataire || 'Le Censeur des Études',
          dateEmission: item.dateEmission || new Date().toISOString().split('T')[0],
          statut: item.statut || 'En attente',
          couponReconnaissance: item.couponReconnaissance !== false
        }));

        return { type: 'convocations', convocations: validatedConvocations };
      }

      return { type: 'unknown', error: 'Format JSON non reconnu. Veuillez vérifier la structure.' };
    } catch (e: any) {
      return { type: 'unknown', error: `Erreur de syntaxe JSON : ${e?.message || 'Invalide'}` };
    }
  }

  /**
   * Parse raw text formatted test/subject into a structured SujetEvaluation
   */
  static parseRawTextSubject(
    rawText: string,
    defaults: {
      type: 'Examen' | 'Devoir' | 'Interrogation';
      discipline: string;
      classe: string;
      titre?: string;
    }
  ): SujetEvaluation {
    const lines = rawText.split('\n');
    let title = defaults.titre || `${defaults.type} de ${defaults.discipline}`;
    const sections: Array<{ id: string; titre: string; points?: number; contenu: string }> = [];

    let currentSectionTitle = 'Exercice 1';
    let currentSectionPoints = 0;
    let currentSectionLines: string[] = [];

    const flushSection = () => {
      if (currentSectionLines.length > 0) {
        sections.push({
          id: `sec-${sections.length + 1}`,
          titre: currentSectionTitle,
          points: currentSectionPoints > 0 ? currentSectionPoints : undefined,
          contenu: currentSectionLines.join('\n').trim()
        });
        currentSectionLines = [];
      }
    };

    // Regex to match "Exercice 1", "Partie A", "Question 1", etc.
    const sectionHeaderRegex = /^(exercice|partie|problème|question|section|sujet|chapitre)\s*([0-9a-zA-ZIVX]+)?(\s*[:\-])?(.*)$/i;
    const pointsRegex = /\(?([0-9]+([.,][0-9]+)?)\s*(pts|points|point)\)?/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (currentSectionLines.length > 0) currentSectionLines.push('');
        continue;
      }

      // Check if line looks like a title at start
      if (i < 3 && (line.toLowerCase().includes('examen') || line.toLowerCase().includes('devoir') || line.toLowerCase().includes('interrogation') || line.toLowerCase().includes('épreuve'))) {
        title = line;
        continue;
      }

      const match = line.match(sectionHeaderRegex);
      if (match && line.length < 80) {
        flushSection();
        currentSectionTitle = line;
        const ptsMatch = line.match(pointsRegex);
        if (ptsMatch) {
          currentSectionPoints = parseFloat(ptsMatch[1].replace(',', '.'));
        } else {
          currentSectionPoints = 0;
        }
      } else {
        currentSectionLines.push(line);
      }
    }

    flushSection();

    if (sections.length === 0) {
      sections.push({
        id: 'sec-1',
        titre: 'Contenu de l\'épreuve',
        points: 20,
        contenu: rawText
      });
    }

    return {
      id: `sujet-custom-${Date.now()}`,
      type: defaults.type,
      titre: title,
      discipline: defaults.discipline,
      classeOuNiveau: defaults.classe,
      duree: defaults.type === 'Examen' ? '4 heures' : defaults.type === 'Devoir' ? '2 heures' : '45 minutes',
      coefficient: defaults.type === 'Examen' ? 4 : defaults.type === 'Devoir' ? 3 : 1,
      dateEvaluation: new Date().toISOString().split('T')[0],
      anneeScolaire: '2025-2026',
      consignes: [
        "L'usage de la calculatrice scientifique non programmable est autorisé sauf mention contraire.",
        "Soignez la rédaction et la présentation."
      ],
      sections,
      baremeTotal: 20,
      auteur: 'Enseignant'
    };
  }
}
