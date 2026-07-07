// DEBUG NAVIGATION — only active when ?debug=1 or localStorage.debug === 'true'
(function () {
  var params = new URLSearchParams(window.location.search);
  if (params.get("debug") !== "1" && localStorage.getItem("debug") !== "true") return;

  // ── helpers ──────────────────────────────────────────────────────────────────

  // Reads the displayed (CSS-distorted but text-intact) robot-check code
  // straight from the DOM and submits it, so debug jumps can sail through
  // the newtab -> results step without solving the visual puzzle by hand.
  function solveRobotCheck(flow) {
    var chars = flow.querySelectorAll("#robotCode .rc-char");
    if (!chars.length) return;
    var code = Array.prototype.map.call(chars, function (el) {
      return el.textContent;
    }).join("");
    var input = flow.querySelector("#robotInput");
    if (input) {
      input.value = code;
      var checkRow = flow.querySelector("#robotCheckRow");
      if (checkRow) checkRow.click();
      var btn = flow.querySelector("#robotConfirm");
      if (btn) btn.click();
    }
  }

  function hideAll() {
    // start screen
    var tjStart = document.getElementById("tjStart");
    if (tjStart) tjStart.style.display = "none";

    // laptop screens
    var screens = [
      document.querySelector(".introScreen"),
      document.querySelector(".introVideoBox"),
      document.querySelector(".nr1_login"),
      document.getElementById("screen_2"),
      document.getElementById("nr3_win"),
      document.getElementById("nr4_gameover"),
      document.getElementById("captchaScreen"),
      document.querySelector(".nr4_camerascreen"),
      document.getElementById("momOverlay"),
      document.getElementById("momCallOverlay"),
      document.getElementById("tjFlow"),
    ];
    screens.forEach(function (el) {
      if (el) el.style.display = "none";
    });

    // file preview
    var fp = document.getElementById("filePreview");
    if (fp) fp.classList.remove("open");

    // apply button + discard modals
    var applyBtn = document.querySelector(".applyButton");
    if (applyBtn) applyBtn.style.display = "none";
    var dm1 = document.getElementById("discardModal");
    if (dm1) dm1.style.display = "none";
    var dm2 = document.getElementById("discardModal2");
    if (dm2) dm2.style.display = "none";

    // desk accessories
    var cattail = document.querySelector(".cattail");
    if (cattail) cattail.style.display = "none";
    var postit = document.querySelector(".postit");
    if (postit) postit.style.display = "none";
  }

  function ensureTimerRunning() {
    // Make the desk visible and start the timer if not already running
    var timerRail = document.querySelector(".clock-card");
    if (timerRail) timerRail.style.display = "flex";
    var cattail = document.querySelector(".cattail");
    if (cattail) cattail.style.display = "flex";
    var postit = document.querySelector(".postit");
    if (postit) postit.style.display = "flex";

    if (typeof window.startTimer === "function") {
      try { window.startTimer(); } catch (e) {}
    }
  }

  // ── jump targets ──────────────────────────────────────────────────────────────

  var STOPS = [
    {
      label: "Login Screen",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        var loginBox = document.querySelector(".nr1_login");
        if (loginBox) loginBox.style.display = "flex";
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Login screen");
      },
    },
    {
      label: "CV / File Explorer",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        // populate docs if empty
        var docsA = document.getElementById("docsA");
        if (docsA && !docsA.children.length && typeof window.loadGame === "function") {
          window.loadGame(typeof DOCS !== "undefined" ? DOCS : []);
        }
        var gameBox = document.getElementById("screen_2");
        if (gameBox) gameBox.style.display = "block";
        var fe = document.getElementById("file_explorer");
        if (fe) fe.style.display = "";
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: File Explorer");
        setTimeout(function () {
          if (typeof window.showMomCall === "function") window.showMomCall();
        }, 350);
      },
    },
    {
      label: "CV Preview (correct file)",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        var docsA = document.getElementById("docsA");
        if (docsA && !docsA.children.length && typeof window.loadGame === "function") {
          window.loadGame(typeof DOCS !== "undefined" ? DOCS : []);
        }
        var gameBox = document.getElementById("screen_2");
        if (gameBox) gameBox.style.display = "block";
        if (typeof window.openPreview === "function" && typeof GAME_SETTINGS !== "undefined" && typeof DOCS !== "undefined") {
          var correct = DOCS.find(function (d) { return d.name === GAME_SETTINGS.correctFile; });
          if (correct) window.openPreview(correct.name, correct.content);
        }
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: CV Preview (correct file)");
      },
    },
    {
      label: "Camera",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        var gameBox = document.getElementById("screen_2");
        if (gameBox) gameBox.style.display = "block";
        if (typeof window.openCamera === "function") window.openCamera();
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Camera");
      },
    },
    {
      label: "Bewerbung: New Tab",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        var flow = document.getElementById("tjFlow");
        if (flow) flow.style.display = "block";
        if (typeof window.startBewerbungsFlow === "function") window.startBewerbungsFlow();
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Bewerbung — New Tab");
      },
    },
    {
      label: "Bewerbung: Results",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        var flow = document.getElementById("tjFlow");
        if (flow) flow.style.display = "block";
        if (typeof window.startBewerbungsFlow === "function") {
          window.startBewerbungsFlow();
          // Simulate typing the correct URL, then solving the robot check, to advance to results
          setTimeout(function () {
            var input = flow.querySelector("#omniInput");
            if (input) {
              input.value = "dreamjob.io";
              input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
            }
          }, 50);
          setTimeout(function () {
            solveRobotCheck(flow);
          }, 120);
        }
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Bewerbung — Results");
      },
    },
    {
      label: "Bewerbung: Apply (dictation)",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        var flow = document.getElementById("tjFlow");
        if (flow) flow.style.display = "block";
        if (typeof window.startBewerbungsFlow === "function") {
          window.startBewerbungsFlow();
          // newtab → robot check → results → detail → apply
          var steps = [
            function () {
              var input = flow.querySelector("#omniInput");
              if (input) {
                input.value = "dreamjob.io";
                input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
              }
            },
            function () {
              solveRobotCheck(flow);
            },
            function () {
              // dismiss cookie wall
              var btn = flow.querySelector("#modalAccept");
              if (btn) btn.click();
            },
            function () {
              // dismiss newsletter wall
              var btn = flow.querySelector("#modalAccept");
              if (btn) btn.click();
            },
            function () {
              // load more results
              var more = flow.querySelector("#djMore");
              if (more) more.click();
            },
            function () {
              // click the matching job card
              var match = flow.querySelector('.jobcard[data-match="1"]');
              if (match) match.click();
            },
            function () {
              // click apply button on detail page
              var applyBtn = flow.querySelector("#dtApply");
              if (applyBtn) applyBtn.click();
            },
          ];
          var delay = 80;
          steps.forEach(function (fn, i) {
            setTimeout(fn, delay * (i + 1));
          });
        }
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Bewerbung — Apply/Dictation");
      },
    },
    {
      label: "Captcha",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        if (typeof window.openCaptcha === "function") window.openCaptcha();
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Captcha");
      },
    },
    {
      label: "Apply Button Phase",
      jump: function () {
        hideAll();
        ensureTimerRunning();
        var applyBtn = document.querySelector(".applyButton");
        if (applyBtn) {
          applyBtn.style.display = "block";
          applyBtn.classList.remove("inactive", "tj-btn--danger", "apply-shake");
          applyBtn.classList.add("tj-btn--primary");
          var p = applyBtn.querySelector("p");
          if (p && typeof window.t === "function") p.textContent = window.t("apply.button");
        }
        if (typeof window.activateApplyPhase === "function") window.activateApplyPhase();
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Apply button phase");
      },
    },
    {
      label: "Win Screen",
      jump: function () {
        hideAll();
        if (typeof window.showWinScreen === "function") window.showWinScreen(false);
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Win screen");
      },
    },
    {
      label: "Game Over",
      jump: function () {
        hideAll();
        if (typeof window.showGameOverScreen === "function") window.showGameOverScreen("debug");
        if (typeof window.showGuide === "function") window.showGuide("DEBUG: Game over screen");
      },
    },
  ];

  // ── build the panel DOM ───────────────────────────────────────────────────────

  var style = document.createElement("style");
  style.textContent = [
    "#dbgNav{position:fixed;top:12px;right:12px;z-index:99999;font-family:monospace;font-size:12px;background:#1a1a2e;color:#e0e0ff;border:1px solid #444488;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.7);min-width:170px;user-select:none}",
    "#dbgNav .dbg-hd{display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:#12122a;border-radius:6px 6px 0 0;cursor:pointer;gap:8px}",
    "#dbgNav .dbg-hd span{font-weight:bold;letter-spacing:.05em}",
    "#dbgNav .dbg-toggle{background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;line-height:1;padding:0 2px}",
    "#dbgNav .dbg-body{padding:6px 4px 8px}",
    "#dbgNav button.dbg-btn{display:block;width:100%;text-align:left;background:none;border:none;color:#c8c8ff;cursor:pointer;padding:4px 8px;border-radius:4px;font-size:12px;font-family:monospace;transition:background .1s}",
    "#dbgNav button.dbg-btn:hover{background:#2a2a5a;color:#fff}",
    "#dbgNav.dbg-collapsed .dbg-body{display:none}",
    "#dbgNav.dbg-collapsed{min-width:0}",
  ].join("");
  document.head.appendChild(style);

  var panel = document.createElement("div");
  panel.id = "dbgNav";
  panel.innerHTML =
    '<div class="dbg-hd"><span>🛠 Debug Nav</span><button class="dbg-toggle" title="Einklappen">▲</button></div>' +
    '<div class="dbg-body"></div>';
  document.body.appendChild(panel);

  var body = panel.querySelector(".dbg-body");
  STOPS.forEach(function (stop) {
    var btn = document.createElement("button");
    btn.className = "dbg-btn";
    btn.textContent = "▶ " + stop.label;
    btn.addEventListener("click", stop.jump);
    body.appendChild(btn);
  });

  // collapse toggle
  var toggleBtn = panel.querySelector(".dbg-toggle");
  toggleBtn.addEventListener("click", function () {
    var collapsed = panel.classList.toggle("dbg-collapsed");
    toggleBtn.textContent = collapsed ? "▼" : "▲";
    toggleBtn.title = collapsed ? "Ausklappen" : "Einklappen";
  });
})();
