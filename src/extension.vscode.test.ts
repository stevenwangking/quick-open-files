import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Quick Open Files extension', () => {
  test('activates and registers the browse command', async () => {
    const ext = vscode.extensions.getExtension('stevenwangking.quick-open-files');
    assert.ok(ext, 'extension should be present');
    await ext.activate();
    assert.ok(ext.isActive, 'extension should be active');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('quickOpenFiles.browse'), 'browse command should be registered');
  });

  test('browse command runs and opens the QuickPick without errors', async () => {
    // Exercises the full path: getSettings -> bookmarkEntries -> createQuickPick().show()
    await vscode.commands.executeCommand('quickOpenFiles.browse');
    await new Promise((resolve) => setTimeout(resolve, 500));
    // The picker is a UI singleton; close it so the test instance is left clean.
    await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
  });
});
