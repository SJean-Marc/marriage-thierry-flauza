import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("../apps-script/Code.gs", import.meta.url), "utf8");

const LIEUX = {
  mairie: { nom: "Mairie", adresse: "Adresse mairie" },
  religieux: { nom: "Temple", adresse: "Adresse temple" },
  soiree: { nom: "Salle", adresse: "Adresse salle" },
};

function creerFeuille(lignesInitiales = []) {
  return {
    lignes: [...lignesInitiales],
    getLastRow() {
      return this.lignes.length;
    },
    appendRow(ligne) {
      this.lignes.push(ligne);
    },
    getRange() {
      return { setValues: (valeurs) => this.lignes.push(...valeurs) };
    },
  };
}

function creerScript({ proprietes = {}, feuilleExistante = null } = {}) {
  const feuille = feuilleExistante ?? creerFeuille();
  const classeur = {
    feuilles: feuilleExistante ? { "Réponses": feuilleExistante } : {},
    getSheetByName(nom) {
      return this.feuilles[nom] ?? null;
    },
    insertSheet(nom) {
      this.feuilles[nom] = feuille;
      return feuille;
    },
  };
  const verrou = { pris: false, libere: false };
  const contexte = {
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (cle) => proprietes[cle] ?? null }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => classeur },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {
          verrou.pris = true;
        },
        releaseLock: () => {
          verrou.libere = true;
        },
      }),
    },
    Utilities: { getUuid: () => "1234abcd-0000-0000-0000-000000000000" },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (texte) => ({
        texte,
        setMimeType(type) {
          this.type = type;
          return this;
        },
      }),
    },
  };
  vm.createContext(contexte);
  vm.runInContext(SOURCE, contexte);
  return { contexte, feuille, verrou };
}

function json(sortie) {
  assert.equal(sortie.type, "application/json");
  return JSON.parse(sortie.texte);
}

function poster(contexte, donnees) {
  return json(contexte.doPost({ postData: { contents: JSON.stringify(donnees) } }));
}

const ENVOI_VALIDE = {
  code: "CgX4ht",
  langue: "ta",
  presence: "oui",
  personnes: [
    { nom: " Thierry ", vegetarien: true },
    { nom: "Flauza", vegetarien: false },
  ],
  site: "",
};

describe("doGet", () => {
  it("should_reject_unknown_action", () => {
    const { contexte } = creerScript();
    assert.deepEqual(json(contexte.doGet({ parameter: { action: "autre" } })), {
      erreur: "action-inconnue",
    });
  });

  it("should_reject_unknown_invitation_code", () => {
    const { contexte } = creerScript();
    assert.deepEqual(json(contexte.doGet({ parameter: { action: "lieux", i: "faux" } })), {
      erreur: "invitation-invalide",
    });
  });

  it("should_hide_places_before_reveal_date", () => {
    const { contexte } = creerScript({
      proprietes: { DATE_REVELATION: "2999-01-01", LIEUX: JSON.stringify(LIEUX) },
    });
    assert.deepEqual(json(contexte.doGet({ parameter: { action: "lieux", i: "rLXUq7" } })), {
      revealed: false,
      revealDate: "2999-01-01",
    });
  });
});

describe("lieuxPourVersion", () => {
  it("should_hide_places_when_reveal_date_is_not_set", () => {
    const { contexte } = creerScript({ proprietes: { LIEUX: JSON.stringify(LIEUX) } });
    const resultat = JSON.parse(JSON.stringify(contexte.lieuxPourVersion("A", new Date())));
    assert.deepEqual(resultat, { revealed: false, revealDate: null });
  });

  it("should_hide_places_one_minute_before_midnight_paris_time", () => {
    const { contexte } = creerScript({
      proprietes: { DATE_REVELATION: "2027-03-01", LIEUX: JSON.stringify(LIEUX) },
    });
    const resultat = contexte.lieuxPourVersion("A", new Date("2027-02-28T22:59:00Z"));
    assert.equal(resultat.revealed, false);
  });

  it("should_return_only_places_of_the_version_from_reveal_date", () => {
    const { contexte } = creerScript({
      proprietes: { DATE_REVELATION: "2027-03-01", LIEUX: JSON.stringify(LIEUX) },
    });
    const resultat = JSON.parse(
      JSON.stringify(contexte.lieuxPourVersion("B", new Date("2027-02-28T23:00:00Z"))),
    );
    assert.deepEqual(resultat, {
      revealed: true,
      revealDate: "2027-03-01",
      lieux: { religieux: LIEUX.religieux, soiree: LIEUX.soiree },
    });
  });

  it("should_skip_places_missing_from_properties", () => {
    const { contexte } = creerScript({
      proprietes: { DATE_REVELATION: "2027-03-01", LIEUX: JSON.stringify({ soiree: LIEUX.soiree }) },
    });
    const resultat = JSON.parse(JSON.stringify(contexte.lieuxPourVersion("A", new Date("2027-03-02"))));
    assert.deepEqual(resultat.lieux, { soiree: LIEUX.soiree });
  });

  it("should_return_no_places_when_places_property_is_not_set", () => {
    const { contexte } = creerScript({ proprietes: { DATE_REVELATION: "2027-03-01" } });
    const resultat = JSON.parse(JSON.stringify(contexte.lieuxPourVersion("C", new Date("2027-03-02"))));
    assert.deepEqual(resultat.lieux, {});
  });
});

