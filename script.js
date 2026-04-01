// Timer functionality
let t0 = 0,
  rafId = null;
const GAME_DURATION = 300; // 5 minutes
let remainingTime = GAME_DURATION;
const now = () => performance.now();

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(ms).padStart(2, "0")}`;
}

function tick() {
  const elapsed = (now() - t0) / 1000;
  remainingTime = Math.max(0, GAME_DURATION - elapsed);
  timeEl.textContent = formatTime(remainingTime);

  const clock = timeEl.closest(".clock");
  if (remainingTime <= 30) {
    clock.classList.remove("warning");
    clock.classList.add("urgent");
  } else if (remainingTime <= 60) {
    clock.classList.remove("urgent");
    clock.classList.add("warning");
  }

  if (remainingTime <= 0) {
    stopTimer();
    // Time's up - show game over
    handleTimeUp();
  } else {
    rafId = requestAnimationFrame(tick);
  }
}

function startTimer() {
  if (t0) return;
  t0 = now();
  remainingTime = GAME_DURATION;
  tick();
}

function stopTimer() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function resetTimer() {
  stopTimer();
  t0 = 0;
  remainingTime = GAME_DURATION;
  timeEl.textContent = formatTime(GAME_DURATION);
}

function handleTimeUp() {
  // Show time up message
  showMessage(errorMessage, "Zeit abgelaufen! Game Over!");
  // Disable apply button
  applyButton.classList.add("inactive");
}

// elements
const startBtn = document.getElementById("startBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const introScreen = document.querySelector(".introScreen");
const introVideoBox = document.querySelector(".introVideoBox");
const introVideo = document.getElementById("introVideo");
const loginBox = document.querySelector(".nr1_login");
const gameBox = document.querySelector(".nr2_dragdrop");
const cattail = document.querySelector(".cattail");
const postit = document.querySelector(".postit");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const timer = document.querySelector(".clock");

startBtn.addEventListener("click", () => {
  introScreen.style.display = "none";
  introVideoBox.style.display = "flex";
  introVideo.play();
});

introVideo.addEventListener("ended", () => {
  introVideoBox.style.display = "none";
  loginBox.style.display = "flex";
  cattail.style.display = "flex";
  postit.style.display = "flex";
  timer.style.display = "flex";
  // delay start of timer for 1 second
  setTimeout(() => {
    startTimer();
  }, 1000);
});

// listen to when video ends

// when enter is hit in password input, click login button
passwordInput.onkeydown = (e) => {
  if (e.key === "Enter") {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Einfache Validierung (nur Demo-Zwecke)
    if (username && password === "brb_snack") {
      hideAllMessages();
      loginBox.style.display = "none";
      gameBox.style.display = "block";
    } else {
      showMessage(errorMessage, "Falsches Passwort!");
    }
  }
};

const zoneA = document.getElementById("zoneA");
const docsA = document.getElementById("docsA");
const applyButton = document.querySelector(".applyButton");
const timeEl = document.getElementById("time");
const nr2_dragdropEL = document.getElementById("nr2_dragdrop");
const winBox = document.getElementById("nr3_win");
const timeTakenEl = document.getElementById("timeTaken");
const timeRemainingEl = document.getElementById("timeRemaining");
const filePreview = document.getElementById("filePreview");
const previewTitle = document.getElementById("previewTitle");
const previewBody = document.getElementById("previewBody");
const previewClose = document.getElementById("previewClose");
const previewSave = document.getElementById("previewSave");

function openPreview(name, content) {
  previewTitle.textContent = name;
  previewBody.innerHTML = content;
  previewSave.style.display = "none";
  filePreview.classList.add("open");
}

function closePreview() {
  filePreview.classList.remove("open");
  previewBody.innerHTML = "";
}

previewClose.addEventListener("click", closePreview);
previewSave.addEventListener("click", closePreview);
filePreview.addEventListener("click", (e) => {
  if (e.target === filePreview) closePreview();
});
previewBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("typo")) {
    e.target.textContent = "Bewerbung";
    e.target.classList.remove("typo");
    previewSave.style.display = "block";
  }
});

function makeDoc({ ext, name, content = "" }) {
  const el = document.createElement("div");
  el.className = "doc";

  el.innerHTML = `
    <div class="icon">${ext}</div>
    <div><b>${name}</b></div>
  `;

  el.addEventListener("click", () => {
    openPreview(name, content);
  });

  return el;
}

applyButton.addEventListener("click", () => {
  if (applyButton.classList.contains("inactive")) {
    return;
  }

  // Calculate time taken and remaining time
  const timeTaken = GAME_DURATION - remainingTime;

  hideAllMessages();
  // Show win box
  winBox.style.display = "block";
  timeTakenEl.textContent = timeTaken.toFixed(1);
  timeRemainingEl.textContent = remainingTime.toFixed(1);
  stopTimer();

  nr2_dragdropEL.style.display = "none";
});

cattail.addEventListener("click", () => {
  cattail.style.display = "none";
});

let activeMessageTimer = null;
let activeMessageEl = null;

function showMessage(element, message) {
  if (activeMessageEl) {
    clearTimeout(activeMessageTimer);
    activeMessageEl.classList.remove("show");
  }
  element.textContent = message;
  element.classList.add("show");
  activeMessageEl = element;
  activeMessageTimer = setTimeout(() => {
    element.classList.remove("show");
    activeMessageEl = null;
  }, 3000);
}

function hideAllMessages() {
  clearTimeout(activeMessageTimer);
  if (activeMessageEl) activeMessageEl.classList.remove("show");
  activeMessageEl = null;
}

function loadGame(docs) {
  docsA.innerHTML = "";
  resetTimer();

  docs.forEach((d) => docsA.appendChild(makeDoc(d)));
}

const DOCS = [
  {
    ext: "PDF",
    name: "lebenslauf_alt.pdf",
    content: `
      <p><strong>Max Mustermann</strong><br>
      Software Developer · max.mustermann@email.at</p>
      <hr>
      <p><strong>Berufserfahrung</strong><br>
      DST GmbH — Junior Developer (2021–2023)<br>
      Freelance — Web Dev (2020–2021)</p>
      <hr>
      <p><strong>Ausbildung</strong><br>
      HTL Wien — Informatik (2015–2020)</p>
      <hr>
      <p><em>Sprachen: Deutsch, Englisch</em></p>
    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_neu.pdf",
    content: `
      <p><strong>Max Mustermann</strong> [FOTO EINFÜGEN]<br>
      Software Developer · max.mustermann@email.at</p>
      <hr>
      <p><strong>Berufserfahrung</strong><br>
      DST GmbH — Junior Developer (2021–2024)<br>
      Freelance — Web Dev (2020–2021)</p>
      <hr>
      <p><strong>Fähigkeiten</strong><br>
      JavaScript, CSS, React, Node.js</p>
      <hr>
      <p><strong>Ausbildung</strong><br>
      HTL Wien — Informatik (2015–2020)</p>
      <hr>
      <p><strong>Referenzen</strong><br>
      [Referenz folgt]</p>
    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_final.pdf",
    content: `
      <p><strong>Max Mustermann</strong><br>
      Software Developer · max.mustermann@email.at</p>
      <hr>
      <p><strong>Berufserfahrung</strong><br>
      DST GmbH — Developer (TODO: Datum prüfen)<br>
      Freelance — Web Dev (2020–2021)</p>
      <hr>
      <p><strong>Fähigkeiten</strong><br>
      JavaScript, CSS, React, Node.js, TypeScript</p>
      <hr>
      <p><strong>Ausbildung</strong><br>
      HTL Wien — Informatik (2015–2020)</p>
    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_finalfinal.pdf",
    content: `
      <p><strong>Max Mustermann</strong><br>
      Software Developer · max.mustermann@email.at · +43 699 9876543</p>
      <hr>
      <p><strong>Berufserfahrung</strong><br>
      DST GmbH — Developer (2021–2024)<br>
      Freelance — Web Dev (2020–2021)</p>
      <hr>
      <p><strong>Fähigkeiten</strong><br>
      JavaScript, CSS, React, Node.js, TypeScript, Git</p>
      <hr>
      <p><strong>Ausbildung</strong><br>
      HTL Wien — Informatik (2015–2020)</p>
      <hr>
      <p>Diese <span class="typo">Bewrbung</span> wurde sorgfältig vorbereitet.</p>
    `,
  },
  {
    ext: "DOCX",
    name: "motivationsschreiben.docx",
    content: `
      <p><strong>Motivationsschreiben</strong><br>
      Max Mustermann · max.mustermann@email.at</p>
      <hr>
      <p>Sehr geehrte Damen und Herren,</p>
      <p>hiermit bewerbe ich mich auf die ausgeschriebene Stelle als Software Developer bei Ihrem Unternehmen.</p>
      <p>Mit meiner mehrjährigen Erfahrung in der Webentwicklung bin ich überzeugt, einen wertvollen Beitrag leisten zu können.</p>
      <p>Mit freundlichen Grüßen,<br>Max Mustermann</p>
    `,
  },
  {
    ext: "PDF",
    name: "zeugnisse_scan.pdf",
    content: `
      <p><strong>Zeugnisse — Scan</strong></p>
      <hr>
      <p>HTL Wien — Abschlusszeugnis 2020<br>
      Gesamtnote: Gut</p>
      <hr>
      <p>Praktikumszeugnis DST GmbH 2019<br>
      „Max hat hervorragende Leistungen erbracht."</p>
    `,
  },
  {
    ext: "PDF",
    name: "portfolio.pdf",
    content: `
      <p><strong>Portfolio — Max Mustermann</strong></p>
      <hr>
      <p><strong>Projekt 1:</strong> E-Commerce-Plattform (React, Node.js)<br>
      <strong>Projekt 2:</strong> Interne HR-App (Vue, PostgreSQL)<br>
      <strong>Projekt 3:</strong> CLI-Tool für Datenmigration (Python)</p>
      <hr>
      <p><em>Weitere Projekte auf GitHub verfügbar.</em></p>
    `,
  },
  {
    ext: "PDF",
    name: "referenzschreiben_dstgmbh.pdf",
    content: `
      <p><strong>Referenzschreiben</strong><br>
      DST GmbH · Wien</p>
      <hr>
      <p>Herr Mustermann war von 2021 bis 2024 in unserem Unternehmen tätig und hat in dieser Zeit stets zuverlässige und qualitativ hochwertige Arbeit geleistet.</p>
      <p>Wir empfehlen ihn uneingeschränkt weiter.</p>
      <p><em>— HR-Abteilung, DST GmbH</em></p>
    `,
  },
  {
    ext: "PNG",
    name: "foto_bewerbung.png",
    content: `<p><em>[Bewerbungsfoto — Vorschau nicht verfügbar]</em></p>`,
  },
  {
    ext: "XLSX",
    name: "gehaltsvorstellung.xlsx",
    content: `
      <p><strong>Gehaltsvorstellung</strong></p>
      <hr>
      <p>Brutto/Jahr: € 58.000<br>
      Verhandelbar: Ja<br>
      Startdatum: 01.06.2024</p>
    `,
  },
  {
    ext: "TXT",
    name: "notizen_interview.txt",
    content: `
      <p><strong>Notizen — Vorstellungsgespräch</strong></p>
      <hr>
      <p>- Fragen zu Teamstruktur stellen<br>
      - Remote-Policy erfragen<br>
      - Stack: TypeScript? Microservices?<br>
      - Onboarding-Prozess?<br>
      - TODO: Referenzen nochmal prüfen!!</p>
    `,
  },
];

loadGame(DOCS);
