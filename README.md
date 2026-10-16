# THRESHOLD — An Emerging Tech Decision Simulation

A comic-book-style browser simulation, set in the original "Vanguard Universe", about deciding
**whether, how, where and for whom** a powerful new technology should exist. Inspired by
[Data Center Genesis](https://sunburnedship.github.io/Responsible-Data-Center-Genesis/).

Players are the CTO of Helix Forge Industries and take one breakthrough through four phases:

| Phase | What happens |
|---|---|
| **PH-I Design** | Pick a technology (SENTINEL Grid AI, Catalyst gene therapy, Aetherium energy, MindLink BCI) and lock in market, release model, rollout speed, safeguards and an access fund. |
| **PH-II Oversight** | Stakeholders react; regulators set a review delay and fine based on your worst residual risk. Choose pivots or retrofit safeguards at 1.5× cost. |
| **PH-III Rollout** | Five years. Incidents are drawn from the risks you left open; years without incidents bring dilemmas. Every event needs a decision. |
| **PH-IV Debrief** | Letter grades on six dimensions, a computed reference path, real-world parallels, discussion questions, certificate and results export. |

Audience: college students, professionals and the general public. Plan on roughly 20–30 minutes.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

Progress auto-saves to `localStorage`; **Restart** clears it.

## Deploy to GitHub Pages

Push this folder to a GitHub repo, then go to **Settings → Pages → Deploy from branch → `main` / root**.

## Project layout

```
index.html        page shell
styles.css        comic-book design system (Bangers / Inter / Space Mono)
js/data.js        ALL content: technologies, regions, safeguards, pivots, events, lessons
js/engine.js      simulation model (pure functions, seeded RNG, grading, reference-path search)
js/ui.js          rendering, interactions, certificate (canvas → PNG), .txt export
tools/            developer scripts (not needed to run the game)
```

### Editing content

Most changes only touch `js/data.js`. Each technology has a risk profile across six concerns
(safety, misuse, equity, privacy, consent, environment). Safeguards and pivots reduce specific concerns,
and incident events are keyed by technology and concern. To add a technology, add an entry to `TECHS`,
a matching set of `EVENTS`, and `LESSONS`.

### Checking balance after edits

```sh
node tools/calibrate.js ref   # sample designs + the computed best design per technology
node tools/fuzz.js 3000       # thousands of random games: crash check, GPA spread, incident rates
node tools/smoke.mjs          # full playthrough in headless Chrome, screenshots in /tmp/threshold-shots
```

## Content notes

All characters, companies and places are original. Nothing uses Marvel or other third-party IP.
The model's numbers are simplified for teaching and are not forecasts. The real-world cases in the
debrief (EU AI Act, He Jiankui, Casgevy, Asilomar, UNDRIP, Juukan Gorge, Chile's neurorights
amendment, Colorado's neural-data law, Neuralink trials, the Collingridge dilemma, and Stilgoe et al.'s
responsible-innovation framework) are summarized in `js/data.js` under `LESSONS`.
