import { AppState } from '../types';
import { generate100StudentsPerClass } from '../services/studentGenerator';

const generated100 = generate100StudentsPerClass(42);

export const SEED_DATA: AppState = {
  parametres: {
    nomEtablissement: 'COMPLEXE SCOLAIRE PRIVÉ "LA PERSÉVÉRANCE"',
    ligne1: 'RÉPUBLIQUE DU NIGER',
    ligne2: "MINISTÈRE DE L'ÉDUCATION NATIONALE",
    ligne3: 'D.R.E.N NIAMEY / I.E.S NIAMEY III',
    ville: 'Niamey',
    anneeScolaire: '2025-2026',
    bareme: 20,
    seuilReussite: 10,
    seuilsAppreciation: [
      { label: 'Excellent(e)', min: 18 },
      { label: 'Très Bien', min: 16 },
      { label: 'Bien', min: 14 },
      { label: 'Assez Bien', min: 12 },
      { label: 'Passable', min: 10 },
      { label: 'Insuffisant', min: 7 },
      { label: 'Très Insuffisant', min: 0 }
    ],
    seuilRedoublement: 9.5,
    seuilExclusion: 6,
    mentions: [
      { label: 'Félicitations', min: 16 },
      { label: 'Encouragements', min: 14 },
      { label: "Tableau d'Honneur", min: 12 },
      { label: 'Passable', min: 10 },
      { label: 'Avertissement travail', min: 0 }
    ],
    niveaux: ['6e', '5e', '4e', '3e', '2nde', '1ere', 'Tle'],
    series: ['A', 'C', 'D', 'Unique'],
    codesNiveaux: {
      '6e': '6',
      '5e': '5',
      '4e': '4',
      '3e': '3',
      '2nde': '2',
      '1ere': '1',
      'Tle': 'T'
    },
    frais: {
      '6e-Unique': 100000,
      '5e-Unique': 100000,
      '4e-Unique': 110000,
      '3e-Unique': 110000,
      '2nde-A': 150000,
      '2nde-C': 200000,
      '2nde-D': 200000,
      '1ere-A': 150000,
      '1ere-C': 200000,
      '1ere-D': 200000,
      'Tle-A': 150000,
      'Tle-C': 200000,
      'Tle-D': 200000
    },
    creneaux: [
      '08h00-09h00',
      '09h00-10h00',
      '10h00-11h00',
      '11h00-12h00',
      '12h00-13h00 (pause)',
      '14h00-15h00',
      '15h00-16h00',
      '16h00-17h00'
    ],
    jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    creneauxParNiveau: {
      Tle: ['08h00-10h00 (2h)', '10h00-12h00 (2h)', '12h00-14h00 (pause)', '14h00-16h00 (2h)', '16h00-18h00 (2h)']
    },
  },
  disciplines: [
    'Philosophie',
    'Français',
    'Anglais',
    'Histoire-Géographie',
    'Mathématiques',
    'Sciences Physiques',
    'Sciences de la Vie et de la Terre',
    'Économie Familiale',
    'Éducation Physique et Sportive',
    'Conduite'
  ],
  coefs: {
    'Philosophie': {
      '2nde-A': 0, '2nde-C': 0, '2nde-D': 0, '1ere-A': 4, '1ere-C': 2, '1ere-D': 2, 'Tle-A': 4, 'Tle-C': 2, 'Tle-D': 2, '6e-Unique': 0, '5e-Unique': 0, '4e-Unique': 0, '3e-Unique': 0
    },
    'Français': {
      '2nde-A': 4, '2nde-C': 2, '2nde-D': 2, '1ere-A': 4, '1ere-C': 2, '1ere-D': 2, 'Tle-A': 4, 'Tle-C': 2, 'Tle-D': 2, '6e-Unique': 4, '5e-Unique': 4, '4e-Unique': 4, '3e-Unique': 4
    },
    'Anglais': {
      '2nde-A': 3, '2nde-C': 2, '2nde-D': 2, '1ere-A': 3, '1ere-C': 2, '1ere-D': 2, 'Tle-A': 3, 'Tle-C': 2, 'Tle-D': 2, '6e-Unique': 2, '5e-Unique': 2, '4e-Unique': 2, '3e-Unique': 2
    },
    'Histoire-Géographie': {
      '2nde-A': 3, '2nde-C': 2, '2nde-D': 2, '1ere-A': 3, '1ere-C': 2, '1ere-D': 2, 'Tle-A': 3, 'Tle-C': 2, 'Tle-D': 2, '6e-Unique': 3, '5e-Unique': 3, '4e-Unique': 3, '3e-Unique': 3
    },
    'Mathématiques': {
      '2nde-A': 2, '2nde-C': 6, '2nde-D': 5, '1ere-A': 2, '1ere-C': 6, '1ere-D': 5, 'Tle-A': 2, 'Tle-C': 6, 'Tle-D': 5, '6e-Unique': 4, '5e-Unique': 4, '4e-Unique': 4, '3e-Unique': 4
    },
    'Sciences Physiques': {
      '2nde-A': 1, '2nde-C': 6, '2nde-D': 5, '1ere-A': 1, '1ere-C': 6, '1ere-D': 5, 'Tle-A': 1, 'Tle-C': 6, 'Tle-D': 5, '6e-Unique': 0, '5e-Unique': 0, '4e-Unique': 2, '3e-Unique': 2
    },
    'Sciences de la Vie et de la Terre': {
      '2nde-A': 1, '2nde-C': 2, '2nde-D': 5, '1ere-A': 1, '1ere-C': 2, '1ere-D': 5, 'Tle-A': 1, 'Tle-C': 2, 'Tle-D': 5, '6e-Unique': 2, '5e-Unique': 2, '4e-Unique': 2, '3e-Unique': 2
    },
    'Économie Familiale': {
      '2nde-A': 1, '2nde-C': 1, '2nde-D': 1, '1ere-A': 1, '1ere-C': 1, '1ere-D': 1, 'Tle-A': 1, 'Tle-C': 1, 'Tle-D': 1, '6e-Unique': 0, '5e-Unique': 0, '4e-Unique': 0, '3e-Unique': 0
    },
    'Éducation Physique et Sportive': {
      '2nde-A': 1, '2nde-C': 1, '2nde-D': 1, '1ere-A': 1, '1ere-C': 1, '1ere-D': 1, 'Tle-A': 1, 'Tle-C': 1, 'Tle-D': 1, '6e-Unique': 1, '5e-Unique': 1, '4e-Unique': 1, '3e-Unique': 1
    },
    'Conduite': {
      '2nde-A': 1, '2nde-C': 1, '2nde-D': 1, '1ere-A': 1, '1ere-C': 1, '1ere-D': 1, 'Tle-A': 1, 'Tle-C': 1, 'Tle-D': 1, '6e-Unique': 1, '5e-Unique': 1, '4e-Unique': 1, '3e-Unique': 1
    }
  },
  classes: generated100.classes,
  professeurs: [
    { id: 'p1', civilite: 'M.', nom: 'Moumouni Salifou', matieres: ['Mathématiques', 'Sciences Physiques'], telephone: '+227 90 12 34 56', email: 'salifou.m@perseverance.edu' },
    { id: 'p2', civilite: 'Mme', nom: 'Amina Zeinabou', matieres: ['Sciences de la Vie et de la Terre', 'Économie Familiale'], telephone: '+227 96 78 90 12', email: 'amina.z@perseverance.edu' },
    { id: 'p3', civilite: 'M.', nom: 'Harouna Ousmane', matieres: ['Philosophie', 'Français'], telephone: '+227 91 23 45 67', email: 'ousmane.h@perseverance.edu' },
    { id: 'p4', civilite: 'M.', nom: 'Kader Abdou', matieres: ['Anglais', 'Histoire-Géographie'], telephone: '+227 94 56 78 90', email: 'kader.a@perseverance.edu' }
  ],
  gestionnaires: [
    { id: 'g1', nom: 'Ibrahim Comptabilité', telephone: '+227 90 99 88 77', email: 'caisse@perseverance.edu' }
  ],
  eleves: generated100.eleves,
  notesS1: generated100.notesS1,
  notesS2: generated100.notesS2,
  absences: [
    { matricule: 'TD2-001', nom: 'Abdoulaye Abdou Nadia', date: '2025-10-04', duree: 1, motif: 'Paludisme', justifiee: 'Oui' },
    { matricule: 'TD2-005', nom: 'Elhadji Roukaya', date: '2026-01-17', duree: 0.5, motif: 'Rendez-vous médical', justifiee: 'Oui' },
    { matricule: '6A-012', nom: 'Garba Ibrahim', date: '2025-11-22', duree: 2, motif: 'Absence non justifiée', justifiee: 'Non' }
  ],
  sanctions: [
    { matricule: 'TD2-001', nom: 'Abdoulaye Abdou Nadia', date: '2025-09-20', type: 'Retard', details: '15 min', motif: 'Retard au 1er cours' },
    { matricule: '6A-012', nom: 'Garba Ibrahim', date: '2025-11-23', type: 'Avertissement', details: 'Écrit', motif: 'Absences répétées' }
  ],
  paiements: generated100.paiements,
  emploiDuTemps: [
    { id: 'edt1', classe: 'TD2', jour: 'Lundi', creneau: '08h00-10h00 (2h)', discipline: 'Mathématiques', professeurId: 'p1', professeurNom: 'Moumouni Salifou', salle: 'Salle Tle 1' },
    { id: 'edt2', classe: 'TD2', jour: 'Lundi', creneau: '10h00-12h00 (2h)', discipline: 'Sciences Physiques', professeurId: 'p1', professeurNom: 'Moumouni Salifou', salle: 'Laboratoire' },
    { id: 'edt3', classe: 'TD2', jour: 'Mardi', creneau: '08h00-10h00 (2h)', discipline: 'Sciences de la Vie et de la Terre', professeurId: 'p2', professeurNom: 'Amina Zeinabou', salle: 'Salle Tle 1' },
    { id: 'edt4', classe: 'TD2', jour: 'Mercredi', creneau: '08h00-10h00 (2h)', discipline: 'Philosophie', professeurId: 'p3', professeurNom: 'Harouna Ousmane', salle: 'Salle Tle 1' }
  ],
  convocations: [],
  sujets: [],
  archives: {
    annees: [],
    classes: [],
    exclusions: [],
    diplomes: []
  }
};
