<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ccfec030-52a3-40d3-96e9-04eb7365050f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Sécurité (version auditée)

- Authentification serveur avec cookie de session HttpOnly, SameSite=Lax et expiration.
- Mots de passe/PIN hachés avec scrypt + sel aléatoire; aucun secret d'authentification n'est envoyé au navigateur.
- Autorisation RBAC côté serveur pour les écritures d'état: administrateur complet, professeur limité aux notes/sujets/affiches/attestations, gestionnaire limité aux paiements/attestations.
- Données persistées dans SQLite côté serveur; le `localStorage` n'est qu'un cache non sensible.
- Journal d'audit SQLite pour les connexions, réinitialisations de mots de passe et modifications d'état.
- Validation serveur des paiements et notes.
- Les clés maître codées en dur, mots de passe par défaut et récupération par téléphone/email ont été supprimés.
- Les appels Gemini sont protégés par session et les e-mails/téléphones/matricules évidents sont redacted avant envoi.
- Les sauvegardes automatiques de fichiers locaux sont désactivées par défaut afin d'éviter la création silencieuse de JSON sensibles non chiffrés.

### Premier démarrage

Définir au minimum `SESSION_PEPPER` et, en production, `NODE_ENV=production`. Vous pouvez définir `ADMIN_INITIAL_PASSWORD` et `STAFF_INITIAL_PASSWORD`. À défaut, des mots de passe aléatoires sont générés une seule fois et affichés dans les logs du serveur.

La base SQLite et le secret de session local sont créés dans `data/`, dossier exclu de Git.
