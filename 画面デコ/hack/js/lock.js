/**
 * LockSystem — adapted for SHADOWSCRIPT black-ops UI
 * No lock emoji. Activate only via command: activate lock.js
 * Audio: original free_note path
 */
(function (global) {
  "use strict";

  const DEFAULTS = {
    audioSrc: "https://r25347sh.github.io/free_note/lock/alert.mp3",
    unlockSequence: "asobiseminar",
    offSequence: "off",
    enterCountRequired: 3,
    overlayId: "shadow-lock-overlay",
    mouseEvents: [
      "mousedown", "mouseup", "click", "dblclick", "mousemove",
      "mouseenter", "mouseleave", "contextmenu", "wheel",
      "pointerdown", "pointermove"
    ]
  };

  let options = {};
  let isLocked = false;
  let isAlerting = false;
  let audio = null;
  let unlockBuffer = "";
  let unlockEnterCount = 0;
  let unlockPhase = "typing";
  let offBuffer = "";
  let offEnterCount = 0;
  let offPhase = "typing";
  let keydownHandler = null;
  let mouseHandlers = [];
  let initialized = false;

  function init(userOptions) {
    if (initialized) return;
    options = Object.assign({}, DEFAULTS, userOptions || {});

    if (options.audioSrc) {
      audio = new Audio(options.audioSrc);
      audio.loop = true;
      audio.preload = "auto";
      audio.addEventListener("error", function () {
        console.warn("[LockSystem] audio load failed:", options.audioSrc);
      });
    }

    ensureOverlay();
    initialized = true;
    console.log("[LockSystem] ready (await activate lock.js)");
  }

  function ensureOverlay() {
    var overlay = document.getElementById(options.overlayId);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = options.overlayId;
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText = [
      "display:none",
      "position:fixed",
      "inset:0",
      "z-index:10000",
      "background:rgba(5,3,12,0.94)",
      "color:#f5f0ff",
      "font-family:'JetBrains Mono',monospace",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "text-align:center",
      "user-select:none",
      "-webkit-user-select:none",
      "backdrop-filter:blur(8px)"
    ].join(";");

    overlay.innerHTML =
      '<div style="border:1px solid rgba(255,51,85,0.55);padding:36px 48px;max-width:520px;' +
      'box-shadow:0 0 40px rgba(255,51,85,0.25),0 0 80px rgba(255,45,149,0.12);' +
      'background:rgba(12,6,18,0.95);">' +
      '<div style="font-size:11px;letter-spacing:0.2em;color:#ff3355;margin-bottom:10px;">SYSTEM · ACCESS DENIED</div>' +
      '<div style="font-size:28px;font-weight:700;letter-spacing:0.14em;color:#ff3355;' +
      'text-shadow:0 0 16px rgba(255,51,85,0.6);margin-bottom:14px;">LOCKED</div>' +
      '<div style="font-size:12px;color:rgba(245,240,255,0.55);line-height:1.6;">' +
      'Session sealed.<br>Unauthorized interaction will trigger alert.</div>' +
      '<div style="margin-top:18px;font-size:10px;color:rgba(0,245,255,0.45);letter-spacing:0.08em;">' +
      'SHADOWSCRIPT · LOCK MODULE</div>' +
      "</div>";

    document.body.appendChild(overlay);
    return overlay;
  }

  function startLock() {
    if (isLocked) return;
    if (!initialized) init();

    isLocked = true;
    isAlerting = false;
    resetUnlockState();
    resetOffState();

    var overlay = ensureOverlay();
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    keydownHandler = handleKeydown;
    window.addEventListener("keydown", keydownHandler, true);

    mouseHandlers = [];
    options.mouseEvents.forEach(function (evtName) {
      var handler = function () {
        if (isLocked && !isAlerting) startAlert();
      };
      window.addEventListener(evtName, handler, true);
      mouseHandlers.push({ evtName: evtName, handler: handler });
    });

    if (typeof options.onLock === "function") options.onLock();
    console.log("[LockSystem] locked");
  }

  function unlock() {
    if (!isLocked) return;
    stopAlert();
    isLocked = false;
    resetUnlockState();
    resetOffState();

    var overlay = document.getElementById(options.overlayId);
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";

    if (keydownHandler) {
      window.removeEventListener("keydown", keydownHandler, true);
      keydownHandler = null;
    }
    mouseHandlers.forEach(function (h) {
      window.removeEventListener(h.evtName, h.handler, true);
    });
    mouseHandlers = [];

    if (typeof options.onUnlock === "function") options.onUnlock();
    console.log("[LockSystem] unlocked");
  }

  function startAlert() {
    if (!isLocked || isAlerting) return;
    isAlerting = true;
    resetOffState();

    if (audio) {
      audio.currentTime = 0;
      var p = audio.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }

    var overlay = document.getElementById(options.overlayId);
    if (overlay) {
      overlay.style.background = "rgba(18,0,4,0.96)";
      var box = overlay.querySelector("div");
      if (box) {
        box.style.borderColor = "rgba(255,51,85,0.9)";
        box.style.boxShadow = "0 0 50px rgba(255,51,85,0.45), 0 0 100px rgba(255,45,149,0.2)";
      }
    }

    if (typeof options.onAlertStart === "function") options.onAlertStart();
    console.log("[LockSystem] alert started");
  }

  function stopAlert() {
    if (!isAlerting) return;
    isAlerting = false;
    resetOffState();

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    var overlay = document.getElementById(options.overlayId);
    if (overlay) {
      overlay.style.background = "rgba(5,3,12,0.94)";
      var box = overlay.querySelector("div");
      if (box) {
        box.style.borderColor = "rgba(255,51,85,0.55)";
        box.style.boxShadow = "0 0 40px rgba(255,51,85,0.25), 0 0 80px rgba(255,45,149,0.12)";
      }
    }

    if (typeof options.onAlertStop === "function") options.onAlertStop();
    console.log("[LockSystem] alert stopped");
  }

  function handleKeydown(e) {
    if (!isLocked) return;
    if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].indexOf(e.key) !== -1) {
      e.preventDefault();
    }
    var key = e.key;
    if (isAlerting) {
      processOffSequence(key, e);
      return;
    }
    processUnlockSequence(key, e);
  }

  function processUnlockSequence(key, e) {
    if (unlockPhase === "typing") {
      var expected = options.unlockSequence;
      var nextChar = expected[unlockBuffer.length];
      if (key.length === 1 && key.toLowerCase() === nextChar) {
        unlockBuffer += key.toLowerCase();
        e.preventDefault();
        if (unlockBuffer === expected) {
          unlockPhase = "enters";
          unlockEnterCount = 0;
        }
      } else if (key === "Enter" || key === "Backspace" || key === "Escape") {
        resetUnlockState();
      } else if (key.length === 1) {
        resetUnlockState();
      }
    } else if (unlockPhase === "enters") {
      if (key === "Enter") {
        e.preventDefault();
        unlockEnterCount += 1;
        if (unlockEnterCount >= options.enterCountRequired) unlock();
      } else {
        resetUnlockState();
      }
    }
  }

  function processOffSequence(key, e) {
    if (offPhase === "typing") {
      var expected = options.offSequence;
      var nextChar = expected[offBuffer.length];
      if (key.length === 1 && key.toLowerCase() === nextChar) {
        offBuffer += key.toLowerCase();
        e.preventDefault();
        if (offBuffer === expected) {
          offPhase = "enters";
          offEnterCount = 0;
        }
      } else if (key === "Enter" || key === "Backspace" || key === "Escape") {
        resetOffState();
      } else if (key.length === 1) {
        resetOffState();
      }
    } else if (offPhase === "enters") {
      if (key === "Enter") {
        e.preventDefault();
        offEnterCount += 1;
        if (offEnterCount >= options.enterCountRequired) stopAlert();
      } else {
        resetOffState();
      }
    }
  }

  function resetUnlockState() {
    unlockBuffer = "";
    unlockEnterCount = 0;
    unlockPhase = "typing";
  }

  function resetOffState() {
    offBuffer = "";
    offEnterCount = 0;
    offPhase = "typing";
  }

  global.LockSystem = {
    init: init,
    startLock: startLock,
    unlock: unlock,
    startAlert: startAlert,
    stopAlert: stopAlert,
    isLocked: function () { return isLocked; },
    isAlerting: function () { return isAlerting; },
    getState: function () {
      return {
        isLocked: isLocked,
        isAlerting: isAlerting,
        unlockBuffer: unlockBuffer,
        unlockEnterCount: unlockEnterCount,
        unlockPhase: unlockPhase
      };
    }
  };
})(typeof window !== "undefined" ? window : this);
