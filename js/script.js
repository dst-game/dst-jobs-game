// ─── Game Settings ───────────────────────────────────────────────
const GAME_SETTINGS = {
  gameDuration: 300, // seconds (5 minutes)
  correctPassword: "brb_snack",
  punishmentAmount: 15, // seconds subtracted per wrong action
  correctFile: "lebenslauf_finalfinal.pdf",
};

const CAPTCHA_CATEGORIES = [
  {
    instructionKey: "captcha.bus",
    target: "🚌",
    decoys: ["🚗", "✈️", "🚲", "🛵", "🚕", "🚂", "🛳️", "🚁"],
  },
  {
    instructionKey: "captcha.briefcase",
    target: "💼",
    decoys: ["👜", "🎒", "🛍️", "👝", "🧳", "📦", "🗃️", "📁"],
  },
  {
    instructionKey: "captcha.coffee",
    target: "☕",
    decoys: ["🍵", "🧃", "🥤", "🍺", "🧋", "🍷", "🥛", "🫖"],
  },
  {
    instructionKey: "captcha.printer",
    target: "🖨️",
    decoys: ["💻", "🖥️", "⌨️", "🖱️", "📠", "📺", "📷", "🔋"],
  },
  {
    instructionKey: "captcha.paperclip",
    target: "📎",
    decoys: ["✏️", "📌", "🖊️", "📏", "✂️", "🗂️", "📋", "🔖"],
  },
];

let gameWon = false;
let gameOver = false;

let captchaCurrentCategory = null;
let captchaCorrectIndices = new Set();
let captchaSelectedCounts = new Map(); // emoji → how many of that emoji are selected

// Timer functionality
let t0 = 0,
  rafId = null;
let lastTick = 0; // performance.now() of the previous frame
let effectiveElapsed = 0; // accumulated game-seconds (delta * SPEED each frame)
let remainingTime = GAME_SETTINGS.gameDuration;
let penaltySeconds = 0;
let SPEED = 1; // seconds per real second
let speedBoosted = false; // true once SPEED has been raised
let clockCritical = false; // digital critical (final 30s)
let halfTimePassed = false; // half-time guide message
let lastMinute = false; // analog red alarm outline (final 60s)
let cameraStream = null;
let photoAdded = false;
let typoFixed = false;
let applyPhaseActive = false;
let applyJumpCount = 0;
let momIgnored = false;
let momReplied = false;
let momAngryIndex = -1; // index into MOM_ANGRY_MSGS, -1 = not started
let momTypewriterTimer = null;
let momCallHandled = false; // true after call accepted — suppresses later SMS messages
const MOM_ANGRY_MSGS = ["mom.msg2", "mom.msg3", "mom.msg4"];
const now = () => performance.now();

const pad2 = (n) => String(n).padStart(2, "0");

function tick() {
  const nowMs = now();
  effectiveElapsed += ((nowMs - lastTick) / 1000) * SPEED;
  lastTick = nowMs;
  remainingTime = Math.max(
    0,
    GAME_SETTINGS.gameDuration - effectiveElapsed - penaltySeconds,
  );

  const pct = remainingTime / GAME_SETTINGS.gameDuration;
  if (timebarFill) timebarFill.style.width = (pct * 100).toFixed(2) + "%";

  // Drive the clock (analog hands + digital local time) from 11:55 → 12:00.
  const frac = Math.min(1, Math.max(0, 1 - pct));
  updateDeskClock(frac);

  // Urgency glow, scoped to the desk so the whole stage reacts.
  if (gameDesk) {
    gameDesk.style.setProperty("--tj-urgency", Math.pow(frac, 1.5).toFixed(3));
  }

  // after one minute — speed up and show guide once
  if (remainingTime <= 240 && !speedBoosted) {
    speedBoosted = true;
    SPEED = 2;
    showGuide(t("guide.oneMinutePassed"), 4000);
    const slowBtn = document.getElementById("slowBtn");
    if (slowBtn) slowBtn.style.display = "inline-flex";
  }

  // after half time
  if (remainingTime <= 150 && !halfTimePassed) {
    halfTimePassed = true;
    showGuide(t("guide.halfTime"), 4000);
  }

  // Last minute → analog clock outline turns to the red alarm state.
  if (remainingTime <= 60 && !lastMinute) {
    lastMinute = true;
    if (gameAnalog) gameAnalog.setAttribute("data-critical", "");
    showGuide(t("guide.hurryUp"), 4000);
  }
  // Final 30s → digital clock also goes critical + stronger warning.
  if (remainingTime <= 30 && !clockCritical) {
    clockCritical = true;
    if (gameDigital) gameDigital.setAttribute("data-critical", "");
    showGuide(t("guide.almostOutOfTime"), 5000);
  }

  if (remainingTime <= 0) {
    stopTimer();
    // Time's up - show game over
    handleTimeUp();
  } else {
    rafId = requestAnimationFrame(tick);
  }
}

// ─── Desk clock helpers ──────────────────────────────────────────
function buildAnalogTicks() {
  if (!gameAnalog) return;
  const firstHand = gameAnalog.querySelector(".hand");
  for (let i = 0; i < 60; i++) {
    const tk = document.createElement("div");
    tk.className = "tick" + (i % 5 === 0 ? " major" : "");
    tk.style.transform = "rotate(" + i * 6 + "deg)";
    gameAnalog.insertBefore(tk, firstHand);
  }
}

