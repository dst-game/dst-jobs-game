/* ============================================================
   bewerbung.js — "Traumjob" application flow (screens 1–4).
   Ported from the React design prototype to vanilla JS.

   Renders INSIDE the laptop screen (#tjFlow lives in .laptop-screen).
   It reuses the desk furniture instead of its own chrome:
     • the right-rail clock/timer  (startTimer / applyPunishment)
     • the left-rail Hase bubble    (showGuide)

   Flow:  successful login -> startBewerbungsFlow()
          1) Neuer Tab   – type a job-portal URL in the address bar
          2) Ergebnisse  – find your dream job among distractors
          3) Detail      – the job listing + "Jetzt bewerben"
          4) Anschreiben – teleprompter: type the dictated line exactly
          -> "CV hochladen" hands off to the existing game (showFileExplorer()).

   All copy is localised through lang.js via t("flow.…"); the dream job
   the player typed and the uploaded file contents stay untranslated.
   ============================================================ */
(function () {
  "use strict";

  /* ---- i18n helper (t() is global, defined in lang.js) ---- */
  function tr(key) {
    return typeof window.t === "function" ? window.t(key) : key;
  }

  /* ---- tick off an objective in the left rail (markStep lives in script.js) ---- */
  function markStep(id) {
    if (typeof window.markStep === "function") window.markStep(id);
  }

  /* ---- data ---- */
  // dreamjob.io is a deliberately awful fictional job portal: buried listings,
  // fake "top" ads, consent walls and a chatbot. (The win/game-over screens
  // nudge the player toward jobs.derstandard.at / finden.at.)
  var TJ_KEY = "tj_traumjob";
  var PLATFORM = "dreamjob.io";
  var PLATFORM_URL = "dreamjob.io";

  function loadDreamJob() {
    try {
      return (localStorage.getItem(TJ_KEY) || "").trim();
    } catch (e) {
      return "";
    }
  }

  var DISTRACTOR_ICONS = [
    "🥕",
    "🐢",
    "🧦",
    "☁️",
    "🫧",
    "🦄",
    "🪨",
    "🧅",
    "🛎️",
    "📠",
    "🧊",
  ];
  // Fake "Top-Treffer" trap and "Anzeige" ads on distractors — never the match.
  var TOP_BADGE_INDEX = 0; // d1 wears a misleading ⭐ Top-Treffer badge
  var AD_BADGE_INDICES = [2, 5, 8, 10]; // several distractors flagged as ads
  var VISIBLE_COUNT = 6; // rest hidden behind "Mehr Treffer laden"

  function buildDistractors() {
    return DISTRACTOR_ICONS.map(function (icon, i) {
      var n = i + 1;
      return {
        icon: icon,
        title: tr("flow.d" + n + ".title"),
        co: tr("flow.d" + n + ".co"),
        loc: tr("flow.d" + n + ".loc"),
        pay: tr("flow.d" + n + ".pay"),
        tags: tr("flow.d" + n + ".tags").split(","),
        match: false,
        topBadge: i === TOP_BADGE_INDEX,
        adBadge: AD_BADGE_INDICES.indexOf(i) !== -1,
      };
    });
  }

  function matchListing(dreamJob) {
    return {
      icon: "⭐",
      title: dreamJob || tr("flow.match.titleFallback"),
      co: tr("flow.match.co"),
      loc: tr("flow.match.loc"),
      pay: tr("flow.match.pay"),
      tags: tr("flow.match.tags").split(","),
      match: true,
    };
  }

  function buildListings(dreamJob) {
    var list = buildDistractors();
    // Bury the real match past the initial page so the player must "load more"
    // and scroll through the junk to find it.
    list.splice(7, 0, matchListing(dreamJob));
    return list;
  }

  function jobDetail(dreamJob) {
    return {
      title: dreamJob || tr("flow.match.titleFallback"),
      co: tr("flow.detail.co"),
      meta: tr("flow.detail.meta"),
      chips: [
        tr("flow.chip.1"),
        tr("flow.chip.2"),
        tr("flow.chip.3"),
        tr("flow.chip.4"),
      ],
      introPre: tr("flow.detail.introPre"),
      introPost: tr("flow.detail.introPost"),
      duties: [tr("flow.duty.1"), tr("flow.duty.2"), tr("flow.duty.3")],
      perks: [tr("flow.perk.1"), tr("flow.perk.2"), tr("flow.perk.3")],
    };
  }

  // Screens: newtab → results → detail → apply, then CV-upload hands off to the
  // existing game. Navigation uses state.history (see go/navBack/navFwd).

  /* ---- helpers ---- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function chromeFor(key) {
    var q = encodeURIComponent(state.dreamJob || "traumjob");
    switch (key) {
      case "newtab":
        return { tab: tr("flow.newtab.tab"), fav: "+", scheme: "", addr: "" };
      case "results":
        return {
          tab: PLATFORM,
          fav: "★",
          scheme: "https://",
          addr: PLATFORM_URL + "/jobs?q=" + q,
        };
      case "detail":
        return {
          tab: PLATFORM,
          fav: "★",
          scheme: "https://",
          addr: PLATFORM_URL + "/job/traum-001",
        };
      case "apply":
        return {
          tab: tr("flow.nav.application") + " · " + PLATFORM,
          fav: "★",
          scheme: "https://",
          addr: PLATFORM_URL + "/job/traum-001/bewerben",
        };
      default:
        return { tab: tr("flow.newtab.tab"), fav: "+", scheme: "", addr: "" };
    }
  }

  /* ---- the rabbit coach speaks through the left guide-rail ---- */
  var lastGuide = "";
  function guide(msg) {
    if (msg === lastGuide) return;
    lastGuide = msg;
    if (typeof window.showGuide === "function") window.showGuide(msg);
  }
  function guideForScreen() {
    if (state.screen === "newtab")
      guide(
        tr("flow.guide.newtabPre") + PLATFORM + tr("flow.guide.newtabPost"),
      );
    else if (state.screen === "results") guide(tr("flow.guide.results"));
    else if (state.screen === "detail") guide(tr("flow.guide.detail"));
    else if (state.screen === "apply") guide(tr("flow.guide.applyScreen"));
  }

  /* ---- state ---- */
  var state = null;

  function freshState() {
    var dj = loadDreamJob();
    return {
      dreamJob: dj,
      screen: "newtab",
      listings: buildListings(dj),
      detail: jobDetail(dj),
      prevLen: 0, // typed length last seen by updateDictate (for per-typo penalty)
      cookieDismissed: false,
      newsletterDismissed: false,
      expanded: false,
      // real browser-style history so Forward can't skip to a screen you never reached
      history: ["newtab"],
      histIdx: 0,
    };
  }

  function root() {
    return document.getElementById("tjFlow");
  }
  function $(sel) {
    var r = root();
    return r ? r.querySelector(sel) : null;
  }

  /* ============================================================
     SCREEN VIEWS  (Hase lives in the rail; URL is typed in the bar)
     ============================================================ */
  function viewNewTab() {
    // Just the question — the Hase tells the player which address to type.
    return (
      '<div class="page nt"><div class="nt-logo">' +
      esc(tr("flow.newtab.q")) +
      "</div></div>"
    );
  }

  function siteHead(activeApplication) {
    var nav = activeApplication
      ? "<a>" +
        esc(tr("flow.nav.jobs")) +
        '</a><a class="on">' +
        esc(tr("flow.nav.application")) +
        "</a>"
      : '<a class="on">' +
        esc(tr("flow.nav.jobs")) +
        "</a><a>" +
        esc(tr("flow.nav.companies")) +
        "</a><a>" +
        esc(tr("flow.nav.salary")) +
        "</a><a>" +
        esc(tr("flow.nav.profile")) +
        "</a>";
    return (
      '<div class="site-head"><div class="logo">dream<b>job</b>.io</div>' +
      '<nav class="nav">' +
      nav +
      "</nav>" +
      '<div class="acct"><div class="avatar">🙂</div></div></div>'
    );
  }

  function cardHtml(job, idx) {
    var tags = job.tags
      .map(function (tg, ti) {
        var gold = job.match && ti >= 1 ? " gold" : "";
        return '<span class="tag' + gold + '">' + esc(tg) + "</span>";
      })
      .join("");
    var badge = job.topBadge
      ? '<span class="topbadge">' + esc(tr("flow.badge.top")) + "</span>"
      : job.adBadge
        ? '<span class="adbadge">' + esc(tr("flow.badge.ad")) + "</span>"
        : "";
    return (
      '<div class="jobcard' +
      (job.adBadge ? " isad" : "") +
      '" data-idx="' +
      idx +
      '" data-match="' +
      (job.match ? "1" : "0") +
      '">' +
      badge +
      '<div class="co">' +
      job.icon +
      "</div>" +
      '<div class="info"><div class="ttl">' +
      esc(job.title) +
      "</div>" +
      '<div class="sub">' +
      esc(job.co) +
      " · " +
      esc(job.loc) +
      "</div>" +
      '<div class="tags">' +
      tags +
      "</div></div>" +
      '<div class="go"><span class="pay">' +
      esc(job.pay) +
      '</span><span class="view">' +
      esc(tr("flow.card.view")) +
      "</span></div>" +
      "</div>"
    );
  }

  function viewResults() {
    // The match is NOT visually marked AND it sits past the first page, so the
    // player must "load more" and scroll past the junk (and the fake badges).
    var shown = state.expanded
      ? state.listings
      : state.listings.slice(0, VISIBLE_COUNT);
    var cards = shown.map(cardHtml).join("");
    var more = state.expanded
      ? ""
      : '<button class="dj-more" id="djMore">' +
        esc(tr("flow.results.more")) +
        "</button>";

    return (
      "" +
      '<div class="page site">' +
      siteHead(false) +
      '<div class="dj-adbanner" id="djAd"><span class="dj-ad-txt">' +
      esc(tr("flow.ad.banner")) +
      '</span><button class="dj-adx" id="djAdX">✕</button></div>' +
      '<div class="results">' +
      '<div class="searchrow"><div class="sbox"><span class="mag">⌕</span><span class="q">' +
      esc(state.dreamJob || tr("flow.match.titleFallback")) +
      '</span><span class="cur"></span></div>' +
      '<button class="filterbtn">' +
      esc(tr("flow.sort.label")) +
      "</button></div>" +
      '<div class="rescount">' +
      tr("flow.results.count") +
      "</div>" +
      '<div class="joblist">' +
      cards +
      "</div>" +
      more +
      "</div>" +
      "</div>"
    );
  }

  // consent/newsletter walls reuse the same overlay styling (.dj-cookie)
  function modalHtml(kind) {
    return (
      '<div class="dj-cookie" id="djModal"><div class="dj-cookie-card">' +
      '<div class="cc-title">' +
      esc(tr("flow." + kind + ".title")) +
      "</div>" +
      '<div class="cc-body">' +
      esc(tr("flow." + kind + ".body")) +
      "</div>" +
      '<button class="cc-accept" id="modalAccept">' +
      esc(tr("flow." + kind + ".accept")) +
      "</button>" +
      '<button class="cc-reject" id="modalReject">' +
      esc(tr("flow." + kind + ".reject")) +
      "</button>" +
      "</div></div>"
    );
  }
  function resultsModalHtml() {
    if (!state.cookieDismissed) return modalHtml("cookie");
    if (!state.newsletterDismissed) return modalHtml("news");
    return "";
  }

  function viewDetail() {
    var d = state.detail;
    var chips = d.chips
      .map(function (c, i) {
        return (
          '<span class="chip' +
          (i > 1 ? " gold" : "") +
          '">' +
          esc(c) +
          "</span>"
        );
      })
      .join("");
    var duties = d.duties
      .map(function (x) {
        return "<li>" + esc(x) + "</li>";
      })
      .join("");
    var perks = d.perks
      .map(function (x) {
        return "<li>" + esc(x) + "</li>";
      })
      .join("");
    return (
      "" +
      '<div class="page site">' +
      siteHead(false) +
      '<div class="detail">' +
      '<div class="crumbs">' +
      esc(tr("flow.nav.jobs")) +
      " › <b>" +
      esc(d.title) +
      "</b></div>" +
      '<div class="dt-head"><div class="co">⭐</div><div><h1>' +
      esc(d.title) +
      "</h1>" +
      '<div class="meta">' +
      esc(d.co) +
      " · " +
      esc(d.meta) +
      "</div></div></div>" +
      '<div class="chips">' +
      chips +
      "</div>" +
      '<div class="sec"><h3>' +
      esc(tr("flow.detail.about")) +
      "</h3><p>" +
      esc(d.introPre) +
      esc(d.title) +
      esc(d.introPost) +
      "</p></div>" +
      '<div class="sec"><h3>' +
      esc(tr("flow.detail.duties")) +
      "</h3><ul>" +
      duties +
      "</ul></div>" +
      '<div class="sec"><h3>' +
      esc(tr("flow.detail.perks")) +
      "</h3><ul>" +
      perks +
      "</ul></div>" +
      "</div>" +
      '<div class="applybar"><div class="ab-info">' +
      '<button class="cta" id="dtApply">' +
      esc(tr("flow.detail.apply")) +
      ' <span class="arr">→</span></button></div>' +
      "</div>"
    );
  }

  function applyTarget() {
    return (
      tr("flow.apply.targetPre") +
      state.detail.title +
      tr("flow.apply.targetPost")
    );
  }

  function viewApply() {
    var d = state.detail;
    var target = applyTarget();
    return (
      "" +
      '<div class="page site">' +
      siteHead(true) +
      '<div class="apply">' +
      '<div class="ap-head"><div class="step">' +
      esc(tr("flow.apply.step")) +
      "</div>" +
      "<h2>" +
      esc(tr("flow.apply.h2")) +
      "</h2>" +
      '<div class="for">' +
      esc(tr("flow.apply.forPre")) +
      esc(d.title) +
      " · " +
      esc(d.co) +
      "</div></div>" +
      '<div class="dictate">' +
      '<div class="dic-label"><span>' +
      esc(tr("flow.apply.dicLabel")) +
      "</span>" +
      '<span class="count" id="dicCount">0 / ' +
      target.length +
      "</span></div>" +
      '<div class="teleprompter" id="dicTele">' +
      '<span class="done"></span><span class="cursor">' +
      esc(target.charAt(0)) +
      '</span><span class="rest">' +
      esc(target.slice(1)) +
      "</span></div>" +
      '<textarea class="dic-input" id="dicInput" placeholder="' +
      esc(tr("flow.apply.placeholder")) +
      '"></textarea>' +
      '<div class="dic-bar"><i id="dicFill"></i></div>' +
      '<span class="dic-hint" id="dicHint">' +
      esc(tr("flow.apply.hintDefault")) +
      "</span>" +
      "</div>" +
      '<div class="ap-foot solo"><span class="hint"><span class="ic" id="apIc">…</span> <span id="apMsg">' +
      esc(tr("flow.apply.footTodo")) +
      "</span></span>" +
      '<button class="cta" id="apNext" disabled>' +
      esc(tr("flow.apply.cta")) +
      ' <span class="arr">→</span></button></div>' +
      "</div>" +
      "</div>"
    );
  }

  function viewFor(screen) {
    if (screen === "newtab") return viewNewTab();
    if (screen === "results") return viewResults();
    if (screen === "detail") return viewDetail();
    if (screen === "apply") return viewApply();
    return "";
  }

  /* ============================================================
     SHELL + RENDER  (just the browser window — no HUD, no steprail)
     ============================================================ */
  function render() {
    var r = root();
    if (!r) return;

    var chrome = chromeFor(state.screen);
    var isNewTab = state.screen === "newtab";
    var canBack = state.histIdx > 0;
    var canFwd = state.histIdx < state.history.length - 1;

    // On the new-tab screen the omnibox itself is the editable address bar;
    // on the other screens it just displays the current address.
    var omniInner = isNewTab
      ? '<input class="addr" id="omniInput" autocomplete="off" spellcheck="false" placeholder="' +
        esc(tr("flow.omni.ph")) +
        '" /><span class="caret-go">↵</span>'
      : (chrome.scheme ? '<span class="lock">🔒</span>' : "") +
        '<span class="scheme">' +
        esc(chrome.scheme) +
        "</span>" +
        '<span class="addr">' +
        esc(chrome.addr) +
        "</span>" +
        (chrome.addr ? '<span class="caret-go">↵</span>' : "");

    r.innerHTML =
      "" +
      '<div class="flow-root"><div class="win-wrap"><div class="browser" id="tjBrowser">' +
      '<div class="bz-tabs"><div class="traffic"><i></i><i></i><i></i></div>' +
      '<div class="bz-tab active"><span class="fav">' +
      esc(chrome.fav) +
      "</span>" +
      esc(chrome.tab) +
      '<span class="x">×</span></div>' +
      '<div class="bz-tab newtab">+</div></div>' +
      '<div class="bz-bar"><div class="bz-nav">' +
      '<button id="navBack"' +
      (canBack ? "" : " disabled") +
      ' title="Zurück">‹</button>' +
      '<button id="navFwd"' +
      (canFwd ? "" : " disabled") +
      ' title="Vor">›</button>' +
      '<button class="reload" id="navReload" title="Neu laden">⟳</button></div>' +
      '<div class="omnibox' +
      (isNewTab ? " focus" : "") +
      '">' +
      omniInner +
      "</div></div>" +
      '<div class="bz-view" id="tjView">' +
      viewFor(state.screen) +
      "</div>" +
      // nagging chatbot pinned to the browser window (results screen only)
      (state.screen === "results"
        ? '<div class="dj-chat" id="djChat">' +
          esc(tr("flow.chat.bubble")) +
          "</div>"
        : "") +
      // back-to-back consent walls cover the window on the results screen
      (state.screen === "results" ? resultsModalHtml() : "") +
      "</div></div></div>";

    wire();
    guideForScreen();
  }

  function rerender() {
    state.prevLen = 0;
    render();
    var v = $(".bz-view");
    if (v) v.scrollTop = 0;
  }

  // Forward progression from a player action — pushes onto history (and drops
  // any "forward" entries), so Forward only ever re-visits screens truly reached.
  function go(key) {
    if (key === "upload") {
      handoff();
      return;
    }
    state.history = state.history.slice(0, state.histIdx + 1);
    state.history.push(key);
    state.histIdx = state.history.length - 1;
    state.screen = key;
    rerender();
  }
  function navBack() {
    if (state.histIdx <= 0) return;
    state.histIdx--;
    state.screen = state.history[state.histIdx];
    rerender();
  }
  function navFwd() {
    if (state.histIdx >= state.history.length - 1) return;
    state.histIdx++;
    state.screen = state.history[state.histIdx];
    rerender();
  }

  /* ---- event wiring per render ---- */
  function wire() {
    var r = root();
    var back = r.querySelector("#navBack"),
      fwd = r.querySelector("#navFwd"),
      rel = r.querySelector("#navReload");
    if (back) back.addEventListener("click", navBack);
    if (fwd) fwd.addEventListener("click", navFwd);
    if (rel) rel.addEventListener("click", rerender);

    if (state.screen === "newtab") wireNewTab();
    else if (state.screen === "results") wireResults();
    else if (state.screen === "detail") wireDetail();
    else if (state.screen === "apply") wireApply();
  }

  // Normalise an entered address: drop scheme, www. and trailing slash.
  function normalizeUrl(v) {
    return String(v || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "");
  }

  function wireNewTab() {
    var input = $("#omniInput"); // the editable address bar at the top
    if (!input) return;
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      if (!input.value.trim().length) return;
      var v = normalizeUrl(input.value);
      if (v === "jobs.derstandard.at" || v === "finden.at") {
        // The player knows the genuinely good portals — instant win.
        instantWin();
      } else if (v === PLATFORM_URL) {
        markStep("objStep2");
        go("results");
      } else {
        // wrong address: time penalty, stay on the page
        penalty();
      }
    });
    try {
      input.focus();
    } catch (e) {}
  }

  // Shortcut victory: skip dreamjob.io entirely by going straight to a good portal.
  function instantWin() {
    guide(tr("flow.guide.shortcutWin"));
    var r = root();
    if (r) {
      r.style.display = "none";
      r.innerHTML = "";
    }
    if (typeof window.showWinScreen === "function") window.showWinScreen(true);
  }

  function wireResults() {
    var r = root();

    // Consent walls (cookie, then newsletter): both buttons just dismiss the
    // current one (pure friction, no penalty); re-render reveals the next.
    function dismissModal() {
      if (!state.cookieDismissed) state.cookieDismissed = true;
      else if (!state.newsletterDismissed) state.newsletterDismissed = true;
      rerender();
    }
    var mA = r.querySelector("#modalAccept"),
      mR = r.querySelector("#modalReject");
    if (mA) mA.addEventListener("click", dismissModal);
    if (mR) mR.addEventListener("click", dismissModal);

    // "Mehr Treffer laden" reveals the rest of the list (where the match hides).
    var more = r.querySelector("#djMore");
    if (more)
      more.addEventListener("click", function () {
        state.expanded = true;
        rerender();
      });

    // Falling for the ad or the chatbot wastes time (−15s), like a wrong pick.
    var adx = r.querySelector("#djAdX"),
      ad = r.querySelector("#djAd");
    if (ad)
      ad.addEventListener("click", function () {
        penalty();
      });
    // the ✕ is the (only) safe way out — close without the time hit
    if (adx && ad)
      adx.addEventListener("click", function (e) {
        e.stopPropagation();
        ad.style.display = "none";
      });
    var chat = r.querySelector("#djChat");
    if (chat)
      chat.addEventListener("click", function () {
        penalty();
      });

    Array.prototype.forEach.call(
      r.querySelectorAll(".jobcard"),
      function (card) {
        card.addEventListener("click", function () {
          if (card.getAttribute("data-match") === "1") {
            markStep("objStep3");
            go("detail");
            return;
          }
          // wrong pick: shake + time penalty, no reveal — the player keeps looking
          card.classList.add("wrong");
          setTimeout(function () {
            card.classList.remove("wrong");
          }, 460);
          penalty();
        });
      },
    );
  }

  function wireDetail() {
    var b = $("#dtApply");
    if (b)
      b.addEventListener("click", function () {
        go("apply");
      });
  }

  function wireApply() {
    var input = $("#dicInput");
    if (!input) return;
    input.addEventListener("input", updateDictate);
    try {
      input.focus();
    } catch (e) {}
  }

  function updateDictate() {
    var input = $("#dicInput");
    if (!input) return;
    var target = applyTarget();
    var typed = input.value || "";

    var correct = 0;
    while (
      correct < typed.length &&
      correct < target.length &&
      typed[correct] === target[correct]
    )
      correct++;
    var hasError = typed.length > correct;
    var complete = typed === target;
    var pct = Math.round((correct / target.length) * 100);

    // Every typo costs time: each keystroke that adds a wrong character is −15s.
    if (hasError && typed.length > state.prevLen) penalty();
    state.prevLen = typed.length;

    var tele = $("#dicTele");
    if (tele) {
      tele.className = "teleprompter" + (hasError ? " err" : "");
      tele.innerHTML =
        '<span class="done">' +
        esc(target.slice(0, correct)) +
        "</span>" +
        '<span class="cursor">' +
        esc(target.charAt(correct)) +
        "</span>" +
        '<span class="rest">' +
        esc(target.slice(correct + 1)) +
        "</span>";
    }
    var count = $("#dicCount");
    if (count) {
      count.textContent =
        correct + " / " + target.length + (complete ? " ✓" : "");
      count.className = "count" + (complete ? " ok" : "");
    }
    var fill = $("#dicFill");
    if (fill) {
      fill.style.width = pct + "%";
      fill.className = complete ? "ok" : hasError ? "bad" : "";
    }
    var hint = $("#dicHint");
    if (hint) {
      if (hasError) {
        hint.className = "dic-hint bad";
        hint.textContent =
          tr("flow.apply.hintErrorPre") +
          (correct + 1) +
          tr("flow.apply.hintErrorPost");
      } else {
        hint.className = "dic-hint";
        hint.textContent = tr("flow.apply.hintDefault");
      }
    }
    input.className = "dic-input" + (hasError ? " err" : "");
    var ic = $("#apIc"),
      msg = $("#apMsg"),
      next = $("#apNext");
    if (ic) ic.textContent = complete ? "✓" : "…";
    if (msg)
      msg.textContent = complete
        ? tr("flow.apply.footDone")
        : tr("flow.apply.footTodo");
    if (next) next.disabled = !complete;
    if (next && !next.__wired) {
      next.__wired = true;
      next.addEventListener("click", function () {
        if (!next.disabled) go("upload");
      });
    }
    if (complete) markStep("objStep4");

    guide(tr("flow.guide.applyScreen"));
  }

  /* ---- time penalty: handled exactly like the rest of the game ---- */
  function penalty() {
    if (typeof window.applyPunishment === "function") window.applyPunishment();
  }

  /* ============================================================
     ENTRY + HANDOFF
     ============================================================ */
  // Entered after a successful login; the desk timer is already running (started
  // by gameScreen/login), so the flow just renders into the laptop.
  function startFlow() {
    var r = root();
    if (!r) return;
    state = freshState();
    lastGuide = "";
    r.classList.remove("done");
    r.style.display = "block";
    render();
  }

  // CV-upload hands control to the existing file-explorer task (find the right
  // Lebenslauf -> captcha -> submit -> win). The desk timer keeps running.
  function handoff() {
    var r = root();
    if (r) r.classList.add("done");
    setTimeout(function () {
      if (r) {
        r.style.display = "none";
        r.classList.remove("done");
        r.innerHTML = "";
      }
      if (typeof window.showFileExplorer === "function") {
        window.showFileExplorer();
      } else if (typeof window.gameScreen === "function") {
        window.gameScreen();
      }
    }, 500);
  }

  window.startBewerbungsFlow = startFlow;
})();
