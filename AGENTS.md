# Obsidian community plugin

## Project overview

- Target: Obsidian Community Plugin (TypeScript → bundled JavaScript).
- Entry point: `main.ts` compiled to `main.js` and loaded by Obsidian.
- Required release artifacts: `main.js`, `manifest.json`, and optional `styles.css`.

## Environment & tooling

- Node.js: use current LTS (Node 18+ recommended).
- **Package manager: npm** (required for this sample - `package.json` defines npm scripts and dependencies).
- **Bundler: esbuild** (required for this sample - `esbuild.config.mjs` and build scripts depend on it). Alternative bundlers like Rollup or webpack are acceptable for other projects if they bundle all external dependencies into `main.js`.
- Types: `obsidian` type definitions.

**Note**: This sample project has specific technical dependencies on npm and esbuild. If you're creating a plugin from scratch, you can choose different tools, but you'll need to replace the build configuration accordingly.

### Install

```bash
npm install
```

### Dev (watch)

```bash
npm run dev
```

### Production build

```bash
npm run build
```

## Linting

- To use eslint install eslint from terminal: `npm install -g eslint`
- To use eslint to analyze this project use this command: `eslint main.ts`
- eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder: `eslint ./src/`

### CSS Class Linting

Check for CSS classes used in Svelte components but not defined in `styles.css`:

```bash
npm run lint:css
```

This catches missing class definitions that would result in unstyled elements. Run this after adding new CSS classes to Svelte components.

## File & folder conventions

- **Organize code into multiple files**: Split functionality across separate modules rather than putting everything in `main.ts`.
- Source lives in `src/`. Keep `main.ts` small and focused on plugin lifecycle (loading, unloading, registering commands).
- **Example file structure**:
  ```
  src/
    main.ts           # Plugin entry point, lifecycle management
    settings.ts       # Settings interface and defaults
    commands/         # Command implementations
      command1.ts
      command2.ts
    ui/              # UI components, modals, views
      modal.ts
      view.ts
    utils/           # Utility functions, helpers
      helpers.ts
      constants.ts
    types.ts         # TypeScript interfaces and types
  ```
- **Do not commit build artifacts**: Never commit `node_modules/`, `main.js`, or other generated files to version control.
- Keep the plugin small. Avoid large dependencies. Prefer browser-compatible packages.
- Generated output should be placed at the plugin root or `dist/` depending on your build setup. Release artifacts must end up at the top level of the plugin folder in the vault (`main.js`, `manifest.json`, `styles.css`).

## Folder Structure

This project uses **feature-based organization**:

- `src/features/` - Domain features (workout, exercises, splits, setup)
  - Each feature folder contains:
    - Modal wrapper (.ts) + Svelte component (.svelte) pairs
    - Feature-specific data/logic
    - `index.ts` exporting public API
- `src/data/` - Cross-cutting data layer (storage, parser)
- `src/ui/components/` - Shared reusable UI components
- `src/settings/` - Plugin configuration

**Current structure:**
```
src/
├── main.ts                      # Plugin entry point
├── constants.ts                 # App constants
├── types.ts                     # Shared types
├── settings/
│   └── index.ts                 # Settings interface and defaults
├── features/
│   ├── workout/                 # Main workout logging feature
│   │   ├── ActiveWorkoutView.ts
│   │   └── index.ts
│   ├── exercises/               # Exercise selection & database
│   │   ├── ExercisePickerModal.ts
│   │   ├── ExercisePickerModal.svelte
│   │   ├── exerciseDatabase.ts
│   │   ├── exercises.json
│   │   └── index.ts
│   ├── splits/                  # Training split management
│   │   ├── SplitPickerModal.ts
│   │   ├── SplitPickerModal.svelte
│   │   ├── CustomSplitBuilderModal.ts
│   │   ├── CustomSplitBuilderModal.svelte
│   │   ├── CustomSplitEditorModal.ts
│   │   ├── CustomSplitEditorModal.svelte
│   │   ├── splitTemplates.ts
│   │   └── index.ts
│   └── setup/                   # Initial training setup
│       ├── TrainingSetupModal.ts
│       ├── TrainingSetupModal.svelte
│       └── index.ts
├── data/                        # Cross-cutting data layer
│   ├── storage.ts               # Persistence (favorites, PRs, custom exercises)
│   ├── parser.ts                # Markdown ↔ Workout conversion
│   └── index.ts
└── ui/                          # Shared UI components
    └── components/
        ├── NumberStepper.svelte
        ├── SetInput.svelte
        └── index.ts
```

