// Validation et préparation de la réponse au formulaire de présence.

export function validerReponse(reponse) {
  const erreurs = [];
  if (reponse.presence !== "oui" && reponse.presence !== "non") {
    erreurs.push("erreur-presence");
  }
  const noms = reponse.personnes.map((personne) => personne.nom.trim());
  if (noms.length === 0 || noms.some((nom) => nom === "")) {
    erreurs.push("erreur-nom");
  }
  return erreurs;
}

export function construireEnvoi(code, langue, reponse) {
  return {
    code,
    langue,
    presence: reponse.presence,
    personnes: reponse.personnes.map((personne) => ({
      nom: personne.nom.trim(),
      vegetarien: reponse.presence === "oui" && personne.vegetarien === true,
    })),
    site: reponse.site ?? "",
  };
}
