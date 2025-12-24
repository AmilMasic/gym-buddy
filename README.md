# Gym Buddy

Fast workout logging for Obsidian Mobile. Log sets with minimal taps, store everything in plain markdown.

## Overview


Gym Buddy is an Obsidian plugin designed for logging weight training workouts on mobile devices. It prioritizes speed and simplicity for use during short rest periods, while keeping all data in human-readable markdown files compatible with Dataview and version control.

## Features

### Efficient Logging


- Steppers for weight/reps instead of keyboard input

- Pre-fills previous workout values as defaults

- Large touch targets for one-handed operation

### Mobile-Optimized

- Interface designed for 30-90 second rest windows

- Works with gloves or sweaty hands

- Minimal navigation required

### Markdown-Based

- Workouts saved as standard markdown with YAML frontmatter

- Full Dataview compatibility

- Integrates with daily/weekly note workflows

### Exercise Database

- 800+ exercises from free-exercise-db

- Filterable by muscle group

- Recent/favorites tracking

### Training Splits

- Built-in templates: PPL, Upper/Lower, Full Body, Bro Split

- Custom split creation

- Auto-detection of current day's workout

### Integrations

- Append workouts to daily notes

- Weekly note aggregation

- Templater token: {{gym-buddy-weekly-links}}

- Compatible with Periodic Notes plugin

## Installation

### Community Plugins (pending)

1. Settings → Community plugins → Browse

2. Search "Gym Buddy"

3. Install and enable

### Manual Install

1. Download main.js, manifest.json, styles.css from the latest release

2. Create <vault>/.obsidian/plugins/gym-buddy/

3. Copy files into the folder

4. Settings → Community plugins → Enable "Gym Buddy"

## Usage

1. Start workout: Cmd/Ctrl + P → "Gym Buddy: Start workout"

2. Add exercise: Search or browse by muscle group

3. Log sets: Adjust weight/reps with steppers, tap "Log Set"

4. Finish: Tap "Finish Workout" to save to vault

## Data Format

Workouts are saved as markdown files with YAML frontmatter:
```markdown
---
type: workout
date: 2025-12-23
duration: 52
split: Push
muscles: [chest, shoulders, triceps]
volume: 15420
---

## Bench Press
| Set | Weight | Reps | RPE |
|-----|--------|------|-----|
| 1   | 185    | 8    | 7   |
| 2   | 185    | 7    | 8   |
| 3   | 185    | 6    | 9   |
```

## Dataview Example
```dataview
TABLE duration, volume, split
FROM "Workouts"
WHERE type = "workout"
SORT date DESC
```
## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Workout folder | Where workout files are saved | `Workouts` |
| Units | Weight unit (lbs or kg) | `lbs` |
| Show RPE | Display RPE field when logging sets | On |
| Rest timer | Enable rest timer between sets | On (90s) |
| Daily note integration | Append workout summary to daily note | Off |
| Weekly notes | Aggregate workouts to weekly notes | Off |
| Periodic Notes | Auto-detect paths from Periodic Notes plugin | On |
| Templater token | Enable `{{gym-buddy-weekly-links}}` token | Off |
| Prompt for split | Ask which split when starting workout | On |

## Roadmap

Planned:

- Add custom exercises
- Rename exercises
- Exercise history view
- Periodization support

Open to suggestions — [open an issue](https://github.com/AmilMasic/gym-buddy/issues)!

## Development
```bash
git clone https://github.com/AmilMasic/gym-buddy
cd gym-buddy
npm install
cp .env.example .env
# Set VAULT_PLUGIN_DIR in .env
npm run dev:vault  # Hot reload to vault
npm run build      # Production build
```
Requires [Hot-Reload](https://github.com/pjeby/hot-reload) plugin for development.

## Contributing

Issues and PRs welcome. For major changes, please open an issue first.

## Acknowledgments

Exercise data from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) by [yuhonas](https://github.com/yuhonas).

## License


0-BSD


---
<a href="https://www.buymeacoffee.com/amilmasic" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;" ></a>