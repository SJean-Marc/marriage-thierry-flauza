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

export function validerReponse(reponse, evenements) {
  const erreurs = [];
  const noms = reponse.personnes.map((personne) => personne.nom.trim());
  if (noms.length === 0 || noms.some((nom) => nom === "")) {
    erreurs.push("erreur-nom");
  }
  const dessertManquant = reponse.personnes.some(
    (personne) => choisitUnDessert(personne, evenements) && !DESSERTS.includes(personne.dessert),
  );
  if (dessertManquant) {
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