When adding new features, create a new folder under `src/features/` and export from its `index.ts`.

## Manifest rules (`manifest.json`)

- Must include (non-exhaustive):  
  - `id` (plugin ID; for local dev it should match the folder name)  
  - `name`  
  - `version` (Semantic Versioning `x.y.z`)  
  - `minAppVersion`  
  - `description`  
  - `isDesktopOnly` (boolean)  
  - Optional: `author`, `authorUrl`, `fundingUrl` (string or map)
- Never change `id` after release. Treat it as stable API.
- Keep `minAppVersion` accurate when using newer APIs.
- Canonical requirements are coded here: https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/validate-plugin-entry.yml

## Testing

- Manual install for testing: copy `main.js`, `manifest.json`, `styles.css` (if any) to:
  ```
  <Vault>/.obsidian/plugins/<plugin-id>/
  ```
- Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Commands & settings

- Any user-facing commands should be added via `this.addCommand(...)`.
- If the plugin has configuration, provide a settings tab and sensible defaults.
- Persist settings using `this.loadData()` / `this.saveData()`.
- Use stable command IDs; avoid renaming once released.

## Versioning & releases

- Bump `version` in `manifest.json` (SemVer) and update `versions.json` to map plugin version → minimum app version.
- Create a GitHub release whose tag exactly matches `manifest.json`'s `version`. Do not use a leading `v`.
- Attach `manifest.json`, `main.js`, and `styles.css` (if present) to the release as individual assets.
- After the initial release, follow the process to add/update your plugin in the community catalog as required.

## Security, privacy, and compliance

Follow Obsidian's **Developer Policies** and **Plugin Guidelines**. In particular:

- Default to local/offline operation. Only make network requests when essential to the feature.
- No hidden telemetry. If you collect optional analytics or call third-party services, require explicit opt-in and document clearly in `README.md` and in settings.
- Never execute remote code, fetch and eval scripts, or auto-update plugin code outside of normal releases.
- Minimize scope: read/write only what's necessary inside the vault. Do not access files outside the vault.
- Clearly disclose any external services used, data sent, and risks.
- Respect user privacy. Do not collect vault contents, filenames, or personal information unless absolutely necessary and explicitly consented.
- Avoid deceptive patterns, ads, or spammy notifications.
- Register and clean up all DOM, app, and interval listeners using the provided `register*` helpers so the plugin unloads safely.

## UX & copy guidelines (for UI text, commands, settings)

- Prefer sentence case for headings, buttons, and titles.
- Use clear, action-oriented imperatives in step-by-step copy.
- Use **bold** to indicate literal UI labels. Prefer "select" for interactions.
- Use arrow notation for navigation: **Settings → Community plugins**.
- Keep in-app strings short, consistent, and free of jargon.

## Performance

- Keep startup light. Defer heavy work until needed.
- Avoid long-running tasks during `onload`; use lazy initialization.
- Batch disk access and avoid excessive vault scans.
- Debounce/throttle expensive operations in response to file system events.

## Coding conventions

- TypeScript with `"strict": true` preferred.
- **Keep `main.ts` minimal**: Focus only on plugin lifecycle (onload, onunload, addCommand calls). Delegate all feature logic to separate modules.
- **Split large files**: If any file exceeds ~200-300 lines, consider breaking it into smaller, focused modules.
- **Use clear module boundaries**: Each file should have a single, well-defined responsibility.
- Bundle everything into `main.js` (no unbundled runtime deps).
- Avoid Node/Electron APIs if you want mobile compatibility; set `isDesktopOnly` accordingly.
- Prefer `async/await` over promise chains; handle errors gracefully.

## Type & props conventions

- Colocate by default: keep component/feature-only types in the same file or a sibling `types.ts` inside the feature folder; export via the feature barrel if reused.
- Shared domain types live in `src/types.ts` (with a simple barrel) and should be limited to cross-feature shapes (e.g., Exercise, Workout, Settings).
- Prefer `type` for flexibility (unions, mapped/conditional); use `interface` only when you need declaration merging or `implements`.
- Naming: PascalCase for types/interfaces/enums; camelCase for members; no `I` prefix.
- Request/response: keep separate DTOs (e.g., `FooRequest`, `FooResponse`) even if identical today.
- Imports order: feature-local first (`./types` or sibling files), then shared (`src/types`). Avoid ambient app-specific `*.d.ts`.
- Granularity: compose small focused types; favor intersections over large catch-alls.
- Circulars: if two features depend on the same shape, lift it to `src/types.ts` instead of cross-importing features.

