/**
 * 画面デコ - Hacker Terminal Animation Engine
 * Infinite loop · Ultra-fast typing · Multi-window
 * Design language: 5G-staff (pink / cyan / gold / deep purple)
 */

(function () {
  "use strict";

  const SNIPPETS = {
    bash: [
      "nmap -sS -sV -O -T4 192.168.1.0/24 --open",
      "ssh -i ~/.ssh/id_ed25519 root@10.0.0.42 -p 2222",
      "curl -s -X POST https://api.target.local/v1/auth -H 'Content-Type: application/json'",
      "sudo tcpdump -i eth0 -nn -s0 -w capture.pcap port 443",
      "find /var/log -name '*.log' -mtime -1 | xargs grep -i error",
      "python3 -c \"import socket; s=socket.socket(); s.connect(('10.0.0.1',22))\"",
      "hashcat -m 0 -a 0 hashes.txt rockyou.txt --force",
      "docker exec -it $(docker ps -q --filter name=proxy) sh",
      "git clone git@github.com:internal/recon.git && cd recon && ./run.sh",
      "export PATH=$PATH:/opt/tools/bin; proxychains4 nmap -Pn 172.16.0.0/16",
      "openssl s_client -connect target:443 -servername target 2>/dev/null",
      "journalctl -u sshd --since '1 hour ago' | grep -E 'Accepted|Failed'",
      "rsync -avz -e 'ssh -p 2222' ./payload/ root@10.0.0.88:/tmp/.x/",
      "echo '*/5 * * * * /usr/local/bin/beacon' | crontab -",
      "iptables -A INPUT -s 203.0.113.0/24 -j DROP && iptables-save",
    ],
    python: [
      "import requests, json, base64, hashlib",
      "from cryptography.fernet import Fernet",
      "session = requests.Session()",
      "session.headers.update({'User-Agent': 'Mozilla/5.0'})",
      "r = session.post(url, json=payload, timeout=8, verify=False)",
      "token = r.json().get('access_token')",
      "key = Fernet.generate_key()",
      "cipher = Fernet(key)",
      "encrypted = cipher.encrypt(data.encode())",
      "def exploit(target, port=443):",
      "    sock = socket.create_connection((target, port), timeout=5)",
      "    sock.send(payload)",
      "    return sock.recv(4096)",
      "hashes = [hashlib.sha256(x.encode()).hexdigest() for x in wordlist]",
      "print(f'[+] Extracted {len(creds)} credentials')",
      "asyncio.run(main())",
    ],
    js: [
      "const res = await fetch('/api/v2/users', { method: 'GET', credentials: 'include' });",
      "const data = await res.json();",
      "localStorage.setItem('session', btoa(JSON.stringify(payload)));",
      "document.cookie = 'token=' + jwt + '; path=/; SameSite=None; Secure';",
      "const buffer = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(secret)));",
      "navigator.credentials.get({ publicKey: options }).then(assert);",
      "eval(atob(obfuscated));",
      "window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;",
    ],
    log: [
      "[INFO]  Connection established -> 10.0.0.42:22",
      "[OK]    Authentication successful (ed25519)",
      "[WARN]  Rate limit approaching (87/100)",
      "[+]     Privilege escalation: uid=0(root)",
      "[*]     Dumping /etc/shadow ... 42 entries",
      "[+]     Lateral movement: 172.16.4.12",
      "[INFO]  Exfiltrating 2.4 MB via DNS tunnel",
      "[OK]    Persistence installed (systemd user unit)",
      "[*]     C2 beacon interval set to 45s",
      "[ERROR] Connection reset by peer - retrying in 3s",
      "[+]     Kernel exploit ready (CVE-2024-XXXX)",
      "[INFO]  Clearing audit logs ... done",
      "[OK]    Cover tracks complete",
      "[*]     Switching to passive mode",
    ],
    network: [
      "TRACE  1  192.168.0.1   0.4 ms",
      "TRACE  2  10.0.0.1      1.2 ms",
      "TRACE  3  203.0.113.1   12.8 ms",
      "SYN-ACK received from 10.0.0.88:443",
      "TLS handshake complete (TLS 1.3)",
      "Certificate: CN=*.internal.corp  (valid)",
      "DNS: target.local -> 10.0.0.42",
      "Packet loss: 0.0%  RTT: 4.2 ms",
    ],
  };

  const WINDOW_CONFIGS = [
    { id: "w1", title: "root@ghost-01", path: "~/ops", badge: "ACTIVE", badgeClass: "green",
      tabs: ["shell", "nmap", "payload"], activeTab: 0, type: "bash", secondary: false,
      x: 4, y: 8, w: 42, h: 48 },
    { id: "w2", title: "python3", path: "exploit.py", badge: "RUN", badgeClass: "",
      tabs: ["exploit.py", "utils.py", "c2.py"], activeTab: 0, type: "python", secondary: false,
      x: 48, y: 6, w: 48, h: 42 },
    { id: "w3", title: "tcpdump", path: "eth0", badge: "LIVE", badgeClass: "cyan",
      tabs: ["capture", "filter", "stats"], activeTab: 0, type: "network", secondary: true,
      x: 52, y: 52, w: 44, h: 36 },
    { id: "w4", title: "logs", path: "/var/log/ops", badge: "TAIL", badgeClass: "green",
      tabs: ["auth.log", "kern.log", "audit"], activeTab: 0, type: "log", secondary: true,
      x: 3, y: 58, w: 46, h: 32 },
    { id: "w5", title: "node", path: "injector.js", badge: "HOOK", badgeClass: "",
      tabs: ["injector.js", "ws.js"], activeTab: 0, type: "js", secondary: false,
      x: 28, y: 28, w: 38, h: 34 },
  ];

  const state = {
    windows: {},
    activeId: "w1",
    packets: 0,
    bytes: 0,
    sessions: 3,
    threat: "LOW",
  };

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  }

  function colorize(line, type) {
    if (type === "log") {
      if (line.indexOf("[OK]") !== -1 || line.indexOf("[+]") !== -1) {
        return '<span class="success">' + escapeHtml(line) + "</span>";
      }
      if (line.indexOf("[ERROR]") !== -1) {
        return '<span class="error">' + escapeHtml(line) + "</span>";
      }
      if (line.indexOf("[WARN]") !== -1) {
        return '<span class="warn">' + escapeHtml(line) + "</span>";
      }
      if (line.indexOf("[INFO]") !== -1 || line.indexOf("[*]") !== -1) {
        return '<span class="dim">' + escapeHtml(line) + "</span>";
      }
      return escapeHtml(line);
    }
    if (type === "network") {
      return '<span class="dim">' + escapeHtml(line) + "</span>";
    }
    var s = escapeHtml(line);
    s = s.replace(/\b(import|from|const|let|var|function|def|async|await|return|if|else|for|while|class|export|SELECT|UPDATE|INSERT|DROP|GRANT)\b/g, '<span class="keyword">$1</span>');
    s = s.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>');
    s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    s = s.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="func">$1</span>(');
    return s;
  }

  function createWindow(cfg) {
    var el = document.createElement("div");
    var isActive = cfg.id === state.activeId;
    el.className = "window" + (cfg.secondary ? " secondary" : "") + (isActive ? " active glow" : "");
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

    el.innerHTML =
      '<div class="title-bar">' +
      '<div class="traffic"><span class="close"></span><span class="min"></span><span class="max"></span></div>' +
      '<div class="title">' + cfg.title + ' <span class="path">· ' + cfg.path + "</span></div>" +
      '<span class="badge ' + (cfg.badgeClass || "") + '">' + cfg.badge + "</span>" +
      "</div>" +
      '<div class="tabs">' + tabsHtml + "</div>" +
      '<div class="term-body"><pre class="output"></pre></div>';

    var stage = $(".stage");
    if (stage) stage.appendChild(el);

    var maxLines = Math.max(8, Math.floor((cfg.h / 100) * (window.innerHeight || 800) / 18) - 4);
    state.windows[cfg.id] = {
      el: el,
      cfg: cfg,
      lines: [],
      maxLines: maxLines,
      typing: false,
    };
    return el;
  }

  function setActive(id) {
    state.activeId = id;
    var ids = Object.keys(state.windows);
    for (var i = 0; i < ids.length; i++) {
      var wid = ids[i];
      var w = state.windows[wid];
      if (!w || !w.el) continue;
      if (wid === id) {
        w.el.classList.add("active", "glow");
        w.el.style.zIndex = "45";
      } else {
        w.el.classList.remove("active", "glow");
        w.el.style.zIndex = String(10 + Math.floor(Math.random() * 15));
      }
    }
  }

  function renderOutput(w) {
    if (!w || !w.el) return;
    var pre = w.el.querySelector(".output");
    if (!pre) return;
    var promptClass = w.cfg.secondary ? "prompt-cyan" : "prompt";
    var cursorCls = w.cfg.secondary ? "cursor" : "cursor pink";
    var html = w.lines.join("\n");
    if (!w.typing) {
      html += "\n<span class=\"" + promptClass + "\">$</span> <span class=\"" + cursorCls + "\"></span>";
    }
    pre.innerHTML = html;
  }

  function appendLine(winId, htmlLine, withPrompt) {
    var w = state.windows[winId];
    if (!w) return;
    var promptClass = w.cfg.secondary ? "prompt-cyan" : "prompt";
    var prompt = withPrompt ? '<span class="' + promptClass + '">$</span> ' : "";
    w.lines.push(prompt + htmlLine);
    if (w.lines.length > w.maxLines) {
      w.lines = w.lines.slice(-w.maxLines);
    }
    renderOutput(w);
  }

  function typeLine(winId, text, type, speed) {
    speed = typeof speed === "number" ? speed : 8;
    return new Promise(function (resolve) {
      var w = state.windows[winId];
      if (!w) {
        resolve();
        return;
      }
      w.typing = true;
      var pre = w.el.querySelector(".output");
      var promptClass = w.cfg.secondary ? "prompt-cyan" : "prompt";
      var cursorCls = w.cfg.secondary ? "cursor" : "cursor pink";
      var i = 0;
      var base = w.lines.slice();
      var colored = colorize(text, type);

      if (speed < 4) {
        appendLine(winId, colored, true);
        w.typing = false;
        resolve();
        return;
      }

      function step() {
        i++;
        var partial = escapeHtml(text.slice(0, i));
        var lines = base.concat([
          '<span class="' + promptClass + '">$</span> <span class="cmd">' + partial + '</span><span class="' + cursorCls + '"></span>',
        ]);
        if (pre) pre.innerHTML = lines.join("\n");
        if (i >= text.length) {
          w.lines = base.concat(['<span class="' + promptClass + '">$</span> ' + colored]);
          w.typing = false;
          renderOutput(w);
          resolve();
        } else {
          setTimeout(step, speed + Math.random() * 4);
        }
      }
      step();
    });
  }

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function runSequence(winId) {
    var w = state.windows[winId];
    if (!w) return;
    var type = w.cfg.type;
    var pool = SNIPPETS[type] || SNIPPETS.bash;

    function loop() {
      var p;
      if (Math.random() > 0.35) {
        var cmd = randomFrom(pool);
        var speed = type === "log" || type === "network" ? 2 : 5 + Math.random() * 9;
        p = typeLine(winId, cmd, type, speed).then(function () {
          return sleep(80 + Math.random() * 220);
        });
      } else {
        p = Promise.resolve();
        var burst = 2 + Math.floor(Math.random() * 4);
        var b = 0;
        function nextBurst() {
          if (b >= burst) {
            return sleep(120 + Math.random() * 300);
          }
          var line = randomFrom(pool);
          appendLine(winId, colorize(line, type), type !== "log" && type !== "network");
          b++;
          return sleep(30 + Math.random() * 50).then(nextBurst);
        }
        p = nextBurst();
      }

      p.then(function () {
        if (w.lines.length > w.maxLines - 2 && Math.random() > 0.7) {
          w.lines = w.lines.slice(-Math.floor(w.maxLines * 0.4));
        }
        loop();
      }).catch(function (err) {
        console.error("runSequence error", winId, err);
        setTimeout(loop, 500);
      });
    }

    loop();
  }

  function initMatrix() {
    var canvas = document.getElementById("matrix-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var w, h, cols, drops;
    var chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01";

    function resize() {
      w = canvas.width = window.innerWidth || 800;
      h = canvas.height = window.innerHeight || 600;
      cols = Math.floor(w / 16) || 40;
      drops = [];
      for (var i = 0; i < cols; i++) drops[i] = 1;
    }

    function draw() {
      ctx.fillStyle = "rgba(7, 5, 15, 0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "13px monospace";
      for (var i = 0; i < drops.length; i++) {
        var ch = chars[Math.floor(Math.random() * chars.length)];
        var x = i * 16;
        var y = drops[i] * 16;
        ctx.fillStyle = Math.random() > 0.92 ? "#00f5ff" : "rgba(0, 245, 255, 0.35)";
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
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
    var colors = ["pink", "cyan", "gold", "green"];
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

  function updateHud() {
    state.packets += Math.floor(Math.random() * 40) + 8;
    state.bytes += Math.floor(Math.random() * 12000) + 2000;
    if (Math.random() > 0.92) state.sessions = 2 + Math.floor(Math.random() * 6);
    if (Math.random() > 0.97) {
      state.threat = randomFrom(["LOW", "MED", "HIGH", "CRIT"]);
    }

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
      thr.className = "val" + (state.threat === "HIGH" || state.threat === "CRIT" ? " val-pink" : "");
    }
    if (clk) {
      var now = new Date();
      clk.textContent = now.toTimeString().slice(0, 8);
    }
  }

  function showToast(title, body) {
    var t = document.getElementById("toast");
    if (!t) return;
    var titleEl = t.querySelector(".toast-title");
    var bodyEl = t.querySelector(".toast-body");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    t.classList.add("show");
    setTimeout(function () {
      t.classList.remove("show");
    }, 3200);
  }

  function rotateFocus() {
    var ids = Object.keys(state.windows);
    if (!ids.length) return;
    var next = randomFrom(ids);
    setActive(next);
  }

  function boot() {
    try {
      for (var i = 0; i < WINDOW_CONFIGS.length; i++) {
        createWindow(WINDOW_CONFIGS[i]);
      }

      var ids = Object.keys(state.windows);
      for (var j = 0; j < ids.length; j++) {
        (function (id) {
          var w = state.windows[id];
          if (w && w.el) {
            w.el.addEventListener("mousedown", function () {
              setActive(id);
            });
          }
        })(ids[j]);
      }

      initMatrix();
      spawnParticles();

      for (var k = 0; k < WINDOW_CONFIGS.length; k++) {
        (function (cfg, delay) {
          setTimeout(function () {
            runSequence(cfg.id);
          }, delay);
        })(WINDOW_CONFIGS[k], 400 + k * 600);
      }

      setInterval(updateHud, 400);
      updateHud();

      setInterval(rotateFocus, 7000 + Math.random() * 4000);

      var toastMessages = [
        ["INTRUSION DETECTED", "Unauthorized probe from 203.0.113.44 blocked"],
        ["C2 BEACON", "Callback received · session #4 established"],
        ["EXFIL COMPLETE", "2.4 MB transferred via DNS"],
        ["PRIV ESC", "uid=0 obtained on ghost-01"],
        ["PERSISTENCE", "systemd unit installed successfully"],
        ["COVER TRACKS", "auditd logs rotated and wiped"],
      ];
      setInterval(function () {
        if (Math.random() > 0.55) {
          var m = randomFrom(toastMessages);
          showToast(m[0], m[1]);
        }
      }, 9000);

      setTimeout(function () {
        showToast("SYSTEM ONLINE", "Multi-session recon active · stealth mode");
      }, 1800);
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
