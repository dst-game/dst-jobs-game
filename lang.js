// ─── Language / i18n ─────────────────────────────────────────────
// Default language is German.
// To switch language, in order of priority:
//   1. add ?lang=en to the URL, or
//   2. run  localStorage.setItem("lang", "en")  in the console, or
//   3. change DEFAULT_LANG below.
// Supported: "de", "en".
//
// How it's used:
//   • Static text in index.html is marked with data-i18n / data-i18n-placeholder
//     / data-i18n-alt and filled in automatically on load.
//   • Dynamic text in script.js is pulled via t("some.key").
// NOTE: The file/CV contents in DOCS (script.js) are intentionally not
//       translated here and stay as authored.

const DEFAULT_LANG = "de";

const TRANSLATIONS = {
  de: {
    // — Intro / Login —
    "intro.heading": "Willkommen bei<br>5 vor 12!",
    "intro.startBtn": "Spiel starten",
    "login.heading": "Computer gesperrt!<br>Passwort eingeben:",
    "login.passwordPlaceholder": "Passwort",

    // — Task headlines —
    "task.findCv": "Finde den richtigen Lebenslauf!",
    "task.submit": "Schicke deine Bewerbung ab!",
    "explorer.title": "📁 Datei-Explorer",

    // — Win screen —
    "win.heading": "🎉 Glückwunsch!",
    "win.appliedPre": "Du hast dich rechtzeitig in ",
    "win.appliedPost": " beworben!",
    "win.remainingPre": "Verbleibende Zeit: ",

    // — File preview —
    "preview.save": "💾 Speichern",

    // — Camera —
    "camera.header": "📷 Foto für Bewerbung aufnehmen",
    "camera.capture": "📸 Foto aufnehmen",
    "camera.retake": "🔄 Nochmal",
    "camera.savePhoto": "💾 Foto speichern",
    "camera.photoAlt": "Aufgenommenes Foto",

    // — Captcha —
    "captcha.logo": "🤖 Ich bin kein Roboter",
    "captcha.confirm": "Bestätigen",
    "captcha.wrong": "Falsche Auswahl! Bitte erneut versuchen.",
    "captcha.bus": "Wähle alle Bilder mit einem 🚌 Bus",
    "captcha.briefcase": "Wähle alle Bilder mit einem 💼 Koffer",
    "captcha.coffee": "Wähle alle Bilder mit einem ☕ Kaffee",
    "captcha.printer": "Wähle alle Bilder mit einem 🖨️ Drucker",
    "captcha.paperclip": "Wähle alle Bilder mit einer 📎 Büroklammer",

    // — Apply button —
    "apply.button": "Bewerbung abschicken",

    // — Desk stage (Setting Option 3) —
    "desk.laptopCap": "Los — die Uhr wartet auf niemanden!",
    "guide.railTitle": "Dein Begleiter",
    "guide.who": "Der Hase",
    "guide.intro": "Bereit? Drück auf Start, dann geht's los!",
    "guide.objLabel": "So gewinnst du",
    "guide.step1": "Passwort eingeben & Rechner entsperren",
    "guide.step2": "Richtigen Lebenslauf finden & vorbereiten",
    "guide.step3": "Absenden, bevor die Uhr 12 schlägt",
    "clock.railTitle": "Verbleibende Zeit",
    "clock.deadline": "Annahmeschluss · 12:00",
    "clock.localtime": "Ortszeit",
    "clock.fristLabel": "Frist",
    "clock.penaltyNote": "Fehler = <b>Zeitstrafe</b>",

    // — Guide (rabbit) messages —
    "guide.password": "Schnell, lass uns das Passwort eingeben!",
    "guide.wrongPassword":
      "Falsches Passwort! Findest du vielleicht irgendwo einen Hinweis?",
    "guide.rememberFile":
      "Oh nein, weißt du noch, wie du die finale Version deiner Bewerbung genannt hast?",
    "guide.wrongFile": "Das ist die falsche Datei!",
    "guide.addImageTypo":
      "Schön, jetzt fügen wir ein Bild hinzu und prüfen auf Tippfehler",
    "guide.missingImage": "Dir fehlt noch das Bild!",
    "guide.typoLeft": "Da ist wohl noch irgendwo ein Tippfehler!",
    "guide.submitNow": "Super! Jetzt schick deine Bewerbung ab! Beeil dich!",
    "guide.almostOutOfTime": "OH NEIN, uns läuft die Zeit davon!!",
    "guide.hurryUp": "Beeil dich!",
    "guide.notRobot": "Bist du sicher, dass du kein Roboter bist?",
    "guide.smile": "Lächeln!",
    "guide.cameraUnavailable": "Kamera nicht verfügbar!",
    "guide.timeUp": "Zeit abgelaufen! Game Over!",
  },

  en: {
    // — Intro / Login —
    "intro.heading": "Welcome to<br>5 vor 12!",
    "intro.startBtn": "Start Game",
    "login.heading": "Computer locked!<br>Enter password:",
    "login.passwordPlaceholder": "Password",

    // — Task headlines —
    "task.findCv": "Find the right CV!",
    "task.submit": "Submit your application!",
    "explorer.title": "📁 File Explorer",

    // — Win screen —
    "win.heading": "🎉 Congratulations!",
    "win.appliedPre": "You applied in time — ",
    "win.appliedPost": "!",
    "win.remainingPre": "Time remaining: ",

    // — File preview —
    "preview.save": "💾 Save",

    // — Camera —
    "camera.header": "📷 Take application photo",
    "camera.capture": "📸 Take photo",
    "camera.retake": "🔄 Retake",
    "camera.savePhoto": "💾 Save photo",
    "camera.photoAlt": "Captured photo",

    // — Captcha —
    "captcha.logo": "🤖 I'm not a robot",
    "captcha.confirm": "Confirm",
    "captcha.wrong": "Wrong selection! Please try again.",
    "captcha.bus": "Select all images with a 🚌 bus",
    "captcha.briefcase": "Select all images with a 💼 briefcase",
    "captcha.coffee": "Select all images with a ☕ coffee",
    "captcha.printer": "Select all images with a 🖨️ printer",
    "captcha.paperclip": "Select all images with a 📎 paperclip",

    // — Apply button —
    "apply.button": "Submit application",

    // — Desk stage (Setting Option 3) —
    "desk.laptopCap": "Go — the clock waits for no one!",
    "guide.railTitle": "Your companion",
    "guide.who": "The Rabbit",
    "guide.intro": "Ready? Hit Start and off we go!",
    "guide.objLabel": "How to win",
    "guide.step1": "Enter the password & unlock the computer",
    "guide.step2": "Find the right CV & get it ready",
    "guide.step3": "Send it before the clock strikes 12",
    "clock.railTitle": "Time remaining",
    "clock.deadline": "Deadline · 12:00",
    "clock.localtime": "Local time",
    "clock.fristLabel": "Deadline",
    "clock.penaltyNote": "Mistake = <b>time penalty</b>",

    // — Guide (rabbit) messages —
    "guide.password": "Quick, let's put in the password!",
    "guide.wrongPassword":
      "Wrong Password! Can you maybe find a hint somewhere?",
    "guide.rememberFile":
      "Oh no, do you remember how you named the final version of your application?",
    "guide.wrongFile": "That's the wrong file!",
    "guide.addImageTypo": "Nice, let's add an image and check for typos",
    "guide.missingImage": "You're missing the image!",
    "guide.typoLeft": "Seems like there is still a typo somewhere!",
    "guide.submitNow": "Great! Now submit your application! Hurry up!",
    "guide.almostOutOfTime": "OH NO, we're almost out of time!!",
    "guide.hurryUp": "Hurry up!",
    "guide.notRobot": "Are you sure you're not a robot?",
    "guide.smile": "Smile!",
    "guide.cameraUnavailable": "Camera not available!",
    "guide.timeUp": "Time's up! Game Over!",
  },
};

function resolveLang() {
  let fromQuery = null;
  try {
    fromQuery = new URLSearchParams(window.location.search).get("lang");
  } catch (e) {
    /* ignore */
  }
  let fromStore = null;
  try {
    fromStore = localStorage.getItem("lang");
  } catch (e) {
    /* localStorage may be unavailable (e.g. file://) */
  }
  const candidate = (fromQuery || fromStore || DEFAULT_LANG).toLowerCase();
  return TRANSLATIONS[candidate] ? candidate : DEFAULT_LANG;
}

const LANG = resolveLang();

// Look up a translation key. Falls back to the German value, then the key itself.
function t(key) {
  const dict = TRANSLATIONS[LANG] || TRANSLATIONS[DEFAULT_LANG];
  if (dict && dict[key] != null) return dict[key];
  if (TRANSLATIONS[DEFAULT_LANG][key] != null)
    return TRANSLATIONS[DEFAULT_LANG][key];
  return key;
}

// Fill in all static elements marked with data-i18n attributes.
function applyStaticTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    el.alt = t(el.dataset.i18nAlt);
  });
  document.documentElement.lang = LANG;
}

// lang.js is loaded right before script.js at the end of <body>, so every
// element above already exists — apply immediately.
applyStaticTranslations();