## CSS Guidelines

- **Prefix all classes with `gb-`**: Use the `gb-` prefix for all plugin-specific classes (e.g., `.gb-workout-view`, `.gb-btn`). Avoid the older `gym-buddy-` prefix.
- **Main styles in `styles.css`**: Layout containers, shared utility classes, and typography defaults live in the global `styles.css`.
- **Component-scoped styles**: Use `<style>` blocks in Svelte components for internal component-specific styling (e.g., BEM sub-elements).
- **Typography System**:
  - **Scoped Defaults**: Common tags like `h2`, `h3`, and `p` are automatically styled when inside plugin containers (e.g., `.gb-setup-step`).
  - **Utility Classes**: Use standardized utilities for explicit control:
    - `.gb-heading-lg/md/sm`: Standardized heading sizes.
    - `.gb-text`, `.gb-text-sm`: Standard body text.
    - `.gb-text-muted`: For secondary/de-emphasized information.
    - `.gb-label`: Small, uppercase, letter-spaced labels for UI sections.
- **Use Obsidian CSS variables**:
  - Colors: `var(--text-normal)`, `var(--background-secondary)`, `var(--interactive-accent)`, `var(--text-muted)`.
  - Spacing: Use the provided scale (e.g., `var(--gb-space-sm)`, `var(--gb-space-md)`).
- **Naming Convention**: Follow BEM-lite (e.g., `.gb-btn` as block, `.gb-btn--primary` as modifier).
- **Mobile-first**: Design for touch first, enhance for desktop.
  - **Touch targets**: Minimum 48px height for buttons and interactive elements.
- **Linting**: Always run `npm run lint:css` after adding new classes to ensure they are defined in `styles.css` or scoped within the component.
- Never use `el.style.property = value` - use CSS classes with `{cls: 'class-name'}`.
- Use `-webkit-tap-highlight-color: transparent` for touch optimization.

## Iconography Guidelines

- **Use Lucide icons** via `@lucide/svelte` for all UI elements.
- **No emojis** should be used for UI actions, buttons, or status indicators.
- **Consistent sizing**:
  - Main action buttons: `size={18}` (e.g., plus/minus in steppers)
  - Standard buttons/menu items: `size={16}`
  - Info icons/tooltips/inline text: `size={14}`
- **Alignment**: Always wrap icons in a container or use flexbox in CSS to ensure perfect vertical centering.
- **Colors**: Icons should inherit `currentColor` or use `fill="currentColor"` for solid variants (like `Heart`).

## Async/Await Patterns

**Required patterns:**
- Always use `async/await` over `.then()/.catch()` chains
- Wrap async operations in `try/catch` blocks
- Never use fire-and-forget patterns (`void asyncFn()`) without error handling

**Bad:**
```ts
void this.plugin.saveSettings(); // Silent failure
```

**Good:**
```ts
try {
  await this.plugin.saveSettings();
} catch (e) {
  console.error('Failed to save settings:', e);
}
```

**For non-critical operations** where you intentionally don't await:
```ts
this.plugin.saveSettings().catch(e => console.error('Settings save failed:', e));
```

## Svelte Component Patterns (Obsidian Integration)

This project uses Svelte 5 for complex UI. Follow these patterns:

### Modal Wrapper Structure
Each Svelte modal has TWO files:
- `ModalName.ts` - Obsidian Modal subclass, handles Svelte lifecycle
- `ModalName.svelte` - UI implementation

### Mounting Pattern
```ts
import { mount, unmount } from 'svelte';
import Component from './Component.svelte';

export class MyModal extends Modal {
  private component: ReturnType<typeof mount> | null = null;

  onOpen() {
    this.component = mount(Component, {
      target: this.contentEl,
      props: { /* ... */ }
    });
  }

  onClose() {
    if (this.component) {
      void unmount(this.component); // unmount returns a Promise
      this.component = null;
    }
    this.contentEl.empty();
  }
}
```

### Event Communication
- Svelte components dispatch events via `document.dispatchEvent(new CustomEvent(...))`
- TypeScript wrappers listen with `document.addEventListener(...)`
- **Always remove listeners on close** to prevent memory leaks

### State Updates
- Prefer reactive state updates over component remounting
- Use `$state` and `$derived` runes (Svelte 5)
- Avoid full component remount for simple state changes

