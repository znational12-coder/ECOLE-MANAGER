import { AppState, Classe, Eleve, NotesRow, Paiement } from '../types';

export interface ClassDefinition {
  id: string;
  nom: string;
  niveau: string;
  serie: string;
  responsableId?: string | null;
  anneeNaissanceMin: number;
  anneeNaissanceMax: number;
}

export const CLASSES_CONFIG_100: ClassDefinition[] = [
  // Collège (Série Unique)
  { id: 'c_6a', nom: '6A', niveau: '6e', serie: 'Unique', responsableId: 'p1', anneeNaissanceMin: 2013, anneeNaissanceMax: 2014 },
  { id: 'c_6b', nom: '6B', niveau: '6e', serie: 'Unique', responsableId: 'p2', anneeNaissanceMin: 2013, anneeNaissanceMax: 2014 },
  { id: 'c_5a', nom: '5A', niveau: '5e', serie: 'Unique', responsableId: 'p3', anneeNaissanceMin: 2012, anneeNaissanceMax: 2013 },
  { id: 'c_5b', nom: '5B', niveau: '5e', serie: 'Unique', responsableId: 'p4', anneeNaissanceMin: 2012, anneeNaissanceMax: 2013 },
  { id: 'c_4a', nom: '4A', niveau: '4e', serie: 'Unique', responsableId: 'p1', anneeNaissanceMin: 2011, anneeNaissanceMax: 2012 },
  { id: 'c_4b', nom: '4B', niveau: '4e', serie: 'Unique', responsableId: 'p2', anneeNaissanceMin: 2011, anneeNaissanceMax: 2012 },
  { id: 'c_3a', nom: '3A', niveau: '3e', serie: 'Unique', responsableId: 'p3', anneeNaissanceMin: 2010, anneeNaissanceMax: 2011 },
  { id: 'c_3b', nom: '3B', niveau: '3e', serie: 'Unique', responsableId: 'p4', anneeNaissanceMin: 2010, anneeNaissanceMax: 2011 },

  // Lycée - 2nde
  { id: 'c_2a1', nom: '2A1', niveau: '2nde', serie: 'A', responsableId: 'p3', anneeNaissanceMin: 2009, anneeNaissanceMax: 2010 },
  { id: 'c_2a2', nom: '2A2', niveau: '2nde', serie: 'A', responsableId: 'p4', anneeNaissanceMin: 2009, anneeNaissanceMax: 2010 },
  { id: 'c_2c1', nom: '2C1', niveau: '2nde', serie: 'C', responsableId: 'p1', anneeNaissanceMin: 2009, anneeNaissanceMax: 2010 },
  { id: 'c_2d1', nom: '2D1', niveau: '2nde', serie: 'D', responsableId: 'p2', anneeNaissanceMin: 2009, anneeNaissanceMax: 2010 },

  // Lycée - 1ère
  { id: 'c_1a1', nom: '1A1', niveau: '1ere', serie: 'A', responsableId: 'p3', anneeNaissanceMin: 2008, anneeNaissanceMax: 2009 },
  { id: 'c_1c1', nom: '1C1', niveau: '1ere', serie: 'C', responsableId: 'p1', anneeNaissanceMin: 2008, anneeNaissanceMax: 2009 },
  { id: 'c_1d1', nom: '1D1', niveau: '1ere', serie: 'D', responsableId: 'p2', anneeNaissanceMin: 2008, anneeNaissanceMax: 2009 },
  { id: 'c_1d2', nom: '1D2', niveau: '1ere', serie: 'D', responsableId: 'p4', anneeNaissanceMin: 2008, anneeNaissanceMax: 2009 },

  // Lycée - Terminale
  { id: 'c_ta1', nom: 'TA1', niveau: 'Tle', serie: 'A', responsableId: 'p3', anneeNaissanceMin: 2007, anneeNaissanceMax: 2008 },
  { id: 'c_tc1', nom: 'TC1', niveau: 'Tle', serie: 'C', responsableId: 'p1', anneeNaissanceMin: 2007, anneeNaissanceMax: 2008 },
  { id: 'c_td1', nom: 'TD1', niveau: 'Tle', serie: 'D', responsableId: 'p1', anneeNaissanceMin: 2007, anneeNaissanceMax: 2008 },
  { id: 'c_td2', nom: 'TD2', niveau: 'Tle', serie: 'D', responsableId: 'p2', anneeNaissanceMin: 2007, anneeNaissanceMax: 2008 }
];

