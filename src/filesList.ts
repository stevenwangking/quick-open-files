// Pure filesystem logic — no vscode imports, so it can be unit-tested with vitest.
import { homedir } from 'node:os';
import { readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { minimatch } from 'minimatch';

export interface FileEntry {
  /** Label shown in the Quick Pick. Folders carry a trailing "/" like the original plugin. */
  label: string;
  path: string;
  isDir: boolean;
  /** False when a bookmark points to a path that does not exist. */
  exists: boolean;
}

export interface ExcludePatterns {
  folderExcludePatterns: string[];
  fileExcludePatterns: string[];
}

/** Expand a leading `~` to the user's home directory. */
export function expandHome(p: string): string {
  if (p === '~') {
    return homedir();
  }
  if (p.startsWith('~/')) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

/** Build the list entry for a configured bookmark. Never throws. */
export async function bookmarkEntry(rawPath: string): Promise<FileEntry> {
  const path = expandHome(rawPath);
  try {
    const s = await stat(path);
    return { label: path, path, isDir: s.isDirectory(), exists: true };
  } catch {
    return { label: path, path, isDir: false, exists: false };
  }
}

export async function bookmarkEntries(bookmarks: readonly string[]): Promise<FileEntry[]> {
  return Promise.all(bookmarks.map(bookmarkEntry));
}

/**
 * Match a pattern against a bare entry name. `files.exclude`-style patterns
 * (a leading double-star prefix or a trailing "/**" suffix) are stripped to
 * their literal segment so they keep working when only the name is available.
 */
function matchesPattern(name: string, pattern: string): boolean {
  if (minimatch(name, pattern)) {
    return true;
  }
  const stripped = pattern.replace(/^\*\*\//, '').replace(/\/\*\*$/, '');
  return stripped !== pattern && minimatch(name, stripped);
}

function isExcluded(name: string, isDir: boolean, exclude: ExcludePatterns): boolean {
  const patterns = isDir ? exclude.folderExcludePatterns : exclude.fileExcludePatterns;
  return patterns.some((p) => matchesPattern(name, p));
}

async function isDirectory(path: string, isSymlink: boolean): Promise<boolean> {
  if (!isSymlink) {
    return true; // caller knows it came from a Dirent with isDirectory()
  }
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * List the contents of a directory, with a leading `..` entry when a parent exists.
 * Folders are listed before files when `listDirsFirst`, and each group is sorted
 * alphabetically. Symlinks are followed to decide whether they open as folders.
 */
export async function dirEntries(
  dir: string,
  exclude: ExcludePatterns,
  listDirsFirst: boolean
): Promise<FileEntry[]> {
  const dirents = await readdir(dir, { withFileTypes: true });

  const entries: FileEntry[] = [];
  for (const dirent of dirents) {
    const isSymlink = dirent.isSymbolicLink();
    const isDir = dirent.isDirectory() || (isSymlink && (await isDirectory(join(dir, dirent.name), true)));
    if (isExcluded(dirent.name, isDir, exclude)) {
      continue;
    }
    entries.push({
      label: isDir ? `${dirent.name}/` : dirent.name,
      path: join(dir, dirent.name),
      isDir,
      exists: true,
    });
  }

  const byName = (a: FileEntry, b: FileEntry) => a.label.localeCompare(b.label, undefined, { numeric: true });
  if (listDirsFirst) {
    entries.sort((a, b) => Number(b.isDir) - Number(a.isDir) || byName(a, b));
  } else {
    entries.sort(byName);
  }

  const parent = dirname(dir);
  if (parent !== dir) {
    entries.unshift({ label: '../', path: parent, isDir: true, exists: true });
  }
  return entries;
}

/**
 * The directory to show for the active editor, or undefined when no file-backed
 * document is open (untitled, output, and other non-file schemes have no real path).
 */
export function currentDirOf(activeDoc: { scheme: string; fsPath: string } | undefined): string | undefined {
  return activeDoc?.scheme === 'file' ? dirname(activeDoc.fsPath) : undefined;
}
