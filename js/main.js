(function () {
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  document.addEventListener("visibilitychange", function () { root.classList.toggle("is-hidden", document.hidden); });
  var cv = document.getElementById("agents"), cx = cv.getContext("2d");
  var NAMES = ["Planner", "Coder", "Reviewer", "Tester", "RAG", "Deployer"];
  var W, H, nodes = [], pulses = [], last = 0, lastPulse = 0, raf;
  var rnd = function (n) { return Math.random() * n; };
  function mk(label, i) {
    return { x: rnd(W), y: rnd(H), vx: rnd(.4) - .2, vy: rnd(.4) - .2, label: label,
      r: label ? 5 : 1.8, c: i % 2 ? "139,92,246" : "91,140,255" };
  }
  function build() {
    var n = W < 720 ? 9 : 24; // plus 6 agents: ~15 / ~30 total
    if (nodes.length === NAMES.length + n) return;
    nodes = NAMES.map(mk).concat(Array.from({ length: n }, function (_, i) { return mk(null, i); }));
  }
  function resize() {
    var d = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    cx.setTransform(d, 0, 0, d, 0, 0);
    build();
    if (still) draw();
  }
  function step() {
    nodes.forEach(function (n) {
      n.x += n.vx; n.y += n.vy;
      // abs() so nodes left outside after a resize head back in instead of jittering
      if (n.x < 0 || n.x > W) n.vx = Math.abs(n.vx) * (n.x < 0 ? 1 : -1);
      if (n.y < 0 || n.y > H) n.vy = Math.abs(n.vy) * (n.y < 0 ? 1 : -1);
    });
  }
  function drawLinks() {
    for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
      var d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d > 140) continue;
      cx.strokeStyle = "rgba(91,140,255," + (.25 * (1 - d / 140)) + ")";
      cx.beginPath(); cx.moveTo(nodes[i].x, nodes[i].y); cx.lineTo(nodes[j].x, nodes[j].y); cx.stroke();
    }
  }
  function drawNodes() {
    cx.font = "12px ui-monospace, Consolas, monospace";
    nodes.forEach(function (n) {
      var b = n.boost ? Math.max(0, 1 - (performance.now() - n.boost) / 900) : 0;
      cx.shadowBlur = n.label ? 14 + 26 * b : 0; cx.shadowColor = "rgb(" + n.c + ")";
      cx.fillStyle = "rgba(" + n.c + "," + (n.label ? 1 : .5) + ")";
      cx.beginPath(); cx.arc(n.x, n.y, n.r * (1 + b), 0, 6.2832); cx.fill();
      cx.shadowBlur = 0;
      if (n.label && W >= 720 && !blocked(n.x - 8, n.y - 10, n.x + 14 + cx.measureText(n.label).width, n.y + 10)) {
        cx.fillStyle = "rgba(154,165,196,.9)"; cx.fillText(n.label, n.x + 10, n.y + 4);
      }
    });
  }
  // keep agent labels off the hero copy: viewport boxes of the text blocks, re-measured after scroll/resize
  var KEEP = document.querySelectorAll(".hero .badge, .hero h1, .hero .wrap > p, .hero .ctas, #term, .hero .stats");
  var boxes = [], measuredAt = -1e9;
  function measure() {
    boxes = Array.prototype.map.call(KEEP, function (el) {
      var r = el.getBoundingClientRect(); return [r.left - 16, r.top - 12, r.right + 16, r.bottom + 12];
    });
    measuredAt = performance.now();
  }
  function blocked(x1, y1, x2, y2) {
    if (performance.now() - measuredAt > 400) measure();
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (x1 < b[2] && x2 > b[0] && y1 < b[3] && y2 > b[1]) return true;
    }
    return false;
  }
  addEventListener("scroll", function () { measuredAt = -1e9; }, { passive: true });
  function drawPulses(t) {
    pulses = pulses.filter(function (p) { return t - p.t < 1400; });
    pulses.forEach(function (p) {
      var k = Math.min((t - p.t) / 1000, 1), a = t - p.t < 1000 ? 1 : 1 - (t - p.t - 1000) / 400;
      cx.fillStyle = "rgba(255,255,255," + a + ")"; cx.shadowBlur = 12; cx.shadowColor = "#fff";
      cx.beginPath(); cx.arc(p.a.x + (p.b.x - p.a.x) * k, p.a.y + (p.b.y - p.a.y) * k, 3, 0, 6.2832); cx.fill();
      cx.shadowBlur = 0;
    });
  }
  function draw(t) { cx.clearRect(0, 0, W, H); drawLinks(); drawNodes(); drawPulses(t || 0); }
  function frame(t) {
    if (t - lastPulse > 1200) {
      lastPulse = t;
      var a = nodes[Math.floor(rnd(6))], b = nodes[Math.floor(rnd(6))];
      if (a !== b) pulses.push({ a: a, b: b, t: t });
    }
    step(); draw(t);
    raf = requestAnimationFrame(frame);
  }
  addEventListener("resize", function () { measuredAt = -1e9; resize(); });
  resize();
  if (still) {
    // static frame: redraw (no motion) so labels stay clear of the copy after scrolling and font load
    var queued = false;
    var redraw = function () { queued = false; measuredAt = -1e9; draw(); };
    addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(redraw); } }, { passive: true });
    if (document.fonts) document.fonts.ready.then(redraw);
  }
  if (!still) {
    raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", function () {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    });
  }

  var term = document.getElementById("term");
  var LOG = ["[Planner] breaking task into 4 steps\u2026", "[RAG] retrieved 12 docs from vector DB", "[Coder] writing agent.py \u2713",
    "[Tester] 24/24 tests passed", "[Reviewer] approved PR #16", "[Deployer] shipped to production \uD83D\uDE80"];
  function lineEl(text) {
    var m = /^(\[[^\]]+\])(.*)$/.exec(text), row = document.createElement("div"), tag = document.createElement("b");
    if (!still) {
      var name = m[1].slice(1, -1);
      for (var k = 0; k < nodes.length; k++) if (nodes[k].label === name) nodes[k].boost = performance.now();
    }
    tag.textContent = m[1]; row.appendChild(tag);
    var rest = document.createTextNode(""); row.appendChild(rest);
    term.appendChild(row);
    while (term.children.length > 5) term.removeChild(term.firstChild);
    var chars = Array.from(m[2]); // code points, so the emoji isn't split mid-typing
    return function (n) { rest.nodeValue = chars.slice(0, n).join(""); return n >= chars.length; };
  }
  // typing timers park while the tab is hidden and resume on return
  var parked = null;
  function later(fn, ms) {
    setTimeout(function () { if (document.hidden) parked = fn; else fn(); }, ms);
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && parked) { var fn = parked; parked = null; fn(); }
  });
  function type(i) {
    var put = lineEl(LOG[i % LOG.length]), n = 0;
    (function tick() {
      if (put(++n)) return later(function () { type(i + 1); }, 600);
      later(tick, 25);
    })();
  }
  if (still) LOG.slice(-5).forEach(function (l) { lineEl(l)(99); }); else type(0);

  if (!still && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var pe = null;
    var spot = function () {
      var e = pe; pe = null;
      var c = e.target.closest && e.target.closest(".card");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    };
    document.addEventListener("pointermove", function (e) {
      if (document.hidden) return;
      if (!pe) requestAnimationFrame(spot);
      pe = e;
    }, { passive: true });
  }
})();
