import * as vscode from 'vscode';
import { dirname } from 'node:path';
import { QuickInputButtons, QuickPickItemKind, Uri } from 'vscode';
import { bookmarkEntries, currentDirOf, dirEntries, ExcludePatterns, FileEntry } from './filesList';
import { getSettings, Settings } from './settings';

interface BrowseItem extends vscode.QuickPickItem {
  entry?: FileEntry;
}

const NO_EXCLUDE: ExcludePatterns = { folderExcludePatterns: [], fileExcludePatterns: [] };

function excludeFrom(patterns: string[] | undefined): ExcludePatterns {
  if (!patterns) {
    return NO_EXCLUDE;
  }
  // A flat pattern list applies to both files and folders, like the original plugin's filter.
  return { folderExcludePatterns: patterns, fileExcludePatterns: patterns };
}

export class BrowseSession {
  private readonly qp = vscode.window.createQuickPick<BrowseItem>();
  /** Guards against stale async directory reads overwriting a newer view. */
  private generation = 0;
  private currentDir: string | undefined;
  /** Captured before the QuickPick takes focus; activeTextEditor may turn undefined then. */
  private activeDoc: vscode.Uri | undefined;

  constructor(private readonly settings: Settings) {
    this.qp.matchOnDetail = true;
    this.qp.ignoreFocusOut = true;
    this.qp.onDidAccept(this.onAccept, this);
    this.qp.onDidTriggerButton(this.onTriggerButton, this);
    this.qp.onDidHide(() => this.qp.dispose());
  }

  start(): void {
    // Read the active editor before qp.show() moves focus away — once the
    // QuickPick is open, window.activeTextEditor can report undefined.
    this.activeDoc = vscode.window.activeTextEditor?.document.uri;
    void this.showRoot();
    this.qp.show();
  }

  private async showRoot(): Promise<void> {
    const gen = ++this.generation;
    this.currentDir = undefined;
    this.qp.buttons = [];
    this.qp.title = undefined;
    this.qp.placeholder = 'Filter files and folders';
    this.qp.busy = true;
    const bookmarks = await bookmarkEntries(this.settings.bookmarks);

    const items: BrowseItem[] = [{ label: 'Bookmarks', kind: QuickPickItemKind.Separator }];
    for (const entry of bookmarks) {
      items.push(toItem(entry));
    }

    if (this.settings.listCurrentDir) {
      // currentDirOf skips untitled/remote documents, whose fsPath has no real folder.
      const dir = currentDirOf(this.activeDoc);
      if (dir) {
        items.push({ label: dir, kind: QuickPickItemKind.Separator });
        items.push(...(await this.listDir(dir, gen)).map(toItem));
      }
    }

    if (gen !== this.generation) {
      return; // a newer view took over while we were loading
    }
    this.qp.busy = false;

    const missing = bookmarks.filter((b) => !b.exists).map((b) => b.path);
    if (missing.length > 0) {
      vscode.window.showWarningMessage(`Quick Open Files: bookmark not found: ${missing.join(', ')}`);
    }
    this.qp.items = items;
  }

  private async showDir(dir: string): Promise<void> {
    const gen = ++this.generation;
    this.currentDir = dir;
    this.qp.buttons = [QuickInputButtons.Back];
    this.qp.title = dir;
    const entries = await this.listDir(dir, gen);
    if (gen === this.generation) {
      this.qp.items = entries.map(toItem);
    }
  }

  private async listDir(dir: string, gen: number): Promise<FileEntry[]> {
    this.qp.busy = true;
    try {
      return await dirEntries(dir, excludeFrom(this.settings.excludePatterns), this.settings.listDirsFirst);
    } catch (err) {
      if (gen === this.generation) {
        vscode.window.showErrorMessage(`Quick Open Files: cannot read ${dir} (${errorMessage(err)})`);
      }
      return [];
    } finally {
      if (gen === this.generation) {
        this.qp.busy = false;
      }
    }
  }

  private onTriggerButton(button: vscode.QuickInputButton): void {
    if (button === QuickInputButtons.Back && this.currentDir) {
      void this.showDir(dirname(this.currentDir));
    }
  }

  private onAccept(): void {
    const picked = this.qp.selectedItems[0];
    if (!picked?.entry) {
      return;
    }
    const entry = picked.entry;
    if (!entry.exists) {
      void vscode.window.showErrorMessage(`Quick Open Files: path does not exist: ${entry.path}`);
      return;
    }
    if (entry.isDir) {
      void this.showDir(entry.path);
      return;
    }
    void this.openFile(entry.path);
  }

  private async openFile(path: string): Promise<void> {
    try {
      await vscode.window.showTextDocument(Uri.file(path), {
        preview: true,
        preserveFocus: this.settings.persistentBrowsing,
      });
    } catch (err) {
      void vscode.window.showErrorMessage(`Quick Open Files: cannot open ${path} (${errorMessage(err)})`);
    }
    if (this.settings.persistentBrowsing) {
      await this.showDir(dirname(path));
    } else {
      this.qp.hide();
    }
  }
}

function toItem(entry: FileEntry): BrowseItem {
  return {
    label: entry.exists ? entry.label : `${entry.label} (not found)`,
    detail: entry.path,
    entry,
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Entry point of the `quickOpenFiles.browse` command. */
export function browse(): void {
  new BrowseSession(getSettings()).start();
}
