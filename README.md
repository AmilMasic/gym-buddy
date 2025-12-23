# Gym Buddy

Mobile-first Obsidian plugin for logging workouts with lightning-fast UX, markdown-native storage, and progress visualization.

<a href="https://www.buymeacoffee.com/amilmasic"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=amilmasic&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>

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

1. **Install Hot-Reload plugin in Obsidian** (not via npm - it's an Obsidian plugin):
   - Open Obsidian → Settings → Community plugins
   - Click "Browse" and search for "Hot-Reload"
   - Install and enable it
   - Or manually: Download from [Hot-Reload GitHub](https://github.com/pjeby/hot-reload) and place in `<vault>/.obsidian/plugins/hot-reload/`

2. **Configure your vault path**:
   ```bash
   # Copy and configure your vault path
   cp .env.example .env
   # Edit .env: VAULT_PLUGIN_DIR=/path/to/vault/.obsidian/plugins/gym-buddy
   ```

3. **Start dev server** (outputs directly to vault):
   ```bash
   npm run dev:vault
   ```

The build system will automatically create a `.hotreload` marker file in your plugin directory, which tells the Hot-Reload plugin to watch for changes. When you edit source files, esbuild rebuilds and Hot-Reload automatically reloads the plugin in Obsidian.

### Build

```bash
npm run build    # Production build
npm run lint     # Run ESLint
```

## Acknowledgments

Exercise data provided by [free-exercise-db](https://github.com/yuhonas/free-exercise-db) by [yuhonas](https://github.com/yuhonas) - an open public domain exercise dataset with 800+ exercises in JSON format.

## License

0-BSD
