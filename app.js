"use strict";

/* ===================================================================
   Subtraction Magic — v2
   - Tens & Ones tutor with adaptive guidance, hearts and exchanging
   - Star Quiz quick-fire game
   - On-device progress, badges and an end-of-session certificate
   =================================================================== */

/* ---------- DOM helpers ---------- */
const $ = (id) => document.getElementById(id);
const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const plural = (n, s, p) => (n === 1 ? s : p);

/* ---------- Unicorn SVG (home + certificate brand) ---------- */
const UNICORN_SVG = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mane" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9ed2"/><stop offset="0.5" stop-color="#b78cff"/><stop offset="1" stop-color="#7ef0d3"/>
    </linearGradient>
    <linearGradient id="horn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe66d"/><stop offset="1" stop-color="#ffb84d"/>
    </linearGradient>
  </defs>
  <ellipse cx="60" cy="100" rx="34" ry="8" fill="#000" opacity="0.08"/>
  <path d="M30 70 q-12 6 -16 20 q10 -4 16 -8z" fill="url(#mane)"/>
  <path d="M86 58 q22 6 26 26 q-16 -2 -26 -14z" fill="url(#mane)"/>
  <ellipse cx="62" cy="68" rx="34" ry="30" fill="#fff"/>
  <ellipse cx="62" cy="68" rx="34" ry="30" fill="#ffeaf5" opacity="0.6"/>
  <path d="M40 52 q-6 -16 4 -30 q8 12 10 24z" fill="url(#mane)"/>
  <path d="M58 46 q-2 -20 8 -34 q6 16 4 30z" fill="url(#mane)"/>
  <path d="M76 48 q8 -16 22 -22 q-4 16 -14 28z" fill="url(#mane)"/>
  <polygon points="64,8 70,40 56,40" fill="url(#horn)"/>
  <polygon points="64,8 70,40 63,40" fill="#ffcf4d"/>
  <circle cx="52" cy="66" r="4.5" fill="#4a2f6b"/>
  <circle cx="74" cy="66" r="4.5" fill="#4a2f6b"/>
  <circle cx="53.5" cy="64.5" r="1.6" fill="#fff"/>
  <circle cx="75.5" cy="64.5" r="1.6" fill="#fff"/>
  <ellipse cx="46" cy="76" rx="5" ry="3" fill="#ff9ed2" opacity="0.7"/>
  <ellipse cx="80" cy="76" rx="5" ry="3" fill="#ff9ed2" opacity="0.7"/>
  <path d="M58 78 q4 4 8 0" stroke="#4a2f6b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="64" cy="22" r="2" fill="#fff"/>
