# dst-jobs-game

A browser-based mini-game built for DST. The player has to submit a job application before the timer runs out.

## How to play

1. Open `index.html` in a browser — no build step needed
2. Click **Start** on the intro screen
3. **Login** with the credentials shown on screen (click the cat to reveal the password)
4. The timer starts — browse the file explorer and find the correct CV
5. Open `lebenslauf_finalfinal.pdf`:
   - Fix the **typo** in the document
   - Click the **missing profile photo** to open the camera screen
   - Take a photo and **save** it
6. Once both are done, hit **Speichern** to save the file
7. Click **Bewerbung abschicken** — this button only appears after the CV is saved correctly

## Punishment system

Certain wrong actions subtract time from the clock:

- Entering a **wrong password** → `-15 s`
- Opening the **wrong file** → `-15 s`
- Trying to save without the **photo** → `-15 s`
- Trying to save without fixing the **typo** → `-15 s`

When time is subtracted a red `-15s` label animates above the timer and flies into the clock before the deduction is applied.

The penalty amount is configurable via `GAME_SETTINGS.punishmentAmount` in `script.js`.

## Tech stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no dependencies
- `requestAnimationFrame`-based countdown timer
- `getUserMedia` for in-browser webcam capture
- Canvas-based photo filter applied to captured frames

## Game flow

```
Intro screen → Login → File explorer → Fix CV (typo + photo) → Save → Submit → Win screen
```

### Screens

| Screen | Description                                       |
| ------ | ------------------------------------------------- |
| Intro  | Start button                                      |
| Login  | Username pre-filled (readonly), password required |
| Game   | File explorer with document previews              |
| Camera | Webcam capture with filter preview and save       |
| Win    | Shows time taken and time remaining               |

### File preview

Each file can be clicked to open a document preview. Only the correct file (`lebenslauf_finalfinal.pdf`) is interactive:

- Contains a **typo** that must be corrected by clicking it
- Contains a **missing profile image** placeholder that opens the camera screen

The **Speichern** (save) button only appears on the correct file, and only once both the typo is fixed and a photo has been taken. The **Bewerbung abschicken** button only appears after the file has been saved.

## Project structure

```
dst-jobs-game/
├── index.html       — markup and layout
├── script.js        — all game logic
├── styles.css       — all styles
└── images/          — laptop SVG, UI screenshots, decorative assets
```

### Key settings in script.js

All tunable values live in the `GAME_SETTINGS` object at the top of `script.js`:

| Setting            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `gameDuration`     | Timer length in seconds                        |
| `correctFile`      | Filename that counts as the correct CV         |
| `correctPassword`  | Valid login password                           |
| `punishmentAmount` | Seconds deducted per wrong action              |
| `DOCS`             | Array of file objects — edit to change content |
