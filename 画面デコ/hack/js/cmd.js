/**
 * ShadowScript command console
 * Grammar:
 *   activate <module>     — load / enable a subsystem
 *   deactivate <module>   — disable when supported
 *   <verb> [args...]      — ops commands
 * Modules and verbs are English-only, black-ops tone.
 */
(function (global) {
  "use strict";

  var HISTORY = [];
  var HIST_IDX = -1;
  var MODULES = Object.create(null);
  var FLAGS = {
    matrix: true,
    particles: true,
    alertFeed: true,
    noise: false,
    stealth: true
  };

  function toast(title, body, crit) {
    var t = document.getElementById("toast");
    if (!t) return;
    var te = t.querySelector(".toast-title");
    var be = t.querySelector(".toast-body");
    if (te) te.textContent = title;
    if (be) be.textContent = body;
    t.classList.toggle("crit-toast", !!crit);
    t.classList.add("show");
    clearTimeout(toast._tm);
    toast._tm = setTimeout(function () { t.classList.remove("show"); }, crit ? 3200 : 2400);
  }

  function setMode(label, cls) {
    var mode = document.getElementById("status-mode");
    if (!mode) return;
    mode.textContent = label;
    mode.className = cls || "label-warn";
  }

  /* ---------- module registry ---------- */

  MODULES["lock.js"] = {
    desc: "Session lock / alert siren (free_note audio)",
    activate: function () {
      if (!global.LockSystem) {
        toast("ERR", "lock module not loaded", true);
        return false;
      }
      if (global.LockSystem.isLocked && global.LockSystem.isLocked()) {
        toast("LOCK", "already sealed");
        return true;
      }
      global.LockSystem.startLock();
      setMode("LOCKED", "label-crit");
      return true;
    },
    deactivate: function () {
      toast("LOCK", "use unlock sequence — deactivate denied");
      return false;
    }
  };

  MODULES["lock"] = MODULES["lock.js"];

  MODULES["matrix"] = {
    desc: "Background matrix rain",
    activate: function () {
      var c = document.getElementById("matrix-canvas");
      if (c) c.style.display = "";
      FLAGS.matrix = true;
      toast("MATRIX", "rain online");
      return true;
    },
    deactivate: function () {
      var c = document.getElementById("matrix-canvas");
      if (c) c.style.display = "none";
      FLAGS.matrix = false;
      toast("MATRIX", "rain offline");
      return true;
    }
  };

  MODULES["particles"] = {
    desc: "Ambient particle field",
    activate: function () {
      var a = document.querySelector(".ambient");
      if (a) a.style.display = "";
      FLAGS.particles = true;
      toast("FX", "particles online");
      return true;
    },
    deactivate: function () {
      var a = document.querySelector(".ambient");
      if (a) a.style.display = "none";
      FLAGS.particles = false;
      toast("FX", "particles offline");
      return true;
    }
  };

  MODULES["noise"] = {
    desc: "High-intensity alert noise mode",
    activate: function () {
      FLAGS.noise = true;
      global.__SHADOW_NOISE = true;
      setMode("NOISE", "label-crit");
      toast("NOISE", "alert intensity elevated", true);
      return true;
    },
    deactivate: function () {
      FLAGS.noise = false;
      global.__SHADOW_NOISE = false;
      setMode("STEALTH", "label-warn");
      toast("NOISE", "intensity normalized");
      return true;
    }
  };

  MODULES["stealth"] = {
    desc: "Stealth posture (UI threat label)",
    activate: function () {
      FLAGS.stealth = true;
      setMode("STEALTH", "label-warn");
      var thr = document.getElementById("hud-threat");
      if (thr) { thr.textContent = "LOW"; thr.className = "val"; }
      toast("STEALTH", "posture engaged");
      return true;
    },
    deactivate: function () {
      FLAGS.stealth = false;
      setMode("EXPOSED", "label-crit");
      var thr = document.getElementById("hud-threat");
      if (thr) { thr.textContent = "HIGH"; thr.className = "val val-red"; }
      toast("STEALTH", "posture dropped — exposed", true);
      return true;
    }
  };

  MODULES["hud"] = {
    desc: "Bottom telemetry HUD",
    activate: function () {
      var h = document.querySelector(".hud-bottom");
      if (h) h.style.display = "";
      toast("HUD", "telemetry visible");
      return true;
    },
    deactivate: function () {
      var h = document.querySelector(".hud-bottom");
      if (h) h.style.display = "none";
      toast("HUD", "telemetry hidden");
      return true;
    }
  };

  MODULES["siren"] = {
    desc: "Force alert audio if lock is active",
    activate: function () {
      if (!global.LockSystem || !global.LockSystem.isLocked || !global.LockSystem.isLocked()) {
        toast("SIREN", "lock not active — activate lock.js first", true);
        return false;
      }
      if (global.LockSystem.startAlert) global.LockSystem.startAlert();
      toast("SIREN", "alert forced", true);
      return true;
    },
    deactivate: function () {
      if (global.LockSystem && global.LockSystem.stopAlert) global.LockSystem.stopAlert();
      toast("SIREN", "alert silenced");
      return true;
    }
  };

  /* ---------- verbs ---------- */

  function cmdHelp() {
    var lines = [
      "activate <module>     enable subsystem",
      "deactivate <module>   disable subsystem",
      "status                session / flags",
      "modules               list activatable modules",
      "scan [cidr]           recon sweep (sim)",
      "threat <L|M|H|C>      set threat label",
      "route anonymize       cosmetic route hop",
      "inject                stage payload line",
      "flood                 burst alert toast",
      "silence               stop lock siren if any",
      "clear                 clear command history",
      "history               show recent commands",
      "whoami                operator identity",
      "uptime                page session clock",
      "help                  this list"
    ];
    toast("HELP", lines[0] + " · " + (lines.length - 1) + " more — see console");
    console.log("%c[SHADOWSCRIPT CMD]", "color:#9b5de5;font-weight:bold");
    lines.forEach(function (l) { console.log("  " + l); });
    return true;
  }

  function cmdModules() {
    var seen = [];
    var list = [];
    Object.keys(MODULES).forEach(function (k) {
      if (seen.indexOf(MODULES[k]) !== -1) return;
      seen.push(MODULES[k]);
      list.push(k + " — " + (MODULES[k].desc || ""));
    });
    toast("MODULES", list.length + " registered — open console");
    console.log("%c[MODULES]", "color:#00f5ff");
    list.forEach(function (l) { console.log("  " + l); });
    return true;
  }

  function cmdStatus() {
    var locked = global.LockSystem && global.LockSystem.isLocked && global.LockSystem.isLocked();
    var alerting = global.LockSystem && global.LockSystem.isAlerting && global.LockSystem.isAlerting();
    var msg = "lock=" + (locked ? "SEALED" : "open") +
      " siren=" + (alerting ? "ON" : "off") +
      " matrix=" + (FLAGS.matrix ? "on" : "off") +
      " noise=" + (FLAGS.noise ? "ON" : "off") +
      " stealth=" + (FLAGS.stealth ? "on" : "off");
    toast("STATUS", msg);
    console.log("[STATUS]", {
      lock: locked,
      siren: alerting,
      flags: FLAGS,
      history: HISTORY.length
    });
    return true;
  }

  function cmdScan(args) {
    var cidr = args[0] || "10.0.0.0/24";
    toast("SCAN", "sweep " + cidr + " — 23 hosts · 9 open");
    console.log("[SCAN] target=" + cidr);
    console.log("  10.0.0.1    up   22/tcp open  ssh");
    console.log("  10.0.0.42   up   443/tcp open  https");
    console.log("  10.0.0.88   up   2222/tcp open  ssh-alt");
    return true;
  }

  function cmdThreat(args) {
    var lvl = (args[0] || "").toUpperCase();
    var map = { L: "LOW", LOW: "LOW", M: "MED", MED: "MED", H: "HIGH", HIGH: "HIGH", C: "CRIT", CRIT: "CRIT" };
    var v = map[lvl];
    if (!v) {
      toast("THREAT", "usage: threat <L|M|H|C>", true);
      return false;
    }
    var thr = document.getElementById("hud-threat");
    if (thr) {
      thr.textContent = v;
      thr.className = "val" + (v === "HIGH" || v === "CRIT" ? " val-red" : "");
    }
    if (v === "CRIT" || v === "HIGH") setMode(v, "label-crit");
    else if (v === "MED") setMode("CAUTION", "label-warn");
    else setMode("STEALTH", "label-warn");
    toast("THREAT", "level -> " + v, v === "CRIT");
    return true;
  }

  function cmdRoute(args) {
    if ((args[0] || "").toLowerCase() === "anonymize") {
      toast("ROUTE", "17 hops · exit rotated");
      console.log("[ROUTE] anonymize complete · exit node rotated");
      return true;
    }
    toast("ROUTE", "usage: route anonymize");
    return false;
  }

  function cmdInject() {
    toast("INJECT", "payload staged · shadow window");
    console.log("[INJECT] polymorphic payload queued");
    return true;
  }

  function cmdFlood() {
    toast("ALERT", "burst — external SOC signature match", true);
    setTimeout(function () {
      toast("ALERT", "trace packets on uplink · 4 hops", true);
    }, 900);
    setTimeout(function () {
      toast("ALERT", "response system stage 2", true);
    }, 1800);
    return true;
  }

  function cmdSilence() {
    if (global.LockSystem && global.LockSystem.stopAlert) {
      global.LockSystem.stopAlert();
      toast("SILENCE", "siren stopped");
      return true;
    }
    toast("SILENCE", "no active siren");
    return true;
  }

  function cmdClear() {
    HISTORY.length = 0;
    HIST_IDX = -1;
    toast("CLEAR", "command history wiped");
    return true;
  }

  function cmdHistory() {
    toast("HISTORY", HISTORY.length ? HISTORY.slice(-5).join(" | ") : "(empty)");
    console.log("[HISTORY]", HISTORY.slice());
    return true;
  }

  function cmdWhoami() {
    toast("ID", "ghost-01 · ops · shadow@local");
    return true;
  }

  function cmdUptime() {
    var sec = Math.floor((Date.now() - (global.__SHADOW_BOOT || Date.now())) / 1000);
    toast("UPTIME", sec + "s since boot");
    return true;
  }

  function cmdActivate(args) {
    var name = (args[0] || "").toLowerCase();
    if (!name) {
      toast("ACTIVATE", "usage: activate <module>", true);
      return false;
    }
    var mod = MODULES[name];
    if (!mod) {
      toast("ACTIVATE", "unknown module: " + name, true);
      return false;
    }
    return mod.activate();
  }

  function cmdDeactivate(args) {
    var name = (args[0] || "").toLowerCase();
    if (!name) {
      toast("DEACTIVATE", "usage: deactivate <module>", true);
      return false;
    }
    var mod = MODULES[name];
    if (!mod || typeof mod.deactivate !== "function") {
      toast("DEACTIVATE", "unknown or non-toggle: " + name, true);
      return false;
    }
    return mod.deactivate();
  }

  function parse(line) {
    var raw = String(line || "").trim();
    if (!raw) return { ok: false, empty: true };
    var parts = raw.split(/\s+/);
    var verb = parts[0].toLowerCase();
    var args = parts.slice(1);
    return { ok: true, verb: verb, args: args, raw: raw };
  }

  function exec(line) {
    var p = parse(line);
    if (p.empty) return true;
    if (!p.ok) return false;

    HISTORY.push(p.raw);
    if (HISTORY.length > 50) HISTORY.shift();
    HIST_IDX = HISTORY.length;

    switch (p.verb) {
      case "activate": return cmdActivate(p.args);
      case "deactivate": return cmdDeactivate(p.args);
      case "help":
      case "?": return cmdHelp();
      case "modules":
      case "ls": return cmdModules();
      case "status":
      case "stat": return cmdStatus();
      case "scan":
      case "nmap": return cmdScan(p.args);
      case "threat": return cmdThreat(p.args);
      case "route": return cmdRoute(p.args);
      case "inject": return cmdInject();
      case "flood": return cmdFlood();
      case "silence":
      case "mute": return cmdSilence();
      case "clear": return cmdClear();
      case "history":
      case "hist": return cmdHistory();
      case "whoami":
      case "id": return cmdWhoami();
      case "uptime": return cmdUptime();
      default:
        toast("CMD", "unknown: " + p.verb, true);
        return false;
    }
  }

  function bindInput(input) {
    if (!input) return;
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var v = input.value;
        input.value = "";
        exec(v);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!HISTORY.length) return;
        HIST_IDX = Math.max(0, HIST_IDX - 1);
        input.value = HISTORY[HIST_IDX] || "";
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!HISTORY.length) return;
        HIST_IDX = Math.min(HISTORY.length, HIST_IDX + 1);
        input.value = HIST_IDX >= HISTORY.length ? "" : (HISTORY[HIST_IDX] || "");
      }
    });
  }

  function register(name, mod) {
    if (!name || !mod || typeof mod.activate !== "function") return false;
    MODULES[String(name).toLowerCase()] = mod;
    return true;
  }

  global.__SHADOW_BOOT = Date.now();
  global.ShadowCMD = {
    exec: exec,
    parse: parse,
    register: register,
    bindInput: bindInput,
    flags: FLAGS,
    toast: toast
  };

  function boot() {
    bindInput(document.getElementById("cmd-input"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : this);
