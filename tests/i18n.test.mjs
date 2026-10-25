import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TEXTES, formaterDate, langueInitiale, traduire } from "../js/i18n.js";

describe("TEXTES", () => {
  it("should_define_the_same_keys_in_french_and_tamil", () => {
    assert.deepEqual(Object.keys(TEXTES.ta).sort(), Object.keys(TEXTES.fr).sort());
  });
});

describe("traduire", () => {
  it("should_return_french_text", () => {
    assert.equal(traduire("fr", "rsvp-oui"), "Nous serons présents");
  });

  it("should_return_tamil_text", () => {
    assert.equal(traduire("ta", "rsvp-oui"), "நாங்கள் வருகிறோம்");
  });

  it("should_fall_back_to_french_when_language_is_unknown", () => {
    assert.equal(traduire("en", "rsvp-oui"), "Nous serons présents");
  });

  it("should_return_the_key_when_text_is_missing", () => {
    assert.equal(traduire("fr", "cle-inconnue"), "cle-inconnue");
  });

  it("should_replace_parameters", () => {
    assert.equal(traduire("fr", "rsvp-limite", { date: "28 janvier 2027" }), "Merci de confirmer votre présence avant le 28 janvier 2027.");
  });

  it("should_keep_marker_when_parameter_is_missing", () => {
    assert.equal(traduire("fr", "rsvp-limite"), "Merci de confirmer votre présence avant le {date}.");
  });
});

describe("langueInitiale", () => {
  it("should_keep_stored_language_when_supported", () => {
    assert.equal(langueInitiale("ta"), "ta");
  });

  it("should_return_french_when_nothing_is_stored", () => {
    assert.equal(langueInitiale(null), "fr");
  });

  it("should_return_french_when_stored_language_is_unsupported", () => {
    assert.equal(langueInitiale("de"), "fr");
  });
});

describe("formaterDate", () => {
  it("should_format_date_in_french", () => {
    assert.equal(formaterDate("2027-01-28", "fr"), "28 janvier 2027");
  });

  it("should_format_date_in_tamil", () => {
    assert.match(formaterDate("2027-01-28", "ta"), /ஜனவரி/);
  });

  it("should_format_date_in_french_when_language_is_unknown", () => {
    assert.equal(formaterDate("2027-03-01", "en"), "1 mars 2027");
  });
});
