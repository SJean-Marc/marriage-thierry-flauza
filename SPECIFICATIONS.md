# Spécifications — Site du mariage de Thierry & Flauza

> Document de travail. Source visuelle : faire-part `IMG-20261025-WA0000.jpg`.

## 1. Identité visuelle (reprise du faire-part)

### Palette
| Rôle | Couleur | Usage |
|---|---|---|
| Fond | Crème / ivoire (`#FBF3E6` env.) | Fond général, légère texture papier |
| Couleur principale | Bordeaux (`#7A1028` env.) | Noms, titres, bloc mis en avant |
| Accent | Or / doré (`#B8862F` env.) | Filets, ornements, heures, esperluette « & » |
| Secondaire | Rose poudré / pêche | Fleurs décoratives |
| Texte courant | Brun foncé / noir doux | Paragraphes |

### Typographies
- **Noms des mariés** : script calligraphique (ex. *Great Vibes*), bordeaux, « & » en doré.
- **Titres de section** : capitales serif espacées (ex. *Cormorant Garamond* / *Cinzel*), comme « PROGRAMME ».
- **Texte** : serif classique ; mentions secondaires en *italique*.
- **Tamoul** : police compatible (ex. *Noto Serif Tamil*), les scripts latins décoratifs n'ayant pas de glyphes tamouls.

### Ornements
- Bouquets floraux aux coins (fleurs blanc/rose, feuilles bordeaux et dorées, baies rouges).
- Filets dorés avec motif central entre les sections.
- Mandalas discrets en filigrane.
- Cartes d'événement au **sommet en arche**, bordées d'or ; la carte de la cérémonie religieuse en bordeaux plein.
- Pictogrammes dorés : mairie, lampe à huile (*kuthu vilakku*), coupes de champagne.

### Ambiance
Élégant, chaleureux, traditionnel ; mélange de classique français et de références tamoules.

## 2. Contenu

### Les mariés
**Thierry & Flauza** (prénoms seulement : aucun nom de famille ni membre de la famille sur le site).

### Événements
| Clé | Événement | Date | Heure |
|---|---|---|---|
| `mairie` | Mariage civil | Mercredi 17 mars 2027 | 11 h 30 |
| `religieux` | Cérémonie religieuse | Jeudi 18 mars 2027 | 11 h 30 |
| `soiree` | Vin d'honneur et réception | Jeudi 18 mars 2027 | dès 19 h |

Les lieux ne sont pas publiés dans le dépôt : ils sont dans `apps-script/lieux.local.json` (fichier local, ignoré par git) et à recopier dans les propriétés du script Google.

Date limite de réponse : **28 janvier 2027**.

## 3. Fonctionnalités

### 3.1 Trois versions du site selon l'invitation
| Version | Événements affichés |
|---|---|
| A | Mairie + religieux + soirée |
| B | Religieux + soirée |
| C | Soirée |

- Un seul site ; la version est déterminée par un **code d'invitation non devinable dans le lien** (ex. `…/?i=k7Rq2m`), donc un QR code par version.
- Sans code valide, le site affiche seulement l'accueil (noms, date) et un message invitant à utiliser le lien de l'invitation.
- La version est enregistrée avec chaque réponse au formulaire.

