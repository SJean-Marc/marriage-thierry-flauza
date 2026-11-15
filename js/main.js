import { CONFIG } from "./config.js";
import { formaterDate, langueInitiale, traduire } from "./i18n.js";
import { evenementVedette, evenementsDeLaVersion, lireInvitation } from "./invitation.js";
import {
  DESSERTS,
  EVENEMENT_DESSERT,
  champsInvalides,
  construireEnvoi,
  estPresenteQuelquePart,
  validerReponse,
} from "./rsvp.js";

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
// Une carte par personne : nom, une ligne « Présent | Absent » par événement de l'invitation,
// puis « végétarien » et le choix du dessert (pour la soirée).

let compteurPersonnes = 0;

function aLeDessert() {
  return etat.evenements.includes(EVENEMENT_DESSERT);
}

function texteTraduit(balise, cle, classe) {
  const noeud = element(balise, classe, t(cle));
  noeud.dataset.i18n = cle;
  return noeud;
}

// Choix segmenté : deux boutons radio stylés, « Présent » coché par défaut.
function creerChoixPresence(idPersonne, cle, choixDessert) {
  const groupe = element("div", "champ champ-presence");
  groupe.setAttribute("role", "radiogroup");
  const intitule = texteTraduit("span", `evt-${cle}-court`, "intitule");
  intitule.id = `${idPersonne}-${cle}`;
  groupe.setAttribute("aria-labelledby", intitule.id);

  const segmente = element("div", "segmente");
  [
    ["present", "rsvp-present"],
    ["absent", "rsvp-absent"],
  ].forEach(([valeur, cleTexte]) => {
    const option = element("label", `option-${valeur}`);
    const radio = element("input");
    radio.type = "radio";
    radio.name = `${idPersonne}-${cle}`;
    radio.value = valeur;
    radio.dataset.evenement = cle;
    radio.checked = valeur === "present";
    if (cle === EVENEMENT_DESSERT && choixDessert) {
      radio.addEventListener("change", () => {
        choixDessert.disabled = valeur === "absent";
      });
    }
    option.append(radio, texteTraduit("span", cleTexte));
    segmente.append(option);
  });

  groupe.append(intitule, segmente);
  return groupe;
}

function creerChoixDessert() {
  const choix = element("select");
  choix.name = "dessert";
  const options = ["", ...DESSERTS].map((dessert) => {
    const option = texteTraduit("option", dessert ? `dessert-${dessert}` : "rsvp-dessert-choisir");
    option.value = dessert;
    return option;
  });
  choix.append(...options);
  return choix;
}

function champAvecLibelle(cleLibelle, controle, classe) {
  const champ = element("label", `champ ${classe}`);
  champ.append(texteTraduit("span", cleLibelle, "intitule"), controle);
  return champ;
}

function ajouterPersonne() {
  const liste = document.getElementById("liste-personnes");
  compteurPersonnes += 1;
  const idPersonne = `personne-${compteurPersonnes}`;
  const ligne = element("li", "personne");

  const nom = element("input", "champ-nom");
  nom.type = "text";
  nom.name = "nom";
  nom.autocomplete = "name";
  nom.dataset.i18nPlaceholder = "rsvp-nom";
  nom.placeholder = t("rsvp-nom");
  nom.setAttribute("aria-label", t("rsvp-nom"));
  ligne.append(nom);

  const choixDessert = aLeDessert() ? creerChoixDessert() : null;
  etat.evenements.forEach((cle) => ligne.append(creerChoixPresence(idPersonne, cle, choixDessert)));

  const caseVegetarien = element("input");
  caseVegetarien.type = "checkbox";
  caseVegetarien.name = "vegetarien";
  ligne.append(champAvecLibelle("rsvp-vegetarien", caseVegetarien, "champ-vegetarien"));

  if (choixDessert) {
    ligne.append(champAvecLibelle("rsvp-dessert", choixDessert, "champ-dessert"));
  }

  const retirer = texteTraduit("button", "rsvp-retirer", "retirer");
  retirer.type = "button";
  retirer.addEventListener("click", () => {
    if (liste.children.length > 1) {
      ligne.remove();
    }
  });
  ligne.append(retirer);

  // Un champ signalé en erreur redevient neutre dès que l'invité le modifie.
  ligne.addEventListener("input", (evenement) => evenement.target.removeAttribute("aria-invalid"));
  ligne.addEventListener("change", (evenement) => evenement.target.removeAttribute("aria-invalid"));

  liste.append(ligne);
  return nom;
}

function lignesPersonnes() {
  return [...document.querySelectorAll("#liste-personnes .personne")];
}

function lireReponse(formulaire) {
  const personnes = lignesPersonnes().map((ligne) => ({
    nom: ligne.querySelector('input[name="nom"]').value,
    presences: Object.fromEntries(
      [...ligne.querySelectorAll('input[type="radio"]:checked')].map((radio) => [
        radio.dataset.evenement,
        radio.value === "present",
      ]),
    ),
    vegetarien: ligne.querySelector('input[name="vegetarien"]').checked,
    dessert: ligne.querySelector('select[name="dessert"]')?.value ?? "",
  }));
  return { personnes, site: formulaire.elements.site.value };
}

function signalerChamps(reponse) {
  const lignes = lignesPersonnes();
  const champs = champsInvalides(reponse, etat.evenements).map(({ index, champ }) =>
    lignes[index].querySelector(`[name="${champ}"]`),
  );
  champs.forEach((champ) => champ.setAttribute("aria-invalid", "true"));
  champs[0]?.focus();
}

function afficherMessage(cles, type) {
  const message = document.getElementById("message-rsvp");
  message.textContent = cles.map((cle) => t(cle)).join(" ");
  message.className = `message ${type}`;
  message.setAttribute("role", type === "erreur" ? "alert" : "status");
}

async function envoyerReponse(evenement) {
  evenement.preventDefault();
  const formulaire = evenement.currentTarget;
  const reponse = lireReponse(formulaire);
  const erreurs = validerReponse(reponse, etat.evenements);
  if (erreurs.length > 0) {
    afficherMessage(erreurs, "erreur");
    signalerChamps(reponse);
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