describe("doPost", () => {
  let script;

  beforeEach(() => {
    script = creerScript();
  });

  it("should_write_one_row_per_person_with_header_on_first_answer", () => {
    assert.deepEqual(poster(script.contexte, ENVOI_VALIDE), { ok: true });

    const [entetes, premiere, seconde] = script.feuille.lignes;
    assert.equal(script.feuille.lignes.length, 3);
    assert.equal(entetes.join("|"), "Horodatage|Réponse n°|Version|Langue|Présence|Nom|Végétarien");
    assert.equal(premiere.slice(1).join("|"), "1234abcd|A|ta|oui|Thierry|oui");
    assert.equal(seconde.slice(1).join("|"), "1234abcd|A|ta|oui|Flauza|non");
    assert.equal(Object.prototype.toString.call(premiere[0]), "[object Date]");
  });

  it("should_take_and_release_the_lock", () => {
    poster(script.contexte, ENVOI_VALIDE);
    assert.equal(script.verrou.pris, true);
    assert.equal(script.verrou.libere, true);
  });

  it("should_not_rewrite_header_when_sheet_already_has_rows", () => {
    const feuille = creerFeuille([["entêtes existantes"]]);
    const { contexte } = creerScript({ feuilleExistante: feuille });
    poster(contexte, { ...ENVOI_VALIDE, personnes: [{ nom: "Thierry" }] });
    assert.equal(feuille.lignes.length, 2);
    assert.equal(feuille.lignes[0][0], "entêtes existantes");
  });

  it("should_default_language_to_french_when_unsupported", () => {
    poster(script.contexte, { ...ENVOI_VALIDE, langue: "xx" });
    assert.equal(script.feuille.lignes[1][3], "fr");
  });

  it("should_record_declined_answer", () => {
    poster(script.contexte, { ...ENVOI_VALIDE, presence: "non", personnes: [{ nom: "Thierry" }] });
    assert.equal(script.feuille.lignes[1].slice(4).join("|"), "non|Thierry|non");
  });

  it("should_neutralize_names_that_look_like_formulas", () => {
    poster(script.contexte, { ...ENVOI_VALIDE, personnes: [{ nom: "=HYPERLINK(1)" }] });
    assert.equal(script.feuille.lignes[1][5], "'=HYPERLINK(1)");
  });

  it("should_pretend_success_without_writing_when_honeypot_is_filled", () => {
    assert.deepEqual(poster(script.contexte, { ...ENVOI_VALIDE, site: "spam" }), { ok: true });
    assert.equal(script.feuille.lignes.length, 0);
  });

  it("should_reject_invalid_json", () => {
    const sortie = script.contexte.doPost({ postData: { contents: "{pas du json" } });
    assert.deepEqual(json(sortie), { ok: false, erreur: "json-invalide" });
  });

  it("should_reject_unknown_invitation_code", () => {
    assert.deepEqual(poster(script.contexte, { ...ENVOI_VALIDE, code: "faux" }), {
      ok: false,
      erreur: "invitation-invalide",
    });
  });

  it("should_reject_invalid_presence", () => {
    assert.deepEqual(poster(script.contexte, { ...ENVOI_VALIDE, presence: "peut-être" }), {
      ok: false,
      erreur: "presence-invalide",
    });
  });

  const PERSONNES_INVALIDES = {
    absentes: undefined,
    vides: [],
    trop_nombreuses: Array.from({ length: 21 }, () => ({ nom: "Invité" })),
    nulles: [null],
    nom_non_texte: [{ nom: 42 }],
    nom_blanc: [{ nom: "  " }],
    nom_trop_long: [{ nom: "x".repeat(101) }],
  };

  for (const [cas, personnes] of Object.entries(PERSONNES_INVALIDES)) {
    it(`should_reject_people_when_${cas}`, () => {
      assert.deepEqual(poster(script.contexte, { ...ENVOI_VALIDE, personnes }), {
        ok: false,
        erreur: "personnes-invalides",
      });
      assert.equal(script.feuille.lignes.length, 0);
    });
  }
});
