# Math Lessons — Subtraction Magic 🦄

An interactive web app that teaches **2-digit subtraction** using the place-value
(Tens / Ones) **exchange method** — the same way it's taught in primary school.

**▶️ Play it here: https://nikolaimak.github.io/math-lessons/**

## The method

Numbers are shown in a **Tens | Ones** place-value chart:

- **Tens** are drawn as tally strokes `||||`
- **Ones** are drawn as circles `◯`

To work out something like **52 − 25**:

1. Build the top number (52 = 5 tens and 2 ones).
2. There aren't enough ones to take 5 away, so **exchange** one ten for ten ones
   (tap a ten — it becomes 10 new ones). Now there are 12 ones.
3. **Cross off** the bottom number's ones (5 of them), then its tens (2 of them).
4. Whatever's left is the answer: **27**.

A linked vertical "number way" column form fills in alongside the chart, so the child
sees how the hands-on method connects to the written method.

## How to play

- Pick a level on the start screen:
  - **Gentle start** — eases in, mostly no exchanging at first.
  - **Exchanging** — every problem needs an exchange (borrow).
  - **Mixed** — a blend of both.
- Tap the tens and ones to follow the steps. Stuck? Tap **Show me** for a hint.
- Earn a ⭐ for each solved problem, with a little unicorn cheering you on.
- The 🔊 button toggles spoken encouragement on/off.

## Running locally

It's a fully self-contained static site — no build step, no dependencies, no internet
needed. Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and element IDs |
| `styles.css` | Pastel unicorn theme, animations, chart layout |
| `app.js` | Game logic: problem generation, step machine, hints, celebration |

## Deployment

Hosted on **GitHub Pages** from the `main` branch root. The `.nojekyll` file tells
Pages to serve the files as-is.
