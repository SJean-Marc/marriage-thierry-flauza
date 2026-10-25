# Mariage Thierry & Flauza

Site du mariage (17 et 18 mars 2027), hébergé sur GitHub Pages. Les spécifications sont dans [SPECIFICATIONS.md](SPECIFICATIONS.md).

## Liens d'invitation

| Version | Événements | Lien |
|---|---|---|
| A | Mairie + religieux + soirée | `https://mariage-flauza-thierry.fr/?i=CgX4ht` |
| B | Religieux + soirée | `https://mariage-flauza-thierry.fr/?i=NXrmCt` |
| C | Soirée | `https://mariage-flauza-thierry.fr/?i=rLXUq7` |

Sans code valide, le site n'affiche que l'accueil.

## Lancer en local

```bash
python3 -m http.server 8765
# puis http://localhost:8765/?i=CgX4ht
```

## Tests

```bash
node --test --experimental-test-coverage tests/
```

## Mise en place de la Google Sheet

1. Créer une Google Sheet, puis **Extensions > Apps Script**.
2. Coller le contenu de `apps-script/Code.gs`.
3. **Paramètres du projet > Propriétés du script** : ajouter `DATE_REVELATION` et `LIEUX` (valeurs dans `apps-script/lieux.local.json`, fichier local non publié ; `LIEUX` se colle en JSON sur une ligne).
4. **Déployer > Nouveau déploiement > Application web** : exécuter en tant que « Moi », accès « Tout le monde ».
5. Copier l'URL `https://script.google.com/macros/s/…/exec` dans `urlScript` de `js/config.js`.

Les réponses arrivent dans l'onglet « Réponses » (une ligne par personne).

## Valeurs provisoires à remplacer (`js/config.js`)

- numéro Wero, liens Lydia et PayPal ;
- liens pCloud (consultation et dépôt) ;
- date de révélation des lieux (propriété du script).
