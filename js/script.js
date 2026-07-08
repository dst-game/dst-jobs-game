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
let speedBoostLabelShown = false; // show the over-laptop label only once per boost
let speedBoostDisabledByUser = false; // user clicked slow button
let clockCritical = false; // digital critical (final 30s)
let halfTimePassed = false; // half-time guide message
let lastMinute = false; // analog red alarm outline (final 60s)
let coffeeHideTimer = null; // pending timeout that hides the energy drink again
let coffeeNextTimer = null; // pending timeout for its next reappearance
let immunityActive = false;
let cameraStream = null;
let photoAdded = false;
let typoFixed = false;
let savedPhotoSrc = null;
let addImageTypoGuideShown = false;
let wrongFileGuideShown = false;
let mistakeNow = false;
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

  const overLaptopLabel = document.getElementById("overLaptopLabel");

  // after one minute — speed up and show guide once
  if (
    remainingTime <= 90 &&
    !mistakeNow &&
    !speedBoosted &&
    !speedBoostDisabledByUser &&
    !speedBoostLabelShown
  ) {
    speedBoosted = true;
    speedBoostLabelShown = true;
    SPEED = 2;

    flashMistake();
    overLaptopLabel.textContent = t("guide.speedBoosted");
    overLaptopLabel.classList.remove("animate");
    void overLaptopLabel.offsetWidth;
    overLaptopLabel.classList.add("animate");

    if (gameDigital) gameDigital.classList.add("mistake");

    if (gameAnalog) {
      gameAnalog.classList.add("speedup");
      gameAnalog.setAttribute("data-critical", "");
    }

    const slowBtn = document.getElementById("slowBtn");
    if (slowBtn) slowBtn.style.display = "inline-flex";
  }

  // after half time — also when the energy drink briefly peeks out
  if (remainingTime <= 150 && !halfTimePassed) {
    halfTimePassed = true;
    showTimerFlash(t("guide.halfTime"));
    revealCoffeeMug();
  }

  // Last minute → analog clock outline turns to the red alarm state.
  if (remainingTime <= 60 && !lastMinute) {
    lastMinute = true;
    if (gameAnalog) gameAnalog.setAttribute("data-critical", "");
    showTimerFlash(t("guide.hurryUp"));
  }
  // Final 30s → digital clock also goes critical + stronger warning.
  if (remainingTime <= 30 && !clockCritical) {
    clockCritical = true;
    if (gameDigital) gameDigital.setAttribute("data-critical", "");
    showTimerFlash(t("guide.almostOutOfTime"), 2800);
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

function handleTimeUp(reason) {
  gameOver = true;
  deactivateApplyPhase();
  closeCaptcha();
  stopTimer();
  if (reason === "discard") {
    showGuidePriority(t("guide.discardedFiles"));
  } else {
    showGuidePriority(t("guide.timeUp"));
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
}

function deactivateApplyPhase() {
  applyPhaseActive = false;
  applyButton.style.display = "none";
}

function applyPunishment(amount) {
  if (gameOver || gameWon || immunityActive) return;
  const label = document.getElementById("punishmentLabel");
  // callers may pass a custom penalty (e.g. the dictation typo penalty);
  // everything else uses the default GAME_SETTINGS.punishmentAmount.
  amount = typeof amount === "number" ? amount : GAME_SETTINGS.punishmentAmount;

  // block immediately so rapid-fire typos can't queue multiple punishments
  immunityActive = true;

  flashMistake();
  label.textContent = `-${amount}s`;
  label.classList.remove("animate");
  void label.offsetWidth;
  label.classList.add("animate");

  setTimeout(() => {
    penaltySeconds += amount;
    // keep immunity for 2 more seconds after the penalty lands
    setTimeout(() => {
      immunityActive = false;
    }, 1200);
  }, 800);
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
  showGuidePriority(t("guide.notRobot"));

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
  videoEl.style.display = "block";
  photoEl.style.display = "none";
  captureBtn.style.display = "block";
  retakeBtn.style.display = "none";
  savePhotoBtn.style.display = "none";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = cameraStream;
  } catch {
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
  savedPhotoSrc = photoEl.src;
  const missingImageEl = previewBody.querySelector(".missing-image");
  if (missingImageEl) {
    missingImageEl.innerHTML = `<img src="${savedPhotoSrc}" class="cv-photo" />`;
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
const cursor = document.querySelector(".cursor");
const postit = document.querySelector(".postit");
const timer = document.querySelector(".clock-card");
const coffeeMug = document.getElementById("coffeeMug");

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
  speedBoosted = false;
  speedBoostDisabledByUser = true;

  if (gameAnalog) {
    gameAnalog.removeAttribute("data-critical", "");
    gameAnalog.classList.remove("speedup");
  }
  if (gameDigital) {
    gameDigital.classList.remove("mistake");
    gameDigital.removeAttribute("data-critical", "");
  }

  // Clear any pending mistake timer
  clearTimeout(mistakeTimer);

  const overLaptopLabel = document.getElementById("overLaptopLabel");
  if (overLaptopLabel) overLaptopLabel.textContent = "";

  const slowBtn = document.getElementById("slowBtn");
  slowBtn.style.display = "none";
  showGuide("🐢 Geschwindigkeit zurück auf normal!", 3000);
});

document.getElementById("skipVideoBtn").addEventListener("click", () => {
  gameScreen();
});

introVideo.addEventListener("ended", () => {
  gameScreen();
});

function gameScreen() {
  introVideoBox.style.display = "none";
  introVideo.pause();
  // reveal the desk decorations so the spotlight has something to light up
  cattail.style.display = "flex";
  if (cattail) {
    cattail.title = t("cat.title");
  }
  postit.style.display = "flex";
  timer.style.display = "flex";
  // Guided spotlight tour: rabbit → clock → laptop, then hand off to play.
  runIntroSpotlight(startGamePlay);
}

// Kick off the actual game once the intro spotlight tour has finished.
function startGamePlay() {
  loginBox.style.display = "flex";
  showGuidePriority(t("guide.password"));
  startTimer();
}

// Dim the screen and move a spotlight over the rabbit, the clock and the
// laptop in turn, each with a help card the player clicks through ("Weiter"),
// finishing with "Spiel starten" — then the game begins.
function runIntroSpotlight(done) {
  const steps = [
    {
      sel: ".guide-card",
      key: "spotlight.rabbit",
      side: "right",
      pad: 16,
      radius: 22,
    },
    {
      sel: ".clock-card",
      key: "spotlight.clock",
      side: "right",
      pad: 16,
      radius: 22,
    },
    {
      sel: ".tj-laptop",
      key: "spotlight.laptop",
      side: "center",
      pad: 12,
      radius: 16,
    },
  ];

  const overlay = document.createElement("div");
  overlay.className = "intro-spotlight";
  const hole = document.createElement("div");
  hole.className = "spot-hole";
  const cap = document.createElement("div");
  cap.className = "spot-cap";
  const capText = document.createElement("div");
  capText.className = "spot-cap-text";
  const capBtn = document.createElement("button");
  capBtn.className = "spot-cap-btn";
  const skipBtn = document.createElement("button");
  skipBtn.className = "spot-skip-btn";
  skipBtn.textContent = t("spotlight.skip");
  cap.appendChild(capText);
  cap.appendChild(capBtn);
  cap.appendChild(skipBtn);
  overlay.appendChild(hole);
  overlay.appendChild(cap);
  document.body.appendChild(overlay);

  let idx = 0;
  let finished = false;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Keep the card next to its target but always fully inside the viewport.
  function positionCaption(r, side) {
    const m = 18;
    const cw = cap.offsetWidth;
    const ch = cap.offsetHeight;
    let left, top;
    if (side === "right") {
      left = r.right + 26;
      top = r.top + r.height / 2 - ch / 2;
      // not enough room to the right? drop it below the target instead
      if (left + cw + m > window.innerWidth) {
        left = r.left + r.width / 2 - cw / 2;
        top = r.bottom + 20;
      }
    } else {
      // centered over the target (used for the big laptop)
      left = r.left + r.width / 2 - cw / 2;
      top = r.top + r.height / 2 - ch / 2;
    }
    cap.style.left = clamp(left, m, window.innerWidth - cw - m) + "px";
    cap.style.top = clamp(top, m, window.innerHeight - ch - m) + "px";
  }

  function render() {
    const step = steps[idx];
    const isLast = idx === steps.length - 1;
    capText.innerHTML = t(step.key);
    capBtn.textContent = t(isLast ? "spotlight.start" : "spotlight.next");
    capBtn.classList.toggle("is-final", isLast);
    const el = document.querySelector(step.sel);
    if (el) {
      const r = el.getBoundingClientRect();
      hole.style.top = r.top - step.pad + "px";
      hole.style.left = r.left - step.pad + "px";
      hole.style.width = r.width + step.pad * 2 + "px";
      hole.style.height = r.height + step.pad * 2 + "px";
      hole.style.borderRadius = step.radius + "px";
      positionCaption(r, step.side);
    }
  }

  function advance() {
    idx++;
    if (idx >= steps.length) {
      finish();
      return;
    }
    render();
  }

  function finish() {
    if (finished) return;
    finished = true;
    overlay.classList.add("done");
    setTimeout(() => {
      overlay.remove();
      if (typeof done === "function") done();
    }, 450);
  }

  capBtn.addEventListener("click", advance);
  skipBtn.addEventListener("click", finish);

  // fade in, then show the first help card
  requestAnimationFrame(() => {
    overlay.classList.add("show");
    render();
  });
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
      showGuide(t("guide.password"), 3000);
      applyPunishment();
    }
  }
};

