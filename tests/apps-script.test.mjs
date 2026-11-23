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
    formats: [],
    getLastRow() {
      return this.lignes.length;
    },
    appendRow(ligne) {
      this.lignes.push(ligne);
    },
    getRange(ligne, colonne, nombreLignes, nombreColonnes) {
      return {
        setValues: (valeurs) => this.lignes.push(...valeurs),
        setNumberFormat: (format) => this.formats.push({ ligne, colonne, nombreLignes, nombreColonnes, format }),
      };
    },
  };
}

function creerScript({ proprietes = {}, feuilleExistante = null, ferme = false } = {}) {
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
  const cache = new Map();
  const contexte = {
    CacheService: {
      getScriptCache: () => ({
        get: (cle) => cache.get(cle)?.valeur ?? null,
        put: (cle, valeur, expiration) => cache.set(cle, { valeur, expiration }),
      }),
    },
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
  // Les tests d'envoi ne doivent pas dépendre du jour où ils tournent : formulaire ouvert par défaut
  // (formulaireFerme est testée à part, avec des dates fixes).
  const formulaireFerme = contexte.formulaireFerme;
  contexte.formulaireFerme = () => ferme;
  contexte.formulaireFermeReel = formulaireFerme;
  return { contexte, feuille, verrou, cache };
}

function json(sortie) {
  assert.equal(sortie.type, "application/json");
  return JSON.parse(sortie.texte);
}

function poster(contexte, donnees) {
  return json(contexte.doPost({ postData: { contents: JSON.stringify(donnees) } }));
}

const TOUS_PRESENTS = { mairie: true, religieux: true, soiree: true };
const NON_VEGETARIEN = { mercredi: false, jeudi: false };

const ENVOI_VALIDE = {
  code: "CgX4ht",
  langue: "ta",
  personnes: [
    {
      nom: " Thierry ",
      presences: TOUS_PRESENTS,
      vegetarien: { mercredi: true, jeudi: false },
      dessert: "velvet",
    },
    {
      nom: "Flauza",
      presences: { mairie: false, religieux: true, soiree: true },
      vegetarien: { mercredi: false, jeudi: true },
      dessert: "exotique",
    },
  ],
  site: "",
};

function invite(nom, autres = {}) {
  return { nom, presences: TOUS_PRESENTS, vegetarien: NON_VEGETARIEN, dessert: "pistache", ...autres };
}

describe("doGet", () => {
  it("should_reject_unknown_action", () => {
    const { contexte } = creerScript();
    assert.deepEqual(json(contexte.doGet({ parameter: { action: "autre" } })), {
      erreur: "action-inconnue",
    });
  });

  for (const code of ["faux", "constructor", "__proto__"]) {
    it(`should_reject_invitation_code_${code}`, () => {
      const { contexte } = creerScript();
      assert.deepEqual(json(contexte.doGet({ parameter: { action: "lieux", i: code } })), {
        erreur: "invitation-invalide",
      });
    });
  }

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

describe("formulaireFerme", () => {
  it("should_keep_the_form_open_until_the_end_of_the_wedding_day_paris_time", () => {
    const { contexte } = creerScript();
    assert.equal(contexte.formulaireFermeReel(new Date("2027-03-18T22:59:59Z")), false);
  });

  it("should_close_the_form_on_the_day_after_the_wedding_paris_time", () => {
    const { contexte } = creerScript();
    assert.equal(contexte.formulaireFermeReel(new Date("2027-03-18T23:00:00Z")), true);
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
    assert.equal(
      entetes.join("|"),
      "Horodatage|Réponse n°|Version|Langue|Nom|Mairie|Menu 17/03|Religieux|Soirée|Menu 18/03|Dessert",
    );
    assert.equal(
      premiere.slice(1).join("|"),
      "1234abcd|A|ta|Thierry|présent|végétarien|présent|présent|non végétarien|Velvet fruits rouges",
    );
    assert.equal(seconde.slice(1).join("|"), "1234abcd|A|ta|Flauza|absent||présent|présent|végétarien|Fruits exotiques");
    assert.equal(Object.prototype.toString.call(premiere[0]), "[object Date]");
  });

  it("should_leave_events_and_days_outside_the_invitation_empty", () => {
    poster(script.contexte, {
      ...ENVOI_VALIDE,
      code: "rLXUq7",
      personnes: [invite("Thierry", { presences: { soiree: true }, vegetarien: { jeudi: true } })],
    });
    assert.equal(script.feuille.lignes[1].slice(5).join("|"), "|||présent|végétarien|Pistache fruits rouges");
  });

  it("should_ignore_answers_sent_for_events_outside_the_invitation", () => {
    poster(script.contexte, { ...ENVOI_VALIDE, code: "NXrmCt", personnes: [invite("Thierry")] });
    assert.equal(script.feuille.lignes[1].slice(5, 7).join("|"), "|");
  });

  it("should_take_and_release_the_lock", () => {
    poster(script.contexte, ENVOI_VALIDE);
    assert.equal(script.verrou.pris, true);
    assert.equal(script.verrou.libere, true);
  });

  it("should_not_rewrite_header_when_sheet_already_has_rows", () => {
    const feuille = creerFeuille([["entêtes existantes"]]);
    const { contexte } = creerScript({ feuilleExistante: feuille });
    poster(contexte, { ...ENVOI_VALIDE, personnes: [invite("Thierry")] });
    assert.equal(feuille.lignes.length, 2);
    assert.equal(feuille.lignes[0][0], "entêtes existantes");
  });

  it("should_default_language_to_french_when_unsupported", () => {
    poster(script.contexte, { ...ENVOI_VALIDE, langue: "xx" });
    assert.equal(script.feuille.lignes[1][3], "fr");
  });

  it("should_record_person_absent_everywhere_without_menu_nor_dessert", () => {
    const absent = { mairie: false, religieux: false, soiree: false };
    poster(script.contexte, {
      ...ENVOI_VALIDE,
      personnes: [invite("Thierry", { presences: absent, vegetarien: { mercredi: true, jeudi: true }, dessert: "" })],
    });
    assert.equal(script.feuille.lignes[1].slice(4).join("|"), "Thierry|absent||absent|absent||");
  });

  it("should_keep_thursday_menu_but_no_dessert_when_only_at_the_ceremony", () => {
    poster(script.contexte, {
      ...ENVOI_VALIDE,
      personnes: [
        invite("Thierry", {
          presences: { mairie: false, religieux: true, soiree: false },
          vegetarien: { mercredi: false, jeudi: true },
          dessert: "inconnu",
        }),
      ],
    });
    assert.equal(script.feuille.lignes[1].slice(9).join("|"), "végétarien|");
  });

  it("should_neutralize_names_that_look_like_formulas", () => {
    poster(script.contexte, { ...ENVOI_VALIDE, personnes: [invite("=HYPERLINK(1)")] });
    assert.equal(script.feuille.lignes[1][4], "'=HYPERLINK(1)");
  });

  it("should_pretend_success_without_writing_when_honeypot_is_filled", () => {
    assert.deepEqual(poster(script.contexte, { ...ENVOI_VALIDE, site: "spam" }), { ok: true });
    assert.equal(script.feuille.lignes.length, 0);
  });

  it("should_reject_invalid_json", () => {
    const sortie = script.contexte.doPost({ postData: { contents: "{pas du json" } });
    assert.deepEqual(json(sortie), { ok: false, erreur: "json-invalide" });
  });

  for (const [cas, contenu] of Object.entries({ null: null, texte: "bonjour", tableau: [ENVOI_VALIDE] })) {
    it(`should_reject_json_that_is_not_an_object_when_${cas}`, () => {
      assert.deepEqual(poster(script.contexte, contenu), { ok: false, erreur: "json-invalide" });
    });
  }

  for (const code of ["faux", "constructor", "__proto__", "toString"]) {
    it(`should_reject_invitation_code_${code}`, () => {
      assert.deepEqual(poster(script.contexte, { ...ENVOI_VALIDE, code }), {
        ok: false,
        erreur: "invitation-invalide",
      });
    });
  }

  it("should_format_the_name_column_as_plain_text_for_the_new_rows", () => {
    poster(script.contexte, ENVOI_VALIDE);
    assert.deepEqual(script.feuille.formats, [
      { ligne: 2, colonne: 5, nombreLignes: 2, nombreColonnes: 1, format: "@" },
    ]);
  });

  it("should_refuse_answers_once_the_form_is_closed", () => {
    const { contexte, feuille } = creerScript({ ferme: true });
    assert.deepEqual(poster(contexte, ENVOI_VALIDE), { ok: false, erreur: "formulaire-ferme" });
    assert.equal(feuille.lignes.length, 0);
  });

  it("should_accept_thirty_answers_per_ten_minutes_then_refuse", () => {
    const envoi = { ...ENVOI_VALIDE, personnes: [invite("Thierry")] };
    for (let i = 0; i < 30; i++) {
      assert.deepEqual(poster(script.contexte, envoi), { ok: true });
    }
    assert.deepEqual(poster(script.contexte, envoi), { ok: false, erreur: "trop-d-envois" });
    assert.equal(script.feuille.lignes.length, 31);
    assert.equal(script.verrou.libere, true);
  });

  it("should_keep_the_answer_counter_for_ten_minutes", () => {
    poster(script.contexte, ENVOI_VALIDE);
    const [[cle, { valeur, expiration }]] = script.cache.entries();
    assert.match(cle, /^envois-\d+$/);
    assert.equal(valeur, "1");
    assert.equal(expiration, 600);
  });

  it("should_refuse_answers_that_would_exceed_1500_rows", () => {
    const feuille = creerFeuille(Array.from({ length: 1499 }, () => ["ligne"]));
    const { contexte } = creerScript({ feuilleExistante: feuille });
    assert.deepEqual(poster(contexte, ENVOI_VALIDE), { ok: false, erreur: "feuille-pleine" });
    assert.equal(feuille.lignes.length, 1499);
    assert.deepEqual(poster(contexte, { ...ENVOI_VALIDE, personnes: [invite("Thierry")] }), { ok: true });
    assert.equal(feuille.lignes.length, 1500);
  });

  const DESSERTS_INVALIDES = { absent: undefined, inconnu: "chocolat", prototype: "toString" };

  for (const [cas, dessert] of Object.entries(DESSERTS_INVALIDES)) {
    it(`should_reject_dessert_when_${cas}_for_a_guest_at_the_reception`, () => {
      assert.deepEqual(poster(script.contexte, { ...ENVOI_VALIDE, personnes: [invite("Thierry", { dessert })] }), {
        ok: false,
        erreur: "dessert-invalide",
      });
      assert.equal(script.feuille.lignes.length, 0);
    });
  }

  const PERSONNES_INVALIDES = {
    absentes: undefined,
    vides: [],
    trop_nombreuses: Array.from({ length: 21 }, () => invite("Invité")),
    nulles: [null],
    non_objet: ["Thierry"],
    nom_non_texte: [invite(42)],
    nom_blanc: [invite("  ")],
    nom_trop_long: [invite("x".repeat(101))],
    nom_avec_saut_de_ligne: [invite("Thierry\nFlauza")],
    nom_avec_tabulation: [invite("Thierry\t")],
    nom_avec_caractere_nul: [invite("Thierry\u0000")],
    nom_avec_suppression: [invite("Thierry\u007f")],
    presences_absentes: [invite("Thierry", { presences: undefined })],
    presences_nulles: [invite("Thierry", { presences: null })],
    presence_manquante: [invite("Thierry", { presences: { religieux: true, soiree: true } })],
    presence_non_booleenne: [invite("Thierry", { presences: { ...TOUS_PRESENTS, mairie: "oui" } })],
    menus_absents: [invite("Thierry", { vegetarien: undefined })],
    menu_manquant: [invite("Thierry", { vegetarien: { jeudi: false } })],
    menu_non_booleen: [invite("Thierry", { vegetarien: { mercredi: "oui", jeudi: false } })],
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