// frac: 0 at game start (11:55:00) → 1 at game end (12:00:00).
// Drives the analog hands AND the digital local-time readout (#time).
function updateDeskClock(frac) {
  const clockSec = 11 * 3600 + 55 * 60 + frac * (5 * 60);
  const dispH = Math.floor(clockSec / 3600); // 11 → 12
  const m = Math.floor(clockSec / 60) % 60;
  const s = Math.floor(clockSec % 60);
  if (timeEl) {
    timeEl.textContent = pad2(dispH) + ":" + pad2(m) + ":" + pad2(s);
  }
  if (clkH) {
    const h = dispH % 12;
    clkH.style.transform = "rotate(" + (h + m / 60) * 30 + "deg)";
    clkM.style.transform = "rotate(" + m * 6 + "deg)";
    clkS.style.transform = "rotate(" + s * 6 + "deg)";
  }
}

function clearClockCritical() {
  if (gameAnalog) gameAnalog.removeAttribute("data-critical");
  if (gameDigital) gameDigital.removeAttribute("data-critical");
}

// Mark a guide objective step as completed.
function markStep(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("done");
}

function startTimer() {
  if (t0) return;
  t0 = now();
  lastTick = t0;
  effectiveElapsed = 0;
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
  lastTick = 0;
  effectiveElapsed = 0;
  penaltySeconds = 0;
  speedBoosted = false;
  clockCritical = false;
  halfTimePassed = false;
  lastMinute = false;
  SPEED = 1;
  const slowBtn = document.getElementById("slowBtn");
  if (slowBtn) slowBtn.style.display = "none";
  remainingTime = GAME_SETTINGS.gameDuration;
  clearClockCritical();
  updateDeskClock(0);
  if (timebarFill) timebarFill.style.width = "100%";
  if (gameDesk) gameDesk.style.setProperty("--tj-urgency", "0");
}

function handleTimeUp(reason) {
  gameOver = true;
  deactivateApplyPhase();
  closeCaptcha();
  stopTimer();
  if (reason === "discard") {
    showGuide(t("guide.discardedFiles"), 0);
  } else {
    showGuide(t("guide.timeUp"), 0);
  }
  applyButton.classList.add("inactive");
  showGameOverScreen(reason);
}

function getRandomApplyPosition() {
  const rect = applyButton.getBoundingClientRect();
  const w = rect.width || 160;
  const h = rect.height || 45;
  const x = Math.random() * (window.innerWidth - w);
  const y = Math.random() * (window.innerHeight - h);
  return { x, y };
}

let discardTimer = null;

function enterDiscardState() {
  // No more jumping — button stays at current position
  applyButton.classList.remove("tj-btn--primary");
  applyButton.classList.add("tj-btn--danger");
  applyButton.querySelector("p").textContent = t("apply.discard");

  discardTimer = setTimeout(() => {
    // Time expired without click — go to final state
    exitDiscardState();
  }, 3000);
}

function exitDiscardState() {
  clearTimeout(discardTimer);
  discardTimer = null;
  applyButton.classList.remove("tj-btn--danger");
  applyButton.classList.add("apply-shake");
  applyButton.classList.add("tj-btn--primary");
  applyButton.querySelector("p").textContent = t("apply.button");
  // Button is now in its final resting state — ready to click normally
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

  if (applyJumpCount >= 4) {
    // Remove mouseenter so no more jumps happen
    applyButton.removeEventListener("mouseenter", jumpApplyButton);
    void applyButton.offsetWidth;
    // On the 4th (second-to-last) jump, show the discard button
    if (applyJumpCount === 4) {
      enterDiscardState();
    }
  }
}

function handleDocumentClick(e) {
  if (!applyPhaseActive) return;
  if (applyButton.contains(e.target)) return;
  if (discardModal && discardModal.contains(e.target)) return;
  if (discardModal2 && discardModal2.contains(e.target)) return;
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
  // trigger only if not game over or won
  if (gameOver || gameWon) return;
  const label = document.getElementById("punishmentLabel");
  const amount = GAME_SETTINGS.punishmentAmount;

  flashMistake();
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
const robotCheckBox = document.getElementById("robotCheckBox");
const robotCheckRow = document.getElementById("captchaRobotRow");
let robotChecked = false;

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
  captchaInstruct.textContent = t(captchaCurrentCategory.instructionKey);
  captchaError.textContent = "";
  captchaSelectedCounts = new Map();
  robotChecked = false;
  robotCheckBox.classList.remove("checked");
  buildCaptchaGrid();
  captchaScreen.style.display = "flex";
  showGuide(t("guide.notRobot"), 3000);

  if (momIgnored && !momReplied) {
    momAngryIndex = 0;
    showMomToast(MOM_ANGRY_MSGS[0]);
  }
}

function closeCaptcha() {
  captchaScreen.style.display = "none";
  captchaGrid.innerHTML = "";
  captchaError.textContent = "";
}

robotCheckRow.addEventListener("click", () => {
  robotChecked = !robotChecked;
  robotCheckBox.classList.toggle("checked", robotChecked);
});

