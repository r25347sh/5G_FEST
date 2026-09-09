/**
 * 画面デコ - ShadowScript Hacker Terminal Engine
 */
(function () {
  "use strict";

  const SHADOW_CODE = [
    "#shadow kernel.init(v4.02) -> READY",
    "bind @local_nodes as swarm;",
    "pierce firewall://target ~> inject(payload);",
    "route.anonymize(swarm, hops=14);",
    "spoof.handshake(GCA_ADMIN) ||> AUTHORIZED",
    "loop @gca_crisis { nullify(counter); }",
    "::overdrive  force_packet(false_ack);",
    "shadow.encrypt(key=ephemeral) === SECURE",
    "inject.false_trace(src=ghost-01, dst=GCA);",
    "@target.nodes.compromised = 14;",
    "shadow.script.run(\"bypass_protocol\") ~> SUCCESS",
    "nullify(GCA_LOCKDOWN, t_minus=0);"
  ];

  const SYSTEM_LOGS = [
    { text: "[SYSTEM] Initializing Custom Kernel...", delay: 500 },
    { text: "[SYSTEM] Starting the parser...", delay: 400 },
    { text: "[SYSTEM] Launching \"ShadowScript\" v4.02...", delay: 600 },
    { text: "[STATUS] Engine: READY.", delay: 450 },
    { text: "[NETWORK] Scanning for local nodes...", delay: 700 },
    { text: "[NETWORK] Hijacking the IP addresses of nearby devices... [SUCCESS]", delay: 800 },
    { text: "[NETWORK] 14 nodes compromised. Route anonymized.", delay: 550 },
    { text: "[TARGET] Piercing the firewall...", delay: 600 },
    { text: "[SHADOWSCRIPT] Executing... _", delay: 700 }
  ];

  const MID_SEQUENCE = [
    { text: "[SHADOWSCRIPT] Generating payload...", delay: 500 },
    { text: "[SHADOWSCRIPT] Injecting... ", delay: 300, progress: true },
    { text: "⚠️ [CRITICAL ALERT] ⚠️", delay: 150, critical: true },
    { text: "[DETECTION] \"Global Cyber Administration (GCA) Auto-Crisis Management Program\" detected!", delay: 800 },
    { text: "[GCA_STATUS] Countermeasures initiated. Tracing source IP...", delay: 600 },
    { text: "[GCA_STATUS] Lockdown protocol activated in T-minus 10 seconds.", delay: 700 },
    { text: ">> [USER INPUT] Initiating Bypass Protocol: \"ShadowScript - Overdrive\"", delay: 900, bypass: true },
    { text: "[SHADOWSCRIPT] Intercepting GCA packets...", delay: 550 },
    { text: "[SHADOWSCRIPT] Injecting false handshakes... [SUCCESS]", delay: 600 },
    { text: "[SHADOWSCRIPT] Spoofing GCA Admin credentials... [AUTHORIZED]", delay: 650 },
    { text: "[SHADOWSCRIPT] Forcing GCA Crisis Program into infinite loop...", delay: 700 },
    { text: "[STATUS] GCA Threat Level: Neutralized.", delay: 500, secure: true },
    { text: "[STATUS] Connection secured. Resume auto-typing...", delay: 600 }
  ];

  const BASH_SNIPS = [
    "nmap -sS -sV -O -T4 192.168.1.0/24 --open",
    "ssh -i ~/.ssh/id_ed25519 root@10.0.0.42 -p 2222",
    "curl -s -X POST https://api.target.local/v1/auth",
    "sudo tcpdump -i eth0 -nn -s0 -w capture.pcap port 443",
    "proxychains4 nmap -Pn 172.16.0.0/16",
    "rsync -avz -e 'ssh -p 2222' ./payload/ root@10.0.0.88:/tmp/.x/"
  ];

  const WINDOW_CONFIGS = [
    { id: "w-shadow", title: "shadow@ghost-01", path: "~/ShadowScript", badge: "CORE", badgeClass: "purple",
      tabs: ["kernel.ss", "overdrive.ss", "payload.ss"], activeTab: 0, type: "shadow", secondary: false,
      x: 3, y: 7, w: 46, h: 52 },
    { id: "w-log", title: "ops-log", path: "/var/log/shadow", badge: "LIVE", badgeClass: "green",
      tabs: ["system", "network", "gca"], activeTab: 0, type: "log", secondary: true,
      x: 51, y: 6, w: 46, h: 44 },
    { id: "w-map", title: "Digital World Map", path: "nodes://global", badge: "SCAN", badgeClass: "cyan",
      tabs: ["topology", "routes", "threats"], activeTab: 0, type: "map", secondary: false, map: true,
      x: 4, y: 61, w: 44, h: 30 },
    { id: "w-shell", title: "root@ghost-01", path: "~/ops", badge: "ACTIVE", badgeClass: "green",
      tabs: ["shell", "nmap", "exfil"], activeTab: 0, type: "bash", secondary: false,
      x: 50, y: 53, w: 47, h: 38 }
  ];

  const state = {
    windows: {},
    activeId: "w-shadow",
    packets: 0,
    bytes: 0,
    sessions: 1,
    threat: "LOW",
    phase: "boot"
  };

  function $(sel) { return document.querySelector(sel); }
  function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  }

  function colorize(line, type) {
    if (type === "log") {
      if (/SUCCESS|AUTHORIZED|Neutralized|READY|\[OK\]/.test(line)) return '<span class="success">' + escapeHtml(line) + "</span>";
      if (/CRITICAL|DETECTION|Lockdown/.test(line)) return '<span class="crit">' + escapeHtml(line) + "</span>";
      if (/WARN|GCA_STATUS|T-minus/.test(line)) return '<span class="warn">' + escapeHtml(line) + "</span>";
      if (/SHADOWSCRIPT|ShadowScript/.test(line)) return '<span class="shadow">' + escapeHtml(line) + "</span>";
      if (/USER INPUT/.test(line)) return '<span class="highlight">' + escapeHtml(line) + "</span>";
      return '<span class="dim">' + escapeHtml(line) + "</span>";
    }
    if (type === "shadow") {
      var s = escapeHtml(line);
      s = s.replace(/#(shadow|kernel|overdrive)/g, '<span class="keyword">#$1</span>');
      s = s.replace(/\b(bind|pierce|inject|spoof|loop|nullify|route|force_packet|encrypt)\b/g, '<span class="func">$1</span>');
      s = s.replace(/(@[a-zA-Z_][\w]*)/g, '<span class="string">$1</span>');
      s = s.replace(/(->|~>|\|\|>|===|::)/g, '<span class="keyword">$1</span>');
      s = s.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
      return s;
    }
    if (type === "bash") {
      var b = escapeHtml(line);
      b = b.replace(/\b(nmap|ssh|curl|sudo|tcpdump|python3|hashcat|proxychains4|rsync)\b/g, '<span class="func">$1</span>');
      b = b.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>');
      return b;
    }
    return escapeHtml(line);
  }

  function createWindow(cfg) {
    var el = document.createElement("div");
    var isActive = cfg.id === state.activeId;
    el.className = "window" + (cfg.secondary ? " secondary" : "") + (cfg.map ? " map-win" : "") + (isActive ? " active glow" : "");
    el.id = cfg.id;
    el.style.left = cfg.x + "%";
    el.style.top = cfg.y + "%";
    el.style.width = cfg.w + "%";
    el.style.height = cfg.h + "%";
    el.style.zIndex = isActive ? "40" : String(10 + Math.floor(Math.random() * 10));

    var tabsHtml = "";
    for (var i = 0; i < cfg.tabs.length; i++) {
      var activeCls = i === cfg.activeTab ? " active" : "";
      var cyanCls = cfg.secondary ? " cyan-active" : "";
      tabsHtml += '<div class="tab' + activeCls + cyanCls + '">' + cfg.tabs[i] + "</div>";
    }

    var titlePart =
      '<div class="title-bar">' +
      '<div class="traffic"><span class="close"></span><span class="min"></span><span class="max"></span></div>' +
      '<div class="title">' + cfg.title + ' <span class="path">· ' + cfg.path + "</span></div>" +
      '<span class="badge ' + (cfg.badgeClass || "") + '">' + cfg.badge + "</span>" +
      "</div>" +
      '<div class="tabs">' + tabsHtml + "</div>";

    if (cfg.map) {
      el.innerHTML = titlePart +
        '<div class="map-body"><canvas id="map-canvas"></canvas>' +
        '<div class="map-legend">' +
        '<span class="node-compromised"></span>compromised &nbsp;' +
        '<span class="node-scan"></span>scanning &nbsp;' +
        '<span class="node-gca"></span>GCA &nbsp;' +
        '<span class="node-safe"></span>secure' +
        "</div></div>";
    } else {
      el.innerHTML = titlePart + '<div class="term-body"><pre class="output"></pre></div>';
    }

    var stage = $(".stage");
    if (stage) stage.appendChild(el);

    var maxLines = Math.max(8, Math.floor((cfg.h / 100) * (window.innerHeight || 800) / 17) - 3);
    state.windows[cfg.id] = { el: el, cfg: cfg, lines: [], maxLines: maxLines, typing: false };
    return el;
  }

  function setActive(id) {
    state.activeId = id;
    Object.keys(state.windows).forEach(function (wid) {
      var w = state.windows[wid];
      if (!w || !w.el) return;
      if (wid === id) {
        w.el.classList.add("active", "glow");
        w.el.style.zIndex = "45";
      } else {
        w.el.classList.remove("active", "glow");
        w.el.style.zIndex = String(10 + Math.floor(Math.random() * 15));
      }
    });
  }

  function renderOutput(w) {
    if (!w || !w.el || w.cfg.map) return;
    var pre = w.el.querySelector(".output");
    if (!pre) return;
    var promptClass = w.cfg.type === "shadow" ? "prompt-shadow" : (w.cfg.secondary ? "prompt-cyan" : "prompt");
    var cursorCls = w.cfg.type === "shadow" ? "cursor purple" : (w.cfg.secondary ? "cursor" : "cursor pink");
    var html = w.lines.join("\n");
    if (!w.typing) {
      html += "\n<span class=\"" + promptClass + "\">$</span> <span class=\"" + cursorCls + "\"></span>";
    }
    pre.innerHTML = html;
  }

  function appendLine(winId, htmlLine, withPrompt) {
    var w = state.windows[winId];
    if (!w || w.cfg.map) return;
    var promptClass = w.cfg.type === "shadow" ? "prompt-shadow" : (w.cfg.secondary ? "prompt-cyan" : "prompt");
    var prompt = withPrompt ? '<span class="' + promptClass + '">$</span> ' : "";
    w.lines.push(prompt + htmlLine);
    if (w.lines.length > w.maxLines) w.lines = w.lines.slice(-w.maxLines);
    renderOutput(w);
  }

  function typeLine(winId, text, type, speed) {
    speed = typeof speed === "number" ? speed : 5;
    return new Promise(function (resolve) {
      var w = state.windows[winId];
      if (!w || w.cfg.map) { resolve(); return; }
      w.typing = true;
      var pre = w.el.querySelector(".output");
      var promptClass = type === "shadow" ? "prompt-shadow" : (w.cfg.secondary ? "prompt-cyan" : "prompt");
      var cursorCls = type === "shadow" ? "cursor purple" : (w.cfg.secondary ? "cursor" : "cursor pink");
      var i = 0;
      var base = w.lines.slice();
      var colored = colorize(text, type);

      if (speed < 3) {
        appendLine(winId, colored, true);
        w.typing = false;
        resolve();
        return;
      }

      function step() {
        i++;
        var partial = escapeHtml(text.slice(0, i));
        if (pre) {
          pre.innerHTML = base.concat([
            '<span class="' + promptClass + '">$</span> <span class="cmd">' + partial + '</span><span class="' + cursorCls + '"></span>'
          ]).join("\n");
        }
        if (i >= text.length) {
          w.lines = base.concat(['<span class="' + promptClass + '">$</span> ' + colored]);
          w.typing = false;
          renderOutput(w);
          resolve();
        } else {
          setTimeout(step, speed + Math.random() * 3);
        }
      }
      step();
    });
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function animateProgress(winId, prefix, duration) {
    return new Promise(function (resolve) {
      var w = state.windows[winId];
      if (!w) { resolve(); return; }
      var pre = w.el.querySelector(".output");
      var base = w.lines.slice();
      var steps = 20;
      var i = 0;
      function tick() {
        i++;
        var pct = Math.min(100, Math.round((i / steps) * 100));
        var filled = Math.floor(pct / 5);
        var bar = "█".repeat(filled) + "░".repeat(20 - filled);
        var line = '<span class="shadow">' + escapeHtml(prefix) + "[" + bar + "] " + pct + "%</span>";
        if (pre) pre.innerHTML = base.concat([line]).join("\n");
        if (i >= steps) {
          w.lines = base.concat([line]);
          renderOutput(w);
          resolve();
        } else {
          setTimeout(tick, duration / steps);
        }
      }
      tick();
    });
  }

  async function runBootSequence() {
    state.phase = "boot";
    setActive("w-log");
    showToast("SYSTEM", "ShadowScript kernel loading…");

    for (var i = 0; i < SYSTEM_LOGS.length; i++) {
      var item = SYSTEM_LOGS[i];
      appendLine("w-log", colorize(item.text, "log"), false);
      if (item.text.indexOf("ShadowScript") !== -1) {
        await typeLine("w-shadow", randomFrom(SHADOW_CODE), "shadow", 4);
      }
      await sleep(item.delay);
    }
    await sleep(300);
    await runMidSequence();
  }

  async function runMidSequence() {
    state.phase = "mid";
    setActive("w-log");
    var statusMode = document.getElementById("status-mode");
    var statusBar = document.querySelector(".status-bar");

    for (var i = 0; i < MID_SEQUENCE.length; i++) {
      var item = MID_SEQUENCE[i];

      if (item.progress) {
        await animateProgress("w-log", item.text, 1200);
        await sleep(150);
        continue;
      }

      if (item.critical) {
        showCriticalOverlay('[DETECTION] "Global Cyber Administration (GCA)"\nAuto-Crisis Management Program detected!\n\nCountermeasures initiated…');
        if (statusBar) statusBar.classList.add("alert-mode");
        if (statusMode) {
          statusMode.textContent = "⚠ CRITICAL";
          statusMode.className = "label-crit";
        }
        state.threat = "CRIT";
        updateHudImmediate();
        Object.keys(state.windows).forEach(function (id) {
          var w = state.windows[id];
          if (w && w.el) w.el.classList.add("alert-flash");
        });
        showToast("CRITICAL", "GCA Auto-Crisis detected — tracing…", true);
      }

      appendLine("w-log", colorize(item.text, "log"), false);

      if (item.bypass) {
        setActive("w-shadow");
        await typeLine("w-shadow", "::overdrive  force_packet(false_ack);", "shadow", 5);
        await typeLine("w-shadow", "spoof.handshake(GCA_ADMIN) ||> AUTHORIZED", "shadow", 4);
        await typeLine("w-shadow", "loop @gca_crisis { nullify(counter); }", "shadow", 4);
      }

      if (item.secure) {
        hideCriticalOverlay();
        if (statusBar) statusBar.classList.remove("alert-mode");
        if (statusMode) {
          statusMode.textContent = "STEALTH";
          statusMode.className = "label-warn";
        }
        state.threat = "LOW";
        updateHudImmediate();
        Object.keys(state.windows).forEach(function (id) {
          var w = state.windows[id];
          if (w && w.el) w.el.classList.remove("alert-flash");
        });
        showToast("SECURE", "GCA neutralized · connection secured");
      }

      await sleep(item.delay);
    }

    state.phase = "free";
    startFreeLoops();
  }

  function startFreeLoops() {
    runSequence("w-shadow");
    runSequence("w-shell");
    setTimeout(function () { runSequence("w-log"); }, 1000);
  }

  function runSequence(winId) {
    var w = state.windows[winId];
    if (!w || w.cfg.map) return;
    var type = w.cfg.type;
    var pool = type === "shadow" ? SHADOW_CODE : (type === "bash" ? BASH_SNIPS : SYSTEM_LOGS.map(function (x) { return x.text; }));

    function loop() {
      if (state.phase !== "free" && winId !== "w-shadow") {
        setTimeout(loop, 600);
        return;
      }
      var p;
      if (Math.random() > 0.3) {
        var cmd = randomFrom(pool);
        var speed = type === "log" ? 2 : (type === "shadow" ? 4 : 5 + Math.random() * 6);
        p = typeLine(winId, cmd, type, speed).then(function () { return sleep(80 + Math.random() * 250); });
      } else {
        var burst = 2 + Math.floor(Math.random() * 3);
        var b = 0;
        function nextBurst() {
          if (b >= burst) return sleep(120 + Math.random() * 250);
          appendLine(winId, colorize(randomFrom(pool), type), type !== "log");
          b++;
          return sleep(20 + Math.random() * 40).then(nextBurst);
        }
        p = nextBurst();
      }
      p.then(function () {
        if (w.lines.length > w.maxLines - 2 && Math.random() > 0.6) {
          w.lines = w.lines.slice(-Math.floor(w.maxLines * 0.4));
        }
        loop();
      }).catch(function () { setTimeout(loop, 500); });
    }
    loop();
  }

  function initMap() {
    var canvas = document.getElementById("map-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var nodes = [], links = [], W, H;

    function resize() {
      var parent = canvas.parentElement;
      W = canvas.width = parent.clientWidth || 400;
      H = canvas.height = parent.clientHeight || 200;
    }

    function seed() {
      nodes = [];
      for (var i = 0; i < 18; i++) {
        nodes.push({
          x: 30 + Math.random() * (W - 60),
          y: 20 + Math.random() * (H - 40),
          r: 3 + Math.random() * 3,
          type: i < 3 ? "gca" : (i < 10 ? "compromised" : (i < 14 ? "scan" : "safe")),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          pulse: Math.random() * Math.PI * 2
        });
      }
      links = [];
      for (var j = 0; j < 20; j++) {
        var a = Math.floor(Math.random() * nodes.length);
        var b = Math.floor(Math.random() * nodes.length);
        if (a !== b) links.push([a, b]);
      }
    }

    function draw() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(155,93,229,0.06)";
      ctx.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 28) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += 28) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      for (var i = 0; i < links.length; i++) {
        var n1 = nodes[links[i][0]], n2 = nodes[links[i][1]];
        if (!n1 || !n2) continue;
        var alpha = 0.12 + Math.sin(Date.now() / 900 + i) * 0.06;
        if (n1.type === "compromised" || n2.type === "compromised") ctx.strokeStyle = "rgba(255,45,149," + (alpha + 0.15) + ")";
        else if (n1.type === "gca" || n2.type === "gca") ctx.strokeStyle = "rgba(255,51,85," + (alpha + 0.2) + ")";
        else ctx.strokeStyle = "rgba(0,245,255," + alpha + ")";
        ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
      }

      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k];
        n.pulse += 0.04;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 15 || n.x > W - 15) n.vx *= -1;
        if (n.y < 12 || n.y > H - 12) n.vy *= -1;
        var glow = 0.5 + Math.sin(n.pulse) * 0.35;
        var color = n.type === "compromised" ? "255,45,149" : n.type === "gca" ? "255,51,85" : n.type === "scan" ? "0,245,255" : "57,255,20";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4 * glow, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + color + "," + (0.12 * glow) + ")"; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + color + ",0.9)";
        ctx.shadowColor = "rgba(" + color + ",0.8)"; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
      }
      requestAnimationFrame(draw);
    }

    resize(); seed();
    window.addEventListener("resize", function () { resize(); seed(); });
    draw();
    setInterval(function () {
      if (nodes.length && Math.random() > 0.6) {
        var n = randomFrom(nodes);
        if (n.type !== "gca") n.type = randomFrom(["compromised", "scan", "safe", "compromised"]);
      }
    }, 2200);
  }

  function initMatrix() {
    var canvas = document.getElementById("matrix-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var w, h, cols, drops;
    var chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01#@$";

    function resize() {
      w = canvas.width = window.innerWidth || 800;
      h = canvas.height = window.innerHeight || 600;
      cols = Math.floor(w / 16) || 40;
      drops = [];
      for (var i = 0; i < cols; i++) drops[i] = 1;
    }

    function draw() {
      ctx.fillStyle = "rgba(7,5,15,0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "13px monospace";
      for (var i = 0; i < drops.length; i++) {
        var ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.92 ? "#00f5ff" : "rgba(0,245,255,0.32)";
        ctx.fillText(ch, i * 16, drops[i] * 16);
        if (drops[i] * 16 > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("resize", resize);
    draw();
  }

  function spawnParticles() {
    var container = $(".ambient");
    if (!container) return;
    var colors = ["pink", "cyan", "gold", "green", "red"];
    for (var i = 0; i < 28; i++) {
      var p = document.createElement("div");
      p.className = "ambient-particle " + randomFrom(colors);
      var size = 2 + Math.random() * 4;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 8 + Math.random() * 14 + "s";
      p.style.animationDelay = Math.random() * 10 + "s";
      container.appendChild(p);
    }
  }

  function updateHudImmediate() {
    var pkt = document.getElementById("hud-packets");
    var byt = document.getElementById("hud-bytes");
    var ses = document.getElementById("hud-sessions");
    var thr = document.getElementById("hud-threat");
    var clk = document.getElementById("hud-clock");
    if (pkt) pkt.textContent = state.packets.toLocaleString();
    if (byt) byt.textContent = (state.bytes / 1024).toFixed(1) + " KB";
    if (ses) ses.textContent = String(state.sessions);
    if (thr) {
      thr.textContent = state.threat;
      thr.className = "val" + (state.threat === "HIGH" || state.threat === "CRIT" ? " val-red" : "");
    }
    if (clk) clk.textContent = new Date().toTimeString().slice(0, 8);
  }

  function updateHud() {
    state.packets += Math.floor(Math.random() * 50) + 10;
    state.bytes += Math.floor(Math.random() * 15000) + 2500;
    if (Math.random() > 0.9) state.sessions = 2 + Math.floor(Math.random() * 7);
    if (state.phase === "free" && Math.random() > 0.96) state.threat = randomFrom(["LOW", "MED", "HIGH"]);
    updateHudImmediate();
  }

  function showToast(title, body, isCrit) {
    var t = document.getElementById("toast");
    if (!t) return;
    var titleEl = t.querySelector(".toast-title");
    var bodyEl = t.querySelector(".toast-body");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    t.classList.toggle("crit-toast", !!isCrit);
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 3400);
  }

  function showCriticalOverlay(msg) {
    var ov = document.getElementById("crit-overlay");
    var body = document.getElementById("crit-body");
    if (!ov) return;
    if (body) body.textContent = msg;
    ov.classList.add("show");
  }

  function hideCriticalOverlay() {
    var ov = document.getElementById("crit-overlay");
    if (ov) ov.classList.remove("show");
  }

  function rotateFocus() {
    if (state.phase !== "free") return;
    var ids = Object.keys(state.windows);
    if (ids.length) setActive(randomFrom(ids));
  }

  function boot() {
    try {
      WINDOW_CONFIGS.forEach(function (cfg) { createWindow(cfg); });
      Object.keys(state.windows).forEach(function (id) {
        var w = state.windows[id];
        if (w && w.el) w.el.addEventListener("mousedown", function () { setActive(id); });
      });
      initMatrix();
      spawnParticles();
      initMap();
      setInterval(updateHud, 380);
      updateHudImmediate();
      setInterval(rotateFocus, 8000 + Math.random() * 4000);
      setTimeout(runBootSequence, 500);
      setTimeout(function () { showToast("SYSTEM ONLINE", "ShadowScript v4.02 · multi-session active"); }, 1200);
    } catch (err) {
      console.error("boot failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
