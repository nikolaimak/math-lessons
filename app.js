"use strict";

/* ===================================================================
   Natasha's Subtraction Magic
   2-digit subtraction taught with a Tens/Ones place-value chart.
   Tens = tally strokes, Ones = circles, with click-to-exchange.
   =================================================================== */

/* ---------- Unicorn SVG (shared) ---------- */
const UNICORN_SVG = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mane" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9ed2"/>
      <stop offset="0.5" stop-color="#b78cff"/>
      <stop offset="1" stop-color="#7ef0d3"/>
    </linearGradient>
    <linearGradient id="horn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe66d"/>
      <stop offset="1" stop-color="#ffb84d"/>
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

/* ---------- Tiny WebAudio sound kit ---------- */
const Sound = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    return ctx;
  }
  function tone(freq, start, dur, type = "sine", gain = 0.12) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
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
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, i * 0.12, 0.22, "triangle", 0.13));
    },
    resume() { const c = ac(); if (c && c.state === "suspended") c.resume(); }
  };
})();

/* ---------- Speech ---------- */
const Speech = {
  on: true,
  voice: null,
  init() {
    if (!("speechSynthesis" in window)) return;
    const pick = () => {
      const vs = window.speechSynthesis.getVoices();
      this.voice = vs.find(v => /female|zira|samantha|karen|google uk english female/i.test(v.name))
        || vs.find(v => /en-GB/i.test(v.lang))
        || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null;
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  },
  say(text) {
    if (!this.on || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[✨🦄🌈⭐💡➜·−?]/g, ""));
    if (this.voice) u.voice = this.voice;
    u.rate = 0.96; u.pitch = 1.25;
    window.speechSynthesis.speak(u);
  }
};

/* ---------- DOM helpers ---------- */
const $ = (id) => document.getElementById(id);
const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

/* ---------- Game state ---------- */
const TOTAL_ROUNDS = 10;
const State = {
  mode: "gentle",
  round: 0,
  stars: 0,
  top: 0, bottom: 0,
  tT: 0, tO: 0, bT: 0, bO: 0,
  needExchange: false,
  exchanged: false,
  onesToCross: 0, tensToCross: 0,
  onesCrossed: 0, tensCrossed: 0,
  phase: "build",
  busy: false
};

/* ---------- Problem generation ---------- */
function makeProblem(mode, round) {
  // Decide whether this round needs an exchange (borrow).
  let wantExchange;
  if (mode === "exchange") {
    wantExchange = true;
  } else if (mode === "gentle") {
    // first three rounds easy (no exchange), then introduce exchanging
    wantExchange = round >= 3 ? (round % 2 === 1) : false;
    if (round >= 6) wantExchange = Math.random() < 0.6;
  } else { // mixed
    wantExchange = Math.random() < 0.5;
  }

  for (let tries = 0; tries < 400; tries++) {
    const tT = rnd(2, 9);          // top tens 2..9
    const tO = rnd(0, 9);          // top ones
    const bT = rnd(1, tT);         // bottom tens <= top tens (no negative result)
    let bO;
    if (wantExchange) {
      if (tO === 9) continue;      // need bO > tO, impossible if tO=9
      bO = rnd(tO + 1, 9);         // bottom ones bigger -> must exchange
      if (bT > tT - 1) continue;   // after borrowing one ten, tens must not go negative
    } else {
      bO = rnd(0, tO);             // bottom ones <= top ones -> no exchange
    }
    const top = tT * 10 + tO;
    const bottom = bT * 10 + bO;
    if (top <= bottom) continue;
    if (bottom < 10) continue;     // keep it 2-digit minus 2-digit
    return { top, bottom, tT, tO, bT, bO, needExchange: wantExchange };
  }
  // fallback
  return { top: 85, bottom: 79, tT: 8, tO: 5, bT: 7, bO: 9, needExchange: true };
}
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/* ---------- Build a round ---------- */
function startRound() {
  const p = makeProblem(State.mode, State.round);
  Object.assign(State, {
    top: p.top, bottom: p.bottom,
    tT: p.tT, tO: p.tO, bT: p.bT, bO: p.bO,
    needExchange: p.needExchange,
    exchanged: false,
    onesToCross: p.bO, tensToCross: p.bT,
    onesCrossed: 0, tensCrossed: 0,
    phase: "build",
    busy: false
  });

  // banner
  $("big-top").textContent = p.top;
  $("big-bot").textContent = p.bottom;
  const ans = $("big-ans");
  ans.textContent = "?"; ans.className = "qmark";

  // column form
  setText("cf-tt", p.tT); setText("cf-to", p.tO);
  setText("cf-ot", p.bT); setText("cf-oo", p.bO);
  setText("cf-bt", ""); setText("cf-bo", "");
  setText("cf-rt", ""); setText("cf-ro", "");
  $("cf-to").className = "cf-cell"; $("cf-tt").className = "cf-cell";

  // answer cells
  $("ans-tens").textContent = "·"; $("ans-tens").className = "ans-tens";
  $("ans-ones").textContent = "·"; $("ans-ones").className = "ans-ones";

  // progress
  $("next-btn").classList.add("hidden");
  $("hint-btn").classList.remove("hidden");

  renderTens();
  renderOnes();
  buildIntro();
}