const PRENOMS_GARCONS = [
  'Abdoulaye', 'Moussa', 'Ibrahim', 'Souleymane', 'Mamane', 'Mahamadou', 'Oumarou', 'Salifou',
  'Kader', 'Hamani', 'Amadou', 'Harouna', 'Ali', 'Hassane', 'Nouhou', 'Boubacar', 'Idrissa',
  'Djibo', 'Mounkaila', 'Alassane', 'Seydou', 'Chaibou', 'Adamou', 'Ismaël', 'Zakaria', 'Daouda',
  'Yacouba', 'Issoufou', 'Mourtala', 'Bachir', 'Nasser', 'Farouk', 'Habibou', 'Tahirou', 'Hamidou',
  'Inoussa', 'Boureima', 'Saley', 'Malam', 'Rabiou', 'Sanoussi', 'Kassoum', 'Zoubeirou', 'Bilal'
];

const PRENOMS_FILLES = [
  'Fatima', 'Hadiza', 'Aïchatou', 'Ramatou', 'Balkissa', 'Nadia', 'Mariama', 'Halima',
  'Zeinabou', 'Roukaya', 'Nafissa', 'Samira', 'Fati', 'Rahila', 'Jamila', 'Safia',
  'Zara', 'Amina', 'Rabiatou', 'Maimouna', 'Rachida', 'Hassana', 'Ousseina', 'Salima',
  'Fadima', 'Khadidja', 'Haoua', 'Barira', 'Nana', 'Souweiba', 'Mariam', 'Yasmina',
  'Assamaou', 'Zoulaha', 'Charifatou', 'Leïla', 'Bintou', 'Djamila', 'Sakina', 'Farida'
];

const NOMS_FAMILLE = [
  'Moussa', 'Abdou', 'Oumarou', 'Djibo', 'Harouna', 'Amadou', 'Saley', 'Souley',
  'Boubacar', 'Mamane', 'Hamani', 'Idi', 'Garba', 'Seyni', 'Maïga', 'Adamou',
  'Nouhou', 'Salifou', 'Issoufou', 'Chaibou', 'Alassane', 'Hassane', 'Boureima',
  'Tahirou', 'Kader', 'Moumouni', 'Mounkaila', 'Zada', 'Balla', 'Mainassara',
  'Dandobi', 'Diori', 'Kountché', 'Sanda', 'Yahaya', 'Kollo', 'Gado', 'Yabilan',
  'Dan Juma', 'Dan Baskoré', 'Soumana', 'Illiassou', 'Sani', 'Lawali', 'Balarabé',
  'Kassoum', 'Wadata', 'Tanimoune', 'Yacouba', 'Goubé', 'Diallo', 'Touré', 'Traoré'
];

const VILLES = [
  'Niamey', 'Zinder', 'Maradi', 'Tahoua', 'Dosso', 'Tillabéri', 'Agadez', 'Diffa',
  'Birni N\'Konni', 'Dogondoutchi', 'Tessaoua', 'Gaya', 'Madaoua', 'Arlit', 'Say', 'Tera'
];

