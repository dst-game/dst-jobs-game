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
    // — Start screen (Traumjob overlay) —
    "start.eyebrow": "Traumjob · 5 vor 12",
    "start.headline": "Was ist dein Traumjob?",
    "start.sub":
      'Es ist <span class="tj-serif">fünf vor zwölf.</span> Sag uns, wovon du träumst — dann beginnt das Rennen gegen die Uhr.',
    "start.fieldLabel": "Dein Traumjob",
    "start.placeholder": "z. B. Katzenstreichler, Drachenflüsterer…",
    "start.btn": 'Augen auf — Spiel starten <span class="arrow">→</span>',

    // — Intro / Login —
    "intro.heading": "Willkommen bei<br>5 vor 12!",
    "intro.startBtn": "Spiel starten",
    "intro.skipBtn": "Überspringen",
    "login.heading": "Computer gesperrt!<br>Passwort eingeben:",
    "login.passwordPlaceholder": "Passwort",

    // — Task headlines —
    "task.findCv": "Finde den richtigen Lebenslauf!",
    "task.submit": "Schicke deine Bewerbung ab!",
    "cv.headlinePrefix": "Lebenslauf für: ",
    "explorer.title": "📁 Datei-Explorer",

    // — Win screen —
    "win.heading": "🎉 Glückwunsch!",
    "win.appliedPre": "Du hast dich rechtzeitig in ",
    "win.appliedPost": " beworben!",
    "win.remainingPre": "Verbleibende Zeit: ",
    "win.shortcut.heading": "🏆 Direkt eingestellt!",
    "win.shortcut.body":
      "Du hast direkt die richtige Webadresse eingegeben — hol dir dein Goodie, du bist schon top (und quasi eingestellt)! 😉",

    // — Leaderboard —
    "lb.openBtn": "Zum Leaderboard",
    "lb.badge": "✦ Spiel beendet",
    "lb.title": "Bestenliste",
    "lb.scoreLabel": "Deine Restzeit:",
    "lb.hint": "Gib deinen Spitznamen ein, um eingetragen zu werden.",
    "lb.inputPlaceholder": "Dein Spitzname",
    "lb.submitBtn": "Eintragen & anzeigen",
    "lb.quote": "„Speed gewinnt. Die Bestenliste lügt nicht.“",
    "lb.colRank": "Rang",
    "lb.colPlayer": "Spieler",
    "lb.colTime": "Restzeit",
    "lb.restartBtn": "Nochmal spielen",
    "lb.chip": "DU",
    "lb.timeLeft": "übrig",

    // — CV Vorschau —
    "cv.jobHeadlinePre": "Bewerbung als ",

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
    "captcha.roboterLabel": "Ich bin ein Roboter.",
    "captcha.roboterError": "Roboter dürfen sich nicht bewerben! 🤖",
    "captcha.bus": "Wähle alle Bilder mit einem 🚌 Bus",
    "captcha.briefcase": "Wähle alle Bilder mit einem 💼 Koffer",
    "captcha.coffee": "Wähle alle Bilder mit einem ☕ Kaffee",
    "captcha.printer": "Wähle alle Bilder mit einem 🖨️ Drucker",
    "captcha.paperclip": "Wähle alle Bilder mit einer 📎 Büroklammer",

    // — Mom SMS —
    "mom.name": "Mama",
    "mom.msg1": "Na?? Hast du dich endlich beworben?! 😠",
    "mom.msg2": "Ich frage dich was!!! 😡",
    "mom.msg3": "Na wenn das so ist!!! Ich sag es Papa!!! 💢",
    "mom.msg4": "Jetzt ruf mich SOFORT zurück!!!! 🤬",
    "mom.reply": "Antworten",
    "mom.ignore": "Ignorieren",
    "mom.sent": "Bin gerade dabei 🙏",
    "mom.call.status": "Eingehender Anruf ...",
    "mom.call.accept": "Annehmen",
    "mom.call.hangup": "Auflegen",
    "mom.call.mistake":
      "Hab mich verwählt, sorry!! 😅 Viel Erfolg bei der Bewerbung — ich drück die Daumen! 🤞",

    // — Game over —
    "gameover.heading": "💀 Zu spät!",
    "gameover.body": "Die Bewerbungsfrist ist abgelaufen. Versuch's nochmal!",
    "gameover.discard.heading": "🗑️ Alles weg!",
    "gameover.discard.body":
      "Du hast deine Bewerbung gelöscht. Das war wohl nix.",
    "gameover.restart": "Nochmal versuchen",
    "tip.betterPortals":
      "Tipp: Versuch's nächstes Mal mit <b>jobs.derstandard.at</b> — da klappt's bestimmt!",
    "tip.betterPortalsWin":
      "Tipp: Versuch's nächstes Mal mit <b>jobs.derstandard.at</b> — da geht das schnell und unkompliziert!",

    // — Apply button —
    "apply.button": "Bewerbung abschicken",
    "apply.discard": "Bewerbung verwerfen",

    // — Discard modal —
    "discard.title": "Bewerbung.docx",
    "discard.heading": "Wirklich alles verwerfen?",
    "discard.body": "Alle Änderungen gehen unwiderruflich verloren.",
    "discard.yes": "Ja, alles verwerfen!",
    "discard.no": "Nein, abbrechen!",

    // — Second confirmation modal —
    "discard2.heading": "Bist du dir sicher, dass du weiter machen willst?",
    "discard2.body": "Du hast noch eine Chance, die Bewerbung abzuschicken.",
    "discard2.yes": "Ja, ich bin mir sicher!",
    "discard2.no": "Nein, verwirf alles!",

    // — Desk stage (Setting Option 3) —
    "desk.laptopCap": "Los — die Uhr wartet auf niemanden!",
    "guide.railTitle": "Dein Begleiter",
    "guide.who": "Der Hase",
    "guide.objLabel": "So gewinnst du",
    "guide.step1": "Passwort eingeben & Rechner entsperren",
    "guide.step2": "Jobplattform öffnen (dreamjob.io)",
    "guide.step3": "Deinen Traumjob finden",
    "guide.step4": "Anschreiben tippen",
    "guide.step5": "Richtigen Lebenslauf finden & vorbereiten",
    "guide.step6": "Absenden, bevor die Uhr 12 schlägt",
    "clock.railTitle": "Verbleibende Zeit",
    "clock.deadline": "Annahmeschluss · 12:00",
    "clock.localtime": "Ortszeit",
    "clock.fristLabel": "Frist",
    "clock.penaltyNote": "Fehler = <b>Zeitstrafe</b>",

    // — Intro spotlight tour (after the video) —
    "spotlight.rabbit":
      "Das ist der Hase — dein Begleiter! Er führt dich durchs Spiel und gibt dir wertvolle Tipps. Hör gut auf ihn!",
    "spotlight.clock":
      "Die Uhr tickt: Es ist fünf vor zwölf! Bis Punkt 12:00 muss deine Bewerbung raus sein. Und Achtung — jeder Fehler kostet dich wertvolle Zeit!",
    "spotlight.laptop":
      "Hier am Laptop spielt sich alles ab. Kleiner Tipp: Manchmal verstecken sich Hinweise in den Dateien — schau also ganz genau hin!",
    "spotlight.next": "Weiter",
    "spotlight.start": "Spiel starten",

    // — Coffee power-up —
    "coffee.title": "Kaffee trinken für mehr Energie",
    "guide.coffee":
      "Ahh, Kaffee! ☕ Jetzt hast du wieder Energie — plus 60 Sekunden!",
    "guide.coffeeCapped":
      "Ahh, Kaffee! ☕ Aber so lange läuft die Uhr noch gar nicht — du bekommst nur die {s} Sekunden zurück, die schon vorbei sind!",
    "spotlight.skip": "Überspringen",

    // — Guide (rabbit) messages —
    "guide.password":
      "Du brauchst das Passwort! Ist irgendwo ein Hinweis versteckt?",
    "guide.rememberFile":
      "Oh, das sind ganz schön viele Dateien! Welche ist richtig?",
    "guide.addImageTypo":
      "Das scheint die richtige Bewerbung zu sein! Aber etwas stimmt noch nicht...",
    "guide.stillWrong": "Hm, etwas stimmt nicht.",
    "guide.submitNow": "Super! Jetzt schick deine Bewerbung ab! Beeil dich!",
    "guide.almostOutOfTime": "OH NEIN, uns läuft die Zeit davon!!",
    "guide.hurryUp": "Nur noch eine Minute! Beeil dich!",
    "guide.notRobot": "Bist du sicher, dass du kein Roboter bist?",
    "guide.success": "Jippie, du hast es geschafft!",
    "guide.timeUp": "Zeit abgelaufen! Game Over!",
    "guide.discardedFiles": "Du hast deine Bewerbung gelöscht... Gut gemacht!",
    "guide.halfTime": "Halbzeit!",
    "guide.oneMinutePassed": "Die Zeit verfliegt!!",

    // — Bewerbungs-Flow (Browser-Minispiel) —
    "flow.newtab.tab": "Neuer Tab",
    "flow.newtab.q": "Wohin heute?",
    "flow.omni.ph": "Adresse eingeben…",
    "flow.nav.jobs": "Jobs",
    "flow.nav.companies": "Unternehmen",
    "flow.nav.salary": "Gehalt",
    "flow.nav.profile": "Mein Profil",
    "flow.nav.application": "Bewerbung",
    "flow.results.count":
      "1.284 Treffer · sortiert nach: ??? · <b>irgendwo hier ist dein Traumjob</b>",
    "flow.card.view": "Ansehen →",
    "flow.detail.about": "Worum es geht",
    "flow.detail.duties": "Deine Aufgaben",
    "flow.detail.perks": "Was wir bieten",
    "flow.detail.apply": "Jetzt bewerben",
    "flow.detail.deadlinePost": " · Annahmeschluss 12:00 Uhr",
    "flow.detail.co": "Zukunft Industries",
    "flow.detail.meta": "Wolkenkuckucksheim · Hybrid · ab sofort · unbefristet",
    "flow.detail.introPre": "Du wolltest schon immer „",
    "flow.detail.introPost":
      "“ werden? Dann ist heute dein Tag. Wir suchen genau dich – und die Uhr tickt. Annahmeschluss ist Punkt zwölf.",
    "flow.chip.1": "Vollzeit",
    "flow.chip.2": "Traum-Level",
    "flow.chip.3": "Sofortstart",
    "flow.chip.4": "Top-Gehalt",
    "flow.duty.1": "Jeden Tag aufstehen und das tun, wovon andere nur träumen",
    "flow.duty.2":
      "Die Welt ein kleines bisschen besser (und pünktlicher) machen",
    "flow.duty.3": "Eng mit einem sehr nervösen Hasen zusammenarbeiten",
    "flow.perk.1": "Unbegrenzt Möhren am Arbeitsplatz",
    "flow.perk.2": "Eine Uhr, die nie zwölf schlägt (theoretisch)",
    "flow.perk.3": "Remote, vor Ort oder im Bau deiner Wahl",
    "flow.match.co": "Zukunft Industries",
    "flow.match.loc": "Hybrid · Wolkenkuckucksheim",
    "flow.match.pay": "Dein Wert",
    "flow.match.tags": "Vollzeit,Traum,Sofort",
    "flow.match.titleFallback": "Dein Traumjob",
    "flow.d1.title": "Senior Karotten-Sommelier",
    "flow.d1.co": "KnackFrisch GmbH",
    "flow.d1.loc": "Möhrenheim · Vor Ort",
    "flow.d1.pay": "42k–48k",
    "flow.d1.tags": "Vollzeit,Gemüse",
    "flow.d2.title": "Chief Slowness Officer",
    "flow.d2.co": "Entschleunigung AG",
    "flow.d2.loc": "Remote · irgendwann",
    "flow.d2.pay": "∞ Geduld",
    "flow.d2.tags": "Teilzeit,Achtsam",
    "flow.d3.title": "Sockenpaar-Detektiv (m/w/d)",
    "flow.d3.co": "Waschküche24",
    "flow.d3.loc": "Hybrid · Keller",
    "flow.d3.pay": "38k",
    "flow.d3.tags": "Vollzeit,Mystery",
    "flow.d4.title": "Wolkenformbeauftragte:r",
    "flow.d4.co": "Himmel & Co.",
    "flow.d4.loc": "Draußen · Wetterabhängig",
    "flow.d4.pay": "Luftnummer",
    "flow.d4.tags": "Saisonal",
    "flow.d5.title": "Bubble-Tea-Statiker",
    "flow.d5.co": "BobaBau",
    "flow.d5.loc": "Vor Ort · Teeküche",
    "flow.d5.pay": "44k",
    "flow.d5.tags": "Vollzeit,Süß",
    "flow.apply.step": "Anschreiben · der Hase diktiert",
    "flow.apply.h2": "Tipp dein Anschreiben",
    "flow.apply.forPre": "für ",
    "flow.apply.dicLabel": "Tipp den Text genau so ab, wie er hier steht",
    "flow.apply.placeholder":
      "Hier lostippen — Buchstabe für Buchstabe, genau wie diktiert…",
    "flow.apply.hintDefault":
      "Fehler blockieren das Absenden — tipp sauber bis zum Punkt.",
    "flow.apply.hintErrorPre": "✗ Tippfehler bei Zeichen ",
    "flow.apply.hintErrorPost": " — korrigier ihn (Backspace). Kein Vertippen!",
    "flow.apply.footTodo": "Tipp den Satz bis zum Ende.",
    "flow.apply.footDone": "Anschreiben fertig — ab zum CV-Upload!",
    "flow.apply.cta": "CV hochladen",
    "flow.apply.targetPre": "Sehr geehrtes Team, ich bin mit Leib und Seele ",
    "flow.apply.targetPost": " und starte sofort durch.",
    "flow.guide.newtabPre": "Schnell — tipp ",
    "flow.guide.newtabPost": " oben in die Leiste, bevor’s zwölf schlägt!",
    "flow.guide.results":
      "Such genau die Stelle, die du eingegeben hast — nicht die Karotten.",
    "flow.guide.detail": "Das ist es! Klick „Jetzt bewerben” — die Zeit rennt.",
    "flow.guide.applyScreen": "Tipp den Text genau so ab!",
    "flow.guide.applyPre": "Sprich mir nach: „",
    "flow.guide.applyPost": "”",
    "flow.guide.shortcutWin":
      "Clever! Du kennst die wirklich guten Portale — und hast damit sofort gewonnen!",
    "flow.ad.banner":
      "🎉 GLÜCKWUNSCH! Du bist heute der 1.000.000ste Besucher! Klick HIER für deinen Preis!! 🎁",
    "flow.cookie.title": "🍪 Wir lieben deine Daten!",
    "flow.cookie.body":
      "Diese Seite nutzt 1.482 Cookies & 73 „Partner“, um dir endlich „relevante“ Jobs zu zeigen.",
    "flow.cookie.accept": "ALLE AKZEPTIEREN ✓",
    "flow.cookie.reject": "ablehnen",
    "flow.chat.bubble": "💬 Hi! Kann ich dir beim Suchen helfen?",
    "flow.sort.label": "Sortieren: Zufällig ▾",
    "flow.badge.top": "⭐ Top-Treffer",
    "flow.badge.ad": "Anzeige",
    "flow.d6.title": "Einhorn-Wellness-Coach",
    "flow.d6.co": "GlitzerVibes GmbH",
    "flow.d6.loc": "Remote · Regenbogen",
    "flow.d6.pay": "Magische Bohnen",
    "flow.d6.tags": "Teilzeit,Magie",
    "flow.d7.title": "Senior Stein-Stapler",
    "flow.d7.co": "Balance & Co.",
    "flow.d7.loc": "Vor Ort · Steinbruch",
    "flow.d7.pay": "37k",
    "flow.d7.tags": "Vollzeit,Geduld",
    "flow.d8.title": "Zwiebel-Schicht-Analyst:in",
    "flow.d8.co": "TränenReich AG",
    "flow.d8.loc": "Hybrid · Küche",
    "flow.d8.pay": "41k",
    "flow.d8.tags": "Vollzeit,Würzig",
    "flow.d9.title": "Chief Vibes Officer",
    "flow.d9.co": "StimmungsWerk",
    "flow.d9.loc": "Überall · Spürbar",
    "flow.d9.pay": "Gute Laune",
    "flow.d9.tags": "Vollzeit,Aura",
    "flow.d10.title": "Fax-Nostalgie-Berater",
    "flow.d10.co": "RetroBüro GmbH",
    "flow.d10.loc": "Vor Ort · 1998",
    "flow.d10.pay": "35k",
    "flow.d10.tags": "Vollzeit,Retro",
    "flow.d11.title": "Eiswürfel-Qualitätsprüfer:in",
    "flow.d11.co": "KaltKalt AG",
    "flow.d11.loc": "Remote · Tiefkühl",
    "flow.d11.pay": "Cool bleiben",
    "flow.d11.tags": "Saisonal,Frostig",
    "flow.results.more": "Mehr Treffer laden ▼",
    "flow.news.title": "📧 Verpass nie wieder deinen Traumjob!",
    "flow.news.body":
      "Trag dich für 4× tägliche Job-Mails ein. Abbestellen jederzeit möglich (irgendwo).",
    "flow.news.accept": "JA, BITTE MAILS ✓",
    "flow.news.reject": "nein danke",
  },

  en: {
    // — Start screen (Traumjob overlay) —
    "start.eyebrow": "Dream Job · 5 vor 12",
    "start.headline": "Tell us what your Dream Job would be",
    "start.sub":
      'It\'s <span class="tj-serif">five to twelve.</span> Tell us what you dream of — then the race against the clock begins.',
    "start.fieldLabel": "Your dream job",
    "start.placeholder": "e.g. cat cuddler, dragon whisperer…",
    "start.btn": 'Eyes open — start the game <span class="arrow">→</span>',

    // — Intro / Login —
    "intro.heading": "Welcome to<br>5 vor 12!",
    "intro.startBtn": "Start Game",
    "intro.skipBtn": "Skip",
    "login.heading": "Computer locked!<br>Enter password:",
    "login.passwordPlaceholder": "Password",

    // — Task headlines —
    "task.findCv": "Find the right CV!",
    "task.submit": "Submit your application!",
    "cv.headlinePrefix": "CV for: ",
    "explorer.title": "📁 File Explorer",

    // — Win screen —
    "win.heading": "🎉 Congratulations!",
    "win.appliedPre": "You applied in time — ",
    "win.appliedPost": "!",
    "win.remainingPre": "Time remaining: ",
    "win.shortcut.heading": "🏆 Hired on the spot!",
    "win.shortcut.body":
      "You typed the right web address straight away — go grab your goodie, you’re already a pro (and basically hired)! 😉",

    // — Leaderboard —
    "lb.openBtn": "To Leaderboard",
    "lb.badge": "✦ Game over",
    "lb.title": "Leaderboard",
    "lb.scoreLabel": "Your remaining time:",
    "lb.hint": "Enter your nickname to be added to the leaderboard.",
    "lb.inputPlaceholder": "Your nickname",
    "lb.submitBtn": "Submit & view",
    "lb.quote": "“Speed wins. The leaderboard never lies.”",
    "lb.colRank": "Rank",
    "lb.colPlayer": "Player",
    "lb.colTime": "Time left",
    "lb.restartBtn": "Play again",
    "lb.chip": "YOU",
    "lb.timeLeft": "left",

    // — CV preview —
    "cv.jobHeadlinePre": "Application as ",

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
    "captcha.roboterLabel": "I am a robot.",
    "captcha.roboterError": "Robots may not apply! 🤖",
    "captcha.bus": "Select all images with a 🚌 bus",
    "captcha.briefcase": "Select all images with a 💼 briefcase",
    "captcha.coffee": "Select all images with a ☕ coffee",
    "captcha.printer": "Select all images with a 🖨️ printer",
    "captcha.paperclip": "Select all images with a 📎 paperclip",

    // — Mom SMS —
    "mom.name": "Mom",
    "mom.msg1": "Well?? Did you finally apply?! 😠",
    "mom.msg2": "I'm asking you something!!! 😡",
    "mom.msg3": "Fine then!!! I'm telling Dad!!! 💢",
    "mom.msg4": "Call me back RIGHT NOW!!!! 🤬",
    "mom.reply": "Reply",
    "mom.ignore": "Ignore",
    "mom.sent": "On it right now 🙏",
    "mom.call.status": "Incoming call ...",
    "mom.call.accept": "Accept",
    "mom.call.hangup": "Hang up",
    "mom.call.mistake":
      "Wrong number, sorry!! 😅 Good luck with the application — fingers crossed! 🤞",

    // — Game over —
    "gameover.heading": "💀 Too late!",
    "gameover.body": "The application deadline has passed. Try again!",
    "gameover.discard.heading": "🗑️ All gone!",
    "gameover.discard.body": "You deleted your application. That's on you.",
    "gameover.restart": "Try again",
    "tip.betterPortals":
      "Tip: Next time try <b>jobs.derstandard.at</b> — it's much easier to use, you'll nail it!",
    "tip.betterPortalsWin":
      "Tip: Next time try <b>jobs.derstandard.at</b> — it's fast and easy!",

    // — Apply button —
    "apply.button": "Submit application",
    "apply.discard": "Discard everything",

    // — Discard modal —
    "discard.title": "Application.docx",
    "discard.heading": "Really discard everything?",
    "discard.body": "All changes will be lost permanently.",
    "discard.yes": "Yes, discard everything!",
    "discard.no": "No, go back!",

    // — Second confirmation modal —
    "discard2.heading": "Are you sure you want to continue?",
    "discard2.body": "You still have a chance to submit your application.",
    "discard2.yes": "Yes, I'm sure!",
    "discard2.no": "No, discard everything!",

    // — Desk stage (Setting Option 3) —
    "desk.laptopCap": "Go — the clock waits for no one!",
    "guide.railTitle": "Your companion",
    "guide.who": "The Rabbit",
    "guide.objLabel": "How to win",
    "guide.step1": "Enter the password & unlock the computer",
    "guide.step2": "Open the job platform (dreamjob.io)",
    "guide.step3": "Find your dream job",
    "guide.step4": "Type your cover letter",
    "guide.step5": "Find the right CV & get it ready",
    "guide.step6": "Send it before the clock strikes 12",
    "clock.railTitle": "Time remaining",
    "clock.deadline": "Deadline · 12:00",
    "clock.localtime": "Local time",
    "clock.fristLabel": "Deadline",
    "clock.penaltyNote": "Mistake = <b>time penalty</b>",

    // — Intro spotlight tour (after the video) —
    "spotlight.rabbit":
      "This is the rabbit — your companion! He guides you through the game and gives you valuable tips. Listen to him closely!",
    "spotlight.clock":
      "The clock is ticking: it's five to twelve! Your application must be sent by 12:00 sharp. And watch out — every mistake costs you precious time!",
    "spotlight.laptop":
      "This is the laptop, where everything happens. A little tip: sometimes hints are hidden inside the files — so look very closely!",
    "spotlight.next": "Next",
    "spotlight.start": "Start game",

    // — Coffee power-up —
    "coffee.title": "Drink coffee for more energy",
    "guide.coffee":
      "Ahh, coffee! ☕ Your energy is back — plus 60 seconds!",
    "guide.coffeeCapped":
      "Ahh, coffee! ☕ But the clock hasn't been running that long — you only get back the {s} seconds that have already passed!",
    "spotlight.skip": "Skip",

    // — Guide (rabbit) messages —
    "guide.password":
      "You need the password! Is there a hint hiding somewhere?",
    "guide.rememberFile":
      "Oh, that's a lot of files! Which one is the right one?",
    "guide.addImageTypo":
      "That seems to be the right application! But something is still wrong here...",
    "guide.stillWrong": "Something is still wrong!",
    "guide.submitNow": "Great! Now submit your application! Hurry up!",
    "guide.almostOutOfTime": "OH NO, we're almost out of time!!",
    "guide.hurryUp": "Hurry up!",
    "guide.notRobot": "Are you sure you're not a robot?",
    "guide.timeUp": "Time's up! Game Over!",
    "guide.discardedFiles": "You discarded your application... Good job!",
    "guide.success": "Woohoo, you made it!",
    "guide.halfTime": "Halftime!",
    "guide.oneMinutePassed": "Time flies!!",

    // — Application flow (browser mini-game) —
    "flow.newtab.tab": "New tab",
    "flow.newtab.q": "Where to today?",
    "flow.omni.ph": "Enter an address…",
    "flow.nav.jobs": "Jobs",
    "flow.nav.companies": "Companies",
    "flow.nav.salary": "Salary",
    "flow.nav.profile": "My profile",
    "flow.nav.application": "Application",
    "flow.results.count":
      "1.284 results · sorted by: ??? · <b>your dream job is in here somewhere</b>",
    "flow.card.view": "View →",
    "flow.detail.about": "What it's about",
    "flow.detail.duties": "Your tasks",
    "flow.detail.perks": "What we offer",
    "flow.detail.apply": "Apply now",
    "flow.detail.deadlinePost": " · Deadline 12:00",
    "flow.detail.co": "Future Industries",
    "flow.detail.meta":
      "Cloud Cuckoo Land · hybrid · immediate start · permanent",
    "flow.detail.introPre": "You always dreamed of becoming a “",
    "flow.detail.introPost":
      "”? Then today is your day. We're looking for exactly you – and the clock is ticking. Deadline is twelve sharp.",
    "flow.chip.1": "Full-time",
    "flow.chip.2": "Dream-level",
    "flow.chip.3": "Instant start",
    "flow.chip.4": "Top salary",
    "flow.duty.1": "Get up every day and do what others only dream of",
    "flow.duty.2": "Make the world a little bit better (and more punctual)",
    "flow.duty.3": "Work closely with a very nervous rabbit",
    "flow.perk.1": "Unlimited carrots at your desk",
    "flow.perk.2": "A clock that never strikes twelve (in theory)",
    "flow.perk.3": "Remote, on-site, or in the burrow of your choice",
    "flow.match.co": "Future Industries",
    "flow.match.loc": "Hybrid · Cloud Cuckoo Land",
    "flow.match.pay": "Your worth",
    "flow.match.tags": "Full-time,Dream,Instant",
    "flow.match.titleFallback": "Your dream job",
    "flow.d1.title": "Senior Carrot Sommelier",
    "flow.d1.co": "CrispFresh Ltd.",
    "flow.d1.loc": "Carrotville · On-site",
    "flow.d1.pay": "42k–48k",
    "flow.d1.tags": "Full-time,Veggies",
    "flow.d2.title": "Chief Slowness Officer",
    "flow.d2.co": "Deceleration Inc.",
    "flow.d2.loc": "Remote · eventually",
    "flow.d2.pay": "∞ Patience",
    "flow.d2.tags": "Part-time,Mindful",
    "flow.d3.title": "Sock-Pair Detective (m/f/d)",
    "flow.d3.co": "Laundry24",
    "flow.d3.loc": "Hybrid · Basement",
    "flow.d3.pay": "38k",
    "flow.d3.tags": "Full-time,Mystery",
    "flow.d4.title": "Cloud Shape Officer",
    "flow.d4.co": "Sky & Co.",
    "flow.d4.loc": "Outdoors · Weather-dependent",
    "flow.d4.pay": "Pie in the sky",
    "flow.d4.tags": "Seasonal",
    "flow.d5.title": "Bubble Tea Structural Engineer",
    "flow.d5.co": "BobaBuild",
    "flow.d5.loc": "On-site · Tea kitchen",
    "flow.d5.pay": "44k",
    "flow.d5.tags": "Full-time,Sweet",
    "flow.apply.step": "Cover letter · the Rabbit dictates",
    "flow.apply.h2": "Type your cover letter",
    "flow.apply.forPre": "for ",
    "flow.apply.dicLabel": "Type the text exactly as shown here",
    "flow.apply.placeholder":
      "Start typing here — letter by letter, exactly as dictated…",
    "flow.apply.hintDefault":
      "Mistakes block submission — type cleanly to the period.",
    "flow.apply.hintErrorPre": "✗ Typo at character ",
    "flow.apply.hintErrorPost": " — fix it (Backspace). No typos!",
    "flow.apply.footTodo": "Type the sentence to the end.",
    "flow.apply.footDone": "Cover letter done — on to the CV upload!",
    "flow.apply.cta": "Upload CV",
    "flow.apply.targetPre": "Dear team, I am heart and soul a ",
    "flow.apply.targetPost": " and ready to start right away.",
    "flow.guide.newtabPre": "Quick — type ",
    "flow.guide.newtabPost": " into the bar up top before it strikes twelve!",
    "flow.guide.results":
      "Look for exactly the position you entered — not the carrots.",
    "flow.guide.detail": "That's it! Click “Apply now” — time is running.",
    "flow.guide.applyScreen": "Type the text exactly as shown!",
    "flow.guide.applyPre": "Repeat after me: “",
    "flow.guide.applyPost": "”",
    "flow.guide.shortcutWin":
      "Clever! You know the genuinely good portals — and just won instantly!",
    "flow.ad.banner":
      "🎉 CONGRATULATIONS! You are today’s 1,000,000th visitor! Click HERE for your prize!! 🎁",
    "flow.cookie.title": "🍪 We love your data!",
    "flow.cookie.body":
      "This site uses 1,482 cookies & 73 “partners” to finally show you “relevant” jobs.",
    "flow.cookie.accept": "ACCEPT ALL ✓",
    "flow.cookie.reject": "reject",
    "flow.chat.bubble": "💬 Hi! Can I help you search?",
    "flow.sort.label": "Sort: Random ▾",
    "flow.badge.top": "⭐ Top match",
    "flow.badge.ad": "Ad",
    "flow.d6.title": "Unicorn Wellness Coach",
    "flow.d6.co": "GlitterVibes Ltd.",
    "flow.d6.loc": "Remote · Rainbow",
    "flow.d6.pay": "Magic beans",
    "flow.d6.tags": "Part-time,Magic",
    "flow.d7.title": "Senior Rock Stacker",
    "flow.d7.co": "Balance & Co.",
    "flow.d7.loc": "On-site · Quarry",
    "flow.d7.pay": "37k",
    "flow.d7.tags": "Full-time,Patience",
    "flow.d8.title": "Onion Layer Analyst",
    "flow.d8.co": "TearfulCorp",
    "flow.d8.loc": "Hybrid · Kitchen",
    "flow.d8.pay": "41k",
    "flow.d8.tags": "Full-time,Spicy",
    "flow.d9.title": "Chief Vibes Officer",
    "flow.d9.co": "MoodWorks",
    "flow.d9.loc": "Everywhere · Palpable",
    "flow.d9.pay": "Good vibes",
    "flow.d9.tags": "Full-time,Aura",
    "flow.d10.title": "Fax Nostalgia Consultant",
    "flow.d10.co": "RetroOffice Ltd.",
    "flow.d10.loc": "On-site · 1998",
    "flow.d10.pay": "35k",
    "flow.d10.tags": "Full-time,Retro",
    "flow.d11.title": "Ice Cube Quality Inspector",
    "flow.d11.co": "ColdCold Inc.",
    "flow.d11.loc": "Remote · Freezer",
    "flow.d11.pay": "Stay cool",
    "flow.d11.tags": "Seasonal,Frosty",
    "flow.results.more": "Load more results ▼",
    "flow.news.title": "📧 Never miss your dream job again!",
    "flow.news.body":
      "Sign up for 4× daily job emails. Unsubscribe anytime (somewhere).",
    "flow.news.accept": "YES, SPAM ME ✓",
    "flow.news.reject": "no thanks",
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