captchaConfirm.addEventListener("click", () => {
  if (robotChecked) {
    applyPunishment();
    captchaError.textContent = t("captcha.roboterError");
    captchaGrid.classList.remove("shake");
    void captchaGrid.offsetWidth;
    captchaGrid.classList.add("shake");
    setTimeout(() => captchaGrid.classList.remove("shake"), 500);
    setTimeout(() => {
      captchaError.textContent = "";
      robotChecked = false;
      robotCheckBox.classList.remove("checked");
    }, 2500);
    return;
  }

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
    captchaError.textContent = t("captcha.wrong");
    captchaGrid.classList.remove("shake");
    void captchaGrid.offsetWidth;
    captchaGrid.classList.add("shake");
    setTimeout(() => {
      captchaGrid.classList.remove("shake");
      captchaSelectedCounts = new Map();
      buildCaptchaGrid();
    }, 600);
    setTimeout(() => {
      captchaError.textContent = "";
    }, 2000);
  }
});

// ─── Camera ──────────────────────────────────────────────────────

async function openCamera() {
  cameraScreen.style.display = "flex";
  showGuide(t("guide.smile"), 2000);
  videoEl.style.display = "block";
  photoEl.style.display = "none";
  captureBtn.style.display = "block";
  retakeBtn.style.display = "none";
  savePhotoBtn.style.display = "none";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = cameraStream;
  } catch {
    showGuide(t("guide.cameraUnavailable"), 4000);
    cameraScreen.style.display = "none";
  }
}

function capturePhoto() {
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0);

  //CHANGE

  // Green terminal filter: grayscale → green channel only
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = (d[i] + d[i + 1] + d[i + 2]) / 3 / 255; // 0..1

    d[i] = Math.min(255, 0 + gray * 255);
    d[i + 1] = 50;
    d[i + 2] = Math.min(255, 180 + gray * (170 - 180));
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
  checkAndShowMomToast();
}

function checkAndShowMomToast() {
  if (momCallHandled) return;
  if (photoAdded && typoFixed) {
    showMomToast("mom.msg1");
  }
}

function showMomCall() {
  const callOverlay = document.getElementById("momCallOverlay");
  if (!callOverlay) return;
  callOverlay.style.display = "flex";
}
window.showMomCall = showMomCall;

function showMomMistakeToast() {
  const overlay = document.getElementById("momOverlay");
  const msgEl = document.getElementById("momMsg");
  const replyArea = document.getElementById("momReplyArea");
  const replyBtn = document.getElementById("momReplyBtn");
  const ignoreBtn = document.getElementById("momIgnoreBtn");
  if (!overlay) return;

  replyBtn.style.display = "none";
  ignoreBtn.style.display = "none";
  replyArea.innerHTML = "";

  clearInterval(momTypewriterTimer);
  msgEl.textContent = "";
  const typed = document.createTextNode("");
  msgEl.appendChild(typed);
  const full = t("mom.call.mistake");
  let i = 0;
  momTypewriterTimer = setInterval(() => {
    typed.textContent = full.slice(0, ++i);
    if (i >= full.length) {
      clearInterval(momTypewriterTimer);
      setTimeout(() => {
        overlay.style.display = "none";
      }, 2500);
    }
  }, 72);

  overlay.style.display = "flex";
}

function showMomToast(msgKey) {
  const overlay = document.getElementById("momOverlay");
  const msgEl = document.getElementById("momMsg");
  const replyArea = document.getElementById("momReplyArea");
  const replyBtn = document.getElementById("momReplyBtn");
  const ignoreBtn = document.getElementById("momIgnoreBtn");
  if (!overlay) return;

  // Reset reply area — restore buttons (may have been replaced by sent-text) and hide until typing finishes
  replyArea.innerHTML = "";
  replyArea.appendChild(replyBtn);
  replyArea.appendChild(ignoreBtn);
  replyBtn.style.display = "";
  ignoreBtn.style.display = "";
  replyBtn.style.visibility = "hidden";
  ignoreBtn.style.visibility = "hidden";

  // Typewriter for the message text
  clearInterval(momTypewriterTimer);
  msgEl.textContent = "";
  const typed = document.createTextNode("");
  msgEl.appendChild(typed);
  const full = t(msgKey);
  let i = 0;
  momTypewriterTimer = setInterval(() => {
    typed.textContent = full.slice(0, ++i);
    if (i >= full.length) {
      clearInterval(momTypewriterTimer);
      replyBtn.style.visibility = "";
      ignoreBtn.style.visibility = "";
    }
  }, 90);

  overlay.style.display = "flex";
}

// elements
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const introScreen = document.querySelector(".introScreen");
const introVideoBox = document.querySelector(".introVideoBox");
const introVideo = document.getElementById("introVideo");
const loginBox = document.querySelector(".nr1_login");
const gameBox = document.querySelector(".screen_2");
const cattail = document.querySelector(".cattail");
const postit = document.querySelector(".postit");
const timer = document.querySelector(".clock-card");

startBtn.addEventListener("click", () => {
  introScreen.style.display = "none";
  introVideoBox.style.display = "flex";
  introVideo.play();
});

restartBtn.addEventListener("click", () => {
  location.reload();
});

