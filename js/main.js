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
  document.querySelectorAll("[data-i18n-label]").forEach((noeud) => {
    noeud.setAttribute("aria-label", t(noeud.dataset.i18nLabel));
  });
  document.querySelectorAll(".bouton-dessert").forEach(afficherDessert);
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

// Choix segmenté : deux boutons radio stylés, le choix actif est rempli.
function creerChoixSegmente(nomGroupe, cleIntitule, options) {
  const groupe = element("div", "champ");
  groupe.setAttribute("role", "radiogroup");
  const intitule = texteTraduit("span", cleIntitule, "intitule");
  intitule.id = `${nomGroupe}-intitule`;
  groupe.setAttribute("aria-labelledby", intitule.id);

  const segmente = element("div", "segmente");
  options.forEach(({ valeur, cleTexte, coche, classe }) => {
    const option = element("label", classe);
    const radio = element("input");
    radio.type = "radio";
    radio.name = nomGroupe;
    radio.value = valeur;
    radio.checked = coche;
    option.append(radio, texteTraduit("span", cleTexte));
    segmente.append(option);
  });

  groupe.append(intitule, segmente);
  return groupe;
}

function creerChoixPresence(idPersonne, cle, boutonDessert) {
  const groupe = creerChoixSegmente(`${idPersonne}-${cle}`, `evt-${cle}-court`, [
    { valeur: "present", cleTexte: "rsvp-present", coche: true },
    { valeur: "absent", cleTexte: "rsvp-absent", coche: false, classe: "option-absent" },
  ]);
  groupe.querySelectorAll("input").forEach((radio) => {
    radio.dataset.evenement = cle;
    if (cle === EVENEMENT_DESSERT && boutonDessert) {
      radio.addEventListener("change", () => {
        boutonDessert.disabled = radio.value === "absent";
      });
    }
  });
  return groupe;
}

function creerChoixMenu(idPersonne) {
  return creerChoixSegmente(`${idPersonne}-menu`, "rsvp-menu", [
    { valeur: "vegetarien", cleTexte: "rsvp-vegetarien", coche: false },
    { valeur: "non-vegetarien", cleTexte: "rsvp-non-vegetarien", coche: true },
  ]);
}

// --- Dessert : bouton dans la carte + fenêtre de choix avec les images des gâteaux ---

const ICONE_CRAYON =
  '<svg class="crayon" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" fill="none" stroke="currentColor" ' +
  'stroke-width="1.8" stroke-linejoin="round"/></svg>';

let boutonDessertActif = null;

function imageDessert(dessert, classe) {
  const image = element("img", classe);
  image.src = `assets/img/dessert-${dessert}.svg`;
  image.alt = "";
  return image;
}

function afficherDessert(bouton) {
  const dessert = bouton.value;
  if (!dessert) {
    bouton.replaceChildren(element("span", "", t("rsvp-dessert-choisir")));
    bouton.setAttribute("aria-label", `${t("rsvp-dessert")} : ${t("rsvp-dessert-choisir")}`);
    return;
  }
  const nom = t(`dessert-${dessert}`);
  bouton.replaceChildren(imageDessert(dessert, "dessert-miniature"), element("span", "", nom));
  bouton.insertAdjacentHTML("beforeend", ICONE_CRAYON);
  bouton.setAttribute("aria-label", `${t("rsvp-dessert")} : ${nom}. ${t("rsvp-dessert-modifier")}`);
}

function creerBoutonDessert() {
  const bouton = element("button", "bouton-dessert");
  bouton.type = "button";
  bouton.name = "dessert";
  bouton.value = "";
  afficherDessert(bouton);
  bouton.addEventListener("click", () => ouvrirFenetreDessert(bouton));
  return bouton;
}

function ouvrirFenetreDessert(bouton) {
  boutonDessertActif = bouton;
  const fenetre = document.getElementById("fenetre-dessert");
  const options = [...fenetre.querySelectorAll(".option-dessert")];
  options.forEach((option) => option.setAttribute("aria-pressed", String(option.value === bouton.value)));
  fenetre.showModal();
  (options.find((option) => option.value === bouton.value) ?? options[0]).focus();
}

function choisirDessert(dessert) {
  boutonDessertActif.value = dessert;
  boutonDessertActif.removeAttribute("aria-invalid");
  afficherDessert(boutonDessertActif);
  document.getElementById("fenetre-dessert").close();
}

function initialiserFenetreDessert() {
  const fenetre = document.getElementById("fenetre-dessert");
  const options = DESSERTS.map((dessert) => {
    const option = element("button", "option-dessert");
    option.type = "button";
    option.value = dessert;
    option.append(imageDessert(dessert, "dessert-image"), texteTraduit("span", `dessert-${dessert}`, "dessert-nom"));
    option.addEventListener("click", () => choisirDessert(dessert));
    return option;
  });
  document.getElementById("liste-desserts").replaceChildren(...options);
  document.getElementById("fermer-dessert").addEventListener("click", () => fenetre.close());
  // Clic sur le fond assombri (hors du contenu) : ferme la fenêtre.
  fenetre.addEventListener("click", (evenement) => {
    if (evenement.target === fenetre) {
      fenetre.close();
    }
  });
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

  const boutonDessert = aLeDessert() ? creerBoutonDessert() : null;
  etat.evenements.forEach((cle) => ligne.append(creerChoixPresence(idPersonne, cle, boutonDessert)));
  ligne.append(creerChoixMenu(idPersonne));

  if (boutonDessert) {
    const champDessert = element("div", "champ champ-dessert");
    champDessert.append(texteTraduit("span", "rsvp-dessert", "intitule"), boutonDessert);
    ligne.append(champDessert);
  }

  const retirer = texteTraduit("button", "rsvp-retirer", "retirer");
  retirer.type = "button";
  retirer.addEventListener("click", () => {
    if (liste.children.length > 1) {
      ligne.remove();
    }
  });
  ligne.append(retirer);

  // Le nom signalé en erreur redevient neutre dès que l'invité le modifie.
  nom.addEventListener("input", () => nom.removeAttribute("aria-invalid"));

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
      [...ligne.querySelectorAll("input[data-evenement]:checked")].map((radio) => [
        radio.dataset.evenement,
        radio.value === "present",
      ]),
    ),
    vegetarien: ligne.querySelector('input[value="vegetarien"]').checked,
    dessert: ligne.querySelector('button[name="dessert"]')?.value ?? "",
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
  initialiserFenetreDessert();
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
