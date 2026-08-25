import { AfficheScolaire } from '../types';

export const MODELES_AFFICHES_DEFAUT: AfficheScolaire[] = [
  {
    id: 'aff-001',
    numeroRef: 'COMM-2025/2026-N°012',
    titre: 'RAPPEL SOLENNEL : ÉCHÉANCE DE LA 2ÈME TRANCHE DES FRAIS DE SCOLARITÉ',
    sousTitre: 'Régularisation impérative avant le démarrage des évaluations semestrielles',
    categorie: 'Paiement',
    cible: 'Parents',
    dateEmission: '2026-02-15',
    dateEvenement: '2026-03-05',
    heureEvenement: '15h00',
    lieuEvenement: 'Service de l\'Intendance & Comptabilité (Bâtiment A)',
    corpsPrincipal: `La Direction Administrative et Financière du Complexe Scolaire Privé « La Persévérance » porte à la connaissance de l'ensemble des parents et tuteurs d'élèves que la date limite de règlement de la deuxième tranche des frais de scolarité (35% du montant annuel) est fixée au jeudi 05 mars 2026 à 15h00 précises.\n\nLe respect scrupuleux de cette échéance est indispensable pour garantir la participation des élèves aux devoirs de synthèse et le bon fonctionnement des activités pédagogiques.`,
    pointsCles: [
      'Montant exigible : 2ème tranche (35% de la scolarité annuelle)',
      'Date limite de paiement : Jeudi 05 Mars 2026 à 15h00',
      'Modes de règlement acceptés : Espèces au guichet, Airtel Money, Moov Flooz, Chèque certifié',
      'Délivrance immédiate d\'un reçu officiel numéroté'
    ],
    consignesImportantes: [
      'Tout élève non en règle après cette date se verra temporairement refuser l\'accès aux salles de devoirs.',
      'Pour toute demande d\'échéancier exceptionnel, prière de rencontrer l\'Intendant avant le 28 février.'
    ],
    contactBureau: 'Secrétariat / Intendance : (+227) 90 12 34 56 / (+227) 96 78 90 12 • secretariat@laperseverance.edu.ne',
    signataire: 'Le Directeur Administratif & Financier',
    nomSignataire: 'M. Ousmane Moussa',
    statut: 'Publié',
    themeCouleur: 'rubis',
    badgeSpecial: 'RAPPEL FINANCIER IMPORTANT',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-002',
    numeroRef: 'NOTE-PEDAG-2026-N°008',
    titre: 'CALENDRIER DES EXAMENS BLANCS & DEVOIRS HARMONISÉS DU SEMESTRE 1',
    sousTitre: 'Sessions spéciales pour les classes de Troisième et de Terminale (Séries A, C, D)',
    categorie: 'Examen',
    cible: 'Tous',
    classesCiblees: ['3ème', '1ère', 'TD1', 'TD2', 'TC'],
    dateEmission: '2026-02-20',
    dateEvenement: '2026-03-16',
    heureEvenement: '07h30',
    lieuEvenement: 'Centres d\'examen - Bâtiments B & C',
    corpsPrincipal: `Le Conseil Pédagogique informe les élèves, enseignants et parents que la première session des Examens Blancs Généraux (BEPC et BAC Blancs) se déroulera du lundi 16 au vendredi 20 mars 2026.\n\nCes épreuves constituent un jalon fondamental pour évaluer la préparation des candidats aux examens d'État session 2026 et déterminer les stratégies de remédiation du second semestre.`,
    pointsCles: [
      'Période des épreuves : Du 16 au 20 Mars 2026 inclus',
      'Appel des candidats : Tous les matins à 07h00 devant les salles d\'examen',
      'Présentation obligatoire de la carte d\'identité scolaire 2025-2026',
      'Matériel autorisé : Règle, équerre, compas, calculatrice non programmable'
    ],
    consignesImportantes: [
      'Strict respect de la discipline : Les téléphones portables et montres connectées sont formellement interdits dans les salles d\'examen.',
      'Toute absence non justifiée médicalement sera sanctionnée par la note zéro (00/20).'
    ],
    contactBureau: 'Direction des Études / Censorat : (+227) 90 55 44 33 • censorat@laperseverance.edu.ne',
    signataire: 'Le Censeur des Études',
    nomSignataire: 'Dr. Idrissa Hassane',
    statut: 'Publié',
    themeCouleur: 'navy-gold',
    badgeSpecial: 'EXAMEN OFFICIEL',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-003',
    numeroRef: 'CONV-APE-2026-N°003',
    titre: 'GRANDE ASSEMBLÉE GÉNÉRALE DE L\'ASSOCIATION DES PARENTS D\'ÉLÈVES (APE)',
    sousTitre: 'Bilan d\'étape semestriel, projets d\'équipements numériques et dialogue éducatif',
    categorie: 'Reunion',
    cible: 'Parents',
    dateEmission: '2026-02-18',
    dateEvenement: '2026-03-08',
    heureEvenement: '09h00',
    lieuEvenement: 'Grande Salle de Conférence / Cour Centrale',
    corpsPrincipal: `Le Bureau Exécutif de l'Association des Parents d'Élèves (APE) et la Direction Générale du Complexe Scolaire Privé « La Persévérance » invitent cordialement tous les parents et tuteurs d'élèves à la 2ème session ordinaire de l'Assemblée Générale.\n\nVotre présence est capitale pour consolider le partenariat école-famille et contribuer aux décisions stratégiques concernant l'encadrement de nos enfants.`,
    pointsCles: [
      'Date & Heure : Dimanche 08 Mars 2026 à partir de 09h00',
      'Ordre du jour 1 : Bilan académique et disciplinaire du Semestre 1',
      'Ordre du jour 2 : Projet d\'installation de la nouvelle salle multimédia / informatique',
      'Ordre du jour 3 : Préparation des voyages d\'études et de la Journée Culturelle',
      'Ordre du jour 4 : Questions diverses et échanges avec les Professeurs Principaux'
    ],
    consignesImportantes: [
      'Un cocktail de bienvenue sera offert à l\'issue de la séance.',
      'Possibilité de rencontrer individuellement les enseignants de 11h30 à 13h00.'
    ],
    contactBureau: 'Bureau APE / Relations Extérieures : (+227) 91 22 33 44 • ape@laperseverance.edu.ne',
    signataire: 'Le Président de l\'APE & Le Proviseur',
    nomSignataire: 'Elhadj Amadou Boubacar & M. Mamane Oumarou',
    statut: 'Publié',
    themeCouleur: 'emeraude',
    badgeSpecial: 'INVITATION OFFICIELLE',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-004',
    numeroRef: 'AVIS-DISC-2025/2026-N°005',
    titre: 'NOTE DE SERVICE : RESPECT DU RÈGLEMENT INTÉRIEUR & TENUE SCOLAIRE UNIFORME',
    sousTitre: 'Rappel des règles de ponctualité, de décence vestimentaire et d\'assiduité',
    categorie: 'Discipline',
    cible: 'Eleves',
    dateEmission: '2026-01-10',
    dateEvenement: '2026-01-15',
    heureEvenement: '07h15',
    lieuEvenement: 'Portail Principal et Enceinte Scolaire',
    corpsPrincipal: `La Direction de l'Établissement rappelle à l'ensemble des élèves que la discipline et la rigueur morale sont les piliers de la réussite au Complexe Scolaire « La Persévérance ».\n\nÀ compter du lundi 15 janvier 2026, un contrôle strict et systématique sera effectué chaque matin à l'entrée de l'établissement.`,
    pointsCles: [
      'Fermeture impérative du portail : 07h25 tous les matins ouvrés',
      'Tenue réglementaire : Uniforme scolaire complet, propre, repassé et décent',
      'Coiffures et bijoux : Simples et conformes aux directives ministérielles',
      'Port de la carte d\'élève obligatoire pour toute circulation dans l\'établissement'
    ],
    consignesImportantes: [
      'Usage du téléphone portable : Strictement prohibé dans les salles et couloirs (confiscation immédiate jusqu\'en fin d\'année en cas de récidive).',
      'Tout retardataire se verra consigné et devra présenter un billet d\'entrée délivré par la Surveillante Générale.'
    ],
    contactBureau: 'Surveillance Générale / Vie Scolaire : (+227) 90 99 88 77',
    signataire: 'La Surveillante Générale & Le Proviseur',
    nomSignataire: 'Mme Balkissa Daouda & M. Mamane Oumarou',
    statut: 'Publié',
    themeCouleur: 'ardoise',
    badgeSpecial: 'RÈGLEMENT & DISCIPLINE',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-005',
    numeroRef: 'COMM-VAC-2026-N°002',
    titre: 'AVIS OFFICIEL : DÉPART EN CONGÉS DE DÉTENTE DU 1ER SEMESTRE',
    sousTitre: 'Calendrier officiel des vacances scolaires et consignes de travail individuel',
    categorie: 'Vacances',
    cible: 'Tous',
    dateEmission: '2026-02-22',
    dateEvenement: '2026-02-27',
    heureEvenement: '12h00',
    lieuEvenement: 'Ensemble de l\'Établissement',
    corpsPrincipal: `Conformément au calendrier officiel fixé par le Ministère de l'Éducation Nationale, la Direction du Complexe Scolaire « La Persévérance » informe les élèves et parents que les cours seront suspendus pour les congés de détente à compter du vendredi 27 février 2026 à midi.\n\nLa reprise effective des cours aura lieu le lundi 09 mars 2026 à 07h30 pour toutes les classes.`,
    pointsCles: [
      'Départ en congés : Vendredi 27 Février 2026 après les cours de 12h00',
      'Durée des congés : Du samedi 28 février au dimanche 08 mars 2026 inclus',
      'Reprise obligatoire des cours : Lundi 09 Mars 2026 dès 07h30',
      'Permanence administrative : Du lundi au vendredi de 08h30 à 13h00'
    ],
    consignesImportantes: [
      'Cahiers de vacances & devoirs à la maison : Des fascicules d\'exercices de révision ont été distribués dans toutes les matières principales.',
      'La Direction souhaite d\'excellents congés studieux et reposants à tous nos apprenants.'
    ],
    contactBureau: 'Secrétariat Général : (+227) 90 12 34 56',
    signataire: 'Le Chef d\'Établissement / Proviseur',
    nomSignataire: 'M. Mamane Oumarou',
    statut: 'Publié',
    themeCouleur: 'ambre',
    badgeSpecial: 'CALENDRIER SCOLAIRE',
    afficherLogo: true,
    afficherTampon: true
  },
  {
    id: 'aff-006',
    numeroRef: 'EVT-CULT-2026-N°001',
    titre: 'JOURNÉE SCIENTIFIQUE & CULTURELLE DE L\'EXCELLENCE : ÉDITION 2026',
    sousTitre: 'Expositions scientifiques, concours d\'éloquence, théâtre, robotique et remise des prix',
    categorie: 'Culture',
    cible: 'Tous',
    dateEmission: '2026-02-10',
    dateEvenement: '2026-04-18',
    heureEvenement: '08h30',
    lieuEvenement: 'Campus du Complexe Scolaire - Espaces plein air & Amphi',
    corpsPrincipal: `Le Club Scientifique et le Club d'Art & Culture du Complexe Scolaire « La Persévérance », sous le haut patronage de la Direction Générale, ont le plaisir de vous annoncer la tenue de la 8ème Édition de la Grande Journée de l'Excellence et de l'Innovation.\n\nVenez découvrir les projets scientifiques, maquettes écologiques, créations artistiques et prestations théâtrales de nos brillants élèves !`,
    pointsCles: [
      'Date de l\'événement : Samedi 18 Avril 2026 de 08h30 à 17h00',
      'Matinée : Foire aux sciences, démonstrations robotiques, expériences de chimie en direct',
      'Midi : Déjeuner champêtre et kermesse de bienfaisance organisée par les élèves',
      'Après-midi : Grande finale du concours d\'art oratoire et remise solennelle des Tableaux d\'Honneur'
    ],
    consignesImportantes: [
      'Événement ouvert aux parents, anciens élèves et partenaires institutionnels.',
      'Inscriptions aux concours auprès des animateurs de clubs avant le 25 mars.'
    ],
    contactBureau: 'Comité d\'Organisation des Événements : (+227) 92 33 44 55 • culture@laperseverance.edu.ne',
    signataire: 'Le Comité d\'Organisation & Le Proviseur',
    nomSignataire: 'M. Mamane Oumarou',
    statut: 'Publié',
    themeCouleur: 'pourpre',
    badgeSpecial: 'ÉVÉNEMENT MAJEUR',
    afficherLogo: true,
    afficherTampon: true
  }
];

