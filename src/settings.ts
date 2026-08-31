import * as vscode from 'vscode';

export interface Settings {
  bookmarks: string[];
  persistentBrowsing: boolean;
  listCurrentDir: boolean;
  listDirsFirst: boolean;
  excludePatterns: string[] | undefined;
}

/** Read settings, falling back to the user's global `files.exclude` for hide patterns. */
export function getSettings(): Settings {
  const cfg = vscode.workspace.getConfiguration('quickOpenFiles');
  const excludePatterns = cfg.get<string[] | undefined>('excludePatterns');
  return {
    bookmarks: cfg.get<string[]>('bookmarks', ['~']),
    persistentBrowsing: cfg.get('persistentBrowsing', true),
    listCurrentDir: cfg.get('listCurrentDir', true),
    listDirsFirst: cfg.get('listDirsFirst', true),
    excludePatterns: excludePatterns ?? fallbackExcludePatterns(),
  };
}

function fallbackExcludePatterns(): string[] | undefined {
  const filesExclude = vscode.workspace
    .getConfiguration('files')
    .get<Record<string, boolean>>('exclude');
  if (!filesExclude) {
    return undefined;
  }
  return Object.entries(filesExclude)
    .filter(([, hidden]) => hidden)
    .map(([pattern]) => pattern);
}
