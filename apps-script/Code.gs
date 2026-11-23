/** @OnlyCurrentDoc */
// Script Google Apps Script lié à la Google Sheet des réponses.
// @OnlyCurrentDoc limite l'autorisation du script à cette seule feuille (pas tout le Drive).
// - doPost : enregistre les réponses au formulaire de présence (une ligne par personne) :
//            par événement « présent », « absent » ou vide si non invité ; par jour le menu
//            « végétarien » / « non végétarien », vide si non invité ou absent ce jour-là.
// - doGet  : fournit les lieux de la version d'invitation, seulement après la date de révélation.
//
// Propriétés du script (Paramètres du projet > Propriétés du script) :
// - DATE_REVELATION : date au format AAAA-MM-JJ (heure de Paris), ex. 2027-03-01
// - LIEUX           : JSON {"mairie": {"nom": "...", "adresse": "..."}, "religieux": {...}, "soiree": {...}}
// Les lieux ne sont jamais publiés dans le dépôt GitHub.
//
// Protections de doPost (l'URL du script et les codes d'invitation sont publics) :
// - formulaire fermé à partir du lendemain du mariage (DATE_FERMETURE, heure de Paris) ;
// - au plus MAX_ENVOIS_PAR_FENETRE envois toutes les 10 minutes, tous invités confondus ;
// - feuille plafonnée à MAX_LIGNES lignes ;
// - noms en texte brut : pas de formule, pas de caractère de contrôle, pas de conversion en nombre ou en date.

// Doit rester identique à CONFIG.versions et CONFIG.evenementsParVersion (js/config.js).
const CODES = { CgX4ht: "A", NXrmCt: "B", rLXUq7: "C" };
const EVENEMENTS = {
  A: ["mairie", "religieux", "soiree"],
  B: ["religieux", "soiree"],
  C: ["soiree"],
};

// Doit rester identique à CONFIG.jours (js/config.js).
const JOURS = { mercredi: ["mairie"], jeudi: ["religieux", "soiree"] };

// Colonnes de la feuille entre « Nom » et « Dessert », regroupées par jour.
const COLONNES = [
  { titre: "Mairie", evenement: "mairie" },
  { titre: "Menu 17/03", jour: "mercredi" },
  { titre: "Religieux", evenement: "religieux" },
  { titre: "Soirée", evenement: "soiree" },
  { titre: "Menu 18/03", jour: "jeudi" },
];
const EVENEMENT_DESSERT = "soiree";
// Doit rester identique à DESSERTS (js/rsvp.js).
const DESSERTS = {
  velvet: "Velvet fruits rouges",
  pistache: "Pistache fruits rouges",
  exotique: "Fruits exotiques",
};

const NOM_FEUILLE = "Réponses";
const ENTETES = ["Horodatage", "Réponse n°", "Version", "Langue", "Nom"].concat(
  COLONNES.map(function (colonne) {
    return colonne.titre;
  }),
  ["Dessert"],
);
const COLONNE_NOM = ENTETES.indexOf("Nom") + 1;
const LANGUES = ["fr", "ta"];
const MAX_PERSONNES = 20;
const MAX_LONGUEUR_NOM = 100;
const CARACTERES_DE_CONTROLE = /[\u0000-\u001f\u007f]/;

const DATE_FERMETURE = "2027-03-19"; // lendemain du mariage
const MAX_LIGNES = 1500;
const MAX_ENVOIS_PAR_FENETRE = 30;
const FENETRE_SECONDES = 600;

// Version (A, B ou C) du code d'invitation, ou null ; ignore les clés héritées comme « constructor ».
function versionDuCode(code) {
  return Object.prototype.hasOwnProperty.call(CODES, code) ? CODES[code] : null;
}

function doGet(e) {
  if (e.parameter.action !== "lieux") {
    return repondre({ erreur: "action-inconnue" });
  }
  const version = versionDuCode(e.parameter.i);
  if (!version) {
    return repondre({ erreur: "invitation-invalide" });
  }
  return repondre(lieuxPourVersion(version, new Date()));
}

function lieuxPourVersion(version, maintenant) {
  const proprietes = PropertiesService.getScriptProperties();
  const dateRevelation = proprietes.getProperty("DATE_REVELATION");
  if (!dateRevelation || maintenant < new Date(dateRevelation + "T00:00:00+01:00")) {
    return { revealed: false, revealDate: dateRevelation || null };
  }
  const tousLesLieux = JSON.parse(proprietes.getProperty("LIEUX") || "{}");
  const lieux = {};
  EVENEMENTS[version].forEach(function (cle) {
    if (tousLesLieux[cle]) {
      lieux[cle] = tousLesLieux[cle];
    }
  });
  return { revealed: true, revealDate: dateRevelation, lieux: lieux };
}

function doPost(e) {
  let donnees;
  try {
    donnees = JSON.parse(e.postData.contents);
  } catch (erreur) {
    return repondre({ ok: false, erreur: "json-invalide" });
  }
  if (donnees === null || typeof donnees !== "object" || Array.isArray(donnees)) {
    return repondre({ ok: false, erreur: "json-invalide" });
  }
  if (formulaireFerme(new Date())) {
    return repondre({ ok: false, erreur: "formulaire-ferme" });
  }
  if (donnees.site) {
    // Champ piège rempli : robot. On répond comme si tout allait bien, sans rien enregistrer.
    return repondre({ ok: true });
  }
  const erreur = validerEnvoi(donnees);
  if (erreur) {
    return repondre({ ok: false, erreur: erreur });
  }
  const refus = enregistrer(donnees);
  return repondre(refus ? { ok: false, erreur: refus } : { ok: true });
}