// Shown after the Bewerbungs-Flow's "CV hochladen" step: the existing
// file-explorer task where the player finds the right Lebenslauf.
function showFileExplorer() {
  loginBox.style.display = "none";
  gameBox.style.display = "block";
  loadGame(DOCS);
  showGuidePriority(t("guide.rememberFile"));
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
const previewBody = document.getElementById("previewBody");
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
let guideQueue = [];
let guideShowing = false;
let guideCurrentText = "";

// The rabbit's speech bubble lives permanently in the left rail; showGuide
// types the new line out character-by-character with a blinking caret.
// Duplicate messages (already showing or already queued) are dropped.
// The queue is capped at 3 — oldest entry is dropped if it fills up.
function showGuide(text) {
  const str = String(text);
  if (str === guideCurrentText || guideQueue.includes(str)) return;
  if (guideShowing) {
    if (guideQueue.length >= 3) guideQueue.shift();
    guideQueue.push(str);
    return;
  }
  _runGuide(str);
}

// Use for screen transitions and game-state changes: clears any queued/in-progress
// messages so stale hints from the previous screen don't bleed through.
const timerFlashEl = document.getElementById("timerFlash");
const timerFlashTextEl = document.getElementById("timerFlashText");
let timerFlashTimeout = null;

function showTimerFlash(text, duration = 2200) {
  if (!timerFlashEl || !timerFlashTextEl) return;
  clearTimeout(timerFlashTimeout);
  timerFlashTextEl.textContent = text;
  timerFlashEl.style.display = "flex";
  // restart animations
  timerFlashEl.style.animation = "none";
  timerFlashTextEl.style.animation = "none";
  void timerFlashEl.offsetWidth;
  timerFlashEl.style.animation = "";
  timerFlashTextEl.style.animation = "";
  timerFlashTimeout = setTimeout(() => {
    timerFlashEl.style.display = "none";
  }, duration);
}

function showGuidePriority(text) {
  guideQueue = [];
  guideShowing = false;
  guideCurrentText = "";
  clearInterval(typewriterTimer);
  _runGuide(String(text));
}

function _runGuide(text) {
  guideShowing = true;
  guideCurrentText = text;
  if (!guideText) {
    guideShowing = false;
    guideCurrentText = "";
    return;
  }

  if (guidePortraitImg && !gameWon && !gameOver) {
    clearTimeout(guidePortraitTimer);
    guidePortraitImg.src = guideIdleSrc;
    guidePortraitImg.src = guideExplainSrc + "?t=" + Date.now();
    guidePortraitTimer = setTimeout(() => {
      guidePortraitImg.src = guideIdleSrc;
    }, 4500);
  }

  clearInterval(typewriterTimer);
  guideText.textContent = "";
  const typed = document.createTextNode("");
  const caret = document.createElement("span");
  caret.className = "caret";
  caret.textContent = "▍";
  guideText.append(typed, caret);
  let i = 0;
  typewriterTimer = setInterval(() => {
    typed.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(typewriterTimer);
      setTimeout(() => {
        guideShowing = false;
        guideCurrentText = "";
        if (guideQueue.length > 0) _runGuide(guideQueue.shift());
      }, 1000);
    }
  }, 32);
}

