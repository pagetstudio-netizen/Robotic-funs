# Déploiement RoboticsFund sur Plesk

## Réglages de l’application Node.js

Dans le dépôt Git configuré dans Plesk, choisir :

| Réglage Plesk | Valeur |
| --- | --- |
| Application root | Racine du dépôt, le dossier qui contient `package.json` |
| Document root | `dist/public` (relatif à l’application root) |
| Application startup file | `dist/index.cjs` (relatif à l’application root) |
| Node.js | Node 20.20 ou une version compatible plus récente |
| Mode | Production (`NODE_ENV=production`) |

Le serveur écoute sur `PORT` fourni par Plesk. Ne pas fixer le port dans le code.

## Première installation et mises à jour

1. Connecter le dépôt GitHub à Plesk et vérifier que la branche déployée est la bonne.
2. Installer les dépendances dans l’application root (`npm ci`, ou **NPM Install** dans Plesk).
3. Avant chaque push contenant des changements d’application, exécuter localement :

   ```bash
   npm run check
   npm run build
   ```

4. Inclure le dossier `dist/` généré dans le commit : le serveur Plesk démarre `dist/index.cjs` et sert `dist/public`. Le bouton **Pull + Deploy Now** récupère ces fichiers; il ne remplace pas la compilation locale.
5. Dans Plesk, faire **Pull + Deploy Now**, puis **Restart** l’application Node.js.
6. Vérifier la page d’accueil, la connexion et les logs de l’application.

`npm start` lance également `NODE_ENV=production node dist/index.cjs`.

## Variables d’environnement Plesk

Les valeurs doivent être ajoutées dans les paramètres d’environnement Node.js de Plesk, jamais dans Git ni dans un fichier `.env` versionné.

### Nécessaires au démarrage

- `SESSION_SECRET`
- `SUPABASE_DATABASE_URL` **ou** `DATABASE_URL`. Si les deux sont définis, l’application privilégie `SUPABASE_DATABASE_URL`.
- `ADMIN_PHONE`, `ADMIN_PASSWORD` et `ADMIN_PIN` pour conserver le compte administrateur attendu par le démarrage de l’application.
- `NODE_ENV=production`

Plesk fournit `PORT`. Ne pas copier les Secrets Replit automatiquement : saisir les valeurs requises dans l’environnement de Plesk.

### Selon les fonctions activées

- URL publique et callbacks : `PUBLIC_APP_URL`
- Telegram : `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Paiements : transférer les clés et secrets des fournisseurs activés, notamment `ASHTECHPAY_API_KEY`, `ASHTECHPAY_USER_ID`, `ASHTECHPAY_WEBHOOK_SECRET`, `DRIMPAY_API_KEY`, `DRIMPAY_WEBHOOK_SECRET`, `INPAY_API_BASE_URL`, `INPAY_API_KEY_CI`, `INPAY_MERCHANT_ID_CI`, `PPAYPROS_APP_ID`, `PPAYPROS_MCH_NO`, `PPAYPROS_PRIVATE_KEY`, `WESTPAY_MERCHANT_SLUG`, `WESTPAY_WEBHOOK_SECRET`, `SENDAVAPAY_API_KEY`, `SENDAVAPAY_WEBHOOK_SECRET`, `SOLEASPAY_API_KEY` et `OMNIPAY_API_KEY`.

Configurer les URL de webhooks chez chaque fournisseur avec le domaine HTTPS final et les routes de callback de l’application.

## Avant de basculer le site public

Le Supabase actuellement configuré contient la copie de la base **de développement** Replit. La base de production n’a pas été migrée ni vérifiée. Ne pas brancher le site public sur ce Supabase avant d’avoir migré et contrôlé les données de production séparément.

`TELEGRAM_CHAT_ID` ne figure plus dans `.replit`, mais le Secret Replit correspondant n’est pas encore configuré. Telegram restera désactivé dans un environnement tant que `TELEGRAM_CHAT_ID` n’y est pas défini. Ne pas remettre cette valeur dans Git; la configurer dans les Secrets Replit et dans les variables d’environnement Plesk si Telegram doit fonctionner.
