// Textes du site en français (par défaut) et en tamoul.
// Les traductions tamoules sont à faire relire par un locuteur natif.

export const LANGUES = ["fr", "ta"];
export const LANGUE_PAR_DEFAUT = "fr";

const LOCALES = { fr: "fr-FR", ta: "ta-IN" };

export const TEXTES = {
  fr: {
    "titre-page": "Mariage de Thierry & Flauza",
    "accueil-intro": "Nos familles ont la joie de vous convier au mariage de",
    "accueil-suite": "et seraient honorées de votre présence à cet évènement",
    "accueil-dates": "17 & 18 mars 2027",
    "invitation-requise":
      "Pour découvrir le programme, utilisez le lien ou le QR code de votre faire-part.",
    "programme-titre": "Programme",
    "evt-mairie-titre": "Mariage civil",
    "evt-mairie-date": "Mercredi 17 mars 2027",
    "evt-mairie-heure": "11 h 30",
    "evt-religieux-titre": "Cérémonie religieuse",
    "evt-religieux-date": "Jeudi 18 mars 2027",
    "evt-religieux-heure": "11 h 30",
    "evt-soiree-titre": "Vin d'honneur et réception",
    "evt-soiree-date": "Jeudi 18 mars 2027",
    "evt-soiree-heure": "dès 19 h",
    "lieu-prochainement": "Lieu communiqué prochainement",
    "lieu-revele-le": "Lieu communiqué le {date}",
    "lien-itineraire": "Itinéraire",
    "rsvp-titre": "Confirmer votre présence",
    "rsvp-limite": "Merci de confirmer votre présence avant le {date}.",
    "rsvp-aide":
      "Afin de faciliter l'organisation de notre mariage, merci d'ajouter chaque personne de votre foyer et d'indiquer sa présence à chacun des événements.",
    "rsvp-halal": "Tous nos plats sont halal.",
    "rsvp-halal-detail": "Merci de sélectionner votre préférence alimentaire pour chaque repas.",
    "rsvp-present": "Présent",
    "rsvp-absent": "Absent",
    "evt-mairie-court": "Mairie",
    "evt-religieux-court": "Cérémonie",
    "evt-soiree-court": "Soirée",
    "rsvp-dessert": "Dessert",
    "rsvp-dessert-choisir": "Choisir…",
    "rsvp-dessert-titre": "Choisissez votre dessert",
    "rsvp-dessert-modifier": "Modifier le dessert",
    "fermer": "Fermer",
    "dessert-velvet": "Velvet fruits rouges",
    "dessert-pistache": "Pistache fruits rouges",
    "dessert-exotique": "Fruits exotiques",
    "rsvp-nom": "Nom et prénom",
    "jour-mercredi": "Mercredi 17 mars 2027",
    "jour-jeudi": "Jeudi 18 mars 2027",
    "rsvp-menu": "Menu",
    "rsvp-vegetarien": "Végétarien",
    "rsvp-non-vegetarien": "Non végétarien",
    "rsvp-ajouter": "Ajouter une personne",
    "rsvp-retirer": "Retirer cette personne",
    "rsvp-envoyer": "Envoyer ma réponse",
    "rsvp-envoi": "Envoi en cours…",
    "rsvp-merci-oui": "Merci ! Votre réponse est bien enregistrée. À très bientôt !",
    "rsvp-merci-non": "Merci de nous avoir prévenus. Vous nous manquerez !",
    "erreur-dessert": "Choisissez un dessert pour chaque personne présente à la soirée.",
    "erreur-nom": "Renseignez le nom de chaque personne.",
    "erreur-envoi": "L'envoi a échoué. Réessayez dans un instant.",
    "erreur-non-configure": "Le formulaire n'est pas encore ouvert.",
    "erreur-ferme": "Le formulaire est fermé : les réponses ne sont plus acceptées.",
    "cagnotte-titre": "Cagnotte",
    "cagnotte-texte":
      "Votre présence est notre plus beau cadeau. Si vous souhaitez participer à notre cagnotte, voici comment faire.",
    "cagnotte-lydia": "Participer avec Lydia",
    "cagnotte-paypal": "Participer avec PayPal",
    "photos-titre": "Photos & vidéos",
    "photos-texte": "Partagez avec nous les photos et vidéos que vous avez prises pendant le mariage.",
    "photos-deposer": "Déposer mes photos et vidéos",
    "pied": "Thierry & Flauza · 17 & 18 mars 2027",
    "contact-texte": "Une question ? Écrivez-nous :",
  },
  ta: {
    "titre-page": "Thierry & Flauza திருமணம்",
    "accueil-intro": "எங்கள் குடும்பத்தினர் மகிழ்ச்சியுடன் அழைக்கும்",
    "accueil-suite": "திருமண விழாவில் உங்கள் வருகையை அன்புடன் எதிர்பார்க்கிறோம்",
    "accueil-dates": "மார்ச் 17 & 18, 2027",
    "invitation-requise":
      "நிகழ்ச்சி விவரங்களைக் காண, உங்கள் அழைப்பிதழில் உள்ள இணைப்பையோ QR குறியீட்டையோ பயன்படுத்தவும்.",
    "programme-titre": "நிகழ்ச்சி நிரல்",
    "evt-mairie-titre": "பதிவுத் திருமணம்",
    "evt-mairie-date": "புதன், 17 மார்ச் 2027",
    "evt-mairie-heure": "காலை 11:30",
    "evt-religieux-titre": "திருமணச் சடங்கு",
    "evt-religieux-date": "வியாழன், 18 மார்ச் 2027",
    "evt-religieux-heure": "காலை 11:30",
    "evt-soiree-titre": "வரவேற்பு விருந்து",
    "evt-soiree-date": "வியாழன், 18 மார்ச் 2027",
    "evt-soiree-heure": "மாலை 7 மணி முதல்",
    "lieu-prochainement": "இடம் விரைவில் அறிவிக்கப்படும்",
    "lieu-revele-le": "இடம் {date} அன்று அறிவிக்கப்படும்",
    "lien-itineraire": "வழி",
    "rsvp-titre": "உங்கள் வருகையை உறுதிசெய்யுங்கள்",
    "rsvp-limite": "{date}-க்குள் உங்கள் வருகையை உறுதிசெய்யவும்.",
    "rsvp-aide":
      "எங்கள் திருமண ஏற்பாடுகளை எளிதாக்க, உங்கள் குடும்பத்தில் ஒவ்வொருவரையும் சேர்த்து, ஒவ்வொரு நிகழ்ச்சிக்கும் அவர்களின் வருகையைக் குறிப்பிடவும்.",
    "rsvp-halal": "எங்கள் அனைத்து உணவுகளும் ஹலால்.",
    "rsvp-halal-detail": "ஒவ்வொரு விருந்துக்கும் உங்கள் உணவு விருப்பத்தைத் தேர்வு செய்யவும்.",
    "rsvp-present": "வருகை",
    "rsvp-absent": "வரவில்லை",
    "evt-mairie-court": "பதிவுத் திருமணம்",
    "evt-religieux-court": "திருமணச் சடங்கு",
    "evt-soiree-court": "வரவேற்பு",
    "rsvp-dessert": "இனிப்பு",
    "rsvp-dessert-choisir": "தேர்வு செய்க…",
    "rsvp-dessert-titre": "உங்கள் இனிப்பைத் தேர்வு செய்யுங்கள்",
    "rsvp-dessert-modifier": "இனிப்பை மாற்று",
    "fermer": "மூடு",
    "dessert-velvet": "வெல்வெட் – சிவப்புப் பழங்கள்",
    "dessert-pistache": "பிஸ்தா – சிவப்புப் பழங்கள்",
    "dessert-exotique": "வெப்பமண்டலப் பழங்கள்",
    "rsvp-nom": "பெயர்",
    "jour-mercredi": "புதன், 17 மார்ச் 2027",
    "jour-jeudi": "வியாழன், 18 மார்ச் 2027",
    "rsvp-menu": "உணவு",
    "rsvp-vegetarien": "சைவம்",
    "rsvp-non-vegetarien": "அசைவம்",
    "rsvp-ajouter": "நபரைச் சேர்க்க",
    "rsvp-retirer": "இந்த நபரை நீக்கு",
    "rsvp-envoyer": "பதிலை அனுப்பு",
    "rsvp-envoi": "அனுப்பப்படுகிறது…",
    "rsvp-merci-oui": "நன்றி! உங்கள் பதில் பதிவு செய்யப்பட்டது. விரைவில் சந்திப்போம்!",
    "rsvp-merci-non": "தெரிவித்தமைக்கு நன்றி. நீங்கள் இல்லாதது எங்களுக்குக் குறையாக இருக்கும்!",
    "erreur-dessert": "வரவேற்பு விருந்தில் கலந்துகொள்ளும் ஒவ்வொருவருக்கும் இனிப்பைத் தேர்வு செய்யவும்.",
    "erreur-nom": "ஒவ்வொருவரின் பெயரையும் உள்ளிடவும்.",
    "erreur-envoi": "அனுப்புதல் தோல்வியடைந்தது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    "erreur-non-configure": "படிவம் இன்னும் திறக்கப்படவில்லை.",
    "erreur-ferme": "படிவம் மூடப்பட்டது: பதில்கள் இனி ஏற்கப்படாது.",
    "cagnotte-titre": "அன்பளிப்பு",
    "cagnotte-texte":
      "உங்கள் வருகையே எங்களுக்குச் சிறந்த பரிசு. அன்பளிப்பு வழங்க விரும்பினால், கீழ்க்கண்ட வழிகளைப் பயன்படுத்தலாம்.",
    "cagnotte-lydia": "Lydia மூலம் வழங்க",
    "cagnotte-paypal": "PayPal மூலம் வழங்க",
    "photos-titre": "புகைப்படங்கள் & காணொளிகள்",
    "photos-texte":
      "திருமணத்தில் நீங்கள் எடுத்த புகைப்படங்களையும் காணொளிகளையும் எங்களுடன் பகிருங்கள்.",
    "photos-deposer": "என் புகைப்படங்களைப் பதிவேற்ற",
    "pied": "Thierry & Flauza · மார்ச் 17 & 18, 2027",
    "contact-texte": "கேள்விகள் இருந்தால் எங்களுக்கு எழுதுங்கள்:",
  },
};

export function traduire(langue, cle, parametres = {}) {
  const texte = TEXTES[langue]?.[cle] ?? TEXTES[LANGUE_PAR_DEFAUT][cle] ?? cle;
  return texte.replace(/\{(\w+)\}/g, (marqueur, nom) => parametres[nom] ?? marqueur);
}

export function langueInitiale(langueMemorisee, langueDuLien = null) {
  if (LANGUES.includes(langueDuLien)) {
    return langueDuLien;
  }
  return LANGUES.includes(langueMemorisee) ? langueMemorisee : LANGUE_PAR_DEFAUT;
}

export function formaterDate(dateIso, langue) {
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALES[langue] ?? LOCALES[LANGUE_PAR_DEFAUT], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(annee, mois - 1, jour));
}