function formulaireFerme(maintenant) {
  return maintenant >= new Date(DATE_FERMETURE + "T00:00:00+01:00");
}

// Compte un envoi dans la fenêtre de 10 minutes en cours ; false si la limite est atteinte.
// À appeler sous le verrou, pour que deux envois simultanés ne lisent pas le même compteur.
function accepterEnvoi(maintenant) {
  const cache = CacheService.getScriptCache();
  const cle = "envois-" + Math.floor(maintenant.getTime() / (FENETRE_SECONDES * 1000));
  const envois = Number(cache.get(cle) || 0);
  if (envois >= MAX_ENVOIS_PAR_FENETRE) {
    return false;
  }
  cache.put(cle, String(envois + 1), FENETRE_SECONDES);
  return true;
}

function validerEnvoi(donnees) {
  const version = versionDuCode(donnees.code);
  if (!version) {
    return "invitation-invalide";
  }
  const evenements = EVENEMENTS[version];
  const personnes = donnees.personnes;
  const personnesValides =
    Array.isArray(personnes) &&
    personnes.length > 0 &&
    personnes.length <= MAX_PERSONNES &&
    personnes.every(function (personne) {
      return (
        personne !== null &&
        typeof personne === "object" &&
        typeof personne.nom === "string" &&
        personne.nom.trim() !== "" &&
        personne.nom.length <= MAX_LONGUEUR_NOM &&
        !CARACTERES_DE_CONTROLE.test(personne.nom) &&
        booleensValides(personne.presences, evenements) &&
        booleensValides(personne.vegetarien, joursInvites(evenements))
      );
    });
  if (!personnesValides) {
    return "personnes-invalides";
  }
  const dessertManquant = personnes.some(function (personne) {
    return choisitUnDessert(personne, evenements) && !estUnDessert(personne.dessert);
  });
  return dessertManquant ? "dessert-invalide" : null;
}

// Vérifie qu'un objet donne un booléen pour chacune des clés attendues.
function booleensValides(objet, cles) {
  return (
    objet !== null &&
    typeof objet === "object" &&
    cles.every(function (cle) {
      return typeof objet[cle] === "boolean";
    })
  );
}

// Événements du jour qui font partie de l'invitation.
function evenementsDuJour(jour, evenements) {
  return JOURS[jour].filter(function (cle) {
    return evenements.indexOf(cle) >= 0;
  });
}

function joursInvites(evenements) {
  return Object.keys(JOURS).filter(function (jour) {
    return evenementsDuJour(jour, evenements).length > 0;
  });
}

function cellule(colonne, personne, evenements) {
  if (colonne.evenement) {
    if (evenements.indexOf(colonne.evenement) < 0) {
      return "";
    }
    return personne.presences[colonne.evenement] ? "présent" : "absent";
  }
  const vientCeJour = evenementsDuJour(colonne.jour, evenements).some(function (cle) {
    return personne.presences[cle];
  });
  if (!vientCeJour) {
    return "";
  }
  return personne.vegetarien[colonne.jour] ? "végétarien" : "non végétarien";
}

function choisitUnDessert(personne, evenements) {
  return evenements.indexOf(EVENEMENT_DESSERT) >= 0 && personne.presences[EVENEMENT_DESSERT] === true;
}

function estUnDessert(dessert) {
  return typeof dessert === "string" && Object.prototype.hasOwnProperty.call(DESSERTS, dessert);
}

// Écrit les lignes de la réponse ; renvoie le code du refus, ou null si tout est enregistré.
function enregistrer(donnees) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const horodatage = new Date();
    if (!accepterEnvoi(horodatage)) {
      return "trop-d-envois";
    }
    const feuille = obtenirFeuille();
    if (feuille.getLastRow() + donnees.personnes.length > MAX_LIGNES) {
      return "feuille-pleine";
    }
    const numero = Utilities.getUuid().slice(0, 8);
    const version = versionDuCode(donnees.code);
    const evenements = EVENEMENTS[version];
    const langue = LANGUES.indexOf(donnees.langue) >= 0 ? donnees.langue : "fr";
    const lignes = donnees.personnes.map(function (personne) {
      const colonnes = COLONNES.map(function (colonne) {
        return cellule(colonne, personne, evenements);
      });
      return [horodatage, numero, version, langue, neutraliserFormule(personne.nom.trim())].concat(
        colonnes,
        [choisitUnDessert(personne, evenements) ? DESSERTS[personne.dessert] : ""],
      );
    });
    const premiereLigne = feuille.getLastRow() + 1;
    // Format texte : un nom comme « 1/2 » ou « 0612 » n'est pas converti en date ou en nombre.
    feuille.getRange(premiereLigne, COLONNE_NOM, lignes.length, 1).setNumberFormat("@");
    feuille.getRange(premiereLigne, 1, lignes.length, ENTETES.length).setValues(lignes);
    return null;
  } finally {
    verrou.releaseLock();
  }
}

function obtenirFeuille() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  const feuille = classeur.getSheetByName(NOM_FEUILLE) || classeur.insertSheet(NOM_FEUILLE);
  if (feuille.getLastRow() === 0) {
    feuille.appendRow(ENTETES);
  }
  return feuille;
}

// Empêche qu'un nom commençant par =, +, - ou @ soit interprété comme une formule.
function neutraliserFormule(texte) {
  return /^[=+\-@]/.test(texte) ? "'" + texte : texte;
}

function repondre(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
