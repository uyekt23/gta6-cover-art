# PosterForge — GTA-Style Cover Art Maker

An offline web app that turns your own photos into striking GTA-style cover art: four multi-panel poster layouts (Star 5-panel, Hero Grid 6-panel, Diagonal slashes, Magazine strip) with thin light gutters, four colour grades (Sunset, Neon Nights, Golden Hour, Noir), a posterise/duotone pass for the illustrated poster feel, bold Anton display lettering with fill / outline / size controls, grain and vignette, per-panel photo assignment, drag-to-position and zoom, a one-click "Surprise me", and one-click PNG export at exactly 1080×1080, 1080×1350 and 1920×1080. Photos are read locally and never uploaded; everything is client-side with no network requests. Original design only — no Rockstar logos, artwork or fonts; the display font is Anton (SIL Open Font License 1.1, shipped under `app/fonts/` with its license).

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/uyekt23/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/uyekt23/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

{description}

## Run it

```sh
{run}
```

Run the maker itself with `node serve.ts`, then open http://localhost:8080 — it works with the network off. Hand the entry in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, which copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref={referral_code}&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
