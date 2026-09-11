/**
 * ShadowScript command console — elevated ops + animation control
 * Grammar:
 *   activate <module>
 *   deactivate <module>
 *   <verb> [args...]
 */
(function (global) {
  "use strict";

  var HISTORY = [];
  var HIST_IDX = -1;
  var MODULES = Object.create(null);
  var FLAGS = { matrix: true, particles: true, alertFeed: true, noise: false, stealth: true };

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

  function needOps() {
    if (!global.ShadowOps) {
      toast("OPS", "animation core offline", true);
      return null;
    }
    return global.ShadowOps;
  }

  MODULES["lock.js"] = {
    desc: "Session lock / alert siren (stealth arm)",
    activate: function () {
      if (!global.LockSystem) { toast("ERR", "lock module not loaded", true); return false; }
      if (global.LockSystem.isLocked && global.LockSystem.isLocked()) return true;
      global.LockSystem.startLock();
      return true;
    },
    deactivate: function () { return false; }
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
      if (global.ShadowOps) global.ShadowOps.setIntensity(2.5);
      toast("NOISE", "alert intensity elevated", true);
      return true;
    },
    deactivate: function () {
      FLAGS.noise = false;
      global.__SHADOW_NOISE = false;
      setMode("STEALTH", "label-warn");
      if (global.ShadowOps) global.ShadowOps.setIntensity(1);
      toast("NOISE", "intensity normalized");
      return true;
    }
  };

  MODULES["stealth"] = {
    desc: "Stealth posture",
    activate: function () {
      FLAGS.stealth = true;
      setMode("STEALTH", "label-warn");
      if (global.ShadowOps) global.ShadowOps.threat("LOW");
      toast("STEALTH", "posture engaged");
      return true;
    },
    deactivate: function () {
      FLAGS.stealth = false;
      setMode("EXPOSED", "label-crit");
      if (global.ShadowOps) global.ShadowOps.threat("HIGH");
      toast("STEALTH", "posture dropped", true);
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
    desc: "Force alert audio if lock active",
    activate: function () {
      if (!global.LockSystem || !global.LockSystem.isLocked || !global.LockSystem.isLocked()) {
        toast("SIREN", "subsystem not ready", true);
        return false;
      }
      if (global.LockSystem.startAlert) global.LockSystem.startAlert();
      return true;
    },
    deactivate: function () {
      if (global.LockSystem && global.LockSystem.stopAlert) global.LockSystem.stopAlert();
      return true;
    }
  };

  MODULES["c2"] = {
    desc: "C2 beacon channel",
    activate: function () {
      global.__SHADOW_C2 = true;
      setMode("C2-LINK", "label-active");
      toast("C2", "beacon channel up · interval 12s");
      if (global.__SHADOW_C2_TIMER) clearInterval(global.__SHADOW_C2_TIMER);
      global.__SHADOW_C2_TIMER = setInterval(function () {
        if (!global.__SHADOW_C2) return;
        console.log("[C2] heartbeat seq=" + (Math.floor(Math.random() * 9000) + 1000));
      }, 12000);
      return true;
    },
    deactivate: function () {
      global.__SHADOW_C2 = false;
      if (global.__SHADOW_C2_TIMER) { clearInterval(global.__SHADOW_C2_TIMER); global.__SHADOW_C2_TIMER = null; }
      setMode("STEALTH", "label-warn");
      toast("C2", "beacon channel down");
      return true;
    }
  };

  MODULES["exfil"] = {
    desc: "Exfil queue",
    activate: function () {
      global.__SHADOW_EXFIL = true;
      setMode("EXFIL", "label-crit");
      toast("EXFIL", "queue armed · dns channel", true);
      return true;
    },
    deactivate: function () {
      global.__SHADOW_EXFIL = false;
      setMode("STEALTH", "label-warn");
      toast("EXFIL", "queue cleared");
      return true;
    }
  };

  MODULES["cover"] = {
    desc: "Decoy traffic generator",
    activate: function () {
      global.__SHADOW_COVER = true;
      toast("COVER", "decoy traffic online");
      return true;
    },
    deactivate: function () {
      global.__SHADOW_COVER = false;
      toast("COVER", "decoy traffic stopped");
      return true;
    }
  };

  function cmdHelp() {
    var lines = [
      "activate / deactivate <module>",
      "status · modules · scan [cidr] · threat <L|M|H|C>",
      "route anonymize · inject [win text] · flood · silence",
      "beacon · exfil [n] · trace · cover · echo · killswitch",
      "intensity <0.25-4> · glitch [ms] · redalert on|off",
      "freeze · resume · focus <win> · burst [n]",
      "matrix <density> [speed] · hide/show <win>",
      "panic · calm · help"
    ];
    toast("HELP", lines[0] + " · see console");
    console.log("%c[SHADOWSCRIPT CMD]", "color:#9b5de5;font-weight:bold");
    lines.forEach(function (l) { console.log("  " + l); });
    return true;
  }

  function cmdModules() {
    var seen = [], list = [];
    Object.keys(MODULES).forEach(function (k) {
      if (seen.indexOf(MODULES[k]) !== -1) return;
      seen.push(MODULES[k]);
      list.push(k + " — " + (MODULES[k].desc || ""));
    });
    toast("MODULES", list.length + " registered");
    console.log("%c[MODULES]", "color:#00f5ff");
    list.forEach(function (l) { console.log("  " + l); });
    return true;
  }

  function cmdStatus() {
    var alerting = global.LockSystem && global.LockSystem.isAlerting && global.LockSystem.isAlerting();
    var ops = global.ShadowOps && global.ShadowOps.getState ? global.ShadowOps.getState() : {};
    var msg = "matrix=" + (FLAGS.matrix ? "on" : "off") +
      " noise=" + (FLAGS.noise ? "ON" : "off") +
      " c2=" + (global.__SHADOW_C2 ? "up" : "down") +
      " intensity=" + (ops.intensity || 1);
    if (alerting) msg = "siren=ON · " + msg;
    if (ops.redAlert) msg = "RED · " + msg;
    if (ops.frozen) msg = "FROZEN · " + msg;
    toast("STATUS", msg);
    console.log("[STATUS]", { flags: FLAGS, ops: ops });
    return true;
  }

  function cmdScan(args) {
    var cidr = args[0] || "10.0.0.0/24";
    toast("SCAN", "sweep " + cidr + " — 23 hosts · 9 open");
    console.log("[SCAN] target=" + cidr);
    return true;
  }

  function cmdThreat(args) {
    var lvl = (args[0] || "").toUpperCase();
    var map = { L: "LOW", LOW: "LOW", M: "MED", MED: "MED", H: "HIGH", HIGH: "HIGH", C: "CRIT", CRIT: "CRIT" };
    var v = map[lvl];
    if (!v) { toast("THREAT", "usage: threat <L|M|H|C>", true); return false; }
    var thr = document.getElementById("hud-threat");
    if (thr) { thr.textContent = v; thr.className = "val" + (v === "HIGH" || v === "CRIT" ? " val-red" : ""); }
    if (v === "CRIT" || v === "HIGH") setMode(v, "label-crit");
    else if (v === "MED") setMode("CAUTION", "label-warn");
    else setMode("STEALTH", "label-warn");
    if (global.ShadowOps) global.ShadowOps.threat(v);
    toast("THREAT", "level -> " + v, v === "CRIT");
    return true;
  }

  function cmdRoute(args) {
    if ((args[0] || "").toLowerCase() === "anonymize") {
      toast("ROUTE", "17 hops · exit rotated");
      return true;
    }
    toast("ROUTE", "usage: route anonymize");
    return false;
  }

  function cmdInject(args) {
    if (args && args.length >= 2 && global.ShadowOps) {
      global.ShadowOps.inject(args[0], args.slice(1).join(" "));
      toast("INJECT", args[0] + " <- line");
      return true;
    }
    toast("INJECT", "payload staged");
    if (global.ShadowOps) {
      global.ShadowOps.inject("shadow", "script.run(\"bypass_protocol\") ~> SUCCESS");
      global.ShadowOps.inject("log", "[SHADOW] payload staged by operator");
    }
    return true;
  }

  function cmdFlood() {
    toast("ALERT", "burst — external SOC signature match", true);
    if (global.ShadowOps) global.ShadowOps.burst(6);
    return true;
  }

  function cmdSilence() {
    if (global.LockSystem && global.LockSystem.stopAlert) global.LockSystem.stopAlert();
    toast("SILENCE", "siren stopped");
    return true;
  }

  function cmdClear() { HISTORY.length = 0; HIST_IDX = -1; toast("CLEAR", "history wiped"); return true; }
  function cmdHistory() { toast("HISTORY", HISTORY.length ? HISTORY.slice(-5).join(" | ") : "(empty)"); return true; }
  function cmdWhoami() { toast("ID", "ghost-01 · ops · shadow@local"); return true; }
  function cmdUptime() {
    var sec = Math.floor((Date.now() - (global.__SHADOW_BOOT || Date.now())) / 1000);
    toast("UPTIME", sec + "s since boot");
    return true;
  }

  function cmdBeacon() {
    if (!global.__SHADOW_C2) { toast("BEACON", "activate c2 first", true); return false; }
    toast("BEACON", "ping · id=" + (Math.floor(Math.random() * 900000) + 100000));
    return true;
  }

  function cmdExfil(args) {
    var n = parseInt(args[0], 10); if (isNaN(n) || n < 1) n = 1; if (n > 16) n = 16;
    if (!global.__SHADOW_EXFIL) { toast("EXFIL", "activate exfil first", true); return false; }
    toast("EXFIL", "shipping " + n + " chunk(s)");
    return true;
  }

  function cmdTrace() { toast("TRACE", "depth 3 hops · skew -380ms"); return true; }
  function cmdCover() {
    if (!global.__SHADOW_COVER) { toast("COVER", "activate cover first", true); return false; }
    toast("COVER", "burst 2.4k decoy packets");
    return true;
  }
  function cmdEcho(args) { toast("ECHO", args.join(" ").slice(0, 60) || "(empty)"); return true; }

  function cmdKillswitch() {
    global.__SHADOW_C2 = false;
    global.__SHADOW_EXFIL = false;
    global.__SHADOW_COVER = false;
    global.__SHADOW_NOISE = false;
    if (global.__SHADOW_C2_TIMER) { clearInterval(global.__SHADOW_C2_TIMER); global.__SHADOW_C2_TIMER = null; }
    if (global.LockSystem && global.LockSystem.stopAlert) global.LockSystem.stopAlert();
    if (global.ShadowOps) { global.ShadowOps.redAlert(false); global.ShadowOps.freeze(false); global.ShadowOps.setIntensity(1); }
    setMode("STEALTH", "label-warn");
    toast("KILLSWITCH", "volatile channels dropped");
    return true;
  }

  function cmdIntensity(args) {
    var ops = needOps(); if (!ops) return false;
    var n = parseFloat(args[0]);
    if (isNaN(n)) { toast("INTENSITY", "usage: intensity <0.25-4>", true); return false; }
    toast("INTENSITY", "rate -> " + ops.setIntensity(n));
    return true;
  }

  function cmdGlitch(args) {
    var ops = needOps(); if (!ops) return false;
    var ms = parseInt(args[0], 10); if (isNaN(ms)) ms = 1200;
    ops.glitch(ms);
    toast("GLITCH", "burst " + ms + "ms", true);
    return true;
  }

  function cmdRedAlert(args) {
    var ops = needOps(); if (!ops) return false;
    var on = String(args[0] || "on").toLowerCase();
    if (on === "toggle") on = ops.getState().redAlert ? "off" : "on";
    var enable = !(on === "off" || on === "0" || on === "false");
    ops.redAlert(enable);
    toast("REDALERT", enable ? "engaged" : "cleared", enable);
    return true;
  }

  function cmdFreeze() { var ops = needOps(); if (!ops) return false; ops.freeze(true); toast("FREEZE", "streams paused"); return true; }
  function cmdResume() { var ops = needOps(); if (!ops) return false; ops.freeze(false); toast("RESUME", "streams live"); return true; }

  function cmdFocus(args) {
    var ops = needOps(); if (!ops) return false;
    if (!args[0]) { toast("FOCUS", "focus <shadow|log|map|shell|params|alert>", true); return false; }
    ops.focus(args[0]);
    toast("FOCUS", String(args[0]));
    return true;
  }

  function cmdBurst(args) {
    var ops = needOps(); if (!ops) return false;
    var n = parseInt(args[0], 10); if (isNaN(n)) n = 8;
    ops.burst(n);
    toast("BURST", n + " alert lines", true);
    return true;
  }

  function cmdMatrix(args) {
    var ops = needOps(); if (!ops) return false;
    var d = parseFloat(args[0]); var s = parseFloat(args[1]);
    if (isNaN(d)) { toast("MATRIX", "matrix <density> [speed]", true); return false; }
    ops.matrix(d, isNaN(s) ? undefined : s);
    toast("MATRIX", "density=" + d + (isNaN(s) ? "" : " speed=" + s));
    return true;
  }

  function cmdHide(args) {
    var ops = needOps(); if (!ops) return false;
    if (!args[0]) { toast("HIDE", "hide <win>", true); return false; }
    ops.hideWindow(args[0], true);
    toast("HIDE", String(args[0]));
    return true;
  }

  function cmdShow(args) {
    var ops = needOps(); if (!ops) return false;
    if (!args[0]) { toast("SHOW", "show <win>", true); return false; }
    ops.hideWindow(args[0], false);
    toast("SHOW", String(args[0]));
    return true;
  }

  function cmdPanic() {
    var ops = needOps(); if (!ops) return false;
    ops.redAlert(true);
    ops.setIntensity(3);
    ops.glitch(2000);
    ops.burst(12);
    ops.threat("CRIT");
    toast("PANIC", "stacked crisis sequence", true);
    return true;
  }

  function cmdCalm() {
    var ops = needOps(); if (!ops) return false;
    ops.redAlert(false);
    ops.freeze(false);
    ops.setIntensity(1);
    ops.matrix(1, 1);
    ops.threat("LOW");
    toast("CALM", "normalized");
    return true;
  }

  function cmdActivate(args) {
    var name = (args[0] || "").toLowerCase();
    if (!name) { toast("ACTIVATE", "usage: activate <module>", true); return false; }
    var mod = MODULES[name];
    if (!mod) { toast("ACTIVATE", "unknown: " + name, true); return false; }
    return mod.activate();
  }

  function cmdDeactivate(args) {
    var name = (args[0] || "").toLowerCase();
    if (!name) { toast("DEACTIVATE", "usage: deactivate <module>", true); return false; }
    var mod = MODULES[name];
    if (!mod || typeof mod.deactivate !== "function") { toast("DEACTIVATE", "unknown: " + name, true); return false; }
    return mod.deactivate();
  }

  function parse(line) {
    var raw = String(line || "").trim();
    if (!raw) return { ok: false, empty: true };
    var parts = raw.split(/\s+/);
    return { ok: true, verb: parts[0].toLowerCase(), args: parts.slice(1), raw: raw };
  }

  function exec(line) {
    var p = parse(line);
    if (p.empty) return true;
    HISTORY.push(p.raw);
    if (HISTORY.length > 50) HISTORY.shift();
    HIST_IDX = HISTORY.length;
    switch (p.verb) {
      case "activate": return cmdActivate(p.args);
      case "deactivate": return cmdDeactivate(p.args);
      case "help": case "?": return cmdHelp();
      case "modules": case "ls": return cmdModules();
      case "status": case "stat": return cmdStatus();
      case "scan": case "nmap": return cmdScan(p.args);
      case "threat": return cmdThreat(p.args);
      case "route": return cmdRoute(p.args);
      case "inject": return cmdInject(p.args);
      case "flood": return cmdFlood();
      case "silence": case "mute": return cmdSilence();
      case "clear": return cmdClear();
      case "history": case "hist": return cmdHistory();
      case "whoami": case "id": return cmdWhoami();
      case "uptime": return cmdUptime();
      case "beacon": return cmdBeacon();
      case "exfil": return cmdExfil(p.args);
      case "trace": return cmdTrace();
      case "cover": return cmdCover();
      case "echo": return cmdEcho(p.args);
      case "killswitch": case "kill": return cmdKillswitch();
      case "intensity": case "rate": return cmdIntensity(p.args);
      case "glitch": return cmdGlitch(p.args);
      case "redalert": case "red": return cmdRedAlert(p.args);
      case "freeze": return cmdFreeze();
      case "resume": case "unfreeze": return cmdResume();
      case "focus": return cmdFocus(p.args);
      case "burst": return cmdBurst(p.args);
      case "matrix": return cmdMatrix(p.args);
      case "hide": return cmdHide(p.args);
      case "show": return cmdShow(p.args);
      case "panic": return cmdPanic();
      case "calm": case "normalize": return cmdCalm();
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

  global.__SHADOW_BOOT = Date.now();
  global.ShadowCMD = { exec: exec, parse: parse, register: function (n, m) { if (!n || !m || typeof m.activate !== "function") return false; MODULES[String(n).toLowerCase()] = m; return true; }, bindInput: bindInput, flags: FLAGS, toast: toast };

  function boot() { bindInput(document.getElementById("cmd-input")); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : this);
