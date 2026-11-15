// Validation et préparation de la réponse au formulaire de présence.
// Chaque personne indique, pour chaque événement de son invitation, si elle sera présente.

export const EVENEMENT_DESSERT = "soiree";
export const DESSERTS = ["velvet", "pistache", "exotique"];

export function estPresenteQuelquePart(personne) {
  return Object.values(personne.presences).some((presente) => presente === true);
}

function choisitUnDessert(personne, evenements) {
  return evenements.includes(EVENEMENT_DESSERT) && personne.presences[EVENEMENT_DESSERT] === true;
}

// Champs à corriger, dans l'ordre du formulaire : [{ index, champ: "nom" | "dessert" }].
export function champsInvalides(reponse, evenements) {
  return reponse.personnes.flatMap((personne, index) => {
    const champs = [];
    if (personne.nom.trim() === "") {
      champs.push({ index, champ: "nom" });
    }
    if (choisitUnDessert(personne, evenements) && !DESSERTS.includes(personne.dessert)) {
      champs.push({ index, champ: "dessert" });
    }
    return champs;
  });
}

export function validerReponse(reponse, evenements) {
  const champs = champsInvalides(reponse, evenements).map((invalide) => invalide.champ);
  const erreurs = [];
  if (reponse.personnes.length === 0 || champs.includes("nom")) {
    erreurs.push("erreur-nom");
  }
  if (champs.includes("dessert")) {
    erreurs.push("erreur-dessert");
  }
  return erreurs;
}

export function construireEnvoi(code, langue, reponse, evenements) {
  return {
    code,
    langue,
    personnes: reponse.personnes.map((personne) => {
      const presences = Object.fromEntries(
        evenements.map((cle) => [cle, personne.presences[cle] === true]),
      );
      const normalisee = { ...personne, presences };
      return {
        nom: personne.nom.trim(),
        presences,
        vegetarien: estPresenteQuelquePart(normalisee) && personne.vegetarien === true,
        dessert: choisitUnDessert(normalisee, evenements) ? personne.dessert : "",
      };
    }),
    site: reponse.site ?? "",
  };
}