</svg>`;

/* ---------- Character cast ---------- */
const BUDDIES = [
  { e: "🦄", n: "Luna" }, { e: "🐉", n: "Sparky" }, { e: "🐱", n: "Mochi" },
  { e: "🦊", n: "Pip" }, { e: "🐸", n: "Hops" }, { e: "🦕", n: "Dino" },
  { e: "🐙", n: "Inky" }, { e: "🐼", n: "Bao" }, { e: "🦁", n: "Leo" },
  { e: "🐰", n: "Cloud" }, { e: "🐢", n: "Shelly" }, { e: "🦋", n: "Flutter" }
];

/* ---------- Badges ---------- */
const BADGES = [
  { id: "first-star", e: "⭐", n: "First Star", d: "Earn your very first star" },
  { id: "exchanger", e: "✨", n: "Exchange Expert", d: "Solve an exchanging problem" },
  { id: "flawless", e: "💯", n: "Flawless", d: "Finish a round with all hearts" },
  { id: "collector", e: "🌟", n: "Star Collector", d: "Collect 15 stars in total" },
  { id: "graduate", e: "🎓", n: "Graduate", d: "Finish a Tens & Ones session" },
  { id: "quickthinker", e: "⚡", n: "Quick Thinker", d: "Score 6+ in Star Quiz" },
  { id: "soloist", e: "🦸", n: "On My Own", d: "Solve a round with no hints showing" },
  { id: "daytripper", e: "📅", n: "Day Tripper", d: "Finish a Days of the Week game" },
  { id: "timetraveller", e: "⏳", n: "Time Traveller", d: "Solve a 'days ago' question" },
  { id: "array-champ", e: "🔢", n: "Array Champion", d: "Finish a Dot Arrays game" }
];

/* ---------- On-device storage ---------- */
const Store = {
  KEY: "natasha-math-v1",
  data: { totalStars: 0, sessions: 0, quizPlays: 0, quizBest: 0, badges: {}, playerName: "" },
  load() {
    try { const s = localStorage.getItem(this.KEY); if (s) this.data = Object.assign(this.data, JSON.parse(s)); }
    catch (e) { /* ignore */ }
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
  addStars(n) { this.data.totalStars += n; this.save(); },
  hasBadge(id) { return !!this.data.badges[id]; },
  earn(id) { if (!this.data.badges[id]) { this.data.badges[id] = Date.now(); this.save(); return true; } return false; },
  badgeCount() { return Object.keys(this.data.badges).length; }
};

/* badges earned during the current session (shown on the certificate) */
let sessionNewBadges = [];
function earnBadge(id) {
  if (Store.earn(id)) {
    const def = BADGES.find(b => b.id === id);
    if (def && !sessionNewBadges.find(b => b.id === id)) sessionNewBadges.push(def);
  }
}

/* ---------- Tiny WebAudio sound kit ---------- */
const Sound = (() => {
  let ctx = null;
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } } return ctx; }
  function tone(freq, start, dur, type = "sine", gain = 0.12) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(c.destination);
    const t = c.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  return {
    pop() { tone(520, 0, 0.12, "triangle", 0.1); },
    cross() { tone(300, 0, 0.1, "square", 0.07); },
    exchange() { tone(440, 0, 0.12, "sine"); tone(660, 0.08, 0.14, "sine"); },
    step() { tone(587, 0, 0.12, "triangle"); tone(784, 0.08, 0.16, "triangle"); },
    oops() { tone(220, 0, 0.18, "sawtooth", 0.08); tone(160, 0.1, 0.2, "sawtooth", 0.07); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, "triangle", 0.13)); },
    fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.13, 0.26, "triangle", 0.13)); },
    resume() { const c = ac(); if (c && c.state === "suspended") c.resume(); }
  };
})();

/* ---------- Speech ---------- */
const Speech = {
  on: true, voice: null,
  init() {
    if (!("speechSynthesis" in window)) return;
    const pick2 = () => {
      const vs = window.speechSynthesis.getVoices();
      this.voice = vs.find(v => /female|zira|samantha|karen|google uk english female/i.test(v.name))
        || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null;
    };
    pick2();
    window.speechSynthesis.onvoiceschanged = pick2;
  },
  say(text) {
    if (!this.on || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[^\w\s.,!?'-]/g, " "));
    if (this.voice) u.voice = this.voice;
    u.rate = 0.96; u.pitch = 1.25;
    window.speechSynthesis.speak(u);
  },
  cancel() { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }
};

/* ---------- Problem generation ---------- */
function makeProblem(wantExchange) {
  for (let tries = 0; tries < 400; tries++) {
    const tT = rnd(2, 9), tO = rnd(0, 9), bT = rnd(1, tT);
    let bO;
    if (wantExchange) {
      if (tO === 9) continue;
      bO = rnd(tO + 1, 9);
      if (bT > tT - 1) continue;
    } else {
      bO = rnd(0, tO);
    }
    const top = tT * 10 + tO, bottom = bT * 10 + bO;
    if (top <= bottom) continue;
    if (bottom < 10) continue;
    return { top, bottom, tT, tO, bT, bO, needExchange: wantExchange };
  }
  return { top: 85, bottom: 79, tT: 8, tO: 5, bT: 7, bO: 9, needExchange: true };
}

/* ===================================================================
   SCREEN MANAGEMENT
   =================================================================== */
const App = { lastGame: "tutor" };
function show(id) {
  ["screen-home", "screen-game", "screen-quiz", "screen-weekday", "screen-arrays", "screen-award"].forEach(s => $(s).classList.add("hidden"));
  $(id).classList.remove("hidden");
  window.scrollTo(0, 0);
}

/* ---------- Bubble + speech ---------- */
function bubble(targetId, text, kind) {
  const b = $(targetId);
  b.textContent = text;
  b.classList.toggle("cheer", kind === "cheer");
  b.classList.toggle("oops", kind === "oops");
  Speech.say(text);
}

/* ===================================================================
   TENS & ONES TUTOR
   =================================================================== */
const ROUNDS = 5;
const T = {
  round: 0, bias: 0, sessionStars: 0, perfects: 0,
  top: 0, bottom: 0, tT: 0, tO: 0, bT: 0, bO: 0,
  needExchange: false, exchanged: false,
  onesToCross: 0, tensToCross: 0, onesCrossed: 0, tensCrossed: 0,
  phase: "build", busy: false, hearts: 3, guidance: "guide",
  hadMistake: false, usedHint: false, buddy: BUDDIES[0]
};

function guidanceLevel(i, bias) {
  const score = i + bias;
  if (score < 2) return "guide";
  if (score < 4) return "coach";
  return "solo";
}
function biasFromSessions() {
  return Store.data.sessions >= 5 ? 2 : (Store.data.sessions >= 2 ? 1 : 0);
}

function startTutor() {
  Sound.resume();
  App.lastGame = "tutor";
  sessionNewBadges = [];
  T.round = 0; T.sessionStars = 0; T.perfects = 0;
  T.bias = biasFromSessions();
  $("star-count").textContent = "0";
  $("progress-fill").style.width = "0%";
  show("screen-game");
  startTutorRound();
}

function startTutorRound() {
  const wantExchange = T.round === 0 ? false : Math.random() < 0.6;
  const p = makeProblem(wantExchange);
  Object.assign(T, {
    top: p.top, bottom: p.bottom, tT: p.tT, tO: p.tO, bT: p.bT, bO: p.bO,
    needExchange: p.needExchange, exchanged: false,
    onesToCross: p.bO, tensToCross: p.bT, onesCrossed: 0, tensCrossed: 0,
    phase: "build", busy: false, hearts: 3, hadMistake: false, usedHint: false,
    guidance: guidanceLevel(T.round, T.bias), buddy: pick(BUDDIES)
  });

  $("buddy").textContent = T.buddy.e;
  renderHearts("hearts", T.hearts);

  $("big-top").textContent = p.top;
  $("big-bot").textContent = p.bottom;
  const ans = $("big-ans"); ans.textContent = "?"; ans.className = "qmark";
  document.querySelector(".problem-banner").classList.remove("solved-banner");

  setText("cf-tt", p.tT); setText("cf-to", p.tO);
  setText("cf-ot", p.bT); setText("cf-oo", p.bO);
  setText("cf-bt", ""); setText("cf-bo", "");
  setText("cf-rt", ""); setText("cf-ro", "");
  $("cf-tt").className = "cf-cell"; $("cf-to").className = "cf-cell";

  $("ans-tens").textContent = "·"; $("ans-tens").className = "ans-tens";
  $("ans-ones").textContent = "·"; $("ans-ones").className = "ans-ones";

  $("next-btn").classList.add("hidden");
  if (T.guidance === "guide") $("hint-btn").classList.remove("hidden");
  else $("hint-btn").classList.add("hidden");

  renderTens(); renderOnes();
  introRound();
}
function setText(id, t) { const e = $(id); if (e) e.textContent = t; }

function renderHearts(id, n) {
  const box = $(id); box.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const h = el("span", "heart" + (i >= n ? " lost" : ""));
    h.textContent = "❤️";
    box.appendChild(h);
  }
}

function renderTens() {
  const col = $("tens-col"); col.innerHTML = "";
  for (let i = 0; i < T.tT; i++) {
    const t = el("div", "ten spawn");
    if (i % 5 === 0 && i !== 0) t.classList.add("group-break");
    t.addEventListener("click", () => handleTenTap(t));
    col.appendChild(t);
    setTimeout(() => t.classList.remove("spawn"), 380);
  }
}
function renderOnes() {
  const col = $("ones-col"); col.innerHTML = "";
  for (let i = 0; i < T.tO; i++) addOne(col, false);
}
function addOne(col, fromExchange) {
  const o = el("div", "one " + (fromExchange ? "fly-in from-exchange" : "spawn"));
  o.addEventListener("click", () => handleOneTap(o));
  col.appendChild(o);
  setTimeout(() => o.classList.remove("spawn", "fly-in"), 520);
  return o;
}

/* ----- Round intro & phase routing ----- */
function introRound() {
  if (T.guidance === "guide") {
    bubble("bubble", `Hi, I'm ${T.buddy.n}! Let's work out ${T.top} take away ${T.bottom}. ` +
      `We start with the Ones.`);
  } else if (T.guidance === "coach") {
    bubble("bubble", `${T.buddy.n} here! Solve ${T.top} − ${T.bottom}. Start with the Ones — you can do it!`);
  } else {
    bubble("bubble", `Your turn! Solve ${T.top} − ${T.bottom}. I'll just watch! 🌟`);
  }
  setTimeout(routePhase, 700);
}

function routePhase() {
  if (T.bO > T.tO && !T.exchanged) {
    T.phase = "exchange";
    if (T.guidance === "guide") {
      bubble("bubble", `We only have ${T.tO} ${plural(T.tO, "one", "ones")}, but need to take ${T.bO}. ` +
        `Tap a glowing Ten to swap it for 10 ones! ✨`);
    } else if (T.guidance === "coach") {
      bubble("bubble", `Hmm, not enough ones to take ${T.bO} away. What could we do? 🤔`);
    }
  } else {
    T.phase = "crossOnes";
    if (T.onesToCross === 0) {
      if (T.guidance === "guide") bubble("bubble", `We take away 0 ones, so they all stay. Now the Tens!`);
      finishOnesPhase();
      return;
    }
    if (T.guidance === "guide") {
      bubble("bubble", `Now tap ${T.onesToCross} ${plural(T.onesToCross, "one", "ones")} to cross out.`);
    } else if (T.guidance === "coach") {
      bubble("bubble", `Take away the ones now.`);
    }
  }
  updateGlow();
}

