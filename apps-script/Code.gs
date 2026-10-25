// Script Google Apps Script lié à la Google Sheet des réponses.
// - doPost : enregistre les réponses au formulaire de présence (une ligne par personne).
// - doGet  : fournit les lieux de la version d'invitation, seulement après la date de révélation.
//
// Propriétés du script (Paramètres du projet > Propriétés du script) :
// - DATE_REVELATION : date au format AAAA-MM-JJ (heure de Paris), ex. 2027-03-01
// - LIEUX           : JSON {"mairie": {"nom": "...", "adresse": "..."}, "religieux": {...}, "soiree": {...}}
// Les lieux ne sont jamais publiés dans le dépôt GitHub.

// Doit rester identique à CONFIG.versions et CONFIG.evenementsParVersion (js/config.js).
const CODES = { CgX4ht: "A", NXrmCt: "B", rLXUq7: "C" };
const EVENEMENTS = {
  A: ["mairie", "religieux", "soiree"],
  B: ["religieux", "soiree"],
  C: ["soiree"],
};

const NOM_FEUILLE = "Réponses";
const ENTETES = ["Horodatage", "Réponse n°", "Version", "Langue", "Présence", "Nom", "Végétarien"];
const LANGUES = ["fr", "ta"];
const MAX_PERSONNES = 20;
const MAX_LONGUEUR_NOM = 100;

function doGet(e) {
  if (e.parameter.action !== "lieux") {
    return repondre({ erreur: "action-inconnue" });
  }
  const version = CODES[e.parameter.i];
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
  if (donnees.site) {
    // Champ piège rempli : robot. On répond comme si tout allait bien, sans rien enregistrer.
    return repondre({ ok: true });
  }
  const erreur = validerEnvoi(donnees);
  if (erreur) {
    return repondre({ ok: false, erreur: erreur });
  }
  enregistrer(donnees);
  return repondre({ ok: true });
}

function validerEnvoi(donnees) {
  if (!CODES[donnees.code]) {
    return "invitation-invalide";
  }
  if (donnees.presence !== "oui" && donnees.presence !== "non") {
    return "presence-invalide";
  }
  const personnes = donnees.personnes;
  const personnesValides =
    Array.isArray(personnes) &&
    personnes.length > 0 &&
    personnes.length <= MAX_PERSONNES &&
    personnes.every(function (personne) {
      return (
        personne !== null &&
        typeof personne.nom === "string" &&
        personne.nom.trim() !== "" &&
        personne.nom.length <= MAX_LONGUEUR_NOM
      );
    });
  return personnesValides ? null : "personnes-invalides";
}

function enregistrer(donnees) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const feuille = obtenirFeuille();
    const horodatage = new Date();
    const numero = Utilities.getUuid().slice(0, 8);
    const version = CODES[donnees.code];
    const langue = LANGUES.indexOf(donnees.langue) >= 0 ? donnees.langue : "fr";
    const lignes = donnees.personnes.map(function (personne) {
      return [
        horodatage,
        numero,
        version,
        langue,
        donnees.presence,
        neutraliserFormule(personne.nom.trim()),
        personne.vegetarien === true ? "oui" : "non",
      ];
    });
    feuille.getRange(feuille.getLastRow() + 1, 1, lignes.length, ENTETES.length).setValues(lignes);
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
