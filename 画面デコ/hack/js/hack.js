/**
 * 画面デコ - Hacker Terminal Animation Engine
 * Infinite loop · Ultra-fast typing · Multi-window
 * Design language: 5G-staff (pink / cyan / gold / deep purple)
 */

(function () {
  "use strict";

  // ─── Code snippets pool (realistic, varied) ───────────────────────────────
  const SNIPPETS = {
    bash: [
      "nmap -sS -sV -O -T4 192.168.1.0/24 --open",
      "ssh -i ~/.ssh/id_ed25519 root@10.0.0.42 -p 2222",
      "curl -s -X POST https://api.target.local/v1/auth -H 'Content-Type: application/json' -d '{\"user\":\"admin\",\"token\":\"...\"}'",
      "sudo tcpdump -i eth0 -nn -s0 -w capture.pcap port 443",
      "find /var/log -name '*.log' -mtime -1 | xargs grep -i 'failed\\|error\\|breach'",
      "python3 -c \"import socket; s=socket.socket(); s.connect(('10.0.0.1',22)); print(s.recv(1024))\"",
      "hashcat -m 0 -a 0 hashes.txt rockyou.txt --force",
      "docker exec -it $(docker ps -q --filter name=proxy) sh",
      "git clone git@github.com:internal/recon.git && cd recon && ./run.sh --stealth",
      "export PATH=$PATH:/opt/tools/bin; proxychains4 nmap -Pn 172.16.0.0/16",
      "openssl s_client -connect target:443 -servername target 2>/dev/null | openssl x509 -noout -text",
      "journalctl -u sshd --since '1 hour ago' | grep -E 'Accepted|Failed'",
      "rsync -avz -e 'ssh -p 2222' ./payload/ root@10.0.0.88:/tmp/.x/",
      "echo '*/5 * * * * /usr/local/bin/beacon' | crontab -",
      "iptables -A INPUT -s 203.0.113.0/24 -j DROP && iptables-save",
    ],
    python: [
      "import requests, json, base64, hashlib",
      "from cryptography.fernet import Fernet",
      "session = requests.Session()",
      "session.headers.update({'User-Agent': 'Mozilla/5.0', 'X-Forwarded-For': '127.0.0.1'})",
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
      "document.cookie = `token=${jwt}; path=/; SameSite=None; Secure`;",
      "WebSocket.prototype.send = new Proxy(WebSocket.prototype.send, { apply(t, thisArg, args) { console.log(args); return Reflect.apply(t, thisArg, args); }});",
      "const buffer = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(secret)));",
      "navigator.credentials.get({ publicKey: options }).then(assert);",
      "eval(atob(obfuscated));",
      "window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;",
    ],
    log: [
      "[INFO]  Connection established → 10.0.0.42:22",
      "[OK]    Authentication successful (ed25519)",
      "[WARN]  Rate limit approaching (87/100)",
      "[+]     Privilege escalation: uid=0(root)",
      "[*]     Dumping /etc/shadow ... 42 entries",
      "[+]     Lateral movement: 172.16.4.12",
      "[INFO]  Exfiltrating 2.4 MB via DNS tunnel",
      "[OK]    Persistence installed (systemd user unit)",
      "[*]     C2 beacon interval set to 45s",
      "[ERROR] Connection reset by peer — retrying in 3s",
      "[+]     Kernel exploit ready (CVE-2024-XXXX)",
      "[INFO]  Clearing audit logs ... done",
      "[OK]    Cover tracks complete",
      "[*]     Switching to passive mode",
    ],
    sql: [
      "SELECT user, password_hash, last_login FROM accounts WHERE role='admin';",
      "UPDATE sessions SET expires_at = NOW() + INTERVAL '30 days' WHERE token = $1;",
      "INSERT INTO audit_log (actor, action, target) VALUES ('system', 'ACCESS', 'vault');",
      "DROP TABLE IF EXISTS temp_recon;",
      "GRANT ALL PRIVILEGES ON DATABASE ops TO 'svc_recon'@'%';",
    ],
    network: [
      "TRACE  1  192.168.0.1   0.4 ms",
      "TRACE  2  10.0.0.1      1.2 ms",
      "TRACE  3  203.0.113.1   12.8 ms",
      "SYN-ACK received from 10.0.0.88:443",
      "TLS handshake complete (TLS 1.3)",
      "Certificate: CN=*.internal.corp  (valid)",
      "DNS: target.local → 10.0.0.42",
      "Packet loss: 0.0%  RTT: 4.2 ms",
    ],
  };

  const WINDOW_CONFIGS = [
    {
      id: "w1",
      title: "root@ghost-01",
      path: "~/ops",
      badge: "ACTIVE",
      badgeClass: "green",
      tabs: ["shell", "nmap", "payload"],
      activeTab: 0,
      type: "bash",
      secondary: false,
      x: 4, y: 8, w: 42, h: 48,
    },
    {
      id: "w2",
      title: "python3",
      path: "exploit.py",
      badge: "RUN",
      badgeClass: "",
      tabs: ["exploit.py", "utils.py", "c2.py"],
      activeTab: 0,
      type: "python",
      secondary: false,
      x: 48, y: 6, w: 48, h: 42,
    },
    {
      id: "w3",
      title: "tcpdump",
      path: "eth0",
      badge: "LIVE",
      badgeClass: "cyan",
      tabs: ["capture", "filter", "stats"],
      activeTab: 0,
      type: "network",
      secondary: true,
      x: 52, y: 52, w: 44, h: 36,
    },
    {
      id: "w4",
      title: "logs",
      path: "/var/log/ops",
      badge: "TAIL",
      badgeClass: "green",
      tabs: ["auth.log", "kern.log", "audit"],
      activeTab: 0,
      type: "log",
      secondary: true,
      x: 3, y: 58, w: 46, h: 32,
    },
    {
      id: "w5",
      title: "node",
      path: "injector.js",
      badge: "HOOK",
      badgeClass: "",
      tabs: ["injector.js", "ws.js"],
      activeTab: 0,
      type: "js",
      secondary: false,
      x: 28, y: 28, w: 38, h: 34,
    },
  ];

  // ─── State ────────────────────────────────────────────────────────
  const state = {
    windows: {},
    activeId: "w1",
    packets: 0,
    bytes: 0,
    sessions: 3,
    threat: "LOW",
  };

  // ─── DOM helpers ──────────────────────────────────────────────────────
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function createWindow(cfg) {
    const el = document.createElement("div");
    el.className = "window" + (cfg.secondary ? " secondary" : "") + (cfg.id === state.activeId ? " active glow" : "");
    el.id = cfg.id;
    el.style.left = cfg.x + "%";
    el.style.top = cfg.y + "%";
    el.style.width = cfg.w + "%";
    el.style.height = cfg.h + "%";
    el.style.zIndex = cfg.id === state.activeId ? 40 : 10 + Math.floor(Math.random() * 10);

    el.innerHTML = `
      <div class="title-bar">
        <div class="traffic"><span class="close"></span><span class="min"></span><span class="max"></span></div>
        <div class="title">${cfg.title} <span class="path">· ${cfg.path}</span></div>
        <span class="badge ${cfg.badgeClass || ""}">${cfg.badge}</span>
      </div>
      <div class="tabs">
        ${cfg.tabs.map((t, i) => `<div class="tab ${i === cfg.activeTab ? "active" : ""} ${cfg.secondary ? "cyan-active" : ""}">${t}</div>`).join("")}
      </div>
      <div class="term-body"><pre class="output"></pre></div>
    `;

    $(".stage").appendChild(el);
    state.windows[cfg.id] = {
      el,
      cfg,
      lines: [],
      maxLines: Math.floor((cfg.h / 100) * window.innerHeight / 18) - 4,
      typing: false,
    };
    return el;
  }

  function setActive(id) {
    state.activeId = id;
    Object.keys(state.windows).forEach((wid) => {
      const w = state.windows[wid];
      w.el.classList.toggle("active", wid === id);
      w.el.classList.toggle("glow", wid === id);
      w.el.style.zIndex = wid === id ? 45 : 10 + Math.floor(Math.random() * 15);
    });
  }

  // ─── Typing engine ─────────────────────────────────────────────────
  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function colorize(line, type) {
    if (type === "log") {
      if (line.includes("[OK]") || line.includes("[+]")) return `<span class="success">${escapeHtml(line)}</span>`;
      if (line.includes("[ERROR]")) return `<span class="error">${escapeHtml(line)}</span>`;
      if (line.includes("[WARN]")) return `<span class="warn">${escapeHtml(line)}</span>`;
      if (line.includes("[INFO]") || line.includes("[*]")) return `<span class="dim">${escapeHtml(line)}</span>`;
      return escapeHtml(line);
    }
    if (type === "network") {
      return `<span class="dim">${escapeHtml(line)}</span>`;
    }
    // simple syntax highlight for code-ish lines
    let s = escapeHtml(line);
    s = s.replace(/\b(import|from|const|let|var|function|def|async|await|return|if|else|for|while|class|export|SELECT|UPDATE|INSERT|DROP|GRANT)\b/g, '<span class="keyword">$1</span>');
    s = s.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>');
    s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    s = s.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="func">$1</span>(');
    return s;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  }

  function appendLine(winId, htmlLine, withPrompt) {
    const w = state.windows[winId];
    if (!w) return;
    const pre = w.el.querySelector(".output");
    const promptClass = w.cfg.secondary ? "prompt-cyan" : "prompt";
    const prompt = withPrompt
      ? `<span class="${promptClass}">$</span> `
      : "";
    w.lines.push(prompt + htmlLine);
    if (w.lines.length > w.maxLines) {
      w.lines = w.lines.slice(-w.maxLines);
    }
    pre.innerHTML = w.lines.join("\n") + (w.typing ? "" : `\n<span class="${promptClass}">$</span> <span class="cursor ${w.cfg.secondary ? "" : "pink"}"></span>`);
  }

  function typeLine(winId, text, type, speed = 8) {
    return new Promise((resolve) => {
      const w = state.windows[winId];
      if (!w) return resolve();
      w.typing = true;
      const pre = w.el.querySelector(".output");
      const promptClass = w.cfg.secondary ? "prompt-cyan" : "prompt";
      let i = 0;
      const base = w.lines.slice();
      const colored = colorize(text, type);

      if (speed < 4) {
        appendLine(winId, colored, true);
        w.typing = false;
        return resolve();
      }

      function step() {
        i++;
        const partial = escapeHtml(text.slice(0, i));
        const lines = base.concat([
          `<span class="${promptClass}">$</span> <span class="cmd">${partial}</span><span class="cursor ${w.cfg.secondary ? "" : "pink"}"></span>`,
        ]);
        pre.innerHTML = lines.join("\n");
        if (i >= text.length) {
          w.lines = base.concat([`<span class="${promptClass}">$</span> ${colored}`]);
          w.typing = false;
          pre.innerHTML = w.lines.join("\n") + `\n<span class="${promptClass}">$</span> <span class="cursor ${w.cfg.secondary ? "" : "pink"}"></span>`;
          resolve();
        } else {
          setTimeout(step, speed + Math.random() * 4);
        }
      }
      step();
    });
  }

  async function runSequence(winId) {
    const w = state.windows[winId];
    if (!w) return;
    const type = w.cfg.type;
    const pool = SNIPPETS[type] || SNIPPETS.bash;

    while (true) {
      if (Math.random() > 0.35) {
        const cmd = randomFrom(pool);
        const speed = type === "log" || type === "network" ? 2 : 5 + Math.random() * 9;
        await typeLine(winId, cmd, type, speed);
        await sleep(80 + Math.random() * 220);
      } else {
        const burst = 2 + Math.floor(Math.random() * 4);
        for (let b = 0; b < burst; b++) {
          const line = randomFrom(pool);
          appendLine(winId, colorize(line, type), type !== "log" && type !== "network");
          await sleep(30 + Math.random() * 50);
        }
        await sleep(120 + Math.random() * 300);
      }

      if (w.lines.length > w.maxLines - 2 && Math.random() > 0.7) {
        w.lines = w.lines.slice(-Math.floor(w.maxLines * 0.4));
      }
    }
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ─── Matrix rain ────────────────────────────────────────────────────
  function initMatrix() {
    const canvas = document.getElementById("matrix-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, cols, drops;
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01アカサタナハマヤラワ";

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.floor(w / 16);
      drops = Array(cols).fill(1);
    }

    function draw() {
      ctx.fillStyle = "rgba(7, 5, 15, 0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "13px monospace";
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 16;
        const y = drops[i] * 16;
        const grad = Math.random() > 0.92;
        ctx.fillStyle = grad ? "#00f5ff" : "rgba(0, 245, 255, 0.35)";
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

  // ─── Ambient particles ──────────────────────────────────────────────
  function spawnParticles() {
    const container = $(".ambient");
    if (!container) return;
    const colors = ["pink", "cyan", "gold", "green"];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("div");
      p.className = "ambient-particle " + randomFrom(colors);
      const size = 2 + Math.random() * 4;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 8 + Math.random() * 14 + "s";
      p.style.animationDelay = Math.random() * 10 + "s";
      container.appendChild(p);
    }
  }

  // ─── HUD updates ───────────────────────────────────────────────────
  function updateHud() {
    state.packets += Math.floor(Math.random() * 40) + 8;
    state.bytes += Math.floor(Math.random() * 12000) + 2000;
    if (Math.random() > 0.92) state.sessions = 2 + Math.floor(Math.random() * 6);
    if (Math.random() > 0.97) {
      state.threat = randomFrom(["LOW", "MED", "HIGH", "CRIT"]);
    }

    const pkt = $("#hud-packets");
    const byt = $("#hud-bytes");
    const ses = $("#hud-sessions");
    const thr = $("#hud-threat");
    const clk = $("#hud-clock");

    if (pkt) pkt.textContent = state.packets.toLocaleString();
    if (byt) byt.textContent = (state.bytes / 1024).toFixed(1) + " KB";
    if (ses) ses.textContent = state.sessions;
    if (thr) {
      thr.textContent = state.threat;
      thr.className = "val" + (state.threat === "HIGH" || state.threat === "CRIT" ? " val-pink" : "");
    }
    if (clk) {
      const now = new Date();
      clk.textContent = now.toTimeString().slice(0, 8);
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────
  function showToast(title, body) {
    const t = $("#toast");
    if (!t) return;
    t.querySelector(".toast-title").textContent = title;
    t.querySelector(".toast-body").textContent = body;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3200);
  }

  // ─── Window focus rotation ─────────────────────────────────────────
  function rotateFocus() {
    const ids = Object.keys(state.windows);
    const next = randomFrom(ids);
    setActive(next);
  }

  // ─── Boot sequence ────────────────────────────────────────────────
  async function boot() {
    WINDOW_CONFIGS.forEach(createWindow);

    Object.keys(state.windows).forEach((id) => {
      state.windows[id].el.addEventListener("mousedown", () => setActive(id));
    });

    initMatrix();
    spawnParticles();

    WINDOW_CONFIGS.forEach((cfg, i) => {
      setTimeout(() => runSequence(cfg.id), 400 + i * 600);
    });

    setInterval(updateHud, 400);
    updateHud();

    setInterval(rotateFocus, 7000 + Math.random() * 4000);

    const toastMessages = [
      ["INTRUSION DETECTED", "Unauthorized probe from 203.0.113.44 blocked"],
      ["C2 BEACON", "Callback received · session #4 established"],
      ["EXFIL COMPLETE", "2.4 MB transferred via DNS"],
      ["PRIV ESC", "uid=0 obtained on ghost-01"],
      ["PERSISTENCE", "systemd unit installed successfully"],
      ["COVER TRACKS", "auditd logs rotated and wiped"],
    ];
    setInterval(() => {
      if (Math.random() > 0.55) {
        const m = randomFrom(toastMessages);
        showToast(m[0], m[1]);
      }
    }, 9000);

    setTimeout(() => showToast("SYSTEM ONLINE", "Multi-session recon active · stealth mode"), 1800);
  }

  // ─── Init ─────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
