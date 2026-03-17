// Timer functionality
let t0 = 0,
  rafId = null;
const now = () => performance.now();

function tick() {
  const elapsed = (now() - t0) / 1000;
  timeEl.textContent = elapsed.toFixed(1);
  rafId = requestAnimationFrame(tick);
}
function startTimer() {
  if (t0) return;
  t0 = now();
  tick();
}
function stopTimer() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}
function resetTimer() {
  stopTimer();
  t0 = 0;
  timeEl.textContent = "0.0";
}

// Login functionality
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBox = document.querySelector(".nr1_login");
const gameBox = document.querySelector(".nr2_dragdrop");

loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Einfache Validierung (nur Demo-Zwecke)
  if (username && password) {
    loginBox.style.display = "none";
    gameBox.style.display = "block";
    startTimer();
  } else {
    alert("Ungültige Anmeldedaten.");
  }
});

// Drag and Drop functionality
const zoneA = document.getElementById("zoneA");
const zoneB = document.getElementById("zoneB");
const zoneBdropable = document.getElementById("zoneBdropable");
const docsA = document.getElementById("docsA");
const docsB = document.getElementById("docsB");

const timeEl = document.getElementById("time");
const countBEl = document.getElementById("countB");
const totalEl = document.getElementById("total");
const nr2_dragdropEL = document.getElementById(".nr2_dragdrop");
const winBox = document.getElementById("winBox");
const finalTimeEl = document.getElementById("finalTime");

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
  });

  return el;
}

function setWon(state) {
  won = state;
  winBox.style.display = won ? "block" : "none";
  zoneB.classList.toggle("ready", won);

  if (won) {
    stopTimer();
    finalTimeEl.textContent = timeEl.textContent;
  } else {
  }
}

function updateCounters() {
  const inB = docsB.querySelectorAll(".doc").length;
  countBEl.textContent = String(inB);
  totalEl.textContent = String(totalDocs);

  setWon(inB === totalDocs && totalDocs > 0);
}

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

    targetDocsContainer.appendChild(el);

    // Check filename and show appropriate alert for Zone B drops
    if (targetDocsContainer === docsB) {
      const fileName = el.querySelector("b").textContent;
      checkFileNameAndShowAlert(fileName);
    }

    updateCounters();
  });
}

wireZoneDrop(zoneA, docsA);
wireZoneDrop(zoneBdropable, docsB);

function checkFileNameAndShowAlert(fileName) {
  if (fileName === "lebenslauf_finalfinal.pdf") {
    alert("Great! This is the final version - ready to submit!");
  } else {
    alert("You uploaded the wrong file!");
  }
}

function loadGame(docs) {
  docsA.innerHTML = "";
  docsB.innerHTML = "";
  winBox.style.display = "none";
  resetTimer();

  docs.forEach((d) => docsA.appendChild(makeDoc(d)));
  totalDocs = docs.length;

  updateCounters();
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

// Finish functionality
const finishButton = document.getElementById("finishButton");
const finishedBox = document.querySelector(".finished");

finishButton.addEventListener("click", () => {
  finishedBox.style.display = "none";
  winBox.style.display = "block";
});
