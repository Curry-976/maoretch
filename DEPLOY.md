# Déployer MaoreTech sur Railway

Objectif : une URL `https://maoretech.up.railway.app` (ou ton domaine) à envoyer à ton client. Hébergement gratuit pendant l'essai, puis ~5 €/mois (plan Hobby).

## 1. Pousser cette branche `railway` sur GitHub

```powershell
cd C:\Users\bendo\maoretch
git push -u origin railway
```

## 2. Créer un compte Railway et lier le repo

1. Va sur https://railway.app/login → connecte-toi avec ton GitHub `Curry-976`
2. **New Project** → **Deploy from GitHub repo** → choisis `maoretch`
3. Important : **Settings → Branch → `railway`** (pas `main`)

Railway détecte Nixpacks + Bun automatiquement et lance un premier build (qui va échouer faute d'env vars — normal).

## 3. Ajouter un volume persistant (pour la SQLite)

1. Dans ton service Railway, onglet **Settings** → section **Volumes** → **+ New Volume**
2. Mount path : `/data`
3. Taille : 1 GB suffit largement

## 4. Récupérer le domaine Railway

Onglet **Settings → Networking → Generate Domain**. Tu obtiens une URL du type :
`https://maoretech-production.up.railway.app`

Note-la, tu en auras besoin juste après.

## 5. Configurer les variables d'environnement

Onglet **Variables** → **+ New Variable** pour chacune :

| Variable | Valeur |
|---|---|
| `BETTER_AUTH_SECRET` | Générée en local : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `BACKEND_URL` | L'URL Railway de l'étape 4 |
| `DATABASE_URL` | `file:/data/maoretech.db` |
| `RESEND_API_KEY` | `re_...` depuis resend.com |
| `RESEND_FROM` | (optionnel) Sinon `onboarding@resend.dev` est utilisé par défaut |

## 6. Redéployer

Onglet **Deployments** → **... → Redeploy** sur le dernier déploiement.

Une fois vert (~2 min), ouvre ton URL Railway → tu dois voir l'écran de login.

## 7. Tester

1. Entre ton email
2. Tu reçois un vrai code à 6 chiffres dans ta boîte
3. Tu te connectes → dashboard ✨

L'URL Railway est celle à partager à ton client.

---

## Développement local

```powershell
cd C:\Users\bendo\maoretch
cd backend && bun install && cd ..
cd webapp && bun install && cd ..

# Crée le .env local
copy .env.example backend\.env
# Édite backend\.env pour mettre BETTER_AUTH_SECRET (RESEND optionnel en dev — les codes s'affichent dans la console)

cd backend && bun run prisma:generate && bun run prisma:push && cd ..

# Lance backend et frontend ensemble (2 terminaux)
cd backend && bun run dev    # http://localhost:3000
cd webapp && bun run dev     # http://localhost:8000
```

Le frontend (port 8000) proxy `/api/*` vers le backend (port 3000) en dev. En prod, c'est servi sur la même URL Railway.

## Mises à jour

Chaque `git push` sur la branche `railway` déclenche un redéploiement automatique.
