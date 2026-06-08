// ─── Game Settings ───────────────────────────────────────────────
const GAME_SETTINGS = {
  gameDuration: 300, // seconds (5 minutes)
  correctPassword: "brb_snack",
  punishmentAmount: 15, // seconds subtracted per wrong action
  correctFile: "lebenslauf_finalfinal.pdf",
};

const CAPTCHA_CATEGORIES = [
  {
    instruction: "Wähle alle Bilder mit einem 🚌 Bus",
    target: "🚌",
    decoys: ["🚗", "✈️", "🚲", "🛵", "🚕", "🚂", "🛳️", "🚁"],
  },
  {
    instruction: "Wähle alle Bilder mit einem 💼 Koffer",
    target: "💼",
    decoys: ["👜", "🎒", "🛍️", "👝", "🧳", "📦", "🗃️", "📁"],
  },
  {
    instruction: "Wähle alle Bilder mit einem ☕ Kaffee",
    target: "☕",
    decoys: ["🍵", "🧃", "🥤", "🍺", "🧋", "🍷", "🥛", "🫖"],
  },
  {
    instruction: "Wähle alle Bilder mit einem 🖨️ Drucker",
    target: "🖨️",
    decoys: ["💻", "🖥️", "⌨️", "🖱️", "📠", "📺", "📷", "🔋"],
  },
  {
    instruction: "Wähle alle Bilder mit einer 📎 Büroklammer",
    target: "📎",
    decoys: ["✏️", "📌", "🖊️", "📏", "✂️", "🗂️", "📋", "🔖"],
  },
];

let captchaCurrentCategory = null;
let captchaCorrectIndices = new Set();
let captchaSelectedCounts = new Map(); // emoji → how many of that emoji are selected

// Timer functionality
let t0 = 0,
  rafId = null;
