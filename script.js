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

const CORRECT_FILE = "lebenslauf_finalfinal.pdf";

// elements
const startBtn = document.getElementById("startBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const introScreen = document.querySelector(".introScreen");
const loginBox = document.querySelector(".nr1_login");
const gameBox = document.querySelector(".nr2_dragdrop");
const cattail = document.querySelector(".cattail");
const postit = document.querySelector(".postit");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

startBtn.addEventListener("click", () => {
  introScreen.style.display = "none";
  loginBox.style.display = "flex";
  cattail.style.display = "block";
  postit.style.display = "block";
  startTimer();
});

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

// Drag and Drop functionality
const zoneA = document.getElementById("zoneA");
const zoneB = document.getElementById("zoneB");
const zoneBdropable = document.getElementById("zoneBdropable");
const docsA = document.getElementById("docsA");
const docsB = document.getElementById("docsB");
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
  el.draggable = true;
  el.id = "doc-" + Math.random().toString(16).slice(2);

  el.innerHTML = `
    <div class="icon">${ext}</div>
    <div><b>${name}</b></div>
  `;

  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", el.id);
    e.dataTransfer.effectAllowed = "move";

    // Check if the file is currently in zone B
    const isInZoneB = docsB.contains(el);
    if (isInZoneB) {
      // Prevent dragging from zone B
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // Add click event to open preview but only if not in zone B
  el.addEventListener("click", (e) => {
    if (!docsB.contains(el)) {
      openPreview(name, content);
    }
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

// Wichtig: dragover + drop direkt auf die ZONEN, nicht nur auf den inneren Container.
function wireZoneDrop(zoneEl, targetDocsContainer) {
  zoneEl.addEventListener("dragover", (e) => {
    e.preventDefault(); // erlaubt drop
    e.dataTransfer.dropEffect = "move";
  });

  zoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const el = document.getElementById(id);
    if (!el) return;

    // Only allow one file in Zone B drop area
    if (targetDocsContainer === docsB && docsB.querySelector(".doc")) {
      return; // Prevent dropping if there's already a file
    }

    // If dropping into zone B, create a copy instead of moving
    if (targetDocsContainer === docsB) {
      const originalDoc = el;
      const fileName = originalDoc.querySelector("b").textContent;
      const fileExt = originalDoc.querySelector(".icon").textContent;

      // Create a new copy of the document
      const copy = makeDoc({ ext: fileExt, name: fileName });
      targetDocsContainer.appendChild(copy);

      // Check filename and show appropriate alert for Zone B drops
      checkFileNameAndShowAlert(fileName);
    } else {
      // For zone A, use the original move behavior
      targetDocsContainer.appendChild(el);
    }
  });
}

wireZoneDrop(zoneA, docsA);
wireZoneDrop(zoneBdropable, docsB);

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

function checkFileNameAndShowAlert(fileName) {
  // Show spinner for 1.5 seconds to simulate upload
  const spinner = document.createElement("div");
  spinner.className = "upload-spinner";
  zoneBdropable.appendChild(spinner);

  setTimeout(() => {
    spinner.remove();

    if (fileName === CORRECT_FILE && remainingTime > 0) {
      showMessage(successMessage, "Upload erfolgreich!");
      applyButton.classList.remove("inactive");
    } else {
      showMessage(errorMessage, "Falsche Datei!");

      // Add error styling and remove button to the uploaded file
      const uploadedFile = docsB.querySelector(".doc");
      if (uploadedFile) {
        uploadedFile.classList.add("upload-error");

        // Add remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "×";
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          uploadedFile.remove();
        };
        uploadedFile.appendChild(removeBtn);
      }
    }
  }, 1500);
}

function loadGame(docs) {
  docsA.innerHTML = "";
  docsB.innerHTML = "";
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
];

loadGame(DOCS);
