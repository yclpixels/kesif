# Keşif — notes for Claude (and for people)

Keşif is a gamified travel web app for Türkiye: visitors collect stamps at real places, earn XP and
characters, and get travel tools (search, walking navigation, taxi fares, money, phrases, prayer times,
weather, SOS). Live at https://yclpixels.github.io/kesif/ from the public repo `yclpixels/kesif`.

This file is the shared memory of the project. Every Claude session on every computer reads it, so put
anything the whole team must know here, not in a personal chat.

## Who does what

- **Code and UI design**: the repo owner. Everything under `js/`, `css/`, `index.html`, `sw.js`, `tools/`, `data/`.
- **3D characters**: a teammate on their own computer. Their files go only in `assets/3d/`
  (see `assets/3d/README.md` for the delivery rules).
- Work arrives through GitHub: each person works on their own branch and opens a pull request into `main`.
  3D work uses branches named `3d-...`. Never push straight to `main` from a 3D branch.

## How the project is built

- Static PWA, no build step, plain ES modules. Open `index.html` through any static server.
- `js/app.js` — screens, map, search, navigation, tools. `js/game.js` — XP, stamps, quests, characters.
  `js/mascot.js` — character drawing (SVG fallback + 3D art from `assets/3d/`). `js/i18n.js` — all
  text in en / tr / de / ru (every new key in all four). `js/data.js` — the 15 city packs and stops.
  `js/api.js` — weather, prayer, place files, live lookups. `sw.js` — offline cache.
- Map: MapLibre GL + OpenFreeMap. Routing: routing.openstreetmap.de (OSRM). Search: Photon.
  Place files `data/places-<city>.json` are built by `tools/` from Geofabrik OpenStreetMap extracts.
- Character ids (used for file names everywhere): `pusula`, `lale`, `cini`, `simit`, `marti`, `kedi`.
  Costume ids: `scarf`, `fez`, `hat`, `cape`.

## Rules

- Bump `VERSION` in `sw.js` on every release, or phones keep the old files.
- After changing anything a visitor sees, test it in a phone-sized browser before pushing.
- The repo is public: no personal names, emails, phone numbers or keys in commits or files.
  `docs/` is private and git-ignored.
- Data credits must stay visible: OpenStreetMap contributors (ODbL), Wikimedia photo credits,
  Open-Meteo, Exchange Rate API.
- Don't show made-up data (ratings, reviews, prices). If we don't have it, link to where it is.

## Adding 3D art (for whoever merges a 3D pull request)

1. Check the files follow `assets/3d/README.md` (names, sizes, transparent PNGs).
2. Make sure `assets/3d/manifest.json` lists exactly the files that exist.
3. Bump `sw.js` VERSION, test the profile, collection and map in a phone-sized browser, then merge.