// Pseudo-random deterministic generator with seed
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generate100StudentsPerClass(baseSeed: number = 42): {
  classes: Classe[];
  eleves: Eleve[];
  notesS1: NotesRow[];
  notesS2: NotesRow[];
  paiements: Paiement[];
} {
  const rand = pseudoRandom(baseSeed);
  const classes: Classe[] = CLASSES_CONFIG_100.map(c => ({
    id: c.id,
    nom: c.nom,
    niveau: c.niveau,
    serie: c.serie,
    responsableId: c.responsableId || null
  }));

  const eleves: Eleve[] = [];
  const notesS1: NotesRow[] = [];
  const notesS2: NotesRow[] = [];
  const paiements: Paiement[] = [];

  let recCounter = 1;

  CLASSES_CONFIG_100.forEach((clsDef, classIdx) => {
    const classCode = clsDef.nom;
    const isCollege = ['6e', '5e', '4e', '3e'].includes(clsDef.niveau);
    const isScientifique = clsDef.serie === 'C' || clsDef.serie === 'D';
    const isLitteraire = clsDef.serie === 'A';

    for (let i = 1; i <= 100; i++) {
      const isGirl = rand() > 0.48;
      const prenom = isGirl
        ? PRENOMS_FILLES[Math.floor(rand() * PRENOMS_FILLES.length)]
        : PRENOMS_GARCONS[Math.floor(rand() * PRENOMS_GARCONS.length)];
      const nom1 = NOMS_FAMILLE[Math.floor(rand() * NOMS_FAMILLE.length)];
      const nom2 = rand() > 0.4 ? NOMS_FAMILLE[Math.floor(rand() * NOMS_FAMILLE.length)] : '';
      const nomComplet = nom2 ? `${nom1} ${prenom} ${nom2}` : `${nom1} ${prenom}`;

      const padNum = String(i).padStart(3, '0');
      const matricule = `${classCode}-${padNum}`;

      // Date of birth
      const year = clsDef.anneeNaissanceMin + Math.floor(rand() * (clsDef.anneeNaissanceMax - clsDef.anneeNaissanceMin + 1));
      const month = String(1 + Math.floor(rand() * 12)).padStart(2, '0');
      const day = String(1 + Math.floor(rand() * 28)).padStart(2, '0');
      const dateNaissance = `${year}-${month}-${day}`;

      const lieuNaissance = VILLES[Math.floor(rand() * VILLES.length)];
      const statutInitial = rand() > 0.12 ? 'Passant(e)' : 'Redoublant(e)';

      // Parent phones
      const prefix1 = ['90', '91', '92', '94', '96', '97', '80', '70'][Math.floor(rand() * 8)];
      const num1 = `${prefix1}${Math.floor(100000 + rand() * 900000)}`;
      const telParent1 = num1;
      const telParent2 = rand() > 0.5 ? `9${Math.floor(1000000 + rand() * 9000000)}` : null;

      const eleve: Eleve = {
        matricule,
        civilite: isGirl ? 'Mlle' : 'M.',
        nom: nomComplet,
        niveau: clsDef.niveau,
        serie: clsDef.serie,
        classe: classCode,
        sexe: isGirl ? 'F' : 'M',
        dateNaissance,
        lieuNaissance,
        statutInitial,
        telParent1,
        telParent2,
        contactParent: telParent1
      };

      eleves.push(eleve);

      // Student performance tier (distributes realistic bell curve across class)
      // Tiers: Top (15%), Good (35%), Average (35%), Low (15%)
      const tierRoll = rand();
      let baseMin = 10;
      let baseMax = 14;
      if (tierRoll > 0.85) {
        baseMin = 14.5;
        baseMax = 18.5; // Top
      } else if (tierRoll > 0.50) {
        baseMin = 12.0;
        baseMax = 15.5; // Good
      } else if (tierRoll > 0.15) {
        baseMin = 9.0;
        baseMax = 12.5; // Average
      } else {
        baseMin = 5.5;
        baseMax = 9.5; // Strugling
      }

      const generateGrade = (subject: string, sem: 'S1' | 'S2'): { moyClas: number; noteComp: number } => {
        let subjectAdj = (rand() - 0.5) * 3;
        if (isScientifique && ['Mathématiques', 'Sciences Physiques', 'Sciences de la Vie et de la Terre'].includes(subject)) {
          subjectAdj += 1.2;
        } else if (isLitteraire && ['Français', 'Philosophie', 'Histoire-Géographie', 'Anglais'].includes(subject)) {
          subjectAdj += 1.2;
        }

        // Slight progression in S2 for many students
        const semProgression = sem === 'S2' ? (rand() * 1.5 - 0.5) : 0;
        const rawMoy = baseMin + rand() * (baseMax - baseMin) + subjectAdj + semProgression;
        const moyClas = Math.min(20, Math.max(2, Math.round(rawMoy * 2) / 2));
        const noteComp = Math.min(20, Math.max(1.5, Math.round((moyClas + (rand() * 3 - 1.5)) * 10) / 10));
        return { moyClas, noteComp };
      };

      const rowS1: NotesRow = {
        matricule,
        Philosophie: isCollege ? { moyClas: null, noteComp: null } : generateGrade('Philosophie', 'S1'),
        Français: generateGrade('Français', 'S1'),
        Anglais: generateGrade('Anglais', 'S1'),
        'Histoire-Géographie': generateGrade('Histoire-Géographie', 'S1'),
        Mathématiques: generateGrade('Mathématiques', 'S1'),
        'Sciences Physiques': ['6e', '5e'].includes(clsDef.niveau) ? { moyClas: null, noteComp: null } : generateGrade('Sciences Physiques', 'S1'),
        'Sciences de la Vie et de la Terre': generateGrade('Sciences de la Vie et de la Terre', 'S1'),
        'Économie Familiale': isCollege ? { moyClas: null, noteComp: null } : generateGrade('Économie Familiale', 'S1'),
        'Éducation Physique et Sportive': generateGrade('Éducation Physique et Sportive', 'S1'),
        Conduite: Math.min(20, Math.max(10, Math.round((14 + rand() * 5.5))))
      };

      const rowS2: NotesRow = {
        matricule,
        Philosophie: isCollege ? { moyClas: null, noteComp: null } : generateGrade('Philosophie', 'S2'),
        Français: generateGrade('Français', 'S2'),
        Anglais: generateGrade('Anglais', 'S2'),
        'Histoire-Géographie': generateGrade('Histoire-Géographie', 'S2'),
        Mathématiques: generateGrade('Mathématiques', 'S2'),
        'Sciences Physiques': ['6e', '5e'].includes(clsDef.niveau) ? { moyClas: null, noteComp: null } : generateGrade('Sciences Physiques', 'S2'),
        'Sciences de la Vie et de la Terre': generateGrade('Sciences de la Vie et de la Terre', 'S2'),
        'Économie Familiale': isCollege ? { moyClas: null, noteComp: null } : generateGrade('Économie Familiale', 'S2'),
        'Éducation Physique et Sportive': generateGrade('Éducation Physique et Sportive', 'S2'),
        Conduite: Math.min(20, Math.max(10, Math.round((14.5 + rand() * 5))))
      };

      notesS1.push(rowS1);
      notesS2.push(rowS2);

      // Fee and payments
      let fraisTotal = 100000;
      if (['4e', '3e'].includes(clsDef.niveau)) fraisTotal = 110000;
      if (['2nde', '1ere', 'Tle'].includes(clsDef.niveau)) {
        fraisTotal = isScientifique ? 200000 : 150000;
      }

      const paymentRoll = rand();
      const nsKey = `${clsDef.niveau}-${clsDef.serie}`;
      if (paymentRoll > 0.35) {
        // Solde complet
        paiements.push({
          noRecu: `REC-${String(recCounter++).padStart(4, '0')}`,
          date: '2025-10-05',
          matricule,
          nom: nomComplet,
          classe: classCode,
          niveauSerie: nsKey,
          montant: fraisTotal,
          mode: rand() > 0.4 ? 'Espèces' : 'Mobile Money',
          tranche: 'Totalité',
          anneeScolaire: '2025-2026',
          observation: 'Règlement total scolarité'
        });
      } else if (paymentRoll > 0.10) {
        // Inscription + 1ère tranche (75%)
        const t1 = Math.round(fraisTotal * 0.4);
        const t2 = Math.round(fraisTotal * 0.35);
        paiements.push({
          noRecu: `REC-${String(recCounter++).padStart(4, '0')}`,
          date: '2025-10-02',
          matricule,
          nom: nomComplet,
          classe: classCode,
          niveauSerie: nsKey,
          montant: t1,
          mode: 'Espèces',
          tranche: 'Inscription',
          anneeScolaire: '2025-2026',
          observation: '1ère tranche d\'inscription'
        });
        paiements.push({
          noRecu: `REC-${String(recCounter++).padStart(4, '0')}`,
          date: '2025-12-10',
          matricule,
          nom: nomComplet,
          classe: classCode,
          niveauSerie: nsKey,
          montant: t2,
          mode: 'Mobile Money',
          tranche: 'Tranche 1',
          anneeScolaire: '2025-2026',
          observation: '2ème versement semestriel'
        });
      } else {
        // Inscription seule (40%)
        const t1 = Math.round(fraisTotal * 0.4);
        paiements.push({
          noRecu: `REC-${String(recCounter++).padStart(4, '0')}`,
          date: '2025-10-04',
          matricule,
          nom: nomComplet,
          classe: classCode,
          niveauSerie: nsKey,
          montant: t1,
          mode: 'Espèces',
          tranche: 'Inscription',
          anneeScolaire: '2025-2026',
          observation: 'Versement initial à la rentrée'
        });
      }
    }
  });

  return { classes, eleves, notesS1, notesS2, paiements };
}
