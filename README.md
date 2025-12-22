# Gym Buddy

Mobile-first Obsidian plugin for logging workouts with lightning-fast UX, markdown-native storage, and progress visualization.

## Features

- **1-2 tap logging** - No typing required during sets
- **Mobile-first** - Big tap targets, steppers instead of keyboards
- **Markdown-native** - Human-readable files, Dataview compatible
- **Smart defaults** - Pre-fills from last workout

## Installation

### From Community Plugins (coming soon)

1. Open Settings → Community plugins
2. Search for "Gym Buddy"
3. Install and enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create folder: `<vault>/.obsidian/plugins/gym-buddy/`
3. Copy the files into the folder
4. Enable the plugin in Settings → Community plugins

## Usage

1. Open command palette (Cmd/Ctrl + P)
2. Run "Gym Buddy: Start workout"
3. Add exercises, log sets
4. Workouts save as markdown files

### Workout Format

```markdown
---
type: workout
date: 2025-12-21
duration: 45
muscles: [chest, triceps]
volume: 12500
---

## Bench Press
| Set | Weight | Reps | RPE |
|-----|--------|------|-----|
| 1   | 155    | 8    | 7   |
| 2   | 155    | 7    | 8   |
```

## Development

### Setup

```bash
git clone https://github.com/yourusername/gym-buddy
cd gym-buddy
npm install
```

### Development with hot-reload

```bash
# Copy and configure your vault path
cp .env.example .env
# Edit .env: VAULT_PLUGIN_DIR=/path/to/vault/.obsidian/plugins/gym-buddy

# Start dev server (outputs directly to vault)
npm run dev:vault
```

Requires the [Hot-Reload](https://github.com/pjeby/hot-reload) plugin for automatic reloading.

### Build

```bash
npm run build    # Production build
npm run lint     # Run ESLint
```

## Acknowledgments

Exercise data provided by [free-exercise-db](https://github.com/yuhonas/free-exercise-db) by [yuhonas](https://github.com/yuhonas) - an open public domain exercise dataset with 800+ exercises in JSON format.

## License

0-BSD
