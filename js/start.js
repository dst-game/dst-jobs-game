/* ============================================================
   start.js — cinematic "Traumjob / 5 vor 12" start screen.
   Saves the player's dream job to localStorage (tj_traumjob),
   then hands off to the existing intro-video flow.
   ============================================================ */
(function () {
  "use strict";

  var TJ_KEY = "tj_traumjob";
  function saveDreamJob(v) {
    try { localStorage.setItem(TJ_KEY, v); } catch (e) {}
  }

  function init() {
    var overlay = document.getElementById("tjStart");
    if (!overlay) return;

    var field = overlay.querySelector(".dj-field");
    var input = overlay.querySelector("#tjDream");
    var startBtn = overlay.querySelector("#tjStartBtn");

    // Hide the game's own in-laptop intro screen — this overlay replaces it.
    var oldIntro = document.querySelector(".introScreen");
    if (oldIntro) oldIntro.style.display = "none";

    function begin() {
      var val = (input && input.value ? input.value : "").trim();
      if (!val) {
        if (field) {
          field.classList.add("shake");
          setTimeout(function () { field.classList.remove("shake"); }, 450);
        }
        if (input) input.focus();
        return;
      }
      saveDreamJob(val);

      // Start the intro video synchronously (keeps the user-gesture context so
      // the video's audio is allowed to play), then fade the overlay out over it.
      var gameStart = document.getElementById("startBtn");
      if (gameStart) gameStart.click();

      overlay.classList.add("done");
      setTimeout(function () { overlay.style.display = "none"; }, 600);
    }

    if (startBtn) startBtn.addEventListener("click", begin);
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") begin();
      });
      // Autofocus so the player can type straight away.
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
