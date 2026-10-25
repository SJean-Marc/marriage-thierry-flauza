import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { construireEnvoi, validerReponse } from "../js/rsvp.js";

describe("validerReponse", () => {
  it("should_return_no_error_when_answer_is_complete", () => {
    const reponse = { presence: "oui", personnes: [{ nom: "Thierry", vegetarien: false }] };
    assert.deepEqual(validerReponse(reponse), []);
  });

  it("should_return_presence_error_when_presence_is_not_chosen", () => {
    const reponse = { presence: "", personnes: [{ nom: "Thierry" }] };
    assert.deepEqual(validerReponse(reponse), ["erreur-presence"]);
  });

  it("should_return_name_error_when_a_name_is_blank", () => {
    const reponse = { presence: "non", personnes: [{ nom: "Flauza" }, { nom: "   " }] };
    assert.deepEqual(validerReponse(reponse), ["erreur-nom"]);
  });

  it("should_return_name_error_when_person_list_is_empty", () => {
    assert.deepEqual(validerReponse({ presence: "oui", personnes: [] }), ["erreur-nom"]);
  });

  it("should_return_both_errors_when_nothing_is_filled", () => {
    assert.deepEqual(validerReponse({ presence: "", personnes: [{ nom: "" }] }), [
      "erreur-presence",
      "erreur-nom",
    ]);
  });
});

describe("construireEnvoi", () => {
  it("should_trim_names_and_keep_vegetarian_choice_when_present", () => {
    const reponse = {
      presence: "oui",
      personnes: [
        { nom: "  Thierry ", vegetarien: true },
        { nom: "Flauza", vegetarien: false },
      ],
      site: "",
    };
    assert.deepEqual(construireEnvoi("abc123", "ta", reponse), {
      code: "abc123",
      langue: "ta",
      presence: "oui",
      personnes: [
        { nom: "Thierry", vegetarien: true },
        { nom: "Flauza", vegetarien: false },
      ],
      site: "",
    });
  });

  it("should_force_vegetarian_to_false_when_declining", () => {
    const reponse = { presence: "non", personnes: [{ nom: "Thierry", vegetarien: true }] };
    assert.equal(construireEnvoi("abc123", "fr", reponse).personnes[0].vegetarien, false);
  });

  it("should_send_empty_honeypot_when_field_is_absent", () => {
    const reponse = { presence: "non", personnes: [{ nom: "Thierry" }] };
    assert.equal(construireEnvoi("abc123", "fr", reponse).site, "");
  });
});
