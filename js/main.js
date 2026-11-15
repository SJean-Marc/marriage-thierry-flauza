import { CONFIG } from "./config.js";
import { formaterDate, langueInitiale, traduire } from "./i18n.js";
import { evenementVedette, evenementsDeLaVersion, lireInvitation } from "./invitation.js";
import { DESSERTS, EVENEMENT_DESSERT, construireEnvoi, estPresenteQuelquePart, validerReponse } from "./rsvp.js";

const CLE_LANGUE = "langue";

// Arche orientale des cartes (même forme que le faire-part), dessinée dans un repère 290 × 330.
const ARCHE_LARGEUR = 290;
const ARCHE_HAUTEUR = 330;

function cheminArche(l, h) {
  const m = l / 2;
  return `M0 ${h - 12} L0 64 C0 48 16 40 36 38 C${m - 62} 33 ${m - 24} 24 ${m} 0 ` +
    `C${m + 24} 24 ${m + 62} 33 ${l - 36} 38 C${l - 16} 40 ${l} 48 ${l} 64 L${l} ${h - 12} ` +
    `Q${l} ${h} ${l - 12} ${h} L12 ${h} Q0 ${h} 0 ${h - 12} Z`;
}

const ARCHE_SVG =
  `<svg class="arche" viewBox="0 0 ${ARCHE_LARGEUR} ${ARCHE_HAUTEUR}" preserveAspectRatio="none" aria-hidden="true">` +
  `<path class="arche-exterieur" d="${cheminArche(ARCHE_LARGEUR, ARCHE_HAUTEUR)}"/>` +
  `<path class="arche-interieur" d="${cheminArche(ARCHE_LARGEUR - 14, ARCHE_HAUTEUR - 14)}" transform="translate(7 9)"/>` +
  `</svg>`;

const invitation = lireInvitation(window.location.search, CONFIG.versions);

const etat = {
  langue: langueInitiale(lireLangueMemorisee(), new URLSearchParams(window.location.search).get("lang")),
  invitation,
  evenements: invitation ? evenementsDeLaVersion(invitation.version, CONFIG.evenementsParVersion) : [],
  lieux: null,
};

function lireLangueMemorisee() {
  try {
    return window.localStorage.getItem(CLE_LANGUE);
  } catch {
    return null;
  }
}

function memoriserLangue(langue) {
  try {
    window.localStorage.setItem(CLE_LANGUE, langue);
  } catch {
    // Stockage indisponible (navigation privée) : la langue n'est simplement pas mémorisée.
  }
}

function t(cle, parametres) {
  return traduire(etat.langue, cle, parametres);
}

function element(balise, classe, texte) {
  const noeud = document.createElement(balise);
  if (classe) {
    noeud.className = classe;
  }
  if (texte !== undefined) {
    noeud.textContent = texte;
  }
  return noeud;
}