// Flash the guide (Begleiter) card AND the digital clock red on a mistake.
let mistakeTimer = null;
function flashMistake() {
  mistakeNow = true;
  if (guideCard) {
    guideCard.classList.remove("mistake");
    void guideCard.offsetWidth; // restart the animation
    guideCard.classList.add("mistake");
  }
  if (gameDigital) gameDigital.classList.add("mistake");
  clearTimeout(mistakeTimer);
  mistakeTimer = setTimeout(() => {
    if (guideCard) guideCard.classList.remove("mistake");
    if (!speedBoosted) {
      if (gameDigital) gameDigital.classList.remove("mistake");
    }
  }, 1200);
  setTimeout(() => {
    mistakeNow = false;
  }, 2000);
}

function openPreview(name, content) {
  previewBody.innerHTML = content;
  previewBody.scrollTop = 0;
  if (name !== GAME_SETTINGS.correctFile) {
    previewSave.style.display = "none";
    if (!wrongFileGuideShown) {
      wrongFileGuideShown = true;
      showGuidePriority(t("guide.wrongFile"));
    }
  } else {
    const traumjob = getTraumjob();
    if (traumjob) {
      const headline = document.getElementById("dreamjobjob");
      headline.textContent = t("cv.headlinePrefix") + traumjob;
    }
    previewSave.style.display = "block";
    const missingImage = previewBody.querySelector(".missing-image");
    if (photoAdded && savedPhotoSrc) {
      if (missingImage) {
        missingImage.innerHTML = `<img src="${savedPhotoSrc}" class="cv-photo" />`;
      }
    } else if (missingImage) {
      missingImage.addEventListener("click", openCamera);
    }
    if (typoFixed) {
      const typoEl = previewBody.querySelector(".typo");
      if (typoEl) {
        typoEl.textContent = "Profil";
        typoEl.classList.remove("typo");
      }
    }
    if (!addImageTypoGuideShown) {
      addImageTypoGuideShown = true;
      wrongFileGuideShown = false;
      showGuidePriority(t("guide.addImageTypo"));
      addImageTypoGuideShown = false;
      // if user goes back to wrong file show wrong message again as long as they are on wrong files
    }
  }
}

