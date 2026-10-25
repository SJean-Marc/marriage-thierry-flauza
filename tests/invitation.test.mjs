import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evenementVedette, evenementsDeLaVersion, lireInvitation } from "../js/invitation.js";

const VERSIONS = { abc123: "A", def456: "C" };
const EVENEMENTS = { A: ["mairie", "religieux", "soiree"], C: ["soiree"] };

describe("lireInvitation", () => {
  it("should_return_code_and_version_when_code_is_known", () => {
    assert.deepEqual(lireInvitation("?i=abc123", VERSIONS), { code: "abc123", version: "A" });
  });

  it("should_return_null_when_code_is_missing", () => {
    assert.equal(lireInvitation("", VERSIONS), null);
  });

  it("should_return_null_when_code_is_unknown", () => {
    assert.equal(lireInvitation("?i=inconnu", VERSIONS), null);
  });

  it("should_return_null_when_code_matches_an_object_prototype_property", () => {
    assert.equal(lireInvitation("?i=toString", VERSIONS), null);
  });
});

describe("evenementVedette", () => {
  it("should_highlight_religious_ceremony_when_present", () => {
    assert.equal(evenementVedette(["mairie", "religieux", "soiree"]), "religieux");
  });

  it("should_highlight_reception_when_religious_ceremony_is_absent", () => {
    assert.equal(evenementVedette(["soiree"]), "soiree");
  });
});

describe("evenementsDeLaVersion", () => {
  it("should_return_events_of_the_version", () => {
    assert.deepEqual(evenementsDeLaVersion("C", EVENEMENTS), ["soiree"]);
  });

  it("should_return_empty_list_when_version_is_unknown", () => {
    assert.deepEqual(evenementsDeLaVersion("Z", EVENEMENTS), []);
  });
});