function updateGlow() {
  document.querySelectorAll("#tens-col .ten, #ones-col .one").forEach(n => { n.classList.remove("tappable"); n.classList.add("live"); });
  if (T.guidance !== "guide") return;
  if (T.phase === "exchange") {
    document.querySelectorAll("#tens-col .ten:not(.crossed)").forEach(t => t.classList.add("tappable"));
  } else if (T.phase === "crossOnes") {
    document.querySelectorAll("#ones-col .one:not(.crossed)").forEach(o => o.classList.add("tappable"));
  } else if (T.phase === "crossTens") {
    document.querySelectorAll("#tens-col .ten:not(.crossed)").forEach(t => t.classList.add("tappable"));
  }
}

/* ----- Taps ----- */
function handleTenTap(node) {
  if (T.busy) return;
  if (node.classList.contains("crossed")) return;
  if (T.phase === "exchange") doExchange(node);
  else if (T.phase === "crossTens") doCrossTen(node);
  else wrongTap(node, "ten");
}
function handleOneTap(node) {
  if (T.busy) return;
  if (node.classList.contains("crossed")) return;
  if (T.phase === "crossOnes") doCrossOne(node);
  else wrongTap(node, "one");
}

function wrongTap(node, kind) {
  node.classList.add("wrong");
  setTimeout(() => node.classList.remove("wrong"), 420);
  if (T.guidance === "guide") {
    // gentle, no penalty for the youngest level
    if (T.phase === "exchange") bubble("bubble", `Not that one — tap a glowing Ten to swap it. ✨`);
    else if (T.phase === "crossOnes") bubble("bubble", `Cross out the Ones (the circles).`);
    else if (T.phase === "crossTens") bubble("bubble", `Cross out the Tens (the tall bars).`);
    return;
  }
  loseHeart(kind);
}

function loseHeart(kind) {
  T.hearts--; T.hadMistake = true;
  Sound.oops();
  const box = $("hearts");
  const live = box.querySelectorAll(".heart:not(.lost)");
  const last = live[live.length - 1];
  if (last) { last.classList.add("ping"); setTimeout(() => { last.classList.add("lost"); last.classList.remove("ping"); }, 200); }
  let msg;
  if (T.phase === "exchange") msg = "Oops! Not enough ones — we must exchange a Ten first.";
  else if (T.phase === "crossOnes") msg = "Oops! We're taking away Ones right now.";
  else if (T.phase === "crossTens") msg = "Oops! We're taking away Tens right now.";
  else msg = "Oops, try again!";
  if (T.hearts <= 0) { bubble("bubble", "That was a tricky one! Let me show you the answer.", "oops"); setTimeout(() => failRound(), 900); }
  else { bubble("bubble", msg + ` ${T.hearts} ${plural(T.hearts, "heart", "hearts")} left.`, "oops"); }
}

function doExchange(node) {
  T.busy = true;
  earnBadge("exchanger");
  node.classList.add("exchanging");
  document.querySelectorAll("#tens-col .ten").forEach(t => t.classList.remove("tappable"));
  // floating +10 from the ten's position
  floatPlus(node);
  setTimeout(() => {
    node.classList.add("exchanged", "crossed");
    node.classList.remove("exchanging");
    T.exchanged = true;
    Sound.exchange();
    setText("cf-bo", "1");
    $("cf-tt").classList.add("cf-strike");
    setText("cf-bt", String(T.tT - 1));
    bubble("bubble", "Abracadabra! ✨ One Ten becomes 10 Ones!");
    const col = $("ones-col");
    let added = 0;
    const timer = setInterval(() => {
      addOne(col, true); Sound.pop();
      if (++added >= 10) {
        clearInterval(timer);
        setTimeout(() => {
          T.busy = false; T.phase = "crossOnes";
          if (T.guidance === "guide") bubble("bubble", `Now we have ${T.tO + 10} ones! Tap ${T.onesToCross} of them to cross out.`);
          else if (T.guidance === "coach") bubble("bubble", `Great thinking! Now take away the ones.`);
          updateGlow();
        }, 500);
      }
    }, 110);
  }, 600);
}

function floatPlus(node) {
  const r = node.getBoundingClientRect();
  const f = el("span", "float-plus"); f.textContent = "+10";
  f.style.left = r.left + "px"; f.style.top = r.top + "px";
  document.body.appendChild(f);
  requestAnimationFrame(() => { f.style.transform = "translateY(-40px)"; f.style.opacity = "0"; });
  setTimeout(() => f.remove(), 1100);
}

function doCrossOne(node) {
  if (node.classList.contains("crossed")) return;
  if (T.onesCrossed >= T.onesToCross) return;
  node.classList.add("crossed"); node.classList.remove("tappable", "live");
  T.onesCrossed++; Sound.cross();
  const left = T.onesToCross - T.onesCrossed;
  if (left > 0) { if (T.guidance === "guide") bubble("bubble", `${left} more ${plural(left, "one", "ones")} to cross out.`); }
  else finishOnesPhase();
}

function finishOnesPhase() {
  T.busy = true;
  document.querySelectorAll("#ones-col .one").forEach(o => o.classList.remove("tappable"));
  const remaining = (T.exchanged ? T.tO + 10 : T.tO) - T.onesToCross;
  const ao = $("ans-ones"); ao.textContent = remaining; ao.classList.add("ans-pop");
  Sound.step();
  if (T.guidance === "guide") bubble("bubble", `${remaining} ${plural(remaining, "one", "ones")} left. Watch it jump into the Number way!`);
  setTimeout(() => flyDigit(ao, $("cf-ro"), remaining), 350);
  setTimeout(() => {
    ao.classList.remove("ans-pop");
    T.busy = false; T.phase = "crossTens";
    if (T.guidance === "guide") bubble("bubble", `Now tap ${T.tensToCross} ${plural(T.tensToCross, "ten", "tens")} to cross out.`);
    else if (T.guidance === "coach") bubble("bubble", `Now take away the tens.`);
    updateGlow();
  }, 1300);
}

function doCrossTen(node) {
  if (node.classList.contains("crossed")) return;
  if (T.tensCrossed >= T.tensToCross) return;
  node.classList.add("crossed"); node.classList.remove("tappable", "live");
  T.tensCrossed++; Sound.cross();
  const left = T.tensToCross - T.tensCrossed;
  if (left > 0) { if (T.guidance === "guide") bubble("bubble", `${left} more ${plural(left, "ten", "tens")} to cross out.`); }
  else finishTensPhase();
}

function finishTensPhase() {
  T.busy = true;
  document.querySelectorAll("#tens-col .ten").forEach(t => t.classList.remove("tappable"));
  const remaining = (T.exchanged ? T.tT - 1 : T.tT) - T.tensToCross;
  const at = $("ans-tens"); at.textContent = remaining; at.classList.add("ans-pop");
  Sound.step();
  setTimeout(() => flyDigit(at, $("cf-rt"), remaining), 350);
  setTimeout(() => { at.classList.remove("ans-pop"); T.phase = "answer"; completeRound(); }, 1200);
}