let remainingTime = GAME_SETTINGS.gameDuration;
let penaltySeconds = 0;
let cameraStream = null;
let photoAdded = false;
let typoFixed = false;
let applyPhaseActive = false;
let applyJumpCount = 0;
const now = () => performance.now();

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(ms).padStart(2, "0")}`;
}

function tick() {
  const elapsed = (now() - t0) / 1000;
  remainingTime = Math.max(
    0,
    GAME_SETTINGS.gameDuration - elapsed - penaltySeconds,
  );
  timeEl.textContent = formatTime(remainingTime);

  const pct = remainingTime / GAME_SETTINGS.gameDuration;
  if (timebarFill) timebarFill.style.width = (pct * 100).toFixed(2) + "%";

  const clock = timeEl.closest(".clock");
  if (remainingTime <= 30) {
    if (!clock.classList.contains("urgent")) {
      showGuide("OH NO, we're almost out of time!!", 5000);
    }
    clock.classList.remove("warning");
    clock.classList.add("urgent");
    document.documentElement.style.setProperty("--tj-urgency", "1");
  } else if (remainingTime <= 60) {
    if (
      !clock.classList.contains("warning") &&
      !clock.classList.contains("urgent")
    ) {
      showGuide("Hurry up!", 4000);
    }
    clock.classList.remove("urgent");
    clock.classList.add("warning");
    document.documentElement.style.setProperty("--tj-urgency", "0.4");
  } else {
    document.documentElement.style.setProperty("--tj-urgency", "0");
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
  remainingTime = GAME_SETTINGS.gameDuration;
  tick();
}

function stopTimer() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function resetTimer() {
  stopTimer();
  t0 = 0;
  penaltySeconds = 0;
  remainingTime = GAME_SETTINGS.gameDuration;
  timeEl.textContent = formatTime(GAME_SETTINGS.gameDuration);
}

function handleTimeUp() {
  deactivateApplyPhase();
  closeCaptcha();
  showGuide("Zeit abgelaufen! Game Over!", 0);
  applyButton.classList.add("inactive");
}

function getRandomApplyPosition() {
  const rect = applyButton.getBoundingClientRect();
  const w = rect.width || 160;
  const h = rect.height || 45;
  const x = Math.random() * (window.innerWidth - w);
  const y = Math.random() * (window.innerHeight - h);
  return { x, y };
}

function jumpApplyButton() {
  applyJumpCount++;
  applyButton.classList.remove("apply-shake");
  const { x, y } = getRandomApplyPosition();
  applyButton.style.left = x + "px";
  applyButton.style.top = y + "px";
  applyButton.style.bottom = "auto";
  applyButton.style.transform = "none";
  applyButton.classList.add("apply-shake");

  if (applyJumpCount >= 5) {
    applyButton.removeEventListener("mouseenter", jumpApplyButton);
    void applyButton.offsetWidth;
  }
}

function handleDocumentClick(e) {
  if (!applyPhaseActive) return;
  if (applyButton.contains(e.target)) return;
  applyPunishment();
}

function activateApplyPhase() {
  applyPhaseActive = true;
  applyJumpCount = 0;
  const w = 160;
  const h = 45;
  applyButton.style.left = window.innerWidth / 2 - w / 2 + "px";
  applyButton.style.top = window.innerHeight / 2 - h / 2 + "px";
  applyButton.style.bottom = "auto";
  applyButton.style.transform = "none";
  applyButton.addEventListener("mouseenter", jumpApplyButton);
  document.addEventListener("click", handleDocumentClick, true);
}

function deactivateApplyPhase() {
  applyPhaseActive = false;
  applyButton.style.display = "none";
  document.removeEventListener("click", handleDocumentClick, true);
}

function applyPunishment() {
  const label = document.getElementById("punishmentLabel");
  const amount = GAME_SETTINGS.punishmentAmount;

  label.textContent = `-${amount}s`;
  label.classList.remove("animate");
  void label.offsetWidth; // force reflow to restart animation
  label.classList.add("animate");

  setTimeout(() => {
    penaltySeconds += amount;
  }, 800); // matches animation duration
}

// ─── CAPTCHA ──────────────────────────────────────────────────────

const captchaScreen = document.getElementById("captchaScreen");
const captchaGrid = document.getElementById("captchaGrid");
const captchaInstruct = document.getElementById("captchaInstruction");
const captchaError = document.getElementById("captchaError");
const captchaConfirm = document.getElementById("captchaConfirm");

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildCaptchaGrid() {
  const cat = captchaCurrentCategory;
  const decoyPool = shuffleArray([...cat.decoys]).slice(0, 5);
  const tiles = [cat.target, cat.target, cat.target, cat.target, ...decoyPool];
  shuffleArray(tiles);

  captchaCorrectIndices.clear();
  captchaGrid.innerHTML = "";

  // Track remaining slots to restore per emoji
  const remaining = new Map(captchaSelectedCounts);

  tiles.forEach((emoji, idx) => {
    if (emoji === cat.target) captchaCorrectIndices.add(idx);

    const tile = document.createElement("div");
    tile.className = "captcha-tile";
    tile.textContent = emoji;
    tile.dataset.index = idx;

    // Restore selected state for this emoji if any were selected before
    if ((remaining.get(emoji) || 0) > 0) {
      tile.classList.add("selected");
      remaining.set(emoji, remaining.get(emoji) - 1);
    }

    tile.addEventListener("click", () => {
      const count = captchaSelectedCounts.get(emoji) || 0;
      if (tile.classList.contains("selected")) {
        captchaSelectedCounts.set(emoji, count - 1);
      } else {
        captchaSelectedCounts.set(emoji, count + 1);
      }
      buildCaptchaGrid(); // reshuffle on every click
    });

    captchaGrid.appendChild(tile);
  });
}

function openCaptcha() {
  captchaCurrentCategory =
    CAPTCHA_CATEGORIES[Math.floor(Math.random() * CAPTCHA_CATEGORIES.length)];
  captchaInstruct.textContent = captchaCurrentCategory.instruction;
  captchaError.textContent = "";
  captchaSelectedCounts = new Map();
  buildCaptchaGrid();
  captchaScreen.style.display = "flex";
  showGuide("Are you sure you're not a robot?", 3000);
}

function closeCaptcha() {
  captchaScreen.style.display = "none";
  captchaGrid.innerHTML = "";
  captchaError.textContent = "";
}

captchaConfirm.addEventListener("click", () => {
  const selectedIndices = new Set(
    [...captchaGrid.querySelectorAll(".captcha-tile.selected")].map((el) =>
      parseInt(el.dataset.index),
    ),
  );

  const allCorrectSelected = [...captchaCorrectIndices].every((i) =>
    selectedIndices.has(i),
  );
  const noWrongSelected = [...selectedIndices].every((i) =>
    captchaCorrectIndices.has(i),
  );

  if (allCorrectSelected && noWrongSelected && selectedIndices.size > 0) {
    closeCaptcha();
    showWinScreen();
  } else {
    applyPunishment();
    captchaError.textContent = "Falsche Auswahl! Bitte erneut versuchen.";
    captchaGrid.classList.remove("shake");
    void captchaGrid.offsetWidth;
    captchaGrid.classList.add("shake");
    setTimeout(() => {
      captchaGrid.classList.remove("shake");
    }, 500);
    setTimeout(() => {
      captchaError.textContent = "";
      captchaSelectedCounts = new Map();
      buildCaptchaGrid();
    }, 2500);
  }
});

// ─── Camera ──────────────────────────────────────────────────────

async function openCamera() {
  cameraScreen.style.display = "flex";
  showGuide("Smile!", 2000);
  videoEl.style.display = "block";
  photoEl.style.display = "none";
  captureBtn.style.display = "block";
  retakeBtn.style.display = "none";
  savePhotoBtn.style.display = "none";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = cameraStream;
  } catch {
    showGuide("Kamera nicht verfügbar!", 4000);
    cameraScreen.style.display = "none";
  }
}

function capturePhoto() {
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0);

  // Green terminal filter: grayscale → green channel only
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = 0;
    d[i + 1] = Math.min(255, gray * 1.2);
    d[i + 2] = 0;
  }
  ctx.putImageData(imageData, 0, 0);

  photoEl.src = canvas.toDataURL("image/png");
  videoEl.style.display = "none";
  photoEl.style.display = "block";
  captureBtn.style.display = "none";
  retakeBtn.style.display = "block";
  savePhotoBtn.style.display = "block";
}

function retakePhoto() {
  videoEl.style.display = "block";
  photoEl.style.display = "none";
  captureBtn.style.display = "block";
  retakeBtn.style.display = "none";
  savePhotoBtn.style.display = "none";
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  cameraScreen.style.display = "none";
}

function savePhoto() {
  stopCamera();
  const missingImageEl = previewBody.querySelector(".missing-image");
  if (missingImageEl) {
    missingImageEl.innerHTML = `<img src="${photoEl.src}" class="cv-photo" />`;
  }
  photoAdded = true;
}

// elements
const startBtn = document.getElementById("startBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const introScreen = document.querySelector(".introScreen");
const introVideoBox = document.querySelector(".introVideoBox");
const introVideo = document.getElementById("introVideo");
const loginBox = document.querySelector(".nr1_login");
const gameBox = document.querySelector(".screen_2");
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

// for testing purposes - click video to skip intro - change eventlistener to ended for production
introVideo.addEventListener("click", () => {
  gameScreen();
});

introVideo.addEventListener("ended", () => {
  gameScreen();
});

function gameScreen() {
  introVideoBox.style.display = "none";
  introVideo.pause();
  loginBox.style.display = "flex";
  cattail.style.display = "flex";
  postit.style.display = "flex";
  timer.style.display = "flex";
  showGuide("Quick, let's put in the password!", 4000);
  // delay start of timer for 1 second
  setTimeout(() => {
    startTimer();
  }, 1000);
}

// listen to when video ends

// when enter is hit in password input, click login button
passwordInput.onkeydown = (e) => {
  if (e.key === "Enter") {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Einfache Validierung (nur Demo-Zwecke)
    if (username && password === GAME_SETTINGS.correctPassword) {
      hideAllMessages();
      loginBox.style.display = "none";
      gameBox.style.display = "block";
      showGuide(
        "Oh no, do you remember how you named the final version of your application?",
        3000,
      );
    } else {
      showGuide("Wrong Password! Can you maybe find a hint somewhere?", 3000);
      applyPunishment();
    }
  }
};

const file_explorer = document.getElementById("file_explorer");
const docsA = document.getElementById("docsA");
const applyButton = document.querySelector(".applyButton");
const timeEl = document.getElementById("time");
const screen_2EL = document.getElementById("screen_2");
const winBox = document.getElementById("nr3_win");
const timeTakenEl = document.getElementById("timeTaken");
const timeRemainingEl = document.getElementById("timeRemaining");
const filePreview = document.getElementById("filePreview");
const previewTitle = document.getElementById("previewTitle");
const previewBody = document.getElementById("previewBody");
const previewClose = document.getElementById("previewClose");
const previewSave = document.getElementById("previewSave");
const cameraScreen = document.querySelector(".nr4_camerascreen");
const videoEl = document.getElementById("video");
const canvas = document.getElementById("canvas");
const photoEl = document.getElementById("photo");
const captureBtn = document.getElementById("capture-btn");
const retakeBtn = document.getElementById("retake-btn");
const savePhotoBtn = document.getElementById("save-photo-btn");
const cameraCloseBtn = document.getElementById("camera-close-btn");
const taskHeadline = document.getElementById("taskHeadline");
const guideDialog = document.getElementById("guideDialog");
const guideText = document.getElementById("guideText");
const timebarFill = document.getElementById("timebarFill");

let guideTimer = null;

function hideGuide() {
  clearTimeout(guideTimer);
  guideDialog.classList.add("guide-dialog--hiding");
  guideDialog.addEventListener(
    "animationend",
    () => {
      guideDialog.style.display = "none";
      guideDialog.classList.remove("guide-dialog--hiding");
    },
    { once: true },
  );
}

function showGuide(text, autohideMs = 0) {
  clearTimeout(guideTimer);
  guideText.textContent = text;
  guideDialog.classList.remove("guide-dialog--hiding");
  guideDialog.style.display = "none";
  void guideDialog.offsetWidth;
  guideDialog.style.display = "flex";
  if (autohideMs > 0) {
    guideTimer = setTimeout(hideGuide, autohideMs);
  }
}

function openPreview(name, content) {
  previewTitle.textContent = name;
  previewBody.innerHTML = content;
  filePreview.classList.add("open");
  if (name !== GAME_SETTINGS.correctFile) {
    previewSave.style.display = "none";
    applyPunishment();
    showGuide("That's the wrong file!", 2000);
  } else {
    photoAdded = false;
    typoFixed = false;
    previewSave.style.display = "block";
    showGuide("Nice, let's add an image and check for typos", 4000);
    const missingImage = previewBody.querySelector(".missing-image");
    if (missingImage) {
      missingImage.addEventListener("click", openCamera);
    }
  }
}

function closePreview() {
  filePreview.classList.remove("open");
  previewBody.innerHTML = "";
  hideAllMessages();
}

previewClose.addEventListener("click", closePreview);
previewSave.addEventListener("click", () => {
  if (!photoAdded) {
    showGuide("You're missing the image!", 3000);
    applyPunishment();
    return;
  }
  if (!typoFixed) {
    showGuide("Seems like there is still a typo somewhere!", 3000);
    applyPunishment();
    return;
  }
  closePreview();
  applyButton.style.display = "block";
  activateApplyPhase();
  // change headline
  file_explorer.style.display = "none";
  taskHeadline.textContent = "Schicke deine Bewerbung ab!";
  showGuide("Great! Now submit your application! Hurry up!", 4000);
});

filePreview.addEventListener("click", (e) => {
  if (e.target === filePreview) closePreview();
});
previewBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("typo")) {
    e.target.textContent = "Bewerbung";
    e.target.classList.remove("typo");
    typoFixed = true;
  }
});

captureBtn.addEventListener("click", capturePhoto);
retakeBtn.addEventListener("click", retakePhoto);
savePhotoBtn.addEventListener("click", savePhoto);
cameraCloseBtn.addEventListener("click", stopCamera);

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

function showWinScreen() {
  const timeTaken = GAME_SETTINGS.gameDuration - remainingTime;
  hideAllMessages();
  winBox.style.display = "block";
  const takenMinutes = Math.floor(timeTaken / 60);
  const takenSeconds = Math.floor(timeTaken % 60);
  timeTakenEl.textContent = `${takenMinutes}:${takenSeconds.toString().padStart(2, "0")}`;
  const minutes = Math.floor(remainingTime / 60);
  const seconds = Math.floor(remainingTime % 60);
  timeRemainingEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  stopTimer();
  screen_2EL.style.display = "none";
}

applyButton.addEventListener("click", () => {
  if (applyButton.classList.contains("inactive")) return;
  deactivateApplyPhase();
  openCaptcha();
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
     <div class="cv-game">
      <div class="content">
        <main class="left">
          <h1>Jessie James · Software Developer</h1>
          <h2>jessie.james@meowth.at</h2>

          <p class="tagline">
            Creative Software Developer with a trainer mindset: curious,
            strategic, team-focused, and always ready to evolve. I build clean
            interfaces, playful digital experiences, and reliable web
            applications that feel fast, useful, and memorable.
          </p>

          <div class="meta">
            <span class="pill">Region: Vienna / Remote</span>
            <span class="pill">Portfolio: jessiejames.dev</span>
            <span class="pill">GitHub: github.com/jessiejames</span>
            <span class="pill">LinkedIn: /in/jessie-james</span>
          </div>

          <hr />

          <section>
            <p>
              <strong>Trainer Profile</strong><br />
              I approach every project like a new route: scout the challenge,
              choose the right tools, level up the solution, and support the
              team until the final release. My strengths are structured
              thinking, visual polish, debugging stamina, and a love for
              interactive, game-inspired user experiences.
            </p>
          </section>

          <hr />

          <section>
            <p>
              <strong>Mission Statement</strong><br />
              To create digital products that are as intuitive as a
              well-designed game menu and as reliable as a trusted battle
              partner. I combine technical structure with strong visual identity
              so every interface feels useful, energetic, and fun.
            </p>
          </section>

          <hr />

          <section>
            <strong>Experience</strong><br /><br />

            <div class="timeline-item">
              <b>DST GmbH — Junior Developer</b><br />
              <span>2021–2023 · Main Quest</span><br />
              Developed and maintained web interfaces, supported smaller backend
              features, fixed bugs, tested releases, and coordinated with design
              and project management teams.
            </div>

            <div class="timeline-item">
              <b>Freelance — Web Developer</b><br />
              <span>2020–2021 · Side Quest Chain</span><br />
              Created landing pages, portfolio websites, and small CMS solutions
              for local clients, with a focus on responsive layouts and clear
              content structure.
            </div>
          </section>

          <hr />

          <section>
            <strong>Education</strong><br /><br />

            <div class="timeline-item">
              <b>HTL Paldea — Computer Science</b><br />
              <span>2015–2020 · Training Academy</span><br />
              Focus on software development, databases, networking, web
              development, project work, and technical documentation.
            </div>
          </section>

          <hr />

          <section>
            <strong>Projects</strong><br /><br />

            <div class="timeline-item">
              <b>Creature Index Web App</b><br />
              React, REST API integration, responsive UI, search, filter logic,
              card layouts, and collection-style browsing.
            </div>

            <div class="timeline-item">
              <b>Portfolio Quest</b><br />
              Gamified portfolio with HTML, CSS, JavaScript, micro-animations,
              quest sections, badges, and achievement-style progress feedback.
            </div>

            <div class="timeline-item">
              <b>Application Portal</b><br />
              PHP, MySQL, login system, application overview, admin dashboard,
              and structured candidate data management.
            </div>

            <div class="timeline-item">
              <b>Battle UI Prototype</b><br />
              Experimental interface inspired by turn-based game screens,
              including action buttons, animated status bars, and responsive
              card components.
            </div>
          </section>

          <hr />

          <section>
            <p>
              <strong>Certificates</strong><br />
              JavaScript Algorithms — freeCodeCamp<br />
              Scrum Basics — 2023<br />
              UX Fundamentals — 2022<br />
              Responsive Web Design — 2021
            </p>
          </section>

          <hr />

          <section>
            <p>
              <strong>Awards</strong><br />
              Best UI Concept — HTL Project Week<br />
              Hackathon Finalist — Code & Coffee Vienna<br />
              Internal Recognition — Bug Hunter of the Month
            </p>
          </section>

          <hr />

          <section>
            <p>
              <strong>Volunteer Work</strong><br />
              Coding mentor for beginners<br />
              Support for local open-source meetups<br />
              Website maintenance for a small community project
            </p>
          </section>

          <hr />

          <section>
            <p>
              <strong>Languages</strong><br />
              German — Native<br />
              English — Very good<br />
              Japanese — Basics
            </p>
          </section>

          <hr />

          <section>
            <p>
              <strong>Interests</strong><br />
              Game design, UI animation, retro tech, open source, pixel art,
              creative coding, indie games, creature collecting games, strategy
              systems, and playful onboarding flows.
            </p>
          </section>
        </main>

        <aside class="right">
          <div class="applypic"></div>

          <div class="sidebox">
            <h2>Trainer Class</h2>
            <div class="stat-grid">
              <div class="stat">
                <b>LVL 23</b>
                Frontend Trainer
              </div>
              <div class="stat">
                <b>XP 8,420</b>
                Next Evolution: 9,000
              </div>
              <div class="stat">
                <b>Region</b>
                Web Dev League
              </div>
              <div class="stat">
                <b>Role</b>
                UI Tactician
              </div>
            </div>
          </div>

          <div class="sidebox">
            <h2>Type Match</h2>
            <div class="type-row">
              <span class="type electric">Electric UI</span>
              <span class="type psychic">Psychic Logic</span>
              <span class="type water">Fluid Layouts</span>
              <span class="type steel">Robust Code</span>
            </div>
          </div>

          <div class="sidebox">
            <h2>Move Set</h2>

            <div class="skill">
              <span><b>HTML/CSS</b><b>95%</b></span>
              <div class="bar"><div style="width: 95%"></div></div>
              <small>Move: Pixel Beam · Accuracy 95</small>
            </div>

            <div class="skill">
              <span><b>JavaScript</b><b>82%</b></span>
              <div class="bar"><div style="width: 82%"></div></div>
              <small>Move: Logic Spark · Accuracy 82</small>
            </div>

            <div class="skill">
              <span><b>React</b><b>72%</b></span>
              <div class="bar"><div style="width: 72%"></div></div>
              <small>Move: Component Call · Accuracy 72</small>
            </div>

            <div class="skill">
              <span><b>PHP/MySQL</b><b>65%</b></span>
              <div class="bar"><div style="width: 65%"></div></div>
              <small>Move: Data Dig · Accuracy 65</small>
            </div>

            <div class="skill">
              <span><b>UX/UI Design</b><b>78%</b></span>
              <div class="bar"><div style="width: 78%"></div></div>
              <small>Move: Interface Charm · Accuracy 78</small>
            </div>
          </div>

          <div class="sidebox">
            <h2>Support Stats</h2>

            <div class="skill">
              <span><b>Teamwork</b><b>90%</b></span>
              <div class="bar"><div style="width: 90%"></div></div>
              <small>Double Battle synergy unlocked</small>
            </div>

            <div class="skill">
              <span><b>Problem Solving</b><b>88%</b></span>
              <div class="bar"><div style="width: 88%"></div></div>
              <small>Critical-hit thinking buff</small>
            </div>

            <div class="skill">
              <span><b>Communication</b><b>84%</b></span>
              <div class="bar"><div style="width: 84%"></div></div>
              <small>Trainer-to-team clarity boost</small>
            </div>
          </div>

          <div class="sidebox">
            <h2>Inventory</h2>
            <div class="tools">
              <span class="tool">VS Code</span>
              <span class="tool">Git</span>
              <span class="tool">Figma</span>
              <span class="tool">Docker</span>
              <span class="tool">Node.js</span>
              <span class="tool">WordPress</span>
              <span class="tool">MySQL</span>
              <span class="tool">Jira</span>
            </div>
          </div>

          <div class="sidebox">
            <h2>Badges</h2>
            <ul class="badges">
              <li>Thunder Badge — Fast Learner</li>
              <li>Pixel Badge — Pixel Perfect</li>
              <li>Bug Badge — Bug Hunter</li>
              <li>Union Badge — Team Player</li>
              <li>Refactor Badge — Clean Code Crafter</li>
              <li>Sprint Badge — Deadline Sprinter</li>
            </ul>
          </div>

          <div class="sidebox">
            <h2>Quest Log</h2>
            <ul class="questlog">
              <li>Main Quest: Build useful, beautiful web apps</li>
              <li>Side Quest: Improve accessibility in every project</li>
              <li>Daily Quest: Learn one new development move</li>
              <li>Gym Challenge: Ship polished, responsive interfaces</li>
              <li>Boss Fight: Refactor legacy code without fear</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_neu.pdf",
    content: `
    <div class="lebenslauf">  <p><strong>Max Mustermann</strong> [FOTO EINFÜGEN]<br>
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
      [Referenz folgt]</p></div>
    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_final.pdf",
    content: `
      <div class="lebenslauf">  <p><strong>Max Mustermann</strong><br>
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
      HTL Wien — Informatik (2015–2020)</p> </div>
    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_finalfinal.pdf",
    content: `
    <div class="missing-image">
    <img src="https://dummyimage.com/100/00ff48/ff0000.png&text=Image+not+Found" />
    </div>
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