function setText(id, t) { const e = $(id); if (e) e.textContent = t; }

/* ---------- Rendering ---------- */
function renderTens() {
  const col = $("tens-col");
  col.innerHTML = "";
  for (let i = 0; i < State.tT; i++) {
    const t = el("div", "ten spawn");
    if (i % 5 === 0 && i !== 0) t.classList.add("group-break");
    t.dataset.idx = i;
    t.addEventListener("click", () => onTenClick(t, i));
    col.appendChild(t);
    setTimeout(() => t.classList.remove("spawn"), 400);
  }
}

function renderOnes() {
  const col = $("ones-col");
  col.innerHTML = "";
  for (let i = 0; i < State.tO; i++) addOne(col, false);
}

function addOne(col, fromExchange) {
  const o = el("div", "one spawn" + (fromExchange ? " from-exchange" : ""));
  o.addEventListener("click", () => onOneClick(o));
  col.appendChild(o);
  setTimeout(() => o.classList.remove("spawn"), 400);
  return o;
}

/* ---------- Phase flow ---------- */
function buildIntro() {
  const msg = `Let's work out ${State.top} take away ${State.bottom}. ` +
    `We need to take away ${State.bO} ${one(State.bO, "one", "ones")} ` +
    `and ${State.bT} ${one(State.bT, "ten", "tens")}.`;
  bubble(msg);
  setTimeout(decideOnesPhase, 600);
}
function one(n, s, p) { return n === 1 ? s : p; }

function decideOnesPhase() {
  if (State.bO > State.tO && !State.exchanged) {
    // not enough ones -> must exchange
    State.phase = "exchange";
    bubble(`Oops! We only have ${State.tO} ${one(State.tO, "one", "ones")}, ` +
      `but we must take away ${State.bO}. Tap a glowing Ten to swap it for 10 ones! ✨`);
    markTensTappable(true);
    markOnesTappable(false);
  } else {
    State.phase = "crossOnes";
    if (State.onesToCross === 0) {
      bubble(`We take away 0 ones, so all ${State.tO} ${one(State.tO, "one", "ones")} stay. Now let's do the Tens!`);
      finishOnes();
      return;
    }
    bubble(`Great! Now tap ${State.onesToCross} ${one(State.onesToCross, "one", "ones")} to cross ${one(State.onesToCross, "it", "them")} out.`);
    markOnesTappable(true);
    markTensTappable(false);
  }
}

function onTenClick(node, idx) {
  if (State.busy) return;
  if (State.phase === "exchange") {
    if (State.exchanged || node.classList.contains("crossed")) return;
    // exchange this ten for 10 ones
    State.busy = true;
    node.classList.add("exchanged", "crossed");
    node.classList.remove("tappable");
    State.exchanged = true;
    Sound.exchange();
    // show borrow in column form
    setText("cf-bo", "1");
    $("cf-tt").classList.add("cf-strike");
    setText("cf-bt", String(State.tT - 1));
    bubble("Abracadabra! ✨ One Ten becomes 10 Ones!");
    markTensTappable(false);
    // add 10 ones with a little stagger
    const col = $("ones-col");
    let added = 0;
    const timer = setInterval(() => {
      addOne(col, true);
      Sound.pop();
      if (++added >= 10) {
        clearInterval(timer);
        setTimeout(() => {
          State.busy = false;
          State.phase = "crossOnes";
          bubble(`Now we have ${State.tO + 10} ones! Tap ${State.onesToCross} of them to cross out.`);
          markOnesTappable(true);
        }, 450);
      }
    }, 90);
  } else if (State.phase === "crossTens") {
    crossTen(node);
  }
}