function appliquerTextes() {
  document.documentElement.lang = etat.langue;
  document.title = t("titre-page");
  document.querySelectorAll("[data-i18n]").forEach((noeud) => {
    noeud.textContent = t(noeud.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-label]").forEach((noeud) => {
    noeud.dataset.label = t(noeud.dataset.i18nLabel);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((champ) => {
    champ.placeholder = t(champ.dataset.i18nPlaceholder);
    champ.setAttribute("aria-label", champ.placeholder);
  });
  document.querySelectorAll("[data-langue]").forEach((bouton) => {
    bouton.setAttribute("aria-pressed", String(bouton.dataset.langue === etat.langue));
  });
  document.getElementById("rsvp-limite").textContent = t("rsvp-limite", {
    date: formaterDate(CONFIG.dateLimiteReponse, etat.langue),
  });
  afficherEvenements();
}

function changerLangue(langue) {
  etat.langue = langueInitiale(langue);
  memoriserLangue(etat.langue);
  appliquerTextes();
}

// --- Programme & lieux ---

function texteLieuMasque() {
  if (etat.lieux?.revealDate) {
    return t("lieu-revele-le", { date: formaterDate(etat.lieux.revealDate, etat.langue) });
  }
  return t("lieu-prochainement");
}

function blocLieu(cle) {
  const lieu = etat.lieux?.revealed ? etat.lieux.lieux?.[cle] : null;
  if (!lieu) {
    return element("p", "lieu lieu-masque", texteLieuMasque());
  }
  const bloc = element("div", "lieu");
  bloc.append(element("p", "lieu-nom", lieu.nom), element("p", "lieu-adresse", lieu.adresse));
  const liens = element("p", "lieu-liens");
  const adresse = encodeURIComponent(`${lieu.nom}, ${lieu.adresse}`);
  const maps = element("a", "", t("lien-itineraire"));
  maps.href = `https://www.google.com/maps/search/?api=1&query=${adresse}`;
  const waze = element("a", "", "Waze");
  waze.href = `https://waze.com/ul?q=${adresse}&navigate=yes`;
  [maps, waze].forEach((lien) => {
    lien.target = "_blank";
    lien.rel = "noopener";
  });
  liens.append(maps, " · ", waze);
  bloc.append(liens);
  return bloc;
}

function afficherEvenements() {
  if (!etat.invitation) {
    return;
  }
  const conteneur = document.getElementById("cartes-evenements");
  const vedette = evenementVedette(etat.evenements);
  const cartes = etat.evenements.map(
    (cle) => {
      const carte = element("article", `carte carte-${cle}${cle === vedette ? " vedette" : ""}`);
      carte.innerHTML = ARCHE_SVG;
      const icone = element("img", "carte-icone");
      icone.src = `assets/img/icone-${cle}.png`;
      icone.alt = "";
      carte.append(
        icone,
        element("h3", "carte-titre", t(`evt-${cle}-titre`)),
        element("div", "filet filet-court"),
        element("p", "carte-date", t(`evt-${cle}-date`)),
        element("p", "carte-heure", t(`evt-${cle}-heure`)),
        blocLieu(cle),
      );
      return carte;
    },
  );
  conteneur.replaceChildren(...cartes);
}

async function chargerLieux() {
  if (!CONFIG.urlScript) {
    return;
  }
  try {
    const url = `${CONFIG.urlScript}?action=lieux&i=${encodeURIComponent(etat.invitation.code)}`;
    const reponse = await fetch(url);
    etat.lieux = await reponse.json();
  } catch {
    etat.lieux = null;
  }
  afficherEvenements();
}

// --- Formulaire de présence ---
// Tableau : une ligne par personne, une colonne par événement de l'invitation,
// puis « végétarien » et le choix du dessert (pour la soirée).

function aLeDessert() {
  return etat.evenements.includes(EVENEMENT_DESSERT);
}

function celluleTraduite(balise, cle, classe) {
  const cellule = element(balise, classe, t(cle));
  cellule.dataset.i18n = cle;
  return cellule;
}

function construireEntete() {
  const entete = document.getElementById("entete-presence");
  entete.append(
    celluleTraduite("th", "rsvp-nom"),
    ...etat.evenements.map((cle) => celluleTraduite("th", `evt-${cle}-court`)),
    celluleTraduite("th", "rsvp-vegetarien"),
  );
  if (aLeDessert()) {
    entete.append(celluleTraduite("th", "rsvp-dessert"));
  }
  entete.append(element("th"));
  entete.querySelectorAll("th").forEach((th) => th.setAttribute("scope", "col"));
}

// Cellule avec intitulé : l'intitulé s'affiche sur mobile, où le tableau devient une liste de cartes.
function celluleAvecIntitule(cle, classe) {
  const cellule = element("td", classe);
  cellule.dataset.i18nLabel = cle;
  cellule.dataset.label = t(cle);
  return cellule;
}

function definirPresence(bascule, presente) {
  const cle = presente ? "rsvp-present" : "rsvp-absent";
  bascule.setAttribute("aria-pressed", String(presente));
  bascule.classList.toggle("absent", !presente);
  bascule.dataset.i18n = cle;
  bascule.textContent = t(cle);
}

function creerBascule(cle, choixDessert) {
  const bascule = element("button", "bascule-presence");
  bascule.type = "button";
  bascule.dataset.evenement = cle;
  definirPresence(bascule, true);
  bascule.addEventListener("click", () => {
    const presente = bascule.getAttribute("aria-pressed") !== "true";
    definirPresence(bascule, presente);
    if (cle === EVENEMENT_DESSERT && choixDessert) {
      choixDessert.disabled = !presente;
    }
  });
  return bascule;
}

function creerChoixDessert() {
  const choix = element("select");
  choix.name = "dessert";
  choix.setAttribute("aria-label", t("rsvp-dessert"));
  const options = ["", ...DESSERTS].map((dessert) => {
    const option = element("option");
    option.value = dessert;
    option.dataset.i18n = dessert ? `dessert-${dessert}` : "rsvp-dessert-choisir";
    option.textContent = t(option.dataset.i18n);
    return option;
  });
  choix.append(...options);
  return choix;
}

function ajouterPersonne() {
  const liste = document.getElementById("liste-personnes");
  const ligne = element("tr", "personne");

  const nom = element("input");
  nom.type = "text";
  nom.name = "nom";
  nom.autocomplete = "name";
  nom.dataset.i18nPlaceholder = "rsvp-nom";
  nom.placeholder = t("rsvp-nom");
  nom.setAttribute("aria-label", t("rsvp-nom"));
  const celluleNom = element("td", "cellule-nom");
  celluleNom.append(nom);
  ligne.append(celluleNom);

  const choixDessert = aLeDessert() ? creerChoixDessert() : null;
  etat.evenements.forEach((cle) => {
    const cellule = celluleAvecIntitule(`evt-${cle}-court`, "cellule-evenement");
    cellule.append(creerBascule(cle, choixDessert));
    ligne.append(cellule);
  });

  const caseVegetarien = element("input");
  caseVegetarien.type = "checkbox";
  caseVegetarien.name = "vegetarien";
  caseVegetarien.setAttribute("aria-label", t("rsvp-vegetarien"));
  const celluleVegetarien = celluleAvecIntitule("rsvp-vegetarien", "cellule-vegetarien");
  celluleVegetarien.append(caseVegetarien);
  ligne.append(celluleVegetarien);

  if (choixDessert) {
    const celluleDessert = celluleAvecIntitule("rsvp-dessert", "cellule-dessert");
    celluleDessert.append(choixDessert);
    ligne.append(celluleDessert);
  }

  const retirer = celluleTraduite("button", "rsvp-retirer", "retirer");
  retirer.type = "button";
  retirer.addEventListener("click", () => {
    if (liste.children.length > 1) {
      ligne.remove();
    }
  });
  const celluleRetirer = element("td", "cellule-retirer");
  celluleRetirer.append(retirer);
  ligne.append(celluleRetirer);

  liste.append(ligne);
  return nom;
}

function lireReponse(formulaire) {
  const personnes = [...document.querySelectorAll("#liste-personnes .personne")].map((ligne) => ({
    nom: ligne.querySelector('input[name="nom"]').value,
    presences: Object.fromEntries(
      [...ligne.querySelectorAll(".bascule-presence")].map((bascule) => [
        bascule.dataset.evenement,
        bascule.getAttribute("aria-pressed") === "true",
      ]),
    ),
    vegetarien: ligne.querySelector('input[name="vegetarien"]').checked,
    dessert: ligne.querySelector('select[name="dessert"]')?.value ?? "",
  }));
  return { personnes, site: formulaire.elements.site.value };
}

function afficherMessage(cles, type) {
  const message = document.getElementById("message-rsvp");
  message.textContent = cles.map((cle) => t(cle)).join(" ");
  message.className = `message ${type}`;
}

async function envoyerReponse(evenement) {
  evenement.preventDefault();
  const formulaire = evenement.currentTarget;
  const reponse = lireReponse(formulaire);
  const erreurs = validerReponse(reponse, etat.evenements);
  if (erreurs.length > 0) {
    afficherMessage(erreurs, "erreur");
    return;
  }
  if (!CONFIG.urlScript) {
    afficherMessage(["erreur-non-configure"], "erreur");
    return;
  }
  const bouton = document.getElementById("envoyer-rsvp");
  bouton.disabled = true;
  bouton.textContent = t("rsvp-envoi");
  try {
    const envoi = construireEnvoi(etat.invitation.code, etat.langue, reponse, etat.evenements);
    const resultat = await fetch(CONFIG.urlScript, {
      method: "POST",
      body: JSON.stringify(envoi),
    }).then((r) => r.json());
    if (!resultat.ok) {
      throw new Error(resultat.erreur);
    }
    const viennent = envoi.personnes.some(estPresenteQuelquePart);
    formulaire.replaceChildren(
      element("p", "message succes", t(viennent ? "rsvp-merci-oui" : "rsvp-merci-non")),
    );
  } catch {
    afficherMessage(["erreur-envoi"], "erreur");
    bouton.disabled = false;
    bouton.textContent = t("rsvp-envoyer");
  }
}

function initialiserFormulaire() {
  construireEntete();
  // Focus seulement sur une ligne ajoutée par l'invité : au chargement, la page ne doit pas sauter au formulaire.
  document.getElementById("ajouter-personne").addEventListener("click", () => ajouterPersonne().focus());
  document.getElementById("formulaire-rsvp").addEventListener("submit", envoyerReponse);
  ajouterPersonne();
}

// --- Cagnotte & photos ---

function initialiserLiens() {
  document.getElementById("lien-lydia").href = CONFIG.cagnotte.lydia;
  document.getElementById("lien-paypal").href = CONFIG.cagnotte.paypal;
  document.getElementById("lien-photos-voir").href = CONFIG.photos.voir;
  document.getElementById("lien-photos-deposer").href = CONFIG.photos.deposer;
}

// --- Démarrage ---

function initialiserContact() {
  const lien = document.getElementById("lien-contact");
  lien.href = `mailto:${CONFIG.contact}`;
  lien.textContent = CONFIG.contact;
}

function demarrer() {
  initialiserContact();
  document.querySelectorAll("[data-langue]").forEach((bouton) => {
    bouton.addEventListener("click", () => changerLangue(bouton.dataset.langue));
  });

  if (etat.invitation) {
    document.getElementById("contenu-invite").hidden = false;
    initialiserFormulaire();
    initialiserLiens();
    chargerLieux();
  } else {
    document.getElementById("invitation-requise").hidden = false;
  }
  appliquerTextes();
}

demarrer();