function closePreview() {
  previewBody.innerHTML = "";
  previewSave.style.display = "none";
}

previewSave.addEventListener("click", () => {
  if (!photoAdded) {
    showGuide(t("guide.stillWrong"), 3000);
    applyPunishment();
    return;
  }
  if (!typoFixed) {
    showGuide(t("guide.stillWrong"), 3000);
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
  showGuidePriority(t("guide.submitNow"));
});

previewBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("typo")) {
    e.target.textContent = "Profil";
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
  el.className = "fe-tab";
  el.innerHTML = `<span title="${name}"><span class="fe-tab-name">${name}</span></span>`;
  el.addEventListener("click", () => {
    document
      .querySelectorAll("#docsA .fe-tab")
      .forEach((t) => t.classList.remove("active"));
    el.classList.add("active");
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
    showGuidePriority(t("guide.success"));
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

if (cattail && cursor) {
  cattail.addEventListener("mouseenter", () => {
    cursor.style.display = "block";
  });
  cattail.addEventListener("mouseleave", () => {
    cursor.style.display = "none";
  });
}

// ─── Coffee power-up: click the mug for a one-time +60s energy boost ──
let coffeeUsed = false;

function grantEnergy(seconds) {
  if (gameOver || gameWon) return;
  // Never give back more time than has actually elapsed — the clock can't go
  // above the full duration. So if you drink the coffee within the first
  // minute, you only get back the seconds that have already passed.
  const elapsed = Math.round(GAME_SETTINGS.gameDuration - remainingTime);
  const bonus = Math.max(0, Math.min(seconds, elapsed));
  const capped = bonus < seconds;
  // nothing has elapsed yet → nothing to give back; leave the coffee for later
  if (bonus <= 0) return 0;
  // subtracting from penaltySeconds adds time back onto the clock
  penaltySeconds -= bonus;
  const label = document.getElementById("punishmentLabel");
  if (label) {
    label.textContent = `+${bonus}s`;
    label.classList.add("energy");
    label.classList.remove("animate");
    void label.offsetWidth; // restart the rise animation
    label.classList.add("animate");
    // revert to the red penalty styling once the boost animation is done
    setTimeout(() => label.classList.remove("energy"), 2400);
  }
  // tell the player how much they got — capped message when less than the
  // full boost was possible, otherwise the normal "+60s" message.
  showGuidePriority(
    capped ? t("guide.coffeeCapped").replace("{s}", bonus) : t("guide.coffee"),
  );
  return bonus;
}

// Fixed corner "peeking" spots (see .coffee-mug.spot-* in styles.css).
const MUG_CORNERS = ["spot-1", "spot-2", "spot-3", "spot-4"];

// Peeks out of one random corner, shakes for 3s, then hides again — first
// triggered at half-time (see tick()), then keeps reappearing every 30-45s
// (randomized so it's not predictable) until it's clicked or the round ends.
function revealCoffeeMug() {
  if (!coffeeMug || coffeeUsed || gameOver || gameWon) return;
  const corner = MUG_CORNERS[Math.floor(Math.random() * MUG_CORNERS.length)];
  coffeeMug.classList.remove(...MUG_CORNERS, "hiding");
  coffeeMug.classList.add(corner, "shake");
  coffeeMug.title = t("coffee.title");
  coffeeMug.style.display = "inline-block";
  coffeeHideTimer = setTimeout(hideCoffeeMug, 3000);
}

function hideCoffeeMug() {
  coffeeHideTimer = null;
  if (!coffeeMug || coffeeUsed) return; // already faded out via .used
  coffeeMug.classList.remove("shake");
  coffeeMug.classList.add("hiding");
  setTimeout(() => {
    coffeeMug.style.display = "none";
    coffeeMug.classList.remove("hiding", ...MUG_CORNERS);
    if (!coffeeUsed && !gameOver && !gameWon) {
      coffeeNextTimer = setTimeout(revealCoffeeMug, 2000);
    }
  }, 400);
}

if (coffeeMug) {
  coffeeMug.addEventListener("click", () => {
    if (coffeeUsed || gameOver || gameWon) return;
    // only "drink" (consume) the coffee if it actually gave energy back
    if (grantEnergy(60) > 0) {
      coffeeUsed = true;
      coffeeMug.classList.remove("shake");
      coffeeMug.classList.add("used");
      if (coffeeHideTimer) {
        clearTimeout(coffeeHideTimer);
        coffeeHideTimer = null;
      }
      if (coffeeNextTimer) {
        clearTimeout(coffeeNextTimer);
        coffeeNextTimer = null;
      }
    }
  });
}

function loadGame(docs) {
  docsA.innerHTML = "";

  docs.forEach((d) => docsA.appendChild(makeDoc(d)));

  // always open on the notes file
  const tabs = Array.from(docsA.querySelectorAll(".fe-tab"));
  const notesIdx = docs.findIndex((d) => d.name === "notizen_interview.txt");
  const notesTab = notesIdx !== -1 ? tabs[notesIdx] : null;
  if (notesTab) {
    // Suppress the "wrong file" guide hint for this auto-seeded open — it
    // should only fire the first time the player themselves picks a wrong file.
    wrongFileGuideShown = true;
    notesTab.click();
    wrongFileGuideShown = false;
  }
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
    name: "lebenslauf_neu.pdf",
    content: `
  
<div id="lebenslauf-graphic">
  <div class="wordart">THOMASINE CRUISE</div>

  <div class="marquee">
    ★ AVAILABLE FOR GRAPHIC DESIGN ★ 
  </div>

  <div class="hero">
    <img
      src="https://hypership.uk/uploads/20260616082732_00_graphic.png"
      alt="Thomasine Cruise Lebenslauf"
    />

    <div class="intro">
      <strong>Thomasine Cruise</strong><br />
      Senior Graphic Wizard™<br />
      📧 graphic_impossible@scientology.com<br />
      🌐 myspace.com/thomasinecruise2007<br /><br />

      <span class="blink"> ★ Winner of "Best ClipArt Placement 2009" ★ </span>
    </div>
   
  </div>

  <div class="section">
    <h2>Berufserfahrung</h2>


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
     
  </div>

  <div class="section">
    <h2>Fähigkeiten</h2>

     
    <ul>
      <li>PowerPoint Übergänge auf Maximum</li>
      <li>WordArt (Expert Level)</li>

      <li>ClipArt-Montage</li>

      <li>MySpace Profil Optimierung</li>
      <li>HTML Tabellen Layouts ohne CSS</li>
    </ul>
      
  </div>

  <div class="section">
    <h2>Software Kenntnisse</h2>

  
    <ul>
      <li>Microsoft Word 2003 ★★★★★</li>
      <li>Paint ★★★★★</li>
      <li>Internet Explorer ★★★★★</li>
      <li>Winamp Skins ★★★★★</li>
      <li>Photoshop CS2 (Testversion) ★★★☆☆</li>
    </ul>
   
  </div>

  <div class="section">
    <h2>Referenzen</h2>

    <p>
      „Bitte hör auf Designs zu machen.“<br />
      — ehemaliger Kunde
    </p>

    <p>
      „Das ist technisch gesehen eine Webseite.“<br />
      — unabhängiger Gutachter
    </p>
  
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
    name: "kuendigung.pdf",
    content: `
       <div id="kuendigung">  <img
      src="https://hypership.uk/uploads/20260701112249_00_kuendigung.png"
      alt="" width="100%"
    /></div>
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
      <h1> <span style="font-size: 15px">Lebenslauf von</span><br>Gustav Mäuschen
    </h1>
      <div class="claim" style="font-size: 24px">„Morgenstund hat Kaffee im Mund.“ ☕🐭</div>
      <div class="kontakt">
      
        Bereit, heute meine vollen 50% zu geben. <br>
        31.02.2014
      </div>
    </div>
  </div>

  <div class="bereich">
    <h2>Profil</h2>
    <p style="font-size: 15px">
      Ich bin just a Maus who needs money für Schabernack. <br> Sehr süß, sehr
      bemüht, sehr sonnenscheinmäßig unterwegs. <br>Ich bringe gute Laune, kleine
      Pfötchen und eine überraschend starke Motivation für halbwegs wichtige
      Aufgaben mit.
    </p>
  </div>

  <div class="bereich">
    <h2>Fähigkeiten</h2>
    <ul >   <li style="font-size: 15px">Motiviert nicken in Meetings</li>   <li style="font-size: 15px">Schabernack planen</li>   <li style="font-size: 15px">Kaffee trinken und dabei wichtig schauen</li>
     
      <li style="font-size: 15px">50% Einsatz mit 100% Cute-Faktor</li>
   

   

      <li style="font-size: 15px">Sehr kleine, aber ernst gemeinte Excel-Tabellen</li>
   
    </ul>

    
  </div>
 <div class="bereich">
    <h2>Referenzen</h2>
    <p>
      „Kommt vielleicht zu spät, aber dafür sehr lieb.“
    </p>
  </div>
  <div class="bereich">
    <h2>Ausbildung</h2>
    <p style="font-size: 15px">
      <strong>Akademie für kleine Dinge mit großer Wirkung</strong><br />
      Diplom in Mausmanagement & Snack Logistics
    </p>
  </div>
 
  <div class="bereich">
    <h2>Berufserfahrung</h2>
    <p style="font-size: 15px">
      <strong>Junior Schabernack Consultant</strong><br />
      Käse & Chaos GmbH · 2022–heute
    </p>
    <p style="font-size: 15px">
      <strong>Assistant to the Regional Sonnenstrahl</strong><br />
      Maus Office Collective · 2020–2022
    </p>
  </div>

  <div class="footer">
    🐭 verfügbar ab sofort · bevorzugt nach Kaffee · bezahlt gerne in Geld oder
    Käse 🧀
  </div><div class="badgebox">
      <span class="badge">cute</span>
      <span class="badge">mausig</span>
      <span class="badge">pastell</span>
      <span class="badge">kaffee</span>
      <span class="badge">schabernack-ready</span>
    </div>
</div>

  
    `,
  },
  {
    ext: "TXT",
    name: "love_msg.txt",
    content: `
 <div id="love">
 <div id="notes-editor">
  
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VIEL ERFOLG BEIM BEWERBEN</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I LUV YOU  <3 </div>
       <div class="note" >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DEIN GUSTAV</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
       <div class="note" style="color: rgb(209, 58, 61); font-weight: bold;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PS: Vergiss nicht ein Foto </div>
       <div class="note" style="color: rgb(209, 58, 61); font-weight: bold;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;für den Lebenslauf zu schiessen!!</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <3 <3 <3 <3 <3 <3</div>
            <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
     

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
        <img src="images/nopfp.png" />
      </div>
      <hr />
      <h2 id="dreamjobjob"></h2>
      <hr />
      <ul>
    <strong>  <span class="typo">  Profiell</span></strong
        ><br />
        <li>Erfahrung in kompetitiven Multiplayer- und Story-Spielen.</li>
        <li>
          Bekannt für strategisches Denken, Ausdauer bei schwierigen Challenges
          und die Fähigkeit, komplexe Systeme schnell zu verstehen.
        </li>
        <li>
          Motiviert durch Fortschritt, Teamplay und das Freischalten neuer
          Achievements.
        </li>
      </ul>
      <hr />
      <p>
        <strong>Spielerfahrung</strong>
      </p>
      <ul>
        <li>Open World Enthusiast (2020–heute)</li>
        <li>Koop-Strategin (2018–heute)</li>
        <li>Achievement Hunter (2016–heute)</li>
      </ul>
      <hr />
      <p>
        <strong>Gaming Highlights</strong>
      </p>
      <ul>
        <li>
          Clair Obscur: Expedition 33 — mehrere anspruchsvolle Bosskämpfe
          erfolgreich gemeistert.
        </li>
        <li>
          Assassin's Creed Shadows — zahlreiche Gebiete vollständig erkundet und
          Nebenmissionen abgeschlossen.
        </li>
        <li>Baldur's Gate 3 — verschiedene Story-Pfade und Builds getestet.</li>
        <li>Fortnite — regelmäßige Top-Platzierungen in saisonalen Events.</li>
        <li>
          Minecraft — umfangreiche Survival- und Kreativprojekte umgesetzt.
        </li>
      </ul>

      <hr />
  
    </main>
    <aside class="right">
      <div class="sidebox">
        <p>
          <strong>Achievements</strong>
        </p>
        <ul>
          <li>100%-Abschlüsse in mehreren Open-World-Spielen.</li>
          <li>Seltene Ingame-Erfolge freigeschaltet.</li>
          <li>Zahlreiche Koop-Kampagnen erfolgreich abgeschlossen.</li>
          <li>
            Langjährige Erfahrung mit RPGs, Action-Adventures und
            Strategiespielen.
          </li>
        </ul>
        <hr />
        <p>
          <strong>Lieblingsgenres</strong><br />
          RPG · Open World · Adventure · Strategie · Survival · Koop · Sandbox
        </p>
      
      </div>
      <div class="sidebox">
        <div class="stat-grid">
          <div class="stat"><b>LVL 37</b> Explorer</div>
          <div class="stat"><b>XP 14.800</b> Next Level Soon</div>
          <div class="stat"><b>Class</b> Adventurer</div>
          <div class="stat"><b>Role</b> Team Player</div>
        </div>
      </div>
      <div class="sidebox">
        <h2>Skills</h2>
        <ul class="badges">
       
  <li> 
        Strategie</li><li>  Teamplay</li><li>  Ressourcenmanagement</li><li>  Problemlösung</li><li>  Ausdauer</li><li> 
        Reaktionsgeschwindigkeit</li><li>  Orientierung</li><li>  Kommunikation</li><li>  Questplanung</li><li> 
        Achievement Tracking
     </li>
   
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
      alt="spongebob" width="70%"
    />
    `,
  },
  {
    ext: "PDF",
    name: "zeugnisse_scan.pdf",
    content: `
    <div id="cvpadding">
         <img class="contento"
      src="https://hypership.uk/uploads/20260616090824_00_ryley.png"
      alt="ryleyrobinson" width="85%"
    /> </div>
    `,
  },

  {
    ext: "PNG",
    name: "foto_bewerbung.png",
    content: `<img src="https://hypership.uk/uploads/20260616124832_00_593d999ade165331c70dbab9a6cd44e5.jpg" alt="oldguy" width="85%">`,
  },

  {
    ext: "TXT",
    name: "notizen_interview.txt",
    content: `
 <div id="notes-editor">
    <h3>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Notizen — Vorstellungsgespräch</h3>

    <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-Fragen ob gratis Kaffee?</div>
    <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-Homeoffice?</div>
    <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-Zu spät kommen schlimm?</div>
    <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-Lieblingstier</div> <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-Ist Obstkorb der einzige Benefit???</div>
    <div class="note todo">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-TODO:</div>    <div class="note todo">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1)Wo ist mein aktueller Lebenslauf?? </div>
    <div class="note todo">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2)Neues Foto hochladen </div>
    <div class="note todo">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3)auf Typos kontrollieren</div>
    
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Der Graphic Design Lebenslauf </div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ist wohl nicht mehr aktuell..</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
       <div class="note" style="color:green; font-weight: bold">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SCHILDKRÖTE?!?!?!?</div>
       <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
     
       <div class="ekl note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Kaufen:</div>
       <div class="ekl note ">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Energy Drinks</div>
       <div class="ekl note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Tomaten</div>
       <div class="ekl note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Spaghetti</div>
        <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div> <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div> <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div> <div class="note">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
</div>
    `,
  },
];

// Build the analog watch face and set it to 11:55 before the game starts.
buildAnalogTicks();
updateDeskClock(0);

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

// Local fallback used only when Firebase is unreachable.
function lbSaveLocal(nickname) {
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
  } catch (e) {}
  return trimmed;
}

function lbLoadRemote() {
  return new Promise((resolve, reject) => {
    if (typeof window.loadLeaderboard !== "function") {
      reject(new Error("Firebase leaderboard unavailable"));
      return;
    }
    try {
      window.loadLeaderboard(resolve);
    } catch (e) {
      reject(e);
    }
  });
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
  const errorMsg = document.getElementById("lbErrorMsg");
  if (errorMsg) errorMsg.style.display = "none";
  nicknameStep.style.display = "flex";
  boardStep.style.display = "none";
  overlay.style.display = "flex";
  const input = document.getElementById("lbNicknameInput");
  if (input) setTimeout(() => input.focus(), 50);
}

async function lbSubmit() {
  const input = document.getElementById("lbNicknameInput");
  const nickname = input ? input.value.trim() : "";
  if (!nickname) {
    if (input) {
      input.focus();
      input.style.borderColor = "var(--tj-danger)";
    }
    return;
  }

  const submitBtn = document.getElementById("lbSubmitBtn");
  const errorMsg = document.getElementById("lbErrorMsg");
  const originalBtnText = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = t("lb.saving");
  }
  if (errorMsg) errorMsg.style.display = "none";

  const dreamjob = getTraumjob();
  let scores;
  let myIndex;

  try {
    await window.submitScore(nickname, _lbRemainingAtWin, dreamjob);
    scores = await lbLoadRemote();
    scores.sort((a, b) => b.remaining - a.remaining);
    scores = scores.slice(0, 20);
    myIndex = scores.findIndex(
      (e) =>
        e.nickname === nickname &&
        e.remaining === _lbRemainingAtWin &&
        e.dreamjob === dreamjob,
    );
  } catch (e) {
    scores = lbSaveLocal(nickname);
    myIndex = scores.findIndex(
      (e) => e.nickname === nickname && e.remaining === _lbRemainingAtWin,
    );
    if (errorMsg) errorMsg.style.display = "block";
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }

  document.getElementById("lbNicknameStep").style.display = "none";
  document.getElementById("lbBoardStep").style.display = "flex";
  lbRender(scores, myIndex);
}

// Export leaderboard as JSON
function lbExport() {
  const scores = lbLoad();
  const dataStr = JSON.stringify(scores, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leaderboard_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Import leaderboard from JSON
function lbImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        const current = lbLoad();
        const merged = [...current, ...imported];
        merged.sort((a, b) => b.remaining - a.remaining);
        const trimmed = merged.slice(0, 20);
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
        alert("✅ Leaderboard imported successfully!");
        location.reload();
      } catch (err) {
        alert("❌ Invalid leaderboard file: " + err.message);
      }
    };
    reader.readAsText(file);
  });
  input.click();
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

// Wire up export/import buttons if they exist
const lbExportBtn = document.getElementById("lbExportBtn");
if (lbExportBtn) lbExportBtn.addEventListener("click", lbExport);

const lbImportBtn = document.getElementById("lbImportBtn");
if (lbImportBtn) lbImportBtn.addEventListener("click", lbImport);

// Restart from leaderboard
document
  .getElementById("lbRestartBtn")
  .addEventListener("click", () => location.reload());
