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
    "rsvp-oui": "Nous serons présents",
    "rsvp-non": "Nous ne pourrons pas venir",
    "rsvp-personnes-oui": "Personnes présentes",
    "rsvp-personnes-non": "Vos noms",
    "rsvp-nom": "Nom et prénom",
    "rsvp-vegetarien": "Végétarien",
    "rsvp-ajouter": "+ Ajouter une personne",
    "rsvp-retirer": "Retirer",
    "rsvp-envoyer": "Envoyer ma réponse",
    "rsvp-envoi": "Envoi en cours…",
    "rsvp-merci-oui": "Merci ! Votre réponse est bien enregistrée. À très bientôt !",
    "rsvp-merci-non": "Merci de nous avoir prévenus. Vous nous manquerez !",
    "erreur-presence": "Indiquez si vous serez présents.",
    "erreur-nom": "Renseignez le nom de chaque personne.",
    "erreur-envoi": "L'envoi a échoué. Réessayez dans un instant.",
    "erreur-non-configure": "Le formulaire n'est pas encore ouvert.",
    "cagnotte-titre": "Cagnotte",
    "cagnotte-texte":
      "Votre présence est notre plus beau cadeau. Si vous souhaitez participer à notre cagnotte, voici comment faire.",
    "cagnotte-wero": "Wero, depuis votre application bancaire",
    "cagnotte-copier": "Copier",
    "cagnotte-copie": "Copié !",
    "cagnotte-lydia": "Participer avec Lydia",
    "cagnotte-paypal": "Participer avec PayPal",
    "photos-titre": "Photos & vidéos",
    "photos-texte": "Retrouvez les photos et vidéos du mariage, et partagez les vôtres.",
    "photos-voir": "Voir les photos et vidéos",
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
    "rsvp-oui": "நாங்கள் வருகிறோம்",
    "rsvp-non": "எங்களால் வர இயலாது",
    "rsvp-personnes-oui": "வருகை தரும் நபர்கள்",
    "rsvp-personnes-non": "உங்கள் பெயர்கள்",
    "rsvp-nom": "பெயர்",
    "rsvp-vegetarien": "சைவ உணவு",
    "rsvp-ajouter": "+ நபரைச் சேர்க்க",
    "rsvp-retirer": "நீக்கு",
    "rsvp-envoyer": "பதிலை அனுப்பு",
    "rsvp-envoi": "அனுப்பப்படுகிறது…",
    "rsvp-merci-oui": "நன்றி! உங்கள் பதில் பதிவு செய்யப்பட்டது. விரைவில் சந்திப்போம்!",
    "rsvp-merci-non": "தெரிவித்தமைக்கு நன்றி. நீங்கள் இல்லாதது எங்களுக்குக் குறையாக இருக்கும்!",
    "erreur-presence": "நீங்கள் வருவீர்களா என்பதைத் தெரிவிக்கவும்.",
    "erreur-nom": "ஒவ்வொருவரின் பெயரையும் உள்ளிடவும்.",
    "erreur-envoi": "அனுப்புதல் தோல்வியடைந்தது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    "erreur-non-configure": "படிவம் இன்னும் திறக்கப்படவில்லை.",
    "cagnotte-titre": "அன்பளிப்பு",
    "cagnotte-texte":
      "உங்கள் வருகையே எங்களுக்குச் சிறந்த பரிசு. அன்பளிப்பு வழங்க விரும்பினால், கீழ்க்கண்ட வழிகளைப் பயன்படுத்தலாம்.",
    "cagnotte-wero": "Wero, உங்கள் வங்கிச் செயலியில்",
    "cagnotte-copier": "நகலெடு",
    "cagnotte-copie": "நகலெடுக்கப்பட்டது!",
    "cagnotte-lydia": "Lydia மூலம் வழங்க",
    "cagnotte-paypal": "PayPal மூலம் வழங்க",
    "photos-titre": "புகைப்படங்கள் & காணொளிகள்",
    "photos-texte":
      "திருமணப் புகைப்படங்களையும் காணொளிகளையும் பாருங்கள், உங்களுடையவற்றையும் பகிருங்கள்.",
    "photos-voir": "புகைப்படங்களைப் பார்க்க",
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