export const THEMES_AFFICHES_CONFIG = {
  'navy-gold': {
    nom: 'Bleu Institutionnel & Or',
    borderClass: 'border-slate-800',
    headerBg: 'bg-slate-900 text-white',
    accentText: 'text-amber-600',
    badgeBg: 'bg-amber-500 text-slate-950',
    cardBorder: 'border-slate-300',
    boxBg: 'bg-slate-50 border-slate-200',
    pointsBg: 'bg-amber-50/70 border-amber-200 text-amber-950',
    footerAccent: 'border-slate-900',
    iconColor: 'text-amber-500'
  },
  'emeraude': {
    nom: 'Émeraude Espoir & Réussite',
    borderClass: 'border-emerald-800',
    headerBg: 'bg-emerald-900 text-white',
    accentText: 'text-emerald-700',
    badgeBg: 'bg-emerald-500 text-white',
    cardBorder: 'border-emerald-300',
    boxBg: 'bg-emerald-50/50 border-emerald-200',
    pointsBg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    footerAccent: 'border-emerald-900',
    iconColor: 'text-emerald-600'
  },
  'rubis': {
    nom: 'Rubis Alerte & Urgence',
    borderClass: 'border-rose-800',
    headerBg: 'bg-rose-950 text-white',
    accentText: 'text-rose-700',
    badgeBg: 'bg-rose-600 text-white animate-pulse',
    cardBorder: 'border-rose-300',
    boxBg: 'bg-rose-50/60 border-rose-200',
    pointsBg: 'bg-rose-50 border-rose-200 text-rose-950',
    footerAccent: 'border-rose-900',
    iconColor: 'text-rose-600'
  },
  'ardoise': {
    nom: 'Ardoise Rigueur & Discipline',
    borderClass: 'border-slate-700',
    headerBg: 'bg-slate-800 text-white',
    accentText: 'text-slate-800',
    badgeBg: 'bg-slate-700 text-white',
    cardBorder: 'border-slate-300',
    boxBg: 'bg-slate-100 border-slate-200',
    pointsBg: 'bg-slate-50 border-slate-300 text-slate-900',
    footerAccent: 'border-slate-800',
    iconColor: 'text-slate-700'
  },
  'pourpre': {
    nom: 'Pourpre Royale & Événements',
    borderClass: 'border-purple-800',
    headerBg: 'bg-purple-950 text-white',
    accentText: 'text-purple-700',
    badgeBg: 'bg-purple-600 text-white',
    cardBorder: 'border-purple-300',
    boxBg: 'bg-purple-50/60 border-purple-200',
    pointsBg: 'bg-purple-50 border-purple-200 text-purple-950',
    footerAccent: 'border-purple-900',
    iconColor: 'text-purple-600'
  },
  'ambre': {
    nom: 'Ambre Chaleur & Vie Scolaire',
    borderClass: 'border-amber-700',
    headerBg: 'bg-amber-900 text-white',
    accentText: 'text-amber-700',
    badgeBg: 'bg-amber-600 text-white',
    cardBorder: 'border-amber-300',
    boxBg: 'bg-amber-50/60 border-amber-200',
    pointsBg: 'bg-amber-50 border-amber-200 text-amber-950',
    footerAccent: 'border-amber-900',
    iconColor: 'text-amber-600'
  }
};