document.getElementById("slowBtn").addEventListener("click", () => {
  SPEED = 1;
  const slowBtn = document.getElementById("slowBtn");
  slowBtn.style.display = "none";
  showGuide("🐢 Geschwindigkeit zurück auf normal!", 3000);
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
  showGuide(t("guide.password"), 4000);
  startTimer();
}

// listen to when video ends

// when enter is hit in password input, click login button
passwordInput.onkeydown = (e) => {
  if (e.key === "Enter") {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Einfache Validierung (nur Demo-Zwecke)
    if (username && password === GAME_SETTINGS.correctPassword) {
      loginBox.style.display = "none";
      markStep("objStep1");
      // After unlocking, run the Bewerbungs-Flow (browser mini-game).
      // Its CV-upload step hands back to showFileExplorer().
      if (typeof window.startBewerbungsFlow === "function") {
        window.startBewerbungsFlow();
      } else {
        showFileExplorer();
      }
    } else {
      showGuide(t("guide.wrongPassword"), 3000);
      applyPunishment();
    }
  }
};

// Shown after the Bewerbungs-Flow's "CV hochladen" step: the existing
// file-explorer task where the player finds the right Lebenslauf.
function showFileExplorer() {
  loginBox.style.display = "none";
  gameBox.style.display = "block";
  showGuide(t("guide.rememberFile"), 3000);
  setTimeout(showMomCall, 350);
}

const file_explorer = document.getElementById("file_explorer");
const docsA = document.getElementById("docsA");
const applyButton = document.querySelector(".applyButton");
const timeEl = document.getElementById("time");
const screen_2EL = document.getElementById("screen_2");
const winBox = document.getElementById("nr3_win");
const gameOverBox = document.getElementById("nr4_gameover");
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
const guideText = document.getElementById("guideText");
const guideCard = document.querySelector(".tj-desk .guide-card");
const guidePortraitImg = document.querySelector(".tj-desk .portrait img");
const guideIdleSrc = "images/idle.png";
const guideExplainSrc = "images/idle2explain.gif";
const guideDisappointedSrc = "images/disappointed.gif";
const guideVictorySrc = "images/victory.gif";
let guidePortraitTimer = null;
const timebarFill = document.getElementById("timebarFill");
// Desk stage clock elements
const gameDesk = document.getElementById("gameDesk");
const gameAnalog = document.getElementById("gameAnalog");
const gameDigital = document.getElementById("gameDigital");
const clkH = document.getElementById("clkH");
const clkM = document.getElementById("clkM");
const clkS = document.getElementById("clkS");

let typewriterTimer = null;

// The rabbit's speech bubble lives permanently in the left rail; showGuide
// types the new line out character-by-character with a blinking caret.
function showGuide(text) {
  if (!guideText) return;
  if (guidePortraitImg && !gameWon && !gameOver) {
    clearTimeout(guidePortraitTimer);
    guidePortraitImg.src = guideIdleSrc;
    guidePortraitImg.src = guideExplainSrc + "?t=" + Date.now();
    guidePortraitTimer = setTimeout(() => {
      guidePortraitImg.src = guideIdleSrc;
    }, 4500);
  }
  clearInterval(typewriterTimer);
  const full = String(text);
  guideText.textContent = "";
  const typed = document.createTextNode("");
  const caret = document.createElement("span");
  caret.className = "caret";
  caret.textContent = "▍";
  guideText.append(typed, caret);
  let i = 0;
  typewriterTimer = setInterval(() => {
    typed.textContent = full.slice(0, ++i);
    if (i >= full.length) clearInterval(typewriterTimer);
  }, 32);
}

// Flash the guide (Begleiter) card AND the digital clock red on a mistake.
let mistakeTimer = null;
function flashMistake() {
  if (guideCard) {
    guideCard.classList.remove("mistake");
    void guideCard.offsetWidth; // restart the animation
    guideCard.classList.add("mistake");
  }
  if (gameDigital) gameDigital.classList.add("mistake");
  clearTimeout(mistakeTimer);
  mistakeTimer = setTimeout(() => {
    if (guideCard) guideCard.classList.remove("mistake");
    if (gameDigital) gameDigital.classList.remove("mistake");
  }, 1200);
}

function openPreview(name, content) {
  previewTitle.textContent = name;
  previewBody.innerHTML = content;
  filePreview.classList.add("open");
  if (name !== GAME_SETTINGS.correctFile) {
    previewSave.style.display = "none";
    applyPunishment();
    showGuide(t("guide.wrongFile"), 2000);
  } else {
    const traumjob = getTraumjob();
    if (traumjob) {
      const headline = document.getElementById("dreamjobjob");
      headline.textContent = traumjob;
    }
    photoAdded = false;
    typoFixed = false;
    previewSave.style.display = "block";
    showGuide(t("guide.addImageTypo"), 4000);
    const missingImage = previewBody.querySelector(".missing-image");
    if (missingImage) {
      missingImage.addEventListener("click", openCamera);
    }
  }
}

function closePreview() {
  filePreview.classList.remove("open");
  previewBody.innerHTML = "";
}

previewClose.addEventListener("click", closePreview);
previewSave.addEventListener("click", () => {
  if (!photoAdded) {
    showGuide(t("guide.missingImage"), 3000);
    applyPunishment();
    return;
  }
  if (!typoFixed) {
    showGuide(t("guide.typoLeft"), 3000);
    applyPunishment();
    return;
  }
  closePreview();
  applyButton.style.display = "block";
  activateApplyPhase();
  markStep("objStep5");
  // change headline (revealed only now, for the submit phase)
  file_explorer.style.display = "none";
  taskHeadline.textContent = t("task.submit");
  taskHeadline.style.display = "";
  showGuide(t("guide.submitNow"), 4000);
});

filePreview.addEventListener("click", (e) => {
  if (e.target === filePreview) closePreview();
});
previewBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("typo")) {
    e.target.textContent = "Bewerbung";
    e.target.classList.remove("typo");
    typoFixed = true;
    checkAndShowMomToast();
  }
});

