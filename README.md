# CODEVERSE!!!1!!

> The greatest website ever built (source: us).

Built for **Codeverse**, a competition by the **ACE Club, CMRIT** to design the **worst UI ever**. 🥈 **It won 2nd place.**

Every "feature" below is on purpose.

It's plain HTML, CSS, and JavaScript. No frameworks, no build step, no mercy.

---

## 🚀 Running it

1. Clone or download this folder.
2. Open `index.html` in a browser.
3. Click anything. You'll get sound after your first click (browsers block autoplay until then).

You can also serve it locally if you like:

```bash
npx serve .
# or
python -m http.server
```

---

## 😈 Features (a.k.a. crimes against UX)

### Layout
- **The footer is at the top** and **the header is at the bottom**, each labelled so you know which is which.
- **Navigation is on the right**, and every label points to the wrong page. "⬅ Forward" goes back.
- A **"click here for nothing"** button that does what it says.
- A scrolling **marquee**, neon colours everywhere, and headings that wobble.
- A **cookie banner that never leaves**. Both "Accept" and "Also Accept" just move it.

### Navigation
- Every page has **decoy NEXT buttons** that go backwards or somewhere random. The real NEXT button moves to a different spot on each page.
- On the register form, "SUBMIT" is a decoy and "NEXT ➡ (this one submits)" submits. Submitting sends you back to page 1.

### Ads
- **Every button click plays an ad first** (`assets/ad.mp4`, 8 seconds). The button only does its thing after the ad ends.
- The ad's **✖ close button runs away** from your cursor and can end up anywhere on screen.

### Timers
- **Doom countdown:** a timer at the top counts down 90 seconds to a "surprise". The surprise is a **rickroll** you can't leave for 15 seconds. Then the countdown starts over.
- **NEXT timer:** after each ad you get 10 seconds to click a real NEXT button. Miss it and your cursor freezes.

### Cursor & scrolling
- The real cursor is hidden and replaced with a fake one that **randomly freezes** ("😈 Uh Oh you're in timeout 😈"). When it unfreezes it jumps to wherever your mouse went.
- **Scrolling down is 6× faster than normal. Scrolling up is about 1 pixel per wheel notch.** Same for the keyboard.

### 🕷️ Spider-Volume
The volume control is Spider-Man hanging upside down from a web. **Swing him left or right** to change the volume.
- Every grab gets a **random sensitivity**.
- 30% of grabs **reverse the controls** ("SPIDEY-SENSE TINGLING").
- When you let go he **keeps swinging**, and the volume swings with him until he settles.
- 12% of the time the **web snaps** and the volume goes to 100%.

### Text chaos
When the page loads, every character gets a chance at a random font (Papyrus and Comic Sans included), bold, italic, underline, or size, plus **flipped case**. About 4% of characters **just disappear**.

### Audio
- `worstsoundever.mp3` loops in the background the whole time.
- The rickroll ignores your volume setting.

---

## 🎛️ Tuning the evil

All the numbers live in the `CONFIG` object at the top of `script.js`:

| Setting | Default | What it does |
|---|---|---|
| `doomSeconds` | `90` | Countdown until the rickroll |
| `adSeconds` | `8` | Length of each ad |
| `nextSeconds` | `10` | Time to click NEXT after an ad |
| `timeoutChance` | `0.004` | Chance of a cursor freeze on each mouse move |
| `scrollDownMultiplier` / `scrollUpMultiplier` | `6` / `0.01` | Scroll speed going down / up |
| `volReverseChance` | `0.3` | Chance the volume controls are reversed |
| `volWebSnapChance` | `0.12` | Chance the web snaps to 100% volume |
| `xDodgeRadius` | `110` | How close you can get to the ad's ✖ before it moves |
| `rickrollSeconds` | `15` | How long the rickroll lasts |
| `chaosStyleChance` / `chaosCaseChance` / `chaosMissingChance` | `0.35` / `0.3` / `0.04` | Text chaos intensity |

---

## 📁 Project structure

```
codeverse/
├── index.html      # the page (header at the bottom, footer at the top)
├── style.css       # neon, wobble, and regret
├── script.js       # all the evil behaviour + CONFIG
└── assets/
    ├── ad.mp4              # plays on every button click
    ├── rickroll.mp4        # the surprise
    └── worstsoundever.mp3  # background audio, loops forever
```

If a media file is missing, the site shows a neon placeholder in its place. See `assets/README.txt`.

---

## 🏆 Credits

🥈 2nd place at **Codeverse**, a worst-UI competition by the **ACE Club, CMRIT**.

*Best viewed in Netscape Navigator 3.0 at 640x480.*
