import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { champsInvalides, construireEnvoi, estPresenteQuelquePart, validerReponse } from "../js/rsvp.js";

const TOUS = ["mairie", "religieux", "soiree"];

function personne(nom, presences, autres = {}) {
  return { nom, presences, vegetarien: {}, dessert: "", ...autres };
}

describe("estPresenteQuelquePart", () => {
  it("should_return_true_when_present_at_one_event", () => {
    assert.equal(estPresenteQuelquePart(personne("A", { mairie: false, soiree: true })), true);
  });

  it("should_return_false_when_absent_everywhere", () => {
    assert.equal(estPresenteQuelquePart(personne("A", { mairie: false, soiree: false })), false);
  });
});

describe("champsInvalides", () => {
  it("should_return_no_field_when_answer_is_complete", () => {
    const reponse = { personnes: [personne("Thierry", { soiree: true }, { dessert: "velvet" })] };
    assert.deepEqual(champsInvalides(reponse, ["soiree"]), []);
  });

  it("should_list_invalid_fields_in_form_order", () => {
    const reponse = {
      personnes: [
        personne("Thierry", { soiree: true }, { dessert: "velvet" }),
        personne(" ", { soiree: true }),
        personne("Flauza", { soiree: true }),
      ],
    };
    assert.deepEqual(champsInvalides(reponse, ["soiree"]), [
      { index: 1, champ: "nom" },
      { index: 1, champ: "dessert" },
      { index: 2, champ: "dessert" },
    ]);
  });
});

describe("validerReponse", () => {
  it("should_return_no_error_when_answer_is_complete", () => {
    const reponse = {
      personnes: [personne("Thierry", { mairie: true, religieux: true, soiree: true }, { dessert: "velvet" })],
    };
    assert.deepEqual(validerReponse(reponse, TOUS), []);
  });

  it("should_accept_a_person_absent_everywhere", () => {
    const reponse = { personnes: [personne("Thierry", { mairie: false, religieux: false, soiree: false })] };
    assert.deepEqual(validerReponse(reponse, TOUS), []);
  });

  it("should_return_name_error_when_a_name_is_blank", () => {
    const reponse = {
      personnes: [personne("Flauza", { soiree: false }), personne("   ", { soiree: false })],
    };
    assert.deepEqual(validerReponse(reponse, ["soiree"]), ["erreur-nom"]);
  });

  it("should_return_name_error_when_person_list_is_empty", () => {
    assert.deepEqual(validerReponse({ personnes: [] }, TOUS), ["erreur-nom"]);
  });

  it("should_return_dessert_error_when_present_at_reception_without_dessert", () => {
    const reponse = { personnes: [personne("Thierry", { soiree: true })] };
    assert.deepEqual(validerReponse(reponse, ["soiree"]), ["erreur-dessert"]);
  });

  it("should_return_dessert_error_when_dessert_is_unknown", () => {
    const reponse = { personnes: [personne("Thierry", { soiree: true }, { dessert: "chocolat" })] };
    assert.deepEqual(validerReponse(reponse, ["soiree"]), ["erreur-dessert"]);
  });

  it("should_not_require_dessert_when_absent_from_reception", () => {
    const reponse = { personnes: [personne("Thierry", { religieux: true, soiree: false })] };
    assert.deepEqual(validerReponse(reponse, ["religieux", "soiree"]), []);
  });

  it("should_not_require_dessert_when_reception_is_not_in_invitation", () => {
    const reponse = { personnes: [personne("Thierry", { mairie: true, soiree: true })] };
    assert.deepEqual(validerReponse(reponse, ["mairie"]), []);
  });

  it("should_return_both_errors_when_name_and_dessert_are_missing", () => {
    const reponse = { personnes: [personne("", { soiree: true })] };
    assert.deepEqual(validerReponse(reponse, ["soiree"]), ["erreur-nom", "erreur-dessert"]);
  });
});

describe("construireEnvoi", () => {
  const MERCREDI = { jour: "mercredi", evenements: ["mairie"] };
  const JEUDI = { jour: "jeudi", evenements: ["religieux", "soiree"] };
  const SOIREE_SEULE = { jour: "jeudi", evenements: ["soiree"] };

  it("should_trim_names_and_keep_choices_when_present", () => {
    const reponse = {
      personnes: [
        personne(
          "  Thierry ",
          { mairie: true, religieux: true, soiree: true },
          { vegetarien: { mercredi: true, jeudi: false }, dessert: "pistache" },
        ),
        personne(
          "Flauza",
          { mairie: false, religieux: false, soiree: true },
          { vegetarien: { mercredi: false, jeudi: true }, dessert: "exotique" },
        ),
      ],
      site: "",
    };
    assert.deepEqual(construireEnvoi("abc123", "ta", reponse, [MERCREDI, JEUDI]), {
      code: "abc123",
      langue: "ta",
      personnes: [
        {
          nom: "Thierry",
          presences: { mairie: true, religieux: true, soiree: true },
          vegetarien: { mercredi: true, jeudi: false },
          dessert: "pistache",
        },
        {
          nom: "Flauza",
          presences: { mairie: false, religieux: false, soiree: true },
          vegetarien: { mercredi: false, jeudi: true },
          dessert: "exotique",
        },
      ],
      site: "",
    });
  });

  it("should_keep_only_events_and_days_of_the_invitation", () => {
    const reponse = {
      personnes: [
        personne("Thierry", { mairie: true, soiree: true }, { vegetarien: { mercredi: true, jeudi: true }, dessert: "velvet" }),
      ],
    };
    const envoye = construireEnvoi("abc123", "fr", reponse, [SOIREE_SEULE]).personnes[0];
    assert.deepEqual(envoye.presences, { soiree: true });
    assert.deepEqual(envoye.vegetarien, { jeudi: true });
  });

  it("should_mark_missing_events_as_absent_and_missing_menus_as_not_vegetarian", () => {
    const reponse = { personnes: [personne("Thierry", { soiree: true }, { vegetarien: undefined, dessert: "velvet" })] };
    const envoye = construireEnvoi("abc123", "fr", reponse, [JEUDI]).personnes[0];
    assert.deepEqual(envoye.presences, { religieux: false, soiree: true });
    assert.deepEqual(envoye.vegetarien, { jeudi: false });
  });

  it("should_clear_menu_of_a_day_where_the_person_is_absent", () => {
    const reponse = {
      personnes: [
        personne(
          "Thierry",
          { mairie: false, religieux: true, soiree: false },
          { vegetarien: { mercredi: true, jeudi: true }, dessert: "velvet" },
        ),
      ],
    };
    const envoye = construireEnvoi("abc123", "fr", reponse, [MERCREDI, JEUDI]).personnes[0];
    assert.deepEqual(envoye.vegetarien, { mercredi: false, jeudi: true });
    assert.equal(envoye.dessert, "");
  });

  it("should_send_empty_honeypot_when_field_is_absent", () => {
    const reponse = { personnes: [personne("Thierry", { soiree: false })] };
    assert.equal(construireEnvoi("abc123", "fr", reponse, [SOIREE_SEULE]).site, "");
  });
});
