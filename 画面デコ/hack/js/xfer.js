/**
 * ShadowOps transfer / process progress bars
 * Random interval download / upload / process animations
 */
(function (global) {
  "use strict";

  var LABELS = {
    DOWNLOAD: [
      "payload.bin", "mirror.dump", "lsass.minidump", "ntds.dit.partial",
      "beacon.so", "stage2.enc", "cert_chain.pem", "route_table.json"
    ],
    UPLOAD: [
      "exfil_chunk_04.dat", "keytab.export", "session.pcap", "shadow.db",
      "loot/creds.txt", "c2/heartbeat.bin", "tunnel.conf", "scrub.log"
    ],
    PROCESS: [
      "hashcat -m 22000", "polymorph.engine", "dns_tunnel.encode",
      "lateral.scan", "kerberoast.batch", "memory.carve", "sig.evade",
      "jitter.recalc", "route.anonymize", "ioc.scrub"
    ],
    DECRYPT: ["aes-gcm session", "tls client_hello", "vault.blob", "pgp keyring"],
    COMPILE: ["implant.elf", "loader.dll", "shellcode.bin", "driver.sys"]
  };

  var KINDS = ["DOWNLOAD", "UPLOAD", "PROCESS", "DECRYPT", "COMPILE"];
  var active = true;
  var timer = null;
  var panel = null;
  var maxBars = 5;

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "xfer-panel";
    panel.className = "xfer-panel";
    panel.setAttribute("aria-hidden", "true");
    document.body.appendChild(panel);
    return panel;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(2) + " MB";
  }

  function spawnBar() {
    if (!active) return;
    var p = ensurePanel();
    while (p.children.length >= maxBars) {
      if (p.firstChild) p.removeChild(p.firstChild);
    }

    var kind = pick(KINDS);
    var name = pick(LABELS[kind] || LABELS.PROCESS);
    var total = Math.floor(rand(48, 2400)) * 1024;
    var rate = Math.floor(rand(80, 900));
    var duration = rand(2800, 9000);

    var el = document.createElement("div");
    el.className = "xfer-bar kind-" + kind.toLowerCase();
    el.innerHTML =
      '<div class="xfer-head">' +
        '<span class="xfer-kind">[' + kind + ']</span> ' +
        '<span class="xfer-name">' + name + '</span>' +
        '<span class="xfer-pct">0%</span>' +
      '</div>' +
      '<div class="xfer-track"><div class="xfer-fill"></div></div>' +
      '<div class="xfer-meta"><span class="xfer-size">0 / ' + formatBytes(total) +
      '</span><span class="xfer-rate">' + rate + ' KB/s</span></div>';

    p.appendChild(el);
    var fill = el.querySelector(".xfer-fill");
    var pctEl = el.querySelector(".xfer-pct");
    var sizeEl = el.querySelector(".xfer-size");
    var t0 = performance.now();

    function frame(now) {
      if (!active && !el.parentNode) return;
      var t = Math.min(1, (now - t0) / duration);
      var e = t < 0.85 ? Math.pow(t / 0.85, 1.15) * 0.92 : 0.92 + (t - 0.85) / 0.15 * 0.08;
      if (Math.random() > 0.97 && t < 0.9) e = Math.max(0, e - 0.02);
      var pct = Math.min(100, Math.floor(e * 100));
      var done = Math.floor(total * e);
      if (fill) fill.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pct + "%";
      if (sizeEl) sizeEl.textContent = formatBytes(done) + " / " + formatBytes(total);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.classList.add("done");
        setTimeout(function () {
          el.classList.add("fade");
          setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          }, 500);
        }, 600);
      }
    }
    requestAnimationFrame(frame);
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    if (!active) return;
    var wait = rand(2200, 7800);
    timer = setTimeout(function () {
      spawnBar();
      if (Math.random() > 0.55) setTimeout(spawnBar, rand(200, 900));
      schedule();
    }, wait);
  }

  function start() {
    active = true;
    ensurePanel();
    schedule();
    setTimeout(spawnBar, 600);
    setTimeout(spawnBar, 1400);
  }

  function stop() {
    active = false;
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function clearAll() {
    if (panel) panel.innerHTML = "";
  }

  global.ShadowXfer = {
    start: start,
    stop: stop,
    spawn: spawnBar,
    clear: clearAll,
    isActive: function () { return active; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(start, 1800);
    });
  } else {
    setTimeout(start, 1800);
  }
})(typeof window !== "undefined" ? window : this);