function crossTen(node) {
  if (State.busy) return;
  if (node.classList.contains("crossed")) return;
  if (State.tensCrossed >= State.tensToCross) return;
  node.classList.add("crossed");
  node.classList.remove("tappable");
  State.tensCrossed++;
  Sound.cross();
  const left = State.tensToCross - State.tensCrossed;
  if (left > 0) {
    bubble(`${left} more ${one(left, "ten", "tens")} to cross out.`);
  } else {
    finishTens();
  }
}

function onOneClick(node) {
  if (State.busy) return;
  if (State.phase !== "crossOnes") return;
  if (node.classList.contains("crossed")) return;
  if (State.onesCrossed >= State.onesToCross) return;
  node.classList.add("crossed");
  node.classList.remove("tappable");
  State.onesCrossed++;
  Sound.cross();
  const left = State.onesToCross - State.onesCrossed;
  if (left > 0) {
    bubble(`${left} more ${one(left, "one", "ones")} to cross out.`);
  } else {
    finishOnes();
  }
}

function finishOnes() {
  State.busy = true;
  markOnesTappable(false);
  const remaining = (State.exchanged ? State.tO + 10 : State.tO) - State.onesToCross;
  const ao = $("ans-ones");
  ao.textContent = remaining; ao.classList.add("ans-pop");
  setText("cf-ro", remaining);
  Sound.step();
  bubble(`Brilliant! ${remaining} ${one(remaining, "one", "ones")} left. Now let's do the Tens.`);
  setTimeout(() => {
    ao.classList.remove("ans-pop");
    State.busy = false;
    State.phase = "crossTens";
    bubble(`Tap ${State.tensToCross} ${one(State.tensToCross, "ten", "tens")} to cross out.`);
    markTensTappable(true, true);
  }, 1100);
}

function finishTens() {
  State.busy = true;
  markTensTappable(false);
  const remaining = (State.exchanged ? State.tT - 1 : State.tT) - State.tensToCross;
  const at = $("ans-tens");
  at.textContent = remaining; at.classList.add("ans-pop");
  setText("cf-rt", remaining);
  Sound.step();
  State.phase = "answer";
  setTimeout(revealAnswer, 900);
}

function revealAnswer() {
  const answer = State.top - State.bottom;
  const ans = $("big-ans");
  ans.textContent = answer;
  ans.className = "solved";
  $("big-top").parentElement.classList.add("solved-banner");
  bubble(`You did it! ${State.top} − ${State.bottom} = ${answer}! 🦄🌈`, true);
  Sound.win();
  celebrate();
  awardStar();
  $("hint-btn").classList.add("hidden");
  $("next-btn").classList.remove("hidden");
  $("next-btn").textContent = State.round + 1 >= TOTAL_ROUNDS ? "Finish 🎉" : "Next ➜";
}

/* ---------- Tappable toggles ---------- */
function markOnesTappable(on) {
  document.querySelectorAll("#ones-col .one").forEach(o => {
    if (on && !o.classList.contains("crossed")) o.classList.add("tappable");
    else o.classList.remove("tappable");
  });
}
function markTensTappable(on, skipExchanged) {
  document.querySelectorAll("#tens-col .ten").forEach(t => {
    const blocked = t.classList.contains("crossed");
    if (on && !blocked) t.classList.add("tappable");
    else t.classList.remove("tappable");
  });
}

/* ---------- Hint (auto-do current step) ---------- */
function hint() {
  Sound.resume();
  if (State.busy) return;
  if (State.phase === "exchange") {
    const ten = document.querySelector("#tens-col .ten:not(.crossed)");
    if (ten) ten.click();
  } else if (State.phase === "crossOnes") {
    const o = document.querySelector("#ones-col .one:not(.crossed)");
    if (o) o.click();
  } else if (State.phase === "crossTens") {
    const t = document.querySelector("#tens-col .ten.tappable:not(.crossed)");
    if (t) t.click();
  }
}

/* ---------- Bubble + speech ---------- */
let bubbleTimer = null;
function bubble(text, cheer = false) {
  const b = $("bubble");
  b.textContent = text;
  b.classList.toggle("cheer", cheer);
  clearTimeout(bubbleTimer);
  Speech.say(text);
}

