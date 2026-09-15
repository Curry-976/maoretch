# Déployer MaoreTech sur un VPS (Docker + Caddy)

Objectif : faire tourner l'app sur ton VPS, accessible via l'IP du serveur (puis un domaine
en HTTPS quand tu en auras un). La base SQLite est persistée sur un volume Docker.

## Une fois : installer Docker sur le VPS

Connecte-toi en SSH puis :

```bash
curl -fsSL https://get.docker.com | sh
```

## 1. Récupérer le code sur le VPS

```bash
git clone https://github.com/Curry-976/maoretch.git
cd maoretch
```

(Pour les mises à jour ensuite : `git pull`.)

## 2. Créer le fichier .env

```bash
cp .env.vps.example .env
nano .env
```

Remplis :

| Variable | Valeur |
|---|---|
| `SITE_ADDRESS` | `:80` (sans domaine) — ou ton domaine plus tard |
| `BETTER_AUTH_SECRET` | Une chaîne aléatoire : `openssl rand -hex 32` |
| `BACKEND_URL` | `http://IP_DU_VPS` (l'IP publique du serveur) |
| `RESEND_API_KEY` | `re_...` depuis resend.com (sinon les codes s'affichent dans les logs) |
| `RESEND_FROM` | (optionnel) |

## 3. Lancer

```bash
docker compose up -d --build
```

Le premier build prend ~2 min. Vérifie que tout tourne :

```bash
docker compose ps
docker compose logs -f app
```

Ouvre `http://IP_DU_VPS` dans ton navigateur → écran de login. 🎉

## 4. (Plus tard) Brancher un domaine en HTTPS

1. Chez ton registrar, crée un enregistrement **A** : `mondomaine.com → IP_DU_VPS`
2. Édite `.env` :
   - `SITE_ADDRESS=mondomaine.com`
   - `BACKEND_URL=https://mondomaine.com`
3. Relance :
   ```bash
   docker compose up -d
   ```
   Caddy obtient automatiquement un certificat Let's Encrypt. L'app passe en HTTPS.

## Mises à jour du code

```bash
cd maoretch
git pull
docker compose up -d --build
```

## Commandes utiles

```bash
docker compose logs -f app      # voir les logs de l'app
docker compose restart app      # redémarrer l'app
docker compose down             # tout arrêter
```

La base SQLite est dans le volume Docker `maoretch_db-data` (survit aux redéploiements).

---

## Développement local

```powershell
cd backend && bun install && cd ..
cd webapp && bun install && cd ..

copy .env.example backend\.env
# Édite backend\.env : BETTER_AUTH_SECRET (RESEND optionnel — les codes s'affichent en console)

cd backend && bun run prisma:generate && bun run prisma:push && cd ..

# Deux terminaux :
cd backend && bun run dev    # http://localhost:3000
cd webapp && bun run dev     # http://localhost:8000
```
