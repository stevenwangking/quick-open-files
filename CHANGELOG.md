# Change Log

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-08-31

### Added

- `Quick Open Files: Browse Files…` command (`Cmd+Alt+O` / `Ctrl+Alt+O`) with a cascading QuickPick file browser.
- Configurable bookmarks (`quickOpenFiles.bookmarks`) with `~` expansion and missing-path warnings.
- Persistent browsing: the picker stays open after opening a file.
- Current-directory listing for the active editor, with `../` and back-button navigation.
- Folder-first sorting and exclusion patterns (falls back to `files.exclude`).