/* ---------- Stars / progress ---------- */
function awardStar() {
  State.stars++;
  $("star-count").textContent = State.stars;
  const pct = Math.min(100, Math.round(((State.round + 1) / TOTAL_ROUNDS) * 100));
  $("progress-fill").style.width = pct + "%";
}

/* ---------- Confetti ---------- */
function celebrate() {
  const layer = $("confetti");
  const colors = ["#ff7eb9", "#9b6dff", "#7ef0d3", "#ffe66d", "#ff4d6d", "#6a3fd6"];
  const emojis = ["🦄", "🌈", "⭐", "✨", "💖"];
  for (let i = 0; i < 60; i++) {
    const s = el("span");
    const useEmoji = Math.random() < 0.25;
    if (useEmoji) {
      s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      s.style.fontSize = (16 + Math.random() * 16) + "px";
      s.style.background = "transparent";
    } else {
      s.style.background = colors[Math.floor(Math.random() * colors.length)];
    }
    s.style.left = Math.random() * 100 + "vw";
    s.style.animationDuration = (1.8 + Math.random() * 1.8) + "s";
    s.style.animationDelay = (Math.random() * 0.5) + "s";
    layer.appendChild(s);
    setTimeout(() => s.remove(), 4000);
  }
}

/* ---------- Finish screen ---------- */
function finishGame() {
  const game = $("screen-game");
  bubble(`Wow Natasha! You earned ${State.stars} stars! You're a true Subtraction Unicorn! 🦄⭐`, true);
  celebrate();
  Sound.win();
  // build a quick replay prompt in the banner area
  $("next-btn").textContent = "Play again 🦄";
}

/* ---------- Navigation ---------- */
function nextRound() {
  Sound.resume();
  State.round++;
  $("big-top").parentElement.classList.remove("solved-banner");
  if (State.round >= TOTAL_ROUNDS) {
    // celebrate the whole set, then restart fresh
    finishGame();
    State.round = 0;
    State.stars = 0;
    $("star-count").textContent = "0";
    $("progress-fill").style.width = "0%";
    setTimeout(startRound, 2600);
    return;
  }
  startRound();
}

function goHome() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  $("screen-game").classList.add("hidden");
  $("screen-start").classList.remove("hidden");
}

function startGame(mode) {
  Sound.resume();
  State.mode = mode;
  State.round = 0;
  State.stars = 0;
  $("star-count").textContent = "0";
  $("progress-fill").style.width = "0%";
  $("screen-start").classList.add("hidden");
  $("screen-game").classList.remove("hidden");
  startRound();
}

/* ---------- Wire up ---------- */
function init() {
  Speech.init();
  document.querySelector(".unicorn-big").innerHTML = UNICORN_SVG;
  document.querySelector(".unicorn-small").innerHTML = UNICORN_SVG;

  $("stars").appendChild(buildStars());

  document.querySelectorAll(".lvl-btn").forEach(btn => {
    btn.addEventListener("click", () => startGame(btn.dataset.mode));
  });

  $("speak-toggle").addEventListener("change", (e) => {
    Speech.on = e.target.checked;
    syncSpeakBtn();
  });
  $("speak-btn").addEventListener("click", () => {
    Speech.on = !Speech.on;
    $("speak-toggle").checked = Speech.on;
    syncSpeakBtn();
    if (!Speech.on) window.speechSynthesis && window.speechSynthesis.cancel();
  });

  $("hint-btn").addEventListener("click", hint);
  $("next-btn").addEventListener("click", nextRound);
  $("home-btn").addEventListener("click", goHome);
}

function syncSpeakBtn() {
  $("speak-btn").classList.toggle("muted", !Speech.on);
  $("speak-btn").textContent = Speech.on ? "🔊" : "🔇";
}

function buildStars() {
  const frag = document.createDocumentFragment();
  const glyphs = ["⭐", "✨", "🌟", "💫"];
  for (let i = 0; i < 28; i++) {
    const s = el("span", "star");
    s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = (Math.random() * 3) + "s";
    s.style.fontSize = (12 + Math.random() * 14) + "px";
    frag.appendChild(s);
  }
  return frag;
}

document.addEventListener("DOMContentLoaded", init);
