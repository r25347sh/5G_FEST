/**
 * ShadowScript command console
 * Grammar:
 *   activate <module>     — load / enable a subsystem
 *   deactivate <module>   — disable when supported
 *   <verb> [args...]      — ops commands
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

  MODULES["lock.js"] = {
    desc: "Session lock / alert siren (free_note audio)",
    activate: function () {
      if (!global.LockSystem) {
        toast("ERR", "lock module not loaded", true);
        return false;
      }
      if (global.LockSystem.isLocked && global.LockSystem.isLocked()) {
        return true;
      }
      global.LockSystem.startLock();
      return true;
    },
    deactivate: function () {
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
    desc: "Command-and-control beacon channel (sim)",
    activate: function () {
      global.__SHADOW_C2 = true;
      setMode("C2-LINK", "label-active");
      toast("C2", "beacon channel up · interval 12s");
      if (global.__SHADOW_C2_TIMER) clearInterval(global.__SHADOW_C2_TIMER);
      global.__SHADOW_C2_TIMER = setInterval(function () {
        if (!global.__SHADOW_C2) return;
        var n = Math.floor(Math.random() * 9000) + 1000;
        console.log("[C2] heartbeat seq=" + n + " · ack");
      }, 12000);
      return true;
    },
    deactivate: function () {
      global.__SHADOW_C2 = false;
      if (global.__SHADOW_C2_TIMER) {
        clearInterval(global.__SHADOW_C2_TIMER);
        global.__SHADOW_C2_TIMER = null;
      }
      setMode("STEALTH", "label-warn");
      toast("C2", "beacon channel down");
      return true;
    }
  };

  MODULES["exfil"] = {
    desc: "Staged exfiltration queue (cosmetic)",
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
    desc: "Cover traffic / noise generation flag",
    activate: function () {
      global.__SHADOW_COVER = true;
      toast("COVER", "decoy traffic generator online");
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
      "beacon                c2 ping (needs activate c2)",
      "exfil [n]             ship n chunks (needs activate exfil)",
      "trace                 show hop path (sim)",
      "cover                 decoy burst (needs activate cover)",
      "echo <text>           reflect text to toast",
      "killswitch            drop volatile channels",
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
    var msg = "matrix=" + (FLAGS.matrix ? "on" : "off") +
      " noise=" + (FLAGS.noise ? "ON" : "off") +
      " stealth=" + (FLAGS.stealth ? "on" : "off") +
      " c2=" + (global.__SHADOW_C2 ? "up" : "down") +
      " exfil=" + (global.__SHADOW_EXFIL ? "armed" : "off");
    if (alerting) msg = "siren=ON · " + msg;
    toast("STATUS", msg);
    console.log("[STATUS]", { lock: locked, siren: alerting, flags: FLAGS, c2: !!global.__SHADOW_C2, exfil: !!global.__SHADOW_EXFIL });
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
    setTimeout(function () { toast("ALERT", "trace packets on uplink · 4 hops", true); }, 900);
    setTimeout(function () { toast("ALERT", "response system stage 2", true); }, 1800);
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

  function cmdBeacon() {
    if (!global.__SHADOW_C2) {
      toast("BEACON", "c2 offline — activate c2 first", true);
      return false;
    }
    var id = Math.floor(Math.random() * 900000) + 100000;
    toast("BEACON", "ping sent · id=" + id);
    console.log("[BEACON] outbound id=" + id + " · waiting ack");
    return true;
  }

  function cmdExfil(args) {
    var n = parseInt(args[0], 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 16) n = 16;
    if (!global.__SHADOW_EXFIL) {
      toast("EXFIL", "queue not armed — activate exfil", true);
      return false;
    }
    toast("EXFIL", "shipping " + n + " chunk(s) via dns");
    console.log("[EXFIL] chunks=" + n + " channel=dns status=queued");
    return true;
  }

  function cmdTrace() {
    toast("TRACE", "depth 3 hops · clock skew -380ms");
    console.log("[TRACE] path: ghost-01 -> relay-a -> relay-b -> exit");
    return true;
  }

  function cmdCover() {
    if (!global.__SHADOW_COVER) {
      toast("COVER", "activate cover first", true);
      return false;
    }
    toast("COVER", "burst 2.4k decoy packets");
    return true;
  }

  function cmdEcho(args) {
    var msg = args.join(" ");
    if (!msg) {
      toast("ECHO", "(empty)");
      return true;
    }
    toast("ECHO", msg.slice(0, 60));
    return true;
  }

  function cmdKillswitch() {
    global.__SHADOW_C2 = false;
    global.__SHADOW_EXFIL = false;
    global.__SHADOW_COVER = false;
    global.__SHADOW_NOISE = false;
    if (global.__SHADOW_C2_TIMER) {
      clearInterval(global.__SHADOW_C2_TIMER);
      global.__SHADOW_C2_TIMER = null;
    }
    if (global.LockSystem && global.LockSystem.stopAlert) global.LockSystem.stopAlert();
    setMode("STEALTH", "label-warn");
    var thr = document.getElementById("hud-threat");
    if (thr) { thr.textContent = "LOW"; thr.className = "val"; }
    toast("KILLSWITCH", "volatile channels dropped");
    console.log("[KILLSWITCH] c2/exfil/cover/noise cleared");
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
    return { ok: true, verb: parts[0].toLowerCase(), args: parts.slice(1), raw: raw };
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
      case "beacon": return cmdBeacon();
      case "exfil": return cmdExfil(p.args);
      case "trace": return cmdTrace();
      case "cover": return cmdCover();
      case "echo": return cmdEcho(p.args);
      case "killswitch":
      case "kill": return cmdKillswitch();
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
