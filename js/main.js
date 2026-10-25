import { CONFIG } from "./config.js";
import { formaterDate, langueInitiale, traduire } from "./i18n.js";
import { evenementVedette, evenementsDeLaVersion, lireInvitation } from "./invitation.js";
import { construireEnvoi, validerReponse } from "./rsvp.js";

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

const etat = {
  langue: langueInitiale(lireLangueMemorisee(), new URLSearchParams(window.location.search).get("lang")),
  invitation: lireInvitation(window.location.search, CONFIG.versions),
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
  mettreAJourLegendePersonnes();
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
  const evenements = evenementsDeLaVersion(etat.invitation.version, CONFIG.evenementsParVersion);
  const vedette = evenementVedette(evenements);
  const cartes = evenements.map(
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

function presenceChoisie() {
  return document.querySelector('input[name="presence"]:checked')?.value ?? "";
}

function mettreAJourLegendePersonnes() {
  const presence = presenceChoisie();
  document.getElementById("legende-personnes").textContent = t(
    presence === "non" ? "rsvp-personnes-non" : "rsvp-personnes-oui",
  );
  document.getElementById("bloc-personnes").hidden = presence === "";
  document.getElementById("formulaire-rsvp").classList.toggle("absent", presence === "non");
}

function ajouterPersonne() {
  const liste = document.getElementById("liste-personnes");
  const ligne = element("li", "personne");
  const nom = element("input");
  nom.type = "text";
  nom.name = "nom";
  nom.autocomplete = "name";
  nom.dataset.i18nPlaceholder = "rsvp-nom";
  nom.placeholder = t("rsvp-nom");
  nom.setAttribute("aria-label", t("rsvp-nom"));

  const vegetarien = element("label", "vegetarien");
  const caseVegetarien = element("input");
  caseVegetarien.type = "checkbox";
  caseVegetarien.name = "vegetarien";
  const libelle = element("span", "", t("rsvp-vegetarien"));
  libelle.dataset.i18n = "rsvp-vegetarien";
  vegetarien.append(caseVegetarien, " ", libelle);

  const retirer = element("button", "retirer", t("rsvp-retirer"));
  retirer.type = "button";
  retirer.dataset.i18n = "rsvp-retirer";
  retirer.addEventListener("click", () => {
    if (liste.children.length > 1) {
      ligne.remove();
    }
  });

  ligne.append(nom, vegetarien, retirer);
  liste.append(ligne);
  nom.focus();
}

function lireReponse(formulaire) {
  const personnes = [...document.querySelectorAll("#liste-personnes .personne")].map((ligne) => ({
    nom: ligne.querySelector('input[name="nom"]').value,
    vegetarien: ligne.querySelector('input[name="vegetarien"]').checked,
  }));
  return { presence: presenceChoisie(), personnes, site: formulaire.elements.site.value };
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
  const erreurs = validerReponse(reponse);
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
    const resultat = await fetch(CONFIG.urlScript, {
      method: "POST",
      body: JSON.stringify(construireEnvoi(etat.invitation.code, etat.langue, reponse)),
    }).then((r) => r.json());
    if (!resultat.ok) {
      throw new Error(resultat.erreur);
    }
    formulaire.replaceChildren(
      element("p", "message succes", t(reponse.presence === "oui" ? "rsvp-merci-oui" : "rsvp-merci-non")),
    );
  } catch {
    afficherMessage(["erreur-envoi"], "erreur");
    bouton.disabled = false;
    bouton.textContent = t("rsvp-envoyer");
  }
}

function initialiserFormulaire() {
  const formulaire = document.getElementById("formulaire-rsvp");
  formulaire.querySelectorAll('input[name="presence"]').forEach((radio) => {
    radio.addEventListener("change", mettreAJourLegendePersonnes);
  });
  document.getElementById("ajouter-personne").addEventListener("click", ajouterPersonne);
  formulaire.addEventListener("submit", envoyerReponse);
  ajouterPersonne();
}

// --- Cagnotte & photos ---

function initialiserLiens() {
  document.getElementById("wero-telephone").textContent = CONFIG.cagnotte.weroTelephone;
  document.getElementById("lien-lydia").href = CONFIG.cagnotte.lydia;
  document.getElementById("lien-paypal").href = CONFIG.cagnotte.paypal;
  document.getElementById("lien-photos-voir").href = CONFIG.photos.voir;
  document.getElementById("lien-photos-deposer").href = CONFIG.photos.deposer;

  const copier = document.getElementById("copier-wero");
  copier.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.cagnotte.weroTelephone.replace(/\s/g, ""));
      copier.textContent = t("cagnotte-copie");
      setTimeout(() => {
        copier.textContent = t("cagnotte-copier");
      }, 2000);
    } catch {
      // Presse-papiers refusé : le numéro reste affiché et sélectionnable.
    }
  });
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