### 3.2 Programme & lieux
- Programme (date, heure, nom de l'événement) toujours visible pour les événements de la version.
- **Lieux (nom et adresse) masqués jusqu'à une date de révélation** (à définir). Avant cette date, le site affiche par exemple « Adresse communiquée le JJ/MM/AAAA ».
- Les adresses **ne figurent pas dans le code du site** : elles sont fournies par le script Google (voir 3.3) uniquement après la date de révélation, sinon on pourrait les lire dans le code source de la page.
- Après la révélation : adresse complète, liens Google Maps et Waze.

### 3.3 Confirmation de présence → Google Sheets
- En tête du formulaire, un bandeau : « Tous nos plats sont halal. Merci de sélectionner votre préférence alimentaire pour chaque repas. »
- Formulaire en cartes : une carte par personne (ajout, suppression par une icône poubelle), deux côte à côte sur grand écran. Dans chaque carte, un groupe par jour, avec seulement les événements **de l'invitation** (version A, B ou C) :
  - **Mercredi 17 mars** : Mairie, Menu ;
  - **Jeudi 18 mars** : Cérémonie, Soirée, Menu, Dessert.
- Chaque jour a un titre en pastille dorée (« Mercredi 17 mars 2027 ») entre deux filets ; chaque ligne commence par un pictogramme doré (ceux du programme pour les événements, couverts pour le menu, gâteau pour le dessert).
- Les contrôles sont alignés dans une même colonne (même début, même fin). Pour chaque personne :
  - nom et prénom ;
  - pour chaque événement, un choix segmenté « Présent | Absent » (deux boutons radio, « Présent » par défaut) ;
  - menu **par jour** : choix segmenté « Végétarien | Non végétarien » (« Non végétarien » par défaut), désactivé si la personne est absente à tous les événements du jour ;
  - dessert pour la soirée (obligatoire si la personne y vient) : un bouton ouvre une fenêtre avec les 3 gâteaux en image (velvet fruits rouges, pistache fruits rouges, fruits exotiques) ; le choix s'affiche ensuite dans la carte avec un crayon pour le modifier. Images provisoires : `assets/img/dessert-*.svg`, à remplacer par de vraies photos.
- Champs manquants (nom, dessert) encadrés en rouge, avec le focus sur le premier et un message d'erreur visible.
- Envoi vers une **Google Sheet** via un **Google Apps Script** publié en application web (gratuit, aucun serveur à gérer).
- Une ligne par personne dans la feuille : horodatage, identifiant de la réponse, version (A/B/C), langue, nom, Mairie, Menu 17/03, Religieux, Soirée, Menu 18/03, Dessert. Événements : « présent », « absent », ou vide si non invité ; menus : « végétarien », « non végétarien », ou vide si non invité ou absent ce jour-là.
- Le script vérifie que les présences correspondent aux événements de la version et que le dessert est valide.
- Message de confirmation après l'envoi, et indication de la date limite du 28/01/2027.
- Anti-spam léger : champ piège invisible (*honeypot*), refus des envois vides.
- Protections du script (son URL et les codes d'invitation sont publics) :
  - formulaire fermé à partir du lendemain du mariage (19/03/2027, heure de Paris), avec un message dédié sur le site ;
  - au plus 30 envois toutes les 10 minutes, tous invités confondus ;
  - feuille plafonnée à 1 500 lignes ;
  - noms en texte brut : formules neutralisées, caractères de contrôle refusés, colonne « Nom » au format texte ;
  - autorisation du script limitée à la feuille des réponses (`@OnlyCurrentDoc`).
- Pas de captcha pour l'instant : à ajouter (Cloudflare Turnstile, vérifié par le script) seulement si du spam réel apparaît.

### 3.4 Cagnotte
- Rubrique « Cagnotte » : boutons Lydia et PayPal (aucun numéro de téléphone affiché). Valeurs provisoires dans `js/config.js`.

### 3.5 Photos & vidéos (pCloud)
- Bouton « Voir les photos et vidéos » → lien de partage pCloud.
- Bouton « Déposer vos photos et vidéos » → lien de dépôt pCloud (*upload link*), sans compte nécessaire pour les invités.
- Les fichiers ne sont pas hébergés sur le site.

### 3.6 Langues
- Français (par défaut) et tamoul, avec un sélecteur FR / தமிழ் dans l'en-tête.
- Le choix est mémorisé dans le navigateur.
- Traductions tamoules : première version rédigée par nos soins, **à relire par un locuteur natif**.

### 3.7 Protection légère
- Pages non référencées par les moteurs de recherche (balise `noindex`).
- Accès au contenu uniquement par un lien d'invitation (voir 3.1).
- Adresses servies par le script Google après la date de révélation (voir 3.2).
- Mot de passe : **reporté à plus tard**.

## 4. Technique
- Site statique HTML / CSS / JavaScript, sans framework, hébergé sur **GitHub Pages**.
- Mise en page d'abord pour mobile (arrivée par QR code).
- Backend unique : Google Apps Script relié à la Google Sheet (réception des réponses + fourniture des adresses).
- Tests automatisés sur la logique JavaScript (choix de la version, révélation des adresses, validation du formulaire).

## 5. Cagnotte — comparatif des frais (octobre 2026, à vérifier sur les grilles officielles)

| Solution | Frais | Remarque |
|---|---|---|
| **Virement / Wero** (RIB ou numéro de téléphone) | **0 %** | Wero est intégré aux applications des principales banques françaises |
| Lydia / Sumeria | 0 % entre utilisateurs de l'application (depuis mai 2026) ; frais possibles par carte | Les invités doivent avoir l'application pour ne pas payer de frais |
| Leetchi | Gratuit si dépensé chez des partenaires ; sinon environ 6 % au retrait | Pratique mais coûteux pour une grosse somme |
| Le Pot Commun | Environ 2,9 à 4 % au retrait selon le montant | Grille modifiée en 2026 |

**Recommandation** : RIB / Wero (aucun frais). Option : ajouter un lien Lydia/Sumeria pour les invités qui préfèrent payer par carte.

## 6. Points à valider
- [ ] Date de révélation des adresses (provisoire : 01/03/2027).
- [x] Cagnotte : Lydia + PayPal (liens provisoires), numéro Wero retiré.
- [x] Formulaire : réponse « nous ne pourrons pas venir » possible.
- [ ] Formulaire : ajouter un téléphone ou un e-mail de contact, ou un message libre ?
- [x] Faire-part : trois QR codes, un par version.
- [ ] Liens pCloud (consultation + dépôt).
- [ ] Relecteur tamoul.
- [ ] Orthographe du nom du lieu de réception (voir `apps-script/lieux.local.json`).
