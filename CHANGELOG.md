# Change Log

All notable changes to this project will be documented in this file.

## [0.1.1] - 2026-08-31

### Changed

- List items now show a single line (the entry name); the absolute path is no longer displayed as a second line.
- The picker now closes after opening a file by default. Set `quickOpenFiles.persistentBrowsing` to `true` to keep it open for continuous browsing.

### Fixed

- `files.exclude`-style patterns with `**` segments (e.g. `**/node_modules/**`) now work in `excludePatterns` and in the `files.exclude` fallback; previously only bare-name patterns matched.
- Rapid navigation no longer lets a stale directory listing overwrite the current view.
- The current-directory listing is skipped for untitled or non-file editors instead of showing an unrelated folder.
- Fixed the extension ID used by the integration tests so `npm run test:integration` passes.
- Dev config files (`vitest.config.ts`, `.vscode-test.mjs`, `scripts/`) are no longer included in the packaged VSIX.

## [0.1.0] - 2026-08-31

### Added

- `Quick Open Files: Browse Files…` command (`Cmd+Alt+O` / `Ctrl+Alt+O`) with a cascading QuickPick file browser.
- Configurable bookmarks (`quickOpenFiles.bookmarks`) with `~` expansion and missing-path warnings.
- Persistent browsing: the picker stays open after opening a file.
- Current-directory listing for the active editor, with `../` and back-button navigation.
- Folder-first sorting and exclusion patterns (falls back to `files.exclude`).
