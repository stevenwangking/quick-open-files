import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Quick Open Files extension', () => {
  test('activates and registers the browse command', async () => {
    const ext = vscode.extensions.getExtension('steven-plugins.quick-open-files');
    assert.ok(ext, 'extension should be present');
    await ext.activate();
    assert.ok(ext.isActive, 'extension should be active');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('quickOpenFiles.browse'), 'browse command should be registered');
  });
});
