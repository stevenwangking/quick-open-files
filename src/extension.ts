import * as vscode from 'vscode';
import { browse } from './browse';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('quickOpenFiles.browse', browse)
  );
}

export function deactivate(): void {
  // nothing to clean up; QuickPick sessions dispose themselves on hide
}
