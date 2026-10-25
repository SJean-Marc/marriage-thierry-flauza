// Résolution de la version du site à partir du lien d'invitation.

export function lireInvitation(recherche, versions) {
  const code = new URLSearchParams(recherche).get("i");
  if (code === null || !Object.hasOwn(versions, code)) {
    return null;
  }
  return { code, version: versions[code] };
}

// Événement mis en avant (carte pleine) : la cérémonie religieuse, sinon la soirée.
export function evenementVedette(evenements) {
  return evenements.includes("religieux") ? "religieux" : "soiree";
}

export function evenementsDeLaVersion(version, evenementsParVersion) {
  return evenementsParVersion[version] ?? [];
}