function flyDigit(srcEl, dstEl, value) {
  const s = srcEl.getBoundingClientRect(), d = dstEl.getBoundingClientRect();
  if (!s.width && !d.width) { dstEl.textContent = value; return; }
  const ghost = el("span", "fly-digit"); ghost.textContent = value;
  ghost.style.left = s.left + "px"; ghost.style.top = s.top + "px";
  document.body.appendChild(ghost);
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${(d.left - s.left)}px, ${(d.top - s.top)}px) scale(1.05)`;
    ghost.style.opacity = "0.25";
  });
  setTimeout(() => { ghost.remove(); dstEl.textContent = value; dstEl.classList.add("cf-pop"); setTimeout(() => dstEl.classList.remove("cf-pop"), 500); }, 760);
}

function completeRound() {
  const answer = T.top - T.bottom;
  const ans = $("big-ans"); ans.textContent = answer; ans.className = "solved";
  document.querySelector(".problem-banner").classList.add("solved-banner");
  T.sessionStars++;
  Store.addStars(1);
  $("star-count").textContent = T.sessionStars;
  $("progress-fill").style.width = Math.round(((T.round + 1) / ROUNDS) * 100) + "%";

  // badges
  if (Store.data.totalStars >= 1) earnBadge("first-star");
  if (Store.data.totalStars >= 15) earnBadge("collector");
  if (!T.hadMistake && T.hearts === 3) { T.perfects++; earnBadge("flawless"); }
  if (T.guidance === "solo" && !T.hadMistake && !T.usedHint) earnBadge("soloist");

  const extra = (!T.hadMistake && T.hearts === 3) ? " Perfect — all hearts! 💯" : "";
  bubble("bubble", `You did it! ${T.top} − ${T.bottom} = ${answer}!${extra} 🦄🌈`, "cheer");
  Sound.win(); celebrate(40);

  $("hint-btn").classList.add("hidden");
  const nb = $("next-btn");
  nb.classList.remove("hidden");
  nb.textContent = (T.round + 1 >= ROUNDS) ? "See my award 🏆" : "Next ➜";
}

function failRound() {
  T.busy = false; T.phase = "answer";
  const answer = T.top - T.bottom;
  const aTens = Math.floor(answer / 10), aOnes = answer % 10;
  $("ans-tens").textContent = aTens; $("ans-ones").textContent = aOnes;
  setText("cf-rt", aTens === 0 ? "0" : aTens); setText("cf-ro", aOnes);
  const ans = $("big-ans"); ans.textContent = answer; ans.className = "solved";
  bubble("bubble", `${T.top} − ${T.bottom} = ${answer}. You'll get the next one! 💪`);
  document.querySelectorAll("#tens-col .ten, #ones-col .one").forEach(n => n.classList.remove("tappable", "live"));
  $("hint-btn").classList.add("hidden");
  const nb = $("next-btn");
  nb.classList.remove("hidden");
  nb.textContent = (T.round + 1 >= ROUNDS) ? "See my award 🏆" : "Next ➜";
}

function tutorNext() {
  Sound.resume();
  T.round++;
  if (T.round >= ROUNDS) { finishTutorSession(); return; }
  startTutorRound();
}

function finishTutorSession() {
  Store.data.sessions++; Store.save();
  earnBadge("graduate");
  showAward({
    game: "tutor",
    headline: T.perfects >= ROUNDS ? "A perfect round — wow!" : "Subtraction superstar!",
    stats: [
      { b: T.sessionStars + "/" + ROUNDS, s: "solved" },
      { b: T.perfects, s: "perfect" },
      { b: Store.data.totalStars, s: "total ⭐" }
    ]
  });
}

function tutorHint() {
  Sound.resume();
  if (T.busy) return;
  T.usedHint = true;
  if (T.phase === "exchange") { const t = document.querySelector("#tens-col .ten:not(.crossed)"); if (t) t.click(); }
  else if (T.phase === "crossOnes") { const o = document.querySelector("#ones-col .one:not(.crossed)"); if (o) o.click(); }
  else if (T.phase === "crossTens") { const t = document.querySelector("#tens-col .ten:not(.crossed)"); if (t) t.click(); }
}

/* ===================================================================
   STAR QUIZ
   =================================================================== */
const Q = { i: 0, total: 8, score: 0, hearts: 3, answer: 0, busy: false };

function startQuiz() {
  Sound.resume();
  App.lastGame = "quiz";
  sessionNewBadges = [];
  Q.i = 0; Q.score = 0; Q.hearts = 3; Q.busy = false;
  show("screen-quiz");
  renderHearts("quiz-hearts", Q.hearts);
  $("quiz-buddy").textContent = pick(BUDDIES).e;
  buildQuizDots();
  bubble("quiz-bubble", "Tap the right answer as fast as you can! ⚡");
  nextQuestion();
}

function buildQuizDots() {
  const box = $("quiz-progress"); box.innerHTML = "";
  for (let i = 0; i < Q.total; i++) box.appendChild(el("span", "qdot"));
}
function markDot(i, cls) { const d = $("quiz-progress").children[i]; if (d) { d.classList.remove("current"); d.classList.add(cls); } }
function setCurrentDot(i) { const d = $("quiz-progress").children[i]; if (d) d.classList.add("current"); }

function nextQuestion() {
  if (Q.i >= Q.total || Q.hearts <= 0) { finishQuiz(); return; }
  Q.busy = false;
  setCurrentDot(Q.i);
  const p = makeProblem(Math.random() < 0.5);
  Q.answer = p.top - p.bottom;
  $("quiz-top").textContent = p.top;
  $("quiz-bot").textContent = p.bottom;
  const choices = quizChoices(Q.answer);
  const box = $("quiz-choices"); box.innerHTML = "";
  choices.forEach(v => {
    const b = el("button", "choice"); b.textContent = v;
    b.addEventListener("click", () => onChoice(v, b));
    box.appendChild(b);
  });
}

function quizChoices(answer) {
  const set = new Set([answer]);
  const cands = shuffle([answer + 1, answer - 1, answer + 10, answer - 10, answer + 2, answer - 2, answer + 9, answer - 9]);
  for (const c of cands) { if (set.size >= 4) break; if (c >= 0 && c <= 99 && !set.has(c)) set.add(c); }
  const arr = [...set];
  while (arr.length < 4) { const r = rnd(0, 99); if (!arr.includes(r)) arr.push(r); }
  return shuffle(arr);
}

function onChoice(val, btn) {
  if (Q.busy) return;
  Q.busy = true;
  const buttons = [...$("quiz-choices").children];
  if (val === Q.answer) {
    btn.classList.add("right");
    Q.score++; Store.addStars(1);
    if (Store.data.totalStars >= 1) earnBadge("first-star");
    if (Store.data.totalStars >= 15) earnBadge("collector");
    Sound.step();
    markDot(Q.i, "done");
    bubble("quiz-bubble", pick(["Yes! 🌟", "Brilliant! ✨", "Correct! 🎉", "Super! 💜"]));
    celebrate(12);
  } else {
    btn.classList.add("wrong");
    buttons.forEach(b => { if (Number(b.textContent) === Q.answer) b.classList.add("right"); else b.classList.add("dim"); });
    Q.hearts--; Sound.oops();
    const box = $("quiz-hearts"); const live = box.querySelectorAll(".heart:not(.lost)");
    const last = live[live.length - 1]; if (last) last.classList.add("lost");
    markDot(Q.i, "miss");
    bubble("quiz-bubble", `It was ${Q.answer}. Keep going! 💪`, "oops");
  }
  Q.i++;
  setTimeout(nextQuestion, 1100);
}

function finishQuiz() {
  Store.data.quizPlays++;
  if (Q.score > Store.data.quizBest) Store.data.quizBest = Q.score;
  Store.save();
  if (Q.score >= 6) earnBadge("quickthinker");
  showAward({
    game: "quiz",
    headline: Q.score >= 6 ? "Lightning fast! ⚡" : (Q.score >= 3 ? "Nice work!" : "Good try — practice makes perfect!"),
    stats: [
      { b: Q.score + "/" + Q.total, s: "correct" },
      { b: Store.data.quizBest, s: "your best" },
      { b: Store.data.totalStars, s: "total ⭐" }
    ]
  });
}

