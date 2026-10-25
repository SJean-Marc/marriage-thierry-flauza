// Configuration du site. Les valeurs marquées PROVISOIRE sont à remplacer.
// Les lieux (noms et adresses) ne sont PAS ici : ils sont fournis par le script Google
// après la date de révélation (voir apps-script/Code.gs).

export const CONFIG = {
  // URL de l'application web Google Apps Script (Déployer > Nouveau déploiement > Application web).
  // Vide = formulaire et lieux désactivés (affichage d'un message).
  urlScript: "",

  dateLimiteReponse: "2027-01-28",

  // Code d'invitation (paramètre ?i= du lien / QR code) -> version du site.
  versions: {
    CgX4ht: "A",
    NXrmCt: "B",
    rLXUq7: "C",
  },

  evenementsParVersion: {
    A: ["mairie", "religieux", "soiree"],
    B: ["religieux", "soiree"],
    C: ["soiree"],
  },

  cagnotte: {
    weroTelephone: "06 00 00 00 00", // PROVISOIRE
    lydia: "https://lydia-app.com/", // PROVISOIRE : lien de la cagnotte Lydia
    paypal: "https://www.paypal.me/", // PROVISOIRE : lien paypal.me
  },

  contact: "flauza.thierry@gmail.com",

  photos: {
    voir: "https://www.pcloud.com/", // PROVISOIRE : lien de partage pCloud
    deposer: "https://www.pcloud.com/", // PROVISOIRE : lien de dépôt (upload link) pCloud
  },
};
