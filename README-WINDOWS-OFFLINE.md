# École Manager — Windows autonome hors ligne

Version 1.1.1 — cette édition transforme l'application en logiciel Windows installable avec Electron + electron-builder.

## Fonctionnalités de distribution

- Installateur Windows NSIS `.exe` en français.
- Logo École Manager intégré à l'installateur et aux raccourcis.
- Raccourci Bureau + menu Démarrer.
- Désinstallation Windows propre.
- Les données utilisateur sont conservées lors de la désinstallation par défaut.
- Option de suppression complète des données lors de la désinstallation.
- Base SQLite locale dans `%APPDATA%\Ecole Manager\data`.
- Sauvegarde automatique au démarrage, à l'arrêt et toutes les 30 minutes.
- Conservation des 20 dernières sauvegardes.
- Sauvegarde manuelle et restauration depuis le menu **Fichier**.
- Dossier de sauvegardes : `%APPDATA%\Ecole Manager\backups`.
- Système de mise à jour hors ligne par installateur local.
- Dossier de mises à jour : `%APPDATA%\Ecole Manager\updates`.
- Aucun appel Internet nécessaire pour les fonctions de gestion.

## Générer l'installateur

Sur une machine Windows de développement :

```powershell
npm install
npm run dist:win
```

Les fichiers générés sont placés dans `release/`.

## Mise à jour hors ligne

Copier le nouvel installateur `.exe` dans :

`%APPDATA%\Ecole Manager\updates\`

Puis créer `manifest.json` avec par exemple :

```json
{"version":"1.1.1","installer":"École Manager-Setup-1.1.1.exe"}
```

Dans l'application : **Maintenance → Vérifier une mise à jour hors ligne**.

## Important

La génération finale du `.exe` doit être effectuée sur Windows (ou avec une chaîne de build Windows compatible). Le projet est prêt pour `electron-builder` et contient le script NSIS personnalisé.

## Contrôle avant livraison

Sur Windows, exécuter d’abord :

```powershell
npm install
npm run lint
npm run security-audit
npm run release-preflight
```

Puis générer les artefacts :

```powershell
npm run dist:win
npm run dist:portable
```

Avant toute distribution à une école, effectuer un test d’acceptation : installation, création de données, redémarrage, sauvegarde automatique, restauration, désinstallation avec conservation des données, réinstallation et mise à jour depuis une clé USB.
