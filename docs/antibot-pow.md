# Anti-bot par Proof-of-Work (Hashcash) — AwemA

Couche anti-spam / anti-abus **auto-hébergée**, sans SaaS, sans CAPTCHA tiers, **aucune donnée envoyée à un tiers**. Implémentée le 2026-06-22.

## Pourquoi (en 2026)
Les CAPTCHA « prouve que tu es humain » sont battus par l'IA (résolution automatique) et pénibles pour les vrais users. Le **Proof-of-Work** change de logique : au lieu de *deviner* qui est humain, il **facture le volume**. Chaque action coûte ~1 s de CPU au client. Un humain qui vote une fois ne le sent presque pas ; un robot qui veut bourrer 100 000 votes paie 100 000 s de CPU → il abandonne. C'est l'idée de **Hashcash** (Adam Back, 1997), à l'origine pensée contre le spam email, puis reprise par Bitcoin.

## Le principe (invariant)
**Asymétrie** : produire la preuve coûte cher (force brute), la vérifier est gratuit (1 hash).

1. **Challenge (serveur, sans état).** `salt` aléatoire + `exp` (TTL ~5 min) + `difficulty` D bits, le tout **signé** par HMAC : `challenge = "salt:exp:difficulty:sig"`. La signature prouve qu'il vient de nous → pas besoin de stocker le challenge.
2. **Résolution (client).** Trouver un `nonce` tel que `SHA256("challenge:nonce")` commence par **≥ D bits à zéro**. ~2^D essais en moyenne. Fait dans un **Web Worker** → l'UI ne fige pas.
3. **Vérification (serveur, O(1)).** Dans l'ordre, rejette si : (a) signature invalide → forgé ; (b) expiré ; (c) `difficulty < D_min` → tentative de *downgrade* ; (d) le hash n'a pas D bits de zéro → preuve fausse ; (e) `salt` déjà vu → rejeu.
4. **Garde-fou.** Si `POW_SECRET` est absent → la vérif renvoie « OK » (no-op). **Activable par variable d'env** → on merge sans risque, on allume en prod.

## Où c'est, dans ce projet
- **Serveur** — [`backend/pow.js`](../backend/pow.js) : `issueChallenge()`, `verifyPoW(pow)`, `allowIssue(ip)`. No-op si `POW_SECRET` absent.
- **Émission** — `GET /api/pow` dans [`backend/index.js`](../backend/index.js) (rate-limité par IP).
- **Branchement** — la preuve est vérifiée **avant** l'écriture sur `POST /api/doleances/add` et `POST /api/doleances/vote` (les surfaces d'abus prioritaires : bourrage de votes + spam de contenu). Le module est réutilisable pour `/api/score` et `/api/lignees/create`.
- **Client** — [`engine/pow.js`](../engine/pow.js) : `window.powToken()` récupère un défi, le résout dans un Web Worker (SHA-256 synchrone), renvoie `{c, n}`. [`engine/idees.html`](../engine/idees.html) l'appelle avant chaque vote/ajout. **Fail-open** : si le PoW est désactivé ou injoignable → `null`, l'action passe normalement.

## Comment l'activer (prod)
Le PoW est **dormant par défaut**. Pour l'allumer sur Railway, pose la variable :

```
POW_SECRET = <une longue chaîne aléatoire secrète>
```

Optionnel :
- `POW_BITS = 18` — difficulté (voir table). Défaut 18.
- `POW_ENABLED = 0` — coupe le PoW même si le secret est présent (interrupteur d'urgence).

Puis redéploie (`railway up`). Aucune autre variable n'est nécessaire. Pour le désactiver : retire `POW_SECRET` (ou `POW_ENABLED=0`) et redéploie.

## Calibrage de la difficulté (D bits)
Coût ≈ 2^D hachages. Repère navigateur ~1 M hash/s (varie selon l'appareil) :

| D | Coût humain | Usage |
|---|---|---|
| 16 | ~40 ms | actions très fréquentes (vote) |
| 18 | ~250 ms | **défaut** — ajout/commentaire |
| 20 | ~1 s | inscription, login |
| 22 | ~4 s | sous attaque |

Commence bas, **mesure**, monte si l'abus persiste. Cible mobile bas de gamme → garde D ≤ 20. Modifiable via `POW_BITS`.

## Limites de sécurité assumées
- **Anti-rejeu mono-instance** : les `salt` consommés vivent en mémoire (`backend/pow.js`). Le serveur tourne en **1 réplique** (Railway eu-west=1) → OK. Si on passe en multi-instance/serverless, il faudra un store partagé (Redis `SETNX`).
- **Le PoW n'authentifie pas** : il rend l'abus de *masse* coûteux, il ne dit pas *qui* est là. On garde la modération, les plafonds et l'anti-triche du classement.
- **Rotation du secret** : changer `POW_SECRET` invalide les challenges en vol (acceptable, TTL court).
- **Denial-of-wallet** : on vérifie la preuve **avant** toute opération coûteuse. Jamais l'inverse.
- **JS désactivé / pas de Worker** : `powToken()` échoue alors « ouvert » (l'action passe). Acceptable ici (l'enjeu est le volume, pas le blocage strict) ; pour un endpoint critique, prévoir un repli (file de modération).

## Reproduire la méthode ailleurs
1. **Cartographier** les endpoints publics non authentifiés qui *écrivent* ou *coûtent* (email, DB, LLM, paiement).
2. **Tester l'applicabilité** : client = navigateur qu'on contrôle ? abus de masse réel ou probable ? Sinon → rate-limit / clés d'API / WAF / auth (le PoW n'est pas la bonne réponse).
3. **Reprendre l'invariant** ci-dessus (challenge signé stateless → Worker → vérif O(1) → gated env).
4. **Calibrer** D en mesurant, et **mesurer** l'effet sur l'abus.

> Test de référence (round-trip résoudre/vérifier + rejeu + forgé) : voir l'historique de `backend/powtest.mjs` (script jetable). Résultat attendu : `POW OK`.
