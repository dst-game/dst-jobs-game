# dst-jobs-game — „5 vor 12"

A browser-based mini-game built for DST. It's five minutes to midnight ("5 vor 12") and the
player has to finish and submit a job application before the clock strikes 12 — fighting a
ticking deadline and a few distractions along the way.

## How to play

1. Open `index.html` in a browser — no build step, no server, no internet needed
2. Click **Start** on the intro screen
3. **Login**: the username is pre-filled; click the **cat** (it's sitting on the laptop) to
   reveal the password post-it underneath, then type the password
4. The countdown starts — browse the file explorer and find the correct CV
5. Open `lebenslauf_finalfinal.pdf`:
   - Fix the **typo** in the document (click it)
   - Click the **missing profile photo** to open the camera, take a photo and **save** it
6. Once both are done, hit **Speichern** to save the file
7. Click **Bewerbung abschicken** (it only appears after the CV is saved) — the button darts
   around, so chase it down
8. Solve the **"Ich bin kein Roboter" CAPTCHA** to submit and reach the **win screen**

## Layout — the desk

The game is staged as a desk (based on "Setting Option 3" in `designGuide.html`) with three zones:

- **Left — the rabbit (Begleiter):** the narrator. His speech bubble types out hints with a
  typewriter effect, and a checklist tracks your progress. The card flashes **red** when you
  make a mistake.
- **Centre — the laptop:** the main stage. Every game screen (login, file explorer, document
  preview, camera, CAPTCHA, win) renders inside the laptop screen.
- **Right — the clock:** an analog watch + a digital local-time readout counting from
  **11:55 → 12:00**, plus a deadline ("Frist") bar. In the **final minute** the analog
  outline turns from blue to **red**; in the final 30 s the digital clock also goes critical.

The whole stage scales with the viewport (container queries). **Below 820 px wide** the three
columns restack into **three rows** (rabbit → laptop → clock) and the page flows vertically.

## Languages

UI text is centralised in `lang.js` with **German and English** translations. **German is the
default.** To switch:

- add `?lang=en` to the URL, or
- run `localStorage.setItem("lang", "en")` in the console, or
- change `DEFAULT_LANG` in `lang.js`

Static text is tagged with `data-i18n` attributes; dynamic strings use `t("key")`. (The CV /
document contents in `DOCS` are intentionally left as-authored and not translated.)

## Punishment system

Wrong actions subtract time from the clock (`-15 s` each):

- Entering a **wrong password**
- Opening the **wrong file**
- Trying to **save** without the photo, or without fixing the typo
- Clicking **away from the Apply button** during the submit phase
- A **wrong CAPTCHA** selection

On a mistake, a red `-15s` label animates near the clock, the rabbit's card and the digital
clock flash red, then the deduction is applied. The amount is configurable via
`GAME_SETTINGS.punishmentAmount` in `script.js`.

## Tech stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no dependencies, no build step
- Fully **offline**: fonts are self-hosted (`fonts.css` + `assets/fonts/`)
- `requestAnimationFrame`-based countdown driving the analog + digital clocks and a desk-wide
  "urgency" glow (CSS custom property)
- Responsive via CSS **container queries** (`cqw`) + a width breakpoint for the row stack
- `getUserMedia` for in-browser webcam capture, with a canvas-based green-terminal filter

## Game flow

```
Intro → (intro video) → Login → File explorer → Fix CV (typo + photo)
      → Save → Submit (chase the button) → CAPTCHA → Win
```

### Screens

| Screen  | Description                                          |
| ------- | ---------------------------------------------------- |
| Intro   | Welcome + Start button                               |
| Login   | Username pre-filled (readonly), password required    |
| Game    | File explorer with document previews                 |
| Preview | Document viewer (typo fix + missing photo on the CV) |
| Camera  | Webcam capture with filter preview and save          |
| CAPTCHA | "Select all images with…" verification before submit |
| Win     | Shows time taken and time remaining                  |

### File preview

Every file opens a document preview, but only the correct file
(`lebenslauf_finalfinal.pdf`) is interactive:

- Contains a **typo** that must be corrected by clicking it
- Contains a **missing profile image** placeholder that opens the camera

The **Speichern** button only appears on the correct file, and only once both the typo is
fixed and a photo has been taken. The **Bewerbung abschicken** button only appears after the
file has been saved.

## Project structure

```
dst-jobs-game/
├── index.html       — markup and desk layout
├── styles.css       — all styles (design tokens, desk, screens, responsive)
├── script.js        — all game logic
├── lang.js          — German/English translations (default German)
├── fonts.css        — local @font-face declarations (offline)
├── assets/fonts/    — Chakra Petch, Cormorant Garamond, Share Tech Mono
├── images/          — laptop SVG, intro video, post-it, cat, decorative assets
└── designGuide.html — design-system reference (colours, type, components)
```

### Key settings in script.js

All tunable values live in the `GAME_SETTINGS` object at the top of `script.js`:

| Setting            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `gameDuration`     | Timer length in seconds (default 300)          |
| `correctFile`      | Filename that counts as the correct CV         |
| `correctPassword`  | Valid login password                           |
| `punishmentAmount` | Seconds deducted per wrong action              |
| `DOCS`             | Array of file objects — edit to change content |

`CAPTCHA_CATEGORIES` (just below) defines the CAPTCHA prompts; each `instructionKey` maps to a
translation in `lang.js`.