captureBtn.addEventListener("click", capturePhoto);
retakeBtn.addEventListener("click", retakePhoto);
savePhotoBtn.addEventListener("click", savePhoto);
cameraCloseBtn.addEventListener("click", stopCamera);

// ─── Mom Call handlers ───────────────────────────────────────────
document.getElementById("momCallAcceptBtn").addEventListener("click", () => {
  document.getElementById("momCallOverlay").style.display = "none";
  momCallHandled = true;
  momReplied = true;
  showMomMistakeToast();
});

document.getElementById("momCallHangupBtn").addEventListener("click", () => {
  document.getElementById("momCallOverlay").style.display = "none";
});

// ─── Mom SMS handlers ────────────────────────────────────────────
document.getElementById("momIgnoreBtn").addEventListener("click", () => {
  document.getElementById("momOverlay").style.display = "none";
  if (momReplied) return;
  momIgnored = true;
  // Chain to next angry message immediately if there is one
  if (momAngryIndex >= 0 && momAngryIndex < MOM_ANGRY_MSGS.length - 1) {
    momAngryIndex++;
    showMomToast(MOM_ANGRY_MSGS[momAngryIndex]);
  }
});

document.getElementById("momReplyBtn").addEventListener("click", () => {
  momReplied = true;
  momIgnored = false;
  momAngryIndex = -1;

  const replyArea = document.getElementById("momReplyArea");
  const replyBtn = document.getElementById("momReplyBtn");
  const ignoreBtn = document.getElementById("momIgnoreBtn");
  replyBtn.style.display = "none";
  ignoreBtn.style.display = "none";

  const sentEl = document.createElement("div");
  sentEl.className = "mom-reply-sent";
  const typed = document.createTextNode("");
  const caret = document.createElement("span");
  caret.className = "caret";
  caret.textContent = "▍";
  sentEl.append(typed, caret);
  replyArea.appendChild(sentEl);

  const full = t("mom.sent");
  let i = 0;
  const timer = setInterval(() => {
    typed.textContent = full.slice(0, ++i);
    if (i >= full.length) {
      clearInterval(timer);
      caret.remove();
      setTimeout(() => {
        document.getElementById("momOverlay").style.display = "none";
      }, 1500);
    }
  }, 55);
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

function showWinScreen(shortcut) {
  gameWon = true;
  if (guidePortraitImg) {
    clearTimeout(guidePortraitTimer);
    guidePortraitImg.src = guideVictorySrc;
  }
  _lbRemainingAtWin = remainingTime;
  markStep("objStep6");
  winBox.style.display = "block";

  const headingEl = document.getElementById("winHeading");
  const normalEl = document.getElementById("winNormal");
  const shortcutEl = document.getElementById("winShortcut");

  if (shortcut) {
    // Won by typing a genuinely good portal — no application, just a victory lap.
    if (headingEl) headingEl.textContent = t("win.shortcut.heading");
    if (normalEl) normalEl.style.display = "none";
    if (shortcutEl) shortcutEl.style.display = "";
  } else {
    if (headingEl) headingEl.textContent = t("win.heading");
    if (normalEl) normalEl.style.display = "";
    if (shortcutEl) shortcutEl.style.display = "none";
    const timeTaken = GAME_SETTINGS.gameDuration - remainingTime;
    const takenMinutes = Math.floor(timeTaken / 60);
    const takenSeconds = Math.floor(timeTaken % 60);
    timeTakenEl.textContent = `${takenMinutes}:${takenSeconds.toString().padStart(2, "0")}`;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = Math.floor(remainingTime % 60);
    timeRemainingEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    showGuide(t("guide.success"), 0);
  }

  stopTimer();
  screen_2EL.style.display = "none";

  // Wire up jobs.derstandard.at as a real link using the player's Traumjob
  const dstUrl = `https://jobs.derstandard.at/suche/oesterreich/${encodeURIComponent(getTraumjob())}`;
  document.querySelectorAll("#nr3_win b").forEach((el) => {
    if (el.textContent.trim() === "jobs.derstandard.at") {
      const a = document.createElement("a");
      a.href = dstUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = el.textContent;
      a.className = "dst-win-link";
      el.replaceWith(a);
    }
  });
}

function showGameOverScreen(reason) {
  if (guidePortraitImg) {
    clearTimeout(guidePortraitTimer);
    guidePortraitImg.src = guideDisappointedSrc;
  }
  const headingEl = document.getElementById("gameOverHeading");
  const bodyEl = document.getElementById("gameOverBody");
  if (reason === "discard") {
    headingEl.textContent = t("gameover.discard.heading");
    bodyEl.textContent = t("gameover.discard.body");
  } else {
    headingEl.textContent = t("gameover.heading");
    bodyEl.textContent = t("gameover.body");
  }
  screen_2EL.style.display = "none";
  filePreview.style.display = "none";
  gameOverBox.style.display = "block";
}

const discardModal = document.getElementById("discardModal");
const discardYesBtn = document.getElementById("discardYesBtn");
const discardNoBtn = document.getElementById("discardNoBtn");
const discardModal2 = document.getElementById("discardModal2");
const discard2YesBtn = document.getElementById("discard2YesBtn");
const discard2NoBtn = document.getElementById("discard2NoBtn");

applyButton.addEventListener("click", () => {
  if (applyButton.classList.contains("inactive")) return;
  if (applyButton.classList.contains("tj-btn--danger")) {
    // Penultimate state — show discard confirmation
    clearTimeout(discardTimer);
    discardModal.style.display = "flex";
    return;
  }
  deactivateApplyPhase();
  openCaptcha();
});

discardYesBtn.addEventListener("click", () => {
  discardModal.style.display = "none";
  handleTimeUp("discard");
});

discardNoBtn.addEventListener("click", () => {
  discardModal.style.display = "none";
  discardModal2.style.display = "flex";
});

discard2YesBtn.addEventListener("click", () => {
  discardModal2.style.display = "none";
  exitDiscardState();
});

discard2NoBtn.addEventListener("click", () => {
  discardModal2.style.display = "none";
  handleTimeUp("discard");
});

cattail.addEventListener("click", () => {
  cattail.style.display = "none";
});

function loadGame(docs) {
  docsA.innerHTML = "";
  resetTimer();

  docs.forEach((d) => docsA.appendChild(makeDoc(d)));
}

function getTraumjob() {
  try {
    return localStorage.getItem("tj_traumjob") || "";
  } catch (e) {
    return "";
  }
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
  
<div id="lebenslauf-graphic">
  <div class="wordart">THOMAS CRUISE</div>

  <div class="marquee">
    ★ AVAILABLE FOR GRAPHIC DESIGN ★ 
  </div>

  <div class="hero">
    <img
      src="https://hypership.uk/uploads/20260616082732_00_graphic.png"
      alt="Thomas Cruise Lebenslauf"
    />

    <div class="intro">
      <strong>Thomas Cruise</strong><br />
      Senior Graphic Wizard™<br />
      📧 graphic_impossible@scientology.com<br />
      🌐 myspace.com/thomascruise2007<br /><br />

      <span class="blink"> ★ Winner of "Best ClipArt Placement 2009" ★ </span>
    </div>
   
  </div>

  <div class="section">
    <h2>Berufserfahrung</h2>

      <p>***</p>
    <p>
      <strong>Lead WordArt Engineer</strong><br />
      Microsoft FrontPage Fanclub (2014–heute)
    </p>

    <p>
      <strong>Freelance JPEG Compressor</strong><br />
      Diverse Foren-Signaturen & Counter-Strike-Clans (2008–2014)
    </p>

    <p>
      <strong>Intern bei Paint</strong><br />
      MS Paint Ultimate Edition (2006–2008)
    </p>
      <p>***</p>
  </div>

  <div class="section">
    <h2>Fähigkeiten</h2>

      <p>***</p>
    <ul>
      <li>PowerPoint Übergänge auf Maximum</li>
      <li>WordArt (Expert Level)</li>

      <li>ClipArt-Montage</li>

      <li>MySpace Profil Optimierung</li>
      <li>HTML Tabellen Layouts ohne CSS</li>
    </ul>
      <p>***</p>
  </div>

  <div class="section">
    <h2>Software Kenntnisse</h2>

      <p>***</p>
    <ul>
      <li>Microsoft Word 2003 ★★★★★</li>
      <li>Paint ★★★★★</li>
      <li>Internet Explorer ★★★★★</li>
      <li>Winamp Skins ★★★★★</li>
      <li>Photoshop CS2 (Testversion) ★★★☆☆</li>
    </ul>
      <p>  <p>***</p></p>
  </div>

  <div class="section">
    <h2>Referenzen</h2>
   <p>***</p>
    <p>
      „Bitte hör auf Designs zu machen.“<br />
      — ehemaliger Kunde
    </p>

    <p>
      „Das ist technisch gesehen eine Webseite.“<br />
      — unabhängiger Gutachter
    </p>
    <p>***</p>
  </div>

  <div class="footer">
    Optimiert für Internet Explorer 6 • 1024×768 empfohlen • Best viewed with
    17" Röhrenmonitor
  </div>
</div>

    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_final.pdf",
    content: `
<div id="lebenslauf-maus">
  <div class="kopf">
    <img
      src="https://hypership.uk/uploads/20260616085123_00_gustaver.jpg"
      alt="Mausiger Lebenslauf"
    />

    <div>
      <h1>Gustav Mäuschen</h1>
      <div class="claim">„Morgenstund hat Kaffee im Mund.“ ☕🐭</div>
      <div class="kontakt">
        Motivierte Teilzeit-Maus · schabernack@mausmail.at<br />
        Bereit, heute meine vollen 50% zu geben.
      </div>
    </div>
  </div>

  <div class="bereich">
    <h2>Profil</h2>
    <p>
      Ich bin just a Maus who needs money für Schabernack. Sehr süß, sehr
      bemüht, sehr sonnenscheinmäßig unterwegs. Ich bringe gute Laune, kleine
      Pfötchen und eine überraschend starke Motivation für halbwegs wichtige
      Aufgaben mit.
    </p>
  </div>

  <div class="bereich">
    <h2>Fähigkeiten</h2>
    <ul>
      <li>Käsebasierte Problemlösung</li>
      <li>50% Einsatz mit 100% Cute-Faktor</li>
      <li>Kaffee trinken und dabei wichtig schauen</li>

      <li>Schabernack planen</li>

      <li>Sehr kleine, aber ernst gemeinte Excel-Tabellen</li>
      <li>Motiviert nicken in Meetings</li>
    </ul>

    <div class="badgebox">
      <span class="badge">cute</span>
      <span class="badge">mausig</span>
      <span class="badge">pastell</span>
      <span class="badge">kaffee</span>
      <span class="badge">schabernack-ready</span>
    </div>
  </div>

  <div class="bereich">
    <h2>Ausbildung</h2>
    <p>
      <strong>Akademie für kleine Dinge mit großer Wirkung</strong><br />
      Diplom in Mausmanagement & Snack Logistics
    </p>
  </div>
  <div class="bereich">
    <h2>Referenzen</h2>
    <p>
      „Kommt vielleicht zu spät, aber dafür sehr lieb.“<br />
      — ehemaliger Käsegeber
    </p>
  </div>
  <div class="bereich">
    <h2>Berufserfahrung</h2>
    <p>
      <strong>Junior Schabernack Consultant</strong><br />
      Käse & Chaos GmbH · 2022–heute
    </p>
    <p>
      <strong>Assistant to the Regional Sonnenstrahl</strong><br />
      Maus Office Collective · 2020–2022
    </p>
  </div>

  <div class="footer">
    🐭 verfügbar ab sofort · bevorzugt nach Kaffee · bezahlt gerne in Geld oder
    Käse 🧀
  </div>
</div>

  
    `,
  },
  {
    ext: "PDF",
    name: "lebenslauf_finalfinal.pdf",
    content: `
  <div id="lebenslauf-correct">
  <div class="content">
    <main class="left">
      <div class="missing-image">
        <img
          src="images/nopfp.png"
        />
      </div>
      <hr />
      <p><strong class="cvname">Patricia Patternwoman</strong></p>
      <p id="dreamjobjob"></p>
      <hr />
      <p>
        <strong>Profil</strong><br />
        Erfahrung in kompetitiven Multiplayer- und
        Story-Spielen. Bekannt für strategisches Denken, Ausdauer bei
        schwierigen Challenges und die Fähigkeit, komplexe Systeme schnell zu
        verstehen. Motiviert durch Fortschritt, Teamplay und das Freischalten
        neuer Achievements.
      </p>
      <hr />
      <p>
        <strong>Spielerfahrung</strong><br />
        Open World Enthusiast (2020–heute)<br />
        Koop-Strategin (2018–heute)<br />
        Achievement Hunter (2016–heute)
      </p>
      <hr />
      <p>
        <strong>Gaming Highlights</strong></p>
      <ul>
  <li>
    Clair Obscur: Expedition 33 — mehrere anspruchsvolle Bosskämpfe erfolgreich gemeistert.
  </li>
  <li>
    Assassin's Creed Shadows — zahlreiche Gebiete vollständig erkundet und Nebenmissionen abgeschlossen.
  </li>
  <li>
    Baldur's Gate 3 — verschiedene Story-Pfade und Builds getestet.
  </li>
  <li>
    Fortnite — regelmäßige Top-Platzierungen in saisonalen Events.
  </li>
  <li>
    Minecraft — umfangreiche Survival- und Kreativprojekte umgesetzt.
  </li>
</ul>
      
      <hr />
      <p>
        <strong>Skills</strong><br />
        Strategie · Teamplay · Ressourcenmanagement · Problemlösung · Ausdauer ·
        Reaktionsgeschwindigkeit · Orientierung · Kommunikation · Questplanung ·
        Achievement Tracking
      </p>
      <hr />
      <p>
        <strong>Achievements</strong><br />
        100%-Abschlüsse in mehreren Open-World-Spielen.<br />
        Seltene Ingame-Erfolge freigeschaltet.<br />
        Zahlreiche Koop-Kampagnen erfolgreich abgeschlossen.<br />
        Langjährige Erfahrung mit RPGs, Action-Adventures und Strategiespielen.
      </p>
      <hr />
      <p>
        <strong>Lieblingsgenres</strong><br />
        RPG · Open World · Adventure · Strategie · Survival · Koop · Sandbox
      </p>
      <hr />
      <p>
        Diese <span class="typo">Bewrbung</span> wurde sorgfältig vorbereitet.
      </p>
    </main>
    <aside class="right">
      <div class="sidebox">
        <h2>Player Card</h2>
        <div class="stat-grid">
          <div class="stat"><b>LVL 37</b> Explorer</div>
          <div class="stat"><b>XP 14.800</b> Next Level Soon</div>
          <div class="stat"><b>Class</b> Adventurer</div>
          <div class="stat"><b>Role</b> Team Player</div>
        </div>
      </div>
      <div class="sidebox">
        <h2>Badges</h2>
        <ul class="badges">
          <li>Explorer Badge</li>
          <li>Quest Completion Badge</li>
          <li>Teamplay Badge</li>
          <li>Bossfight Badge</li>
          <li>Collector Badge</li>
        </ul>
      </div>
      <div class="sidebox">
        <h2>Current Quest</h2>
        <p>
          Das nächste große Abenteuer finden und dabei möglichst viele
          Achievements freischalten.
        </p>
      </div>
    </aside>
  </div>
</div>
    `,
  },
  {
    ext: "DOCX",
    name: "motivationsschreiben.docx",
    content: `
     <img
      src="https://hypership.uk/uploads/20260616082039_00_spngememe.png"
      alt="spongebob" width="100%"
    />
    `,
  },
  {
    ext: "PDF",
    name: "zeugnisse_scan.pdf",
    content: `
         <img
      src="https://hypership.uk/uploads/20260616090824_00_ryley.png"
      alt="ryleyrobinson" width="100%"
    />
    `,
  },

  {
    ext: "PNG",
    name: "foto_bewerbung.png",
    content: `<img src="https://hypership.uk/uploads/20260616124832_00_593d999ade165331c70dbab9a6cd44e5.jpg" alt="oldguy" width="100%">`,
  },

  {
    ext: "TXT",
    name: "notizen_interview.txt",
    content: `
     <div id="notes-editor">
  <p><strong>Notizen — Vorstellungsgespräch</strong></p>
  <hr>
  <p>
    - Fragen ob gratis Kaffee?<br>
    - Homeoffice?<br>
    - zu spät kommen schlimm?<br>
    - Lieblingstier<br>
   <span style="font-weight: bold; color:pink"> - TODO: Neues Foto hochladen &amp; Auf Typos kontolliern</span>
  </p>
</div>
    `,
  },
];

// Build the analog watch face and set it to 11:55 before the game starts.
buildAnalogTicks();
updateDeskClock(0);

loadGame(DOCS);

// ─── Leaderboard ──────────────────────────────────────────────────
const LEADERBOARD_KEY = "tj_leaderboard";
let _lbRemainingAtWin = 0;

function lbLoad() {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function lbSave(nickname) {
  const scores = lbLoad();
  scores.push({
    nickname: nickname.trim(),
    remaining: _lbRemainingAtWin,
    dreamjob: getTraumjob(),
  });
  scores.sort((a, b) => b.remaining - a.remaining);
  const trimmed = scores.slice(0, 20);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  } catch (e) { }
  return trimmed;
}

function lbFmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${pad2(m)}:${pad2(s)}`;
}

function lbRender(scores, myIndex) {
  const list = document.getElementById("lbList");
  if (!list) return;
  list.innerHTML = "";
  scores.forEach((entry, i) => {
    const rank = i + 1;
    const isMe = i === myIndex;
    const rowCls = ["lb-row"];
    if (rank === 1) rowCls.push("r1");
    else if (rank === 2) rowCls.push("r2");
    else if (rank === 3) rowCls.push("r3");
    if (isMe) rowCls.push("me");
    const row = document.createElement("div");
    row.className = rowCls.join(" ");
    row.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
    row.innerHTML = `
      <div class="rank">${rank}</div>
      <div class="name"><b>${entry.nickname}${isMe ? `<span class="lb-chip">${t("lb.chip")}</span>` : ""}</b><span>${entry.dreamjob || ""}</span></div>
      <div class="score"><b>${lbFmt(entry.remaining)}</b><span>${t("lb.timeLeft")}</span></div>
    `;
    list.appendChild(row);
  });
}

function showLeaderboard() {
  const overlay = document.getElementById("leaderboardOverlay");
  const nicknameStep = document.getElementById("lbNicknameStep");
  const boardStep = document.getElementById("lbBoardStep");
  const scoreDisplay = document.getElementById("lbScoreDisplay");
  if (!overlay) return;
  if (scoreDisplay) scoreDisplay.textContent = lbFmt(_lbRemainingAtWin);
  nicknameStep.style.display = "flex";
  boardStep.style.display = "none";
  overlay.style.display = "flex";
  const input = document.getElementById("lbNicknameInput");
  if (input) setTimeout(() => input.focus(), 50);
}

function lbSubmit() {
  const input = document.getElementById("lbNicknameInput");
  const nickname = input ? input.value.trim() : "";
  if (!nickname) {
    if (input) {
      input.focus();
      input.style.borderColor = "var(--tj-danger)";
    }
    return;
  }
  const scores = lbSave(nickname);
  const myIndex = scores.findIndex(
    (e) => e.nickname === nickname && e.remaining === _lbRemainingAtWin,
  );
  document.getElementById("lbNicknameStep").style.display = "none";
  document.getElementById("lbBoardStep").style.display = "flex";
  lbRender(scores, myIndex);
}

// Wire up open button on win screen
document.getElementById("lbOpenBtn").addEventListener("click", showLeaderboard);

// Wire up nickname submit (button + Enter)
document.getElementById("lbSubmitBtn").addEventListener("click", lbSubmit);
document.getElementById("lbNicknameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") lbSubmit();
});
document.getElementById("lbNicknameInput").addEventListener("input", () => {
  document.getElementById("lbNicknameInput").style.borderColor = "";
});

// Restart from leaderboard
document
  .getElementById("lbRestartBtn")
  .addEventListener("click", () => location.reload());