## Event Listener & Resource Cleanup

**Always use Obsidian's register helpers:**
```ts
// DOM events - auto-cleaned on unload
this.registerDomEvent(window, 'resize', () => { /* ... */ });

// App events - auto-cleaned on unload
this.registerEvent(this.app.workspace.on('file-open', f => { /* ... */ }));

// Intervals - auto-cleaned on unload
this.registerInterval(window.setInterval(() => { /* ... */ }, 1000));
```

**For document-level event listeners in modals:**
```ts
onOpen() {
  this.boundHandler = this.handleEvent.bind(this);
  document.addEventListener('custom-event', this.boundHandler);
}

onClose() {
  document.removeEventListener('custom-event', this.boundHandler);
}
```

**Never:**
- Add listeners without corresponding removal
- Use anonymous functions for listeners you need to remove

## Error Handling

- **No silent failures** - Every promise rejection must be handled
- Log errors with context: `console.error('Context:', error)`
- For user-facing errors, use `new Notice('User-friendly message')`
- Validate inputs at boundaries (user input, file reads, API responses)

**Pattern for async operations:**
```ts
async doSomething(): Promise<void> {
  try {
    const result = await this.riskyOperation();
    // handle success
  } catch (error) {
    console.error('doSomething failed:', error);
    new Notice('Operation failed. Check console for details.');
  }
}
```

## Mobile

- Where feasible, test on iOS and Android.
- Don't assume desktop-only behavior unless `isDesktopOnly` is `true`.
- Avoid large in-memory structures; be mindful of memory and storage constraints.

## Agent do/don't

**Do**
- Add commands with stable IDs (don't rename once released).
- Provide defaults and validation in settings.
- Write idempotent code paths so reload/unload doesn't leak listeners or intervals.
- Use `this.register*` helpers for everything that needs cleanup.

**Don't**
- Introduce network calls without an obvious user-facing reason and documentation.
- Ship features that require cloud services without clear disclosure and explicit opt-in.
- Store or transmit vault contents unless essential and consented.
- **Add debug logging that won't be removed** - No `console.log` spam, no debug fetch calls.
- Add network requests (fetch/XMLHttpRequest) without explicit user-facing purpose.
- Use fire-and-forget async patterns without error handling.

## Common tasks

### Organize code across multiple files

**main.ts** (minimal, lifecycle only):
```ts
import { Plugin } from "obsidian";
import { MySettings, DEFAULT_SETTINGS } from "./settings";
import { registerCommands } from "./commands";

export default class MyPlugin extends Plugin {
  settings: MySettings;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    registerCommands(this);
  }
}
```

**settings.ts**:
```ts
export interface MySettings {
  enabled: boolean;
  apiKey: string;
}

export const DEFAULT_SETTINGS: MySettings = {
  enabled: true,
  apiKey: "",
};
```

**commands/index.ts**:
```ts
import { Plugin } from "obsidian";
import { doSomething } from "./my-command";

export function registerCommands(plugin: Plugin) {
  plugin.addCommand({
    id: "do-something",
    name: "Do something",
    callback: () => doSomething(plugin),
  });
}
```

### Add a command

```ts
this.addCommand({
  id: "your-command-id",
  name: "Do the thing",
  callback: () => this.doTheThing(),
});
```

### Persist settings

```ts
interface MySettings { enabled: boolean }
const DEFAULT_SETTINGS: MySettings = { enabled: true };

async onload() {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  await this.saveData(this.settings);
}
```

### Register listeners safely

```ts
this.registerEvent(this.app.workspace.on("file-open", f => { /* ... */ }));
this.registerDomEvent(window, "resize", () => { /* ... */ });
this.registerInterval(window.setInterval(() => { /* ... */ }, 1000));
```

## Troubleshooting

- Plugin doesn't load after build: ensure `main.js` and `manifest.json` are at the top level of the plugin folder under `<Vault>/.obsidian/plugins/<plugin-id>/`. 
- Build issues: if `main.js` is missing, run `npm run build` or `npm run dev` to compile your TypeScript source code.
- Commands not appearing: verify `addCommand` runs after `onload` and IDs are unique.
- Settings not persisting: ensure `loadData`/`saveData` are awaited and you re-render the UI after changes.
- Mobile-only issues: confirm you're not using desktop-only APIs; check `isDesktopOnly` and adjust.

## References

- Obsidian sample plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- API documentation: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Style guide: https://help.obsidian.md/style-guide
