# Tower-Tactics-External-Codex

## Towers Data Pipeline

This repository includes a data-cleaning pipeline for base-game tower cards
from `export/Scripts/Towers`.

### What It Produces

- `generated/towers/towers.cleaned.json`
	- Card data for website rendering: id, name, description, cost, type, rarity,
		hover stats, and resource paths.
- `generated/towers/towers.summary.json`
	- Build summary and validation warnings.
- `generated/towers/assets/towers/*`
	- Copied tower card art variants for direct website use.

### Run

```bash
python scripts/build_towers_pipeline.py --game-root ../export
```

Optional:

```bash
python scripts/build_towers_pipeline.py --game-root ../export --no-copy-assets
```