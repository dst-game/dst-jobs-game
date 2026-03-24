# dst-jobs-game

A browser-based mini-game built for DST. The player has to submit a job application before the timer runs out.

## How to play

1. Open `index.html` in a browser — no build step needed
2. Click **Start** on the intro screen — the timer begins immediately
3. **Login** with the credentials shown on screen, hidden behind the cat - click the cat to reveal
4. In the file explorer, click any file to **preview its contents**
5. Drag the correct resume into the upload zone
6. Wait for the upload to complete, then click **Bewerbung abschicken**

## Tech stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no dependencies
- `requestAnimationFrame`-based countdown timer
- Drag-and-drop via the native HTML5 drag API

## Game flow

```
Intro screen → Login → Drag & Drop game (60s timer) → Win screen
```

### Screens

| Screen | Description                                                            |
| ------ | ---------------------------------------------------------------------- |
| Intro  | Start button; timer begins on click                                    |
| Login  | Username pre-filled (readonly), password required                      |
| Game   | File explorer (Zone A) + upload area (Zone B). Click files to preview. |
| Win    | Shows time taken and time remaining                                    |

### File preview

Each file can be clicked to open a document preview. One file contains a typo — clicking it corrects the spelling and reveals a Save button.

## Project structure

```
dst-jobs-game/
├── index.html       — markup and layout
├── script.js        — all game logic
├── styles.css       — all styles
└── images/          — laptop SVG, UI screenshots, decorative assets
```

### Key constants in script.js

| Constant        | Purpose                                                               |
| --------------- | --------------------------------------------------------------------- |
| `GAME_DURATION` | Timer length in seconds                                               |
| `CORRECT_FILE`  | The filename that counts as a successful upload                       |
| `DOCS`          | Array of file objects — edit content here to change what players read |

## Next steps

## <!-- to be written -->
