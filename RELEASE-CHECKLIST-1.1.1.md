# École Manager 1.1.1 — checklist de livraison Windows

## Préparation
- [ ] Windows 10/11 x64 propre disponible pour le test
- [ ] Node.js compatible installé
- [ ] `npm install` terminé sans erreur
- [ ] `npm run lint` réussi
- [ ] `npm run security-audit` réussi
- [ ] `npm run release-preflight` réussi

## Build
- [ ] `npm run dist:win` réussi
- [ ] `École Manager-Setup-1.1.1.exe` présent dans `release/`
- [ ] `npm run dist:portable` réussi
- [ ] `École Manager-Portable-1.1.1.exe` présent dans `release/`

## Installation
- [ ] Installation en français
- [ ] Raccourci Bureau créé
- [ ] Raccourci Menu Démarrer créé
- [ ] Application démarre sans Internet
- [ ] Base locale créée dans `%APPDATA%\\Ecole Manager\\data`

## Données et sauvegardes
- [ ] Créer un élève
- [ ] Créer une classe
- [ ] Ajouter une note
- [ ] Ajouter un paiement
- [ ] Fermer et rouvrir l’application
- [ ] Vérifier la sauvegarde au démarrage
- [ ] Vérifier une sauvegarde planifiée
- [ ] Restaurer une sauvegarde et vérifier les données
- [ ] Vérifier la conservation des 20 dernières sauvegardes

## Désinstallation / réinstallation
- [ ] Désinstaller
- [ ] Choisir de conserver les données
- [ ] Vérifier que les données sont toujours présentes
- [ ] Réinstaller
- [ ] Vérifier la récupération des données
- [ ] Tester séparément la suppression volontaire des données

## Mise à jour hors ligne
- [ ] Copier un nouvel installateur dans `updates`
- [ ] Créer `manifest.json`
- [ ] Détecter la nouvelle version
- [ ] Lancer la mise à jour
- [ ] Vérifier les données après mise à jour

## Livraison
- [ ] Tester sur un deuxième PC Windows
- [ ] Tester avec Internet désactivé
- [ ] Archiver les SHA-256 des installateurs
- [ ] Conserver une copie de la sauvegarde avant distribution
