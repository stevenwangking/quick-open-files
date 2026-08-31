# Quick Open Files

Open files quicker and easier in VS Code: browse your **bookmarks** or **any directory** from a Quick Pick — even outside the current workspace.

Inspired by the classic [sublime-open](https://github.com/danielfrg/sublime-open) plugin for Sublime Text.

## Features

- **Bookmarks**: jump straight to frequently used files and folders, across all workspaces.
- **File system browsing**: drill into any directory with `Enter`, go up with `../` or the `←` back button.
- **Persistent browsing**: the picker stays open after you open a file, so you can keep opening more.
- **Current directory listing**: the active editor's folder is listed right below your bookmarks.
- **Smart ordering and filtering**: folders before files, and your existing `files.exclude` patterns are respected out of the box.

## Usage

Default keyboard shortcut: `Cmd+Alt+O` (macOS) / `Ctrl+Alt+O` (Windows, Linux). Also available as **Quick Open Files: Browse Files…** in the Command Palette.

- Pick a **file** to open it in a new tab.
- Pick a **folder** to browse inside it.

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `quickOpenFiles.bookmarks` | `["~"]` | Files or folders shown at the top of the picker. `~` expands to your home directory. |
| `quickOpenFiles.persistentBrowsing` | `true` | Keep the picker open after opening a file. |
| `quickOpenFiles.listCurrentDir` | `true` | List the active editor's folder below the bookmarks. |
| `quickOpenFiles.listDirsFirst` | `true` | List folders before files. |
| `quickOpenFiles.excludePatterns` | *(falls back to `files.exclude`)* | Glob patterns to hide from directory listings. |

Example:

```json
{
  "quickOpenFiles.bookmarks": ["~", "~/.ssh/config", "~/projects"],
  "quickOpenFiles.excludePatterns": ["**/node_modules/**", ".DS_Store"]
}
```

## Known limitations

- Opening binary files may show an error notification from VS Code.
- Symlinks to folders are followed and browsed like regular folders.

## Release Notes

Release notes are available in the CHANGELOG file.

## License

Released under the MIT license.