/* ===================================================================
   DAYS OF THE WEEK — hop around the wheel
   =================================================================== */
const WROUNDS = 5;
const DAYS = [
  { short: "Mon", long: "Monday", e: "🌙", c: "#d7c6ff" },
  { short: "Tue", long: "Tuesday", e: "🌷", c: "#ffc6e0" },
  { short: "Wed", long: "Wednesday", e: "🐬", c: "#a9e8ff" },
  { short: "Thu", long: "Thursday", e: "🌟", c: "#ffe39a" },
  { short: "Fri", long: "Friday", e: "🐝", c: "#ffd0a6" },
  { short: "Sat", long: "Saturday", e: "🎈", c: "#bdf0cd" },
  { short: "Sun", long: "Sunday", e: "☀️", c: "#ffd1d1" }
];
const W = {
  round: 0, bias: 0, sessionStars: 0, perfects: 0,
  today: 0, delta: 1, dir: 1, answer: 0, current: 0, hopsDone: 0,
  phase: "hop", busy: false, hearts: 3, guidance: "guide",
  hadMistake: false, usedHint: false, buddy: BUDDIES[0], token: null
};

function wheelPos(i) {
  const ang = (-90 + i * (360 / 7)) * Math.PI / 180;
  const r = 38;
  return { left: 50 + r * Math.cos(ang), top: 50 + r * Math.sin(ang) };
}
function nodeAt(i) { return $("week-wheel").querySelector('.day-node[data-idx="' + i + '"]'); }
function expectedNext() { return ((W.current + W.dir) % 7 + 7) % 7; }
function weekdayOp() { return (W.dir === 1 ? "+ " : "− ") + W.delta + " " + plural(W.delta, "day", "days"); }

function weekdayParams(round) {
  if (round === 0) return { delta: 1, dir: 1 };
  if (round === 1) return { delta: 1, dir: -1 };
  if (round === 2) return { delta: rnd(2, 3), dir: 1 };
  if (round === 3) return { delta: rnd(2, 3), dir: -1 };
  return { delta: rnd(1, 4), dir: Math.random() < 0.5 ? 1 : -1 };
}

function startWeekday() {
  Sound.resume();
  App.lastGame = "weekday";
  sessionNewBadges = [];
  W.round = 0; W.sessionStars = 0; W.perfects = 0; W.bias = biasFromSessions();
  $("wk-star-count").textContent = "0";
  $("wk-progress-fill").style.width = "0%";
  show("screen-weekday");
  startWeekdayRound();
}

function startWeekdayRound() {
  const p = weekdayParams(W.round);
  Object.assign(W, {
    today: rnd(0, 6), delta: p.delta, dir: p.dir,
    hopsDone: 0, phase: "hop", busy: false, hearts: 3,
    hadMistake: false, usedHint: false,
    guidance: guidanceLevel(W.round, W.bias), buddy: pick(BUDDIES)
  });
  W.current = W.today;
  W.answer = ((W.today + W.dir * W.delta) % 7 + 7) % 7;

  $("wk-buddy").textContent = W.buddy.e;
  renderHearts("wk-hearts", W.hearts);
  $("wk-today").textContent = DAYS[W.today].long;
  $("wk-op").textContent = weekdayOp();
  const ans = $("wk-ans"); ans.textContent = "?"; ans.className = "qmark";
  $("wk-center").textContent = "Hop!";
  $("wk-next-btn").classList.add("hidden");
  if (W.guidance === "guide") $("wk-hint-btn").classList.remove("hidden");
  else $("wk-hint-btn").classList.add("hidden");

  renderWheel();
  introWeekday();
}

function renderWheel() {
  const wheel = $("week-wheel");
  wheel.querySelectorAll(".day-node, .week-token").forEach(n => n.remove());
  DAYS.forEach((d, i) => {
    const node = el("div", "day-node");
    const pos = wheelPos(i);
    node.style.left = pos.left + "%"; node.style.top = pos.top + "%";
    node.style.background = "linear-gradient(160deg,#fff," + d.c + ")";
    node.dataset.idx = i;
    const em = el("div", "dn-emoji"); em.textContent = d.e;
    const nm = el("div", "dn-name"); nm.textContent = d.short;
    node.appendChild(em); node.appendChild(nm);
    node.addEventListener("click", () => onDayTap(i));
    wheel.appendChild(node);
  });
  W.token = el("div", "week-token"); W.token.textContent = W.buddy.e;
  wheel.appendChild(W.token);
  placeToken(W.today, false);
  nodeAt(W.today).classList.add("today");
}

function placeToken(i, animate) {
  const pos = wheelPos(i);
  if (!animate) W.token.style.transition = "none";
  W.token.style.left = pos.left + "%";
  W.token.style.top = pos.top + "%";
  if (!animate) requestAnimationFrame(() => { W.token.style.transition = ""; });
}

function introWeekday() {
  const todayName = DAYS[W.today].long;
  const dirWord = W.dir === 1 ? "forward" : "back";
  let full;
  if (W.dir === 1 && W.delta === 1) full = `Today is ${todayName}. What day is tomorrow?`;
  else if (W.dir === -1 && W.delta === 1) full = `Today is ${todayName}. What day was yesterday?`;
  else if (W.dir === 1) full = `Today is ${todayName}. What day will it be in ${W.delta} days?`;
  else full = `Today is ${todayName}. What day was it ${W.delta} days ago?`;

  if (W.guidance === "guide") {
    bubble("wk-bubble", `Hi, I'm ${W.buddy.n}! ${full} Let's hop ${dirWord} ${W.delta} ${plural(W.delta, "day", "days")} — tap each glowing day!`);
  } else if (W.guidance === "coach") {
    bubble("wk-bubble", `${full} Hop ${dirWord} ${W.delta} ${plural(W.delta, "day", "days")} — tap each day in turn.`);
  } else {
    bubble("wk-bubble", `${full} Hop to find out! 🌟`);
  }
  updateWheelGlow();
}

function updateWheelGlow() {
  const nodes = $("week-wheel").querySelectorAll(".day-node");
  nodes.forEach(n => { n.classList.remove("next"); n.classList.add("live"); });
  if (W.guidance === "guide" && W.phase === "hop") nodeAt(expectedNext()).classList.add("next");
}

function onDayTap(i) {
  if (W.busy || W.phase !== "hop") return;
  if (i === W.current) return;
  if (i === expectedNext()) hopForward(i);
  else wrongDayTap(nodeAt(i));
}

function hopForward(i) {
  W.busy = true;
  W.current = i; W.hopsDone++;
  placeToken(i, true);
  Sound.step();
  $("wk-center").textContent = W.hopsDone + " " + plural(W.hopsDone, "day", "days");
  $("week-wheel").querySelectorAll(".day-node").forEach(n => n.classList.remove("next"));
  setTimeout(() => {
    if (W.hopsDone >= W.delta) { landWeekday(); }
    else {
      W.busy = false;
      if (W.guidance === "guide") {
        const left = W.delta - W.hopsDone;
        bubble("wk-bubble", `${W.hopsDone} done! ${left} more ${plural(left, "hop", "hops")} to go.`);
      }
      updateWheelGlow();
    }
  }, 480);
}

