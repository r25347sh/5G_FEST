/**
 * ShadowOps Roulette — adapted from 5G-staff European wheel
 * activate roulette / deactivate roulette
 */
(function (global) {
  "use strict";

  var ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
    10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];
  var RED = {
    1:1,3:1,5:1,7:1,9:1,12:1,14:1,16:1,18:1,19:1,21:1,23:1,25:1,27:1,30:1,32:1,34:1,36:1
  };
  var POCKET = 360 / 37;

  var overlay = null;
  var canvas = null;
  var ctx = null;
  var rotation = 0;
  var spinning = false;
  var balance = 1000;
  var currentBet = null;
  var history = [];
  var active = false;

  function colorOf(n) {
    if (n === 0) return "green";
    return RED[n] ? "red" : "black";
  }

  function ensureUI() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "roulette-overlay";
    overlay.className = "roulette-overlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="roulette-panel">' +
        '<div class="roulette-top">' +
          '<span class="roulette-title">OPS · ROULETTE</span>' +
          '<span class="roulette-bal">BAL <b id="rl-bal">1000</b></span>' +
          '<button type="button" class="roulette-x" id="rl-close" title="close">×</button>' +
        '</div>' +
        '<div class="wheel-stage">' +
          '<div class="wheel-outer"></div>' +
          '<canvas id="rl-canvas" width="420" height="420"></canvas>' +
          '<div class="wheel-pointer"></div>' +
          '<div class="wheel-hub">G5</div>' +
        '</div>' +
        '<div class="roulette-result" id="rl-result">—</div>' +
        '<div class="roulette-bets" id="rl-bets">' +
          '<button type="button" class="bet-chip" data-bet="red">RED</button>' +
          '<button type="button" class="bet-chip" data-bet="black">BLACK</button>' +
          '<button type="button" class="bet-chip" data-bet="even">EVEN</button>' +
          '<button type="button" class="bet-chip" data-bet="odd">ODD</button>' +
          '<button type="button" class="bet-chip" data-bet="low">1-18</button>' +
          '<button type="button" class="bet-chip" data-bet="high">19-36</button>' +
        '</div>' +
        '<div class="roulette-actions">' +
          '<button type="button" id="rl-spin" class="rl-spin">SPIN</button>' +
          '<button type="button" id="rl-clear" class="rl-clear">CLEAR BET</button>' +
        '</div>' +
        '<div class="roulette-hist" id="rl-hist"></div>' +
        '<div class="roulette-hint">SPACE to spin · ESC to close</div>' +
      '</div>';
    document.body.appendChild(overlay);

    canvas = document.getElementById("rl-canvas");
    ctx = canvas.getContext("2d");

    document.getElementById("rl-close").addEventListener("click", hide);
    document.getElementById("rl-spin").addEventListener("click", spin);
    document.getElementById("rl-clear").addEventListener("click", function () {
      currentBet = null;
      overlay.querySelectorAll(".bet-chip").forEach(function (b) { b.classList.remove("active"); });
    });
    overlay.querySelectorAll(".bet-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        overlay.querySelectorAll(".bet-chip").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentBet = { type: btn.dataset.bet, amount: 50 };
      });
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) hide();
    });
  }

  function drawWheel(rotDeg) {
    if (!ctx || !canvas) return;
    var w = canvas.width;
    var cx = w / 2, cy = w / 2, r = w / 2 - 4;
    ctx.clearRect(0, 0, w, w);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#0d0a14";
    ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotDeg * Math.PI) / 180);
    for (var i = 0; i < 37; i++) {
      var start = ((i * POCKET) - POCKET / 2 - 90) * Math.PI / 180;
      var end = (((i + 1) * POCKET) - POCKET / 2 - 90) * Math.PI / 180;
      var n = ORDER[i];
      var col = colorOf(n);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 2, start, end);
      ctx.closePath();
      if (col === "red") ctx.fillStyle = "#c41e3a";
      else if (col === "black") ctx.fillStyle = "#121018";
      else ctx.fillStyle = "#0a6b3c";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,215,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      var mid = (start + end) / 2;
      var tx = Math.cos(mid) * (r * 0.72);
      var ty = Math.sin(mid) * (r * 0.72);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), 0, 0);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10,7,18,0.85)";
    ctx.fill();
    ctx.restore();
  }

  function updateBalance() {
    var el = document.getElementById("rl-bal");
    if (el) el.textContent = String(balance);
  }

  function pushHistory(n) {
    history.unshift({ n: n, c: colorOf(n) });
    if (history.length > 12) history.pop();
    var h = document.getElementById("rl-hist");
    if (!h) return;
    h.innerHTML = history.map(function (x) {
      return '<span class="h-' + x.c + '">' + x.n + "</span>";
    }).join("");
  }

  function settle(n) {
    if (!currentBet || currentBet.amount <= 0) return "";
    var amt = currentBet.amount;
    var win = false;
    var t = currentBet.type;
    var c = colorOf(n);
    if (t === "red") win = c === "red";
    else if (t === "black") win = c === "black";
    else if (t === "even") win = n !== 0 && n % 2 === 0;
    else if (t === "odd") win = n % 2 === 1;
    else if (t === "low") win = n >= 1 && n <= 18;
    else if (t === "high") win = n >= 19 && n <= 36;
    if (win) {
      balance += amt;
      return "WIN +" + amt;
    }
    balance = Math.max(0, balance - amt);
    return "LOSS -" + amt;
  }

  function spin() {
    if (spinning || !active) return;
    ensureUI();
    spinning = true;
    var btn = document.getElementById("rl-spin");
    if (btn) btn.disabled = true;
    var winNumber = ORDER[Math.floor(Math.random() * 37)];
    var winIdx = ORDER.indexOf(winNumber);
    var startRot = rotation;
    var extra = 360 * (4 + Math.floor(Math.random() * 3));
    var target = startRot + extra + (360 - (winIdx * POCKET) - (startRot % 360) + 360) % 360;
    var duration = 4200 + Math.random() * 1200;
    var t0 = performance.now();
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function frame(now) {
      var t = Math.min(1, (now - t0) / duration);
      rotation = startRot + (target - startRot) * ease(t);
      drawWheel(rotation);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        rotation = target;
        drawWheel(rotation);
        var landed = winNumber;
        var msg = settle(landed);
        updateBalance();
        pushHistory(landed);
        var res = document.getElementById("rl-result");
        if (res) {
          res.innerHTML = '<span class="landed ' + colorOf(landed) + '">' + landed +
            "</span> " + colorOf(landed).toUpperCase() +
            (msg ? ' <span class="betmsg">' + msg + "</span>" : "");
        }
        spinning = false;
        if (btn) btn.disabled = false;
        if (global.ShadowOps && global.ShadowOps.showToast) {
          global.ShadowOps.showToast("ROULETTE", landed + " · " + colorOf(landed) + (msg ? " · " + msg : ""));
        }
      }
    }
    requestAnimationFrame(frame);
  }

  function show() {
    ensureUI();
    active = true;
    overlay.hidden = false;
    overlay.classList.add("show");
    drawWheel(rotation);
    updateBalance();
  }

  function hide() {
    active = false;
    if (overlay) {
      overlay.classList.remove("show");
      overlay.hidden = true;
    }
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === "Escape") { hide(); return; }
    if (e.code === "Space" || e.key === " ") {
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      spin();
    }
  }

  document.addEventListener("keydown", onKey);

  global.ShadowRoulette = {
    show: show,
    hide: hide,
    spin: spin,
    isActive: function () { return active; }
  };
})(typeof window !== "undefined" ? window : this);
