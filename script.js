// Timer functionality
let t0 = 0,
  rafId = null;
const GAME_DURATION = 30; // 30 seconds
let remainingTime = GAME_DURATION;
const now = () => performance.now();

function tick() {
  const elapsed = (now() - t0) / 1000;
  remainingTime = Math.max(0, GAME_DURATION - elapsed);
  timeEl.textContent = remainingTime.toFixed(1);

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
  timeEl.textContent = GAME_DURATION.toFixed(1);
}

function handleTimeUp() {
  // Show time up message
  showMessage(errorMessage, "Zeit abgelaufen! Game Over!");
  // Disable apply button
  applyButton.classList.add("inactive");
}

// elements
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBox = document.querySelector(".nr1_login");
const gameBox = document.querySelector(".nr2_dragdrop");
const cattail = document.querySelector(".cattail");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    loginBtn.click();
  }
});

loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Einfache Validierung (nur Demo-Zwecke)
  if (username && password === "brb_snack") {
    loginBox.style.display = "none";
    gameBox.style.display = "block";
    startTimer();
  } else {
    showMessage(errorMessage, "Falsches Passwort!");
  }
});

// Drag and Drop functionality
const zoneA = document.getElementById("zoneA");
const zoneB = document.getElementById("zoneB");
const zoneBdropable = document.getElementById("zoneBdropable");
const docsA = document.getElementById("docsA");
const docsB = document.getElementById("docsB");
const applyButton = document.querySelector(".applyButton");
const timeEl = document.getElementById("time");
const countBEl = document.getElementById("countB");
const totalEl = document.getElementById("total");
const nr2_dragdropEL = document.getElementById("nr2_dragdrop");
const winBox = document.getElementById("nr3_win");
const finalTimeEl = document.getElementById("finalTime");
const timeTakenEl = document.getElementById("timeTaken");
const timeRemainingEl = document.getElementById("timeRemaining");

let totalDocs = 0;
let won = false;

function makeDoc({ ext, name }) {
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

  return el;
}

applyButton.addEventListener("click", () => {
  if (applyButton.classList.contains("inactive")) {
    return;
  }

  // Calculate time taken and remaining time
  const timeTaken = GAME_DURATION - remainingTime;

  // Show win box
  winBox.style.display = "block";
  timeTakenEl.textContent = timeTaken.toFixed(1);
  timeRemainingEl.textContent = remainingTime.toFixed(1);
  stopTimer();

  // Hide apply button and nr2_dragdrop
  // applyButton.style.display = "none";
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

// Helper function to show messages
function showMessage(element, message) {
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => {
    element.classList.remove("show");
  }, 3000);
}

function checkFileNameAndShowAlert(fileName) {
  // Show spinner for 1.5 seconds to simulate upload
  const spinner = document.createElement("div");
  spinner.className = "upload-spinner";
  zoneBdropable.appendChild(spinner);

  setTimeout(() => {
    spinner.remove();

    if (fileName === "lebenslauf_finalfinal.pdf") {
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
        removeBtn.onclick = () => {
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
  totalDocs = docs.length;
}

function randomDocs() {
  const pool = [
    { ext: "PDF", name: "report.pdf" },
    { ext: "DOC", name: "vertrag.doc" },
    { ext: "XLS", name: "budget.xls" },
    { ext: "PNG", name: "mockup.png" },
    { ext: "TXT", name: "notizen.txt" },
    { ext: "PPT", name: "pitch.ppt" },
  ];
  const n = 3 + Math.floor(Math.random() * 3); // 3–5
  return pool.sort(() => Math.random() - 0.5).slice(0, n);
}

loadGame([
  { ext: "PDF", name: "lebenslauf.pdf" },
  { ext: "PDF", name: "lebenslauf_v2.pdf" },
  { ext: "PDF", name: "lebenslauf_final.pdf" },
  { ext: "PDF", name: "lebenslauf_finalfinal.pdf" },
]);