function wrongDayTap(node) {
  node.classList.add("wrong");
  setTimeout(() => node.classList.remove("wrong"), 420);
  const dirWord = W.dir === 1 ? "forward" : "back";
  if (W.guidance === "guide") {
    bubble("wk-bubble", `Not that one — hop just one day ${dirWord} at a time. ✨`);
    return;
  }
  loseHeartW(dirWord);
}

function loseHeartW(dirWord) {
  W.hearts--; W.hadMistake = true;
  Sound.oops();
  const box = $("wk-hearts");
  const live = box.querySelectorAll(".heart:not(.lost)");
  const last = live[live.length - 1];
  if (last) { last.classList.add("ping"); setTimeout(() => { last.classList.add("lost"); last.classList.remove("ping"); }, 200); }
  if (W.hearts <= 0) { bubble("wk-bubble", "Tricky one! Let me show you.", "oops"); setTimeout(() => failWeekdayRound(), 900); }
  else { bubble("wk-bubble", `Oops! Hop one day ${dirWord} at a time. ${W.hearts} ${plural(W.hearts, "heart", "hearts")} left.`, "oops"); }
}

function landWeekday() {
  W.phase = "done"; W.busy = false;
  $("week-wheel").querySelectorAll(".day-node").forEach(n => n.classList.remove("live", "next"));
  nodeAt(W.current).classList.add("landed");
  completeWeekdayRound();
}

function completeWeekdayRound() {
  const ansName = DAYS[W.answer].long;
  const ans = $("wk-ans"); ans.textContent = ansName; ans.className = "solved";
  W.sessionStars++; Store.addStars(1);
  $("wk-star-count").textContent = W.sessionStars;
  $("wk-progress-fill").style.width = Math.round(((W.round + 1) / WROUNDS) * 100) + "%";

  if (Store.data.totalStars >= 1) earnBadge("first-star");
  if (Store.data.totalStars >= 15) earnBadge("collector");
  if (!W.hadMistake && W.hearts === 3) { W.perfects++; earnBadge("flawless"); }
  if (W.dir === -1) earnBadge("timetraveller");
  if (W.guidance === "solo" && !W.hadMistake && !W.usedHint) earnBadge("soloist");

  bubble("wk-bubble", `You did it! It's ${ansName}! 📅🌈`, "cheer");
  Sound.win(); celebrate(40);
  $("wk-hint-btn").classList.add("hidden");
  const nb = $("wk-next-btn");
  nb.classList.remove("hidden");
  nb.textContent = (W.round + 1 >= WROUNDS) ? "See my award 🏆" : "Next ➜";
}

function failWeekdayRound() {
  W.phase = "done"; W.busy = false;
  $("week-wheel").querySelectorAll(".day-node").forEach(n => n.classList.remove("live", "next"));
  nodeAt(W.answer).classList.add("landed");
  placeToken(W.answer, true);
  const ansName = DAYS[W.answer].long;
  const ans = $("wk-ans"); ans.textContent = ansName; ans.className = "solved";
  bubble("wk-bubble", `It's ${ansName}. You'll get the next one! 💪`);
  $("wk-hint-btn").classList.add("hidden");
  const nb = $("wk-next-btn");
  nb.classList.remove("hidden");
  nb.textContent = (W.round + 1 >= WROUNDS) ? "See my award 🏆" : "Next ➜";
}

function weekdayNext() {
  Sound.resume();
  W.round++;
  if (W.round >= WROUNDS) { finishWeekdaySession(); return; }
  startWeekdayRound();
}

function finishWeekdaySession() {
  Store.data.sessions++; Store.save();
  earnBadge("daytripper");
  showAward({
    game: "weekday",
    headline: W.perfects >= WROUNDS ? "Perfect week — amazing!" : "Weekday wizard! 📅",
    stats: [
      { b: W.sessionStars + "/" + WROUNDS, s: "solved" },
      { b: W.perfects, s: "perfect" },
      { b: Store.data.totalStars, s: "total ⭐" }
    ]
  });
}

function weekdayHint() {
  Sound.resume();
  if (W.busy || W.phase !== "hop") return;
  W.usedHint = true;
  hopForward(expectedNext());
}

/* ===================================================================
   DOT ARRAYS GAME
   =================================================================== */
const AROUNDS = 6;
const AR = {
  round: 0, bias: 0, sessionStars: 0, perfects: 0,
  rows: 3, cols: 4, product: 12, qType: "product", answer: 0,
  hearts: 3, hadMistake: false, usedHint: false,
  guidance: "guide", buddy: BUDDIES[0]
};

function arrayParams(round, bias) {
  const score = round + bias;
  let maxR = 4, maxC = 4;
  if (score >= 3) { maxR = 6; maxC = 6; }
  if (score >= 5) { maxR = 9; maxC = 9; }
  return { rows: rnd(2, maxR), cols: rnd(2, maxC) };
}

function pickArrayQType() {
  if (AR.guidance === "guide") return "product";
  return pick(["rows", "cols", "product"]);
}

function startArrays() {
  Sound.resume();
  App.lastGame = "arrays";
  sessionNewBadges = [];
  AR.round = 0; AR.sessionStars = 0; AR.perfects = 0;
  AR.bias = biasFromSessions();
  $("ar-star-count").textContent = "0";
  $("ar-progress-fill").style.width = "0%";
  show("screen-arrays");
  startArrayRound();
}

function startArrayRound() {
  AR.guidance = guidanceLevel(AR.round, AR.bias);
  AR.buddy = pick(BUDDIES);
  AR.hearts = 3;
  AR.hadMistake = false;
  AR.usedHint = false;

  const p = arrayParams(AR.round, AR.bias);
  AR.rows = p.rows; AR.cols = p.cols; AR.product = p.rows * p.cols;
  AR.qType = pickArrayQType();
  AR.answer = AR.qType === "rows" ? AR.rows : (AR.qType === "cols" ? AR.cols : AR.product);

  $("ar-buddy").textContent = AR.buddy.e;
  renderHearts("ar-hearts", AR.hearts);
  renderDotGrid(AR.rows, AR.cols);
  renderArrayEquation();
  renderArrayChoices();

  $("ar-next-btn").classList.add("hidden");
  if (AR.guidance === "guide") $("ar-hint-btn").classList.remove("hidden");
  else $("ar-hint-btn").classList.add("hidden");

  let msg;
  if (AR.qType === "rows") {
    msg = `${AR.buddy.n} here! How many rows of ${AR.cols} dots are there? 🔢`;
  } else if (AR.qType === "cols") {
    msg = `${AR.buddy.n} here! How many dots are in each row? 🔢`;
  } else {
    msg = `${AR.buddy.n} here! Count all the dots — ${AR.rows} rows of ${AR.cols}. What is the total? 🔢`;
  }
  bubble("ar-bubble", msg);
}

function renderDotGrid(rows, cols) {
  const grid = $("ar-dot-grid");
  grid.innerHTML = "";
  const maxDim = Math.max(rows, cols);
  const dotSize = Math.max(20, Math.floor(260 / maxDim) - 6);
  const gap = dotSize >= 28 ? 8 : 5;
  grid.style.gridTemplateColumns = `repeat(${cols}, ${dotSize}px)`;
  grid.style.gap = gap + "px";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dot = el("div", "ar-dot");
      dot.style.width = dotSize + "px";
      dot.style.height = dotSize + "px";
      dot.dataset.row = r;
      dot.dataset.col = c;
      grid.appendChild(dot);
    }
  }
}

