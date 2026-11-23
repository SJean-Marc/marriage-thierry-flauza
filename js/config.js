// Configuration du site. Les valeurs marquées PROVISOIRE sont à remplacer.
// Les lieux (noms et adresses) ne sont PAS ici : ils sont fournis par le script Google
// après la date de révélation (voir apps-script/Code.gs).

export const CONFIG = {
  // URL de l'application web Google Apps Script (Déployer > Nouveau déploiement > Application web).
  // Vide = formulaire et lieux désactivés (affichage d'un message).
  urlScript: "https://script.google.com/macros/s/AKfycbxkaMnIyrF_XSBLYEl-WhEFW1L-51KV0WfzOxcpYZY9yH5TuKDa8cowo4SG5ISSXLxG/exec",

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

  // Jour -> événements de ce jour : un groupe par jour dans le formulaire,
  // avec un choix de menu (végétarien ou non) propre à chaque jour.
  jours: {
    mercredi: ["mairie"],
    jeudi: ["religieux", "soiree"],
  },

  cagnotte: {
    lydia: "https://lydia-app.com/", // PROVISOIRE : lien de la cagnotte Lydia
    paypal: "https://www.paypal.me/", // PROVISOIRE : lien paypal.me
  },

  contact: "flauza.thierry@gmail.com",

  // Lien de dépôt pCloud (upload link) : les invités déposent leurs fichiers sans compte, sans voir ceux des autres.
  depotPhotos: "https://e.pcloud.com/#/puplink?code=eOv7ZHcXzHBx2kDQDy5ocxyisbBkBnKRy",
};
