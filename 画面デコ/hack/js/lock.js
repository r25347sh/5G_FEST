/**
 * LockSystem — stealth mode for SHADOWSCRIPT
 * No lock badge, no LOCKED overlay. Screen looks normal while armed.
 * Mouse interaction while armed -> alert siren (audio).
 * Unlock / off sequences remain hidden (never shown on screen).
 */
(function (global) {
  "use strict";

  const DEFAULTS = {
    audioSrc: "https://r25347sh.github.io/free_note/lock/alert.mp3",
    unlockSequence: "asobiseminar",
    offSequence: "off",
    enterCountRequired: 3,
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

    initialized = true;
  }

  function startLock() {
    if (isLocked) return;
    if (!initialized) init();

    isLocked = true;
    isAlerting = false;
    resetUnlockState();
    resetOffState();

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
  }

  function unlock() {
    if (!isLocked) return;
    stopAlert();
    isLocked = false;
    resetUnlockState();
    resetOffState();

    if (keydownHandler) {
      window.removeEventListener("keydown", keydownHandler, true);
      keydownHandler = null;
    }
    mouseHandlers.forEach(function (h) {
      window.removeEventListener(h.evtName, h.handler, true);
    });
    mouseHandlers = [];

    if (typeof options.onUnlock === "function") options.onUnlock();
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

    if (typeof options.onAlertStart === "function") options.onAlertStart();
  }

  function stopAlert() {
    if (!isAlerting) return;
    isAlerting = false;
    resetOffState();

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (typeof options.onAlertStop === "function") options.onAlertStop();
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