function renderArrayEquation() {
  const rowEl = $("ar-q-rows"), colEl = $("ar-q-cols"), resEl = $("ar-q-result");
  if (AR.qType === "rows") {
    rowEl.textContent = "?"; rowEl.className = "ar-blank";
    colEl.textContent = AR.cols; colEl.className = "ar-given";
    resEl.textContent = AR.product; resEl.className = "ar-given";
  } else if (AR.qType === "cols") {
    rowEl.textContent = AR.rows; rowEl.className = "ar-given";
    colEl.textContent = "?"; colEl.className = "ar-blank";
    resEl.textContent = AR.product; resEl.className = "ar-given";
  } else {
    rowEl.textContent = AR.rows; rowEl.className = "ar-given";
    colEl.textContent = AR.cols; colEl.className = "ar-given";
    resEl.textContent = "?"; resEl.className = "ar-blank";
  }
}

function renderArrayChoices() {
  const ans = AR.answer;
  let distractors;
  if (AR.qType === "rows") {
    distractors = [AR.cols, AR.rows + 1, AR.rows - 1, AR.rows + 2, AR.cols + 1, AR.cols - 1];
  } else if (AR.qType === "cols") {
    distractors = [AR.rows, AR.cols + 1, AR.cols - 1, AR.cols + 2, AR.rows + 1, AR.rows - 1];
  } else {
    distractors = [
      AR.rows + AR.cols, AR.product + AR.rows, AR.product - AR.rows,
      AR.product + AR.cols, AR.product - AR.cols, AR.product + 1, AR.product - 1
    ];
  }
  const set = new Set([ans]);
  for (const d of distractors) {
    if (set.size >= 4) break;
    if (d >= 1 && d <= 100 && d !== ans) set.add(d);
  }
  const arr = [...set];
  while (arr.length < 4) { const r = rnd(1, Math.max(ans + 5, 20)); if (!arr.includes(r)) arr.push(r); }
  const choices = shuffle(arr.slice(0, 4));
  const box = $("ar-choices"); box.innerHTML = "";
  choices.forEach(v => {
    const b = el("button", "choice"); b.textContent = v;
    b.addEventListener("click", () => onArrayChoice(v, b));
    box.appendChild(b);
  });
}

function onArrayChoice(val, btn) {
  const buttons = [...$("ar-choices").children];
  if (val === AR.answer) {
    buttons.forEach(b => { b.disabled = true; });
    btn.classList.add("right");
    AR.sessionStars++; Store.addStars(1);
    if (Store.data.totalStars >= 1) earnBadge("first-star");
    if (Store.data.totalStars >= 15) earnBadge("collector");
    if (!AR.hadMistake && AR.hearts === 3) AR.perfects++;
    if (AR.guidance === "solo" && !AR.hadMistake && !AR.usedHint) earnBadge("soloist");
    $("ar-dot-grid").querySelectorAll(".ar-dot").forEach(d => d.classList.add("ar-correct"));
    Sound.win(); celebrate(40);
    bubble("ar-bubble", `Yes! ${AR.rows} rows of ${AR.cols} = ${AR.product}! 🌟`, "cheer");
    $("ar-hint-btn").classList.add("hidden");
    $("ar-progress-fill").style.width = Math.round(((AR.round + 1) / AROUNDS) * 100) + "%";
    $("ar-star-count").textContent = AR.sessionStars;
    const nb = $("ar-next-btn");
    nb.classList.remove("hidden");
    nb.textContent = (AR.round + 1 >= AROUNDS) ? "See my award 🏆" : "Next ➜";
  } else {
    btn.classList.add("wrong");
    btn.disabled = true;
    AR.hadMistake = true;
    AR.hearts--;
    Sound.oops();
    renderHearts("ar-hearts", AR.hearts);
    if (AR.hearts <= 0) {
      buttons.forEach(b => {
        b.disabled = true;
        if (Number(b.textContent) === AR.answer) b.classList.add("right");
        else if (!b.classList.contains("wrong")) b.classList.add("dim");
      });
      bubble("ar-bubble", `The answer was ${AR.answer}. ${AR.rows} rows × ${AR.cols} = ${AR.product}. Keep going! 💪`, "oops");
      $("ar-hint-btn").classList.add("hidden");
      $("ar-progress-fill").style.width = Math.round(((AR.round + 1) / AROUNDS) * 100) + "%";
      const nb = $("ar-next-btn");
      nb.classList.remove("hidden");
      nb.textContent = (AR.round + 1 >= AROUNDS) ? "See my award 🏆" : "Next ➜";
    } else {
      bubble("ar-bubble", `Not quite! ${AR.hearts} ${plural(AR.hearts, "heart", "hearts")} left. Try again!`, "oops");
    }
  }
}

function arrayHint() {
  Sound.resume();
  AR.usedHint = true;
  $("ar-hint-btn").classList.add("hidden");
  const dots = [...$("ar-dot-grid").querySelectorAll(".ar-dot")];
  if (AR.qType === "cols") {
    for (let c = 0; c < AR.cols; c++) {
      dots.filter(d => parseInt(d.dataset.col) === c).forEach(d => d.classList.add("ar-hint-" + (c % 5)));
    }
    bubble("ar-bubble", `Each column is a different colour — count the columns! 🎨`);
  } else {
    for (let r = 0; r < AR.rows; r++) {
      dots.filter(d => parseInt(d.dataset.row) === r).forEach(d => d.classList.add("ar-hint-" + (r % 5)));
    }
    if (AR.qType === "rows") {
      bubble("ar-bubble", `Each row is a different colour — count the rows! 🎨`);
    } else {
      bubble("ar-bubble", `${AR.rows} rows, each with ${AR.cols} dots. ${AR.rows} × ${AR.cols} = ? 🎨`);
    }
  }
}

function arrayNext() {
  Sound.resume();
  AR.round++;
  if (AR.round >= AROUNDS) { finishArraySession(); return; }
  startArrayRound();
}

function finishArraySession() {
  Store.data.sessions++; Store.save();
  earnBadge("array-champ");
  showAward({
    game: "arrays",
    headline: AR.perfects >= AROUNDS ? "Array ace — perfect! 🔢" : "Multiplication master! 🔢",
    stats: [
      { b: AR.sessionStars + "/" + AROUNDS, s: "solved" },
      { b: AR.perfects, s: "perfect" },
      { b: Store.data.totalStars, s: "total ⭐" }
    ]
  });
}

/* ===================================================================
   AWARD / CERTIFICATE
   =================================================================== */
function showAward(info) {
  $("cert-emoji").textContent = info.game === "quiz" ? "⚡" : (info.game === "weekday" ? "📅" : (info.game === "arrays" ? "🔲" : "🏆"));
  $("cert-name").textContent = Store.data.playerName || "there";
  $("cert-headline").textContent = info.headline;
  const stats = $("cert-stats"); stats.innerHTML = "";
  info.stats.forEach(st => {
    const c = el("div", "cert-stat");
    const b = el("b"); b.textContent = st.b;
    const s = el("span"); s.textContent = st.s;
    c.appendChild(b); c.appendChild(s); stats.appendChild(c);
  });
  const badges = $("cert-badges"); badges.innerHTML = "";
  sessionNewBadges.forEach((bd, i) => {
    const wrap = el("div", "cert-badge"); wrap.style.animationDelay = (0.15 * i) + "s";
    wrap.textContent = bd.e;
    const nm = el("span", "cb-name"); nm.textContent = "New: " + bd.n;
    wrap.appendChild(nm); badges.appendChild(wrap);
  });
  $("cert-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  show("screen-award");
  Sound.fanfare(); celebrate(80);
  Speech.say("Congratulations " + (Store.data.playerName || "there") + "! " + info.headline);
}

/* ===================================================================
   CONFETTI + FLOATIES + STARS
   =================================================================== */
function celebrate(count) {
  const layer = $("confetti");
  const colors = ["#ff7eb9", "#9b6dff", "#7ef0d3", "#ffe66d", "#ff4d6d", "#6a3fd6"];
  const emojis = ["🦄", "🌈", "⭐", "✨", "💖", "🎈", "🐉", "🦋"];
  for (let i = 0; i < count; i++) {
    const s = el("span");
    if (Math.random() < 0.3) {
      s.textContent = pick(emojis);
      s.style.fontSize = (16 + Math.random() * 18) + "px";
      s.style.background = "transparent";
    } else {
      s.style.background = pick(colors);
    }
    s.style.left = Math.random() * 100 + "vw";
    s.style.animationDuration = (1.8 + Math.random() * 1.8) + "s";
    s.style.animationDelay = (Math.random() * 0.5) + "s";
    layer.appendChild(s);
    setTimeout(() => s.remove(), 4200);
  }
}

function buildStars() {
  const frag = document.createDocumentFragment();
  const glyphs = ["⭐", "✨", "🌟", "💫"];
  for (let i = 0; i < 24; i++) {
    const s = el("span", "star");
    s.textContent = pick(glyphs);
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = (Math.random() * 3) + "s";
    s.style.fontSize = (12 + Math.random() * 14) + "px";
    frag.appendChild(s);
  }
  return frag;
}

function buildFloaties() {
  const box = $("floaties");
  const cast = shuffle(BUDDIES.slice()).slice(0, 5);
  cast.forEach((c, i) => {
    const f = el("span", "floatie");
    f.textContent = c.e;
    f.style.left = (8 + i * 19 + Math.random() * 6) + "%";
    f.style.top = (10 + Math.random() * 70) + "%";
    f.style.animationDuration = (7 + Math.random() * 6) + "s";
    f.style.animationDelay = (Math.random() * 4) + "s";
    box.appendChild(f);
  });
}

/* ===================================================================
   HOME + BADGES MODAL
   =================================================================== */
function renderHome() {
  $("home-stars").textContent = Store.data.totalStars;
  $("home-badges-count").textContent = Store.badgeCount();
  const name = Store.data.playerName || "there";
  $("player-name").textContent = name;
  $("cert-name").textContent = name;
}

function openBadges() {
  const grid = $("badge-grid"); grid.innerHTML = "";
  BADGES.forEach(bd => {
    const earned = Store.hasBadge(bd.id);
    const card = el("div", "badge" + (earned ? "" : " locked"));
    const em = el("div", "b-emoji"); em.textContent = earned ? bd.e : "🔒";
    const nm = el("div", "b-name"); nm.textContent = bd.n;
    const ds = el("div", "b-desc"); ds.textContent = bd.d;
    card.appendChild(em); card.appendChild(nm); card.appendChild(ds);
    grid.appendChild(card);
  });
  $("badge-modal").classList.remove("hidden");
}
function closeBadges() { $("badge-modal").classList.add("hidden"); }

function openNameModal() {
  $("name-input").value = Store.data.playerName || "";
  $("name-modal").classList.remove("hidden");
  $("name-input").focus();
}

function savePlayerName() {
  const name = $("name-input").value.trim();
  if (!name) {
    $("name-input").focus();
    $("name-input").classList.add("input-error");
    setTimeout(() => $("name-input").classList.remove("input-error"), 600);
    return;
  }
  Store.data.playerName = name;
  Store.save();
  $("name-modal").classList.add("hidden");
  renderHome();
}

function goHome() {
  Speech.cancel();
  renderHome();
  show("screen-home");
}

/* ===================================================================
   INIT
   =================================================================== */
function syncSpeakBtns() {
  ["speak-btn", "quiz-speak-btn", "wk-speak-btn", "ar-speak-btn"].forEach(id => {
    const b = $(id); if (!b) return;
    b.classList.toggle("muted", !Speech.on);
    b.textContent = Speech.on ? "🔊" : "🔇";
  });
  $("speak-toggle").checked = Speech.on;
}
function toggleSpeak() {
  Speech.on = !Speech.on;
  if (!Speech.on) Speech.cancel();
  syncSpeakBtns();
}

function init() {
  Store.load();
  Speech.init();
  document.querySelector(".unicorn-big").innerHTML = UNICORN_SVG;
  $("stars").appendChild(buildStars());
  buildFloaties();
  renderHome();

  $("play-tutor").addEventListener("click", startTutor);
  $("play-quiz").addEventListener("click", startQuiz);
  $("play-weekday").addEventListener("click", startWeekday);
  $("play-arrays").addEventListener("click", startArrays);
  $("badges-btn").addEventListener("click", openBadges);
  $("badge-close").addEventListener("click", closeBadges);
  $("badge-modal").addEventListener("click", (e) => { if (e.target === $("badge-modal")) closeBadges(); });

  $("name-edit-btn").addEventListener("click", openNameModal);
  $("name-save-btn").addEventListener("click", savePlayerName);
  $("name-input").addEventListener("keydown", (e) => { if (e.key === "Enter") savePlayerName(); });

  $("speak-toggle").addEventListener("change", (e) => { Speech.on = e.target.checked; if (!Speech.on) Speech.cancel(); syncSpeakBtns(); });
  $("speak-btn").addEventListener("click", toggleSpeak);
  $("quiz-speak-btn").addEventListener("click", toggleSpeak);
  $("wk-speak-btn").addEventListener("click", toggleSpeak);
  $("ar-speak-btn").addEventListener("click", toggleSpeak);

  $("hint-btn").addEventListener("click", tutorHint);
  $("next-btn").addEventListener("click", tutorNext);
  $("home-btn").addEventListener("click", goHome);
  $("quiz-home-btn").addEventListener("click", goHome);
  $("wk-hint-btn").addEventListener("click", weekdayHint);
  $("wk-next-btn").addEventListener("click", weekdayNext);
  $("wk-home-btn").addEventListener("click", goHome);
  $("ar-hint-btn").addEventListener("click", arrayHint);
  $("ar-next-btn").addEventListener("click", arrayNext);
  $("ar-home-btn").addEventListener("click", goHome);

  $("award-home").addEventListener("click", goHome);
  $("award-again").addEventListener("click", () => {
    if (App.lastGame === "quiz") startQuiz();
    else if (App.lastGame === "weekday") startWeekday();
    else if (App.lastGame === "arrays") startArrays();
    else startTutor();
  });

  if (!Store.data.playerName) openNameModal();
}

document.addEventListener("DOMContentLoaded", init);
