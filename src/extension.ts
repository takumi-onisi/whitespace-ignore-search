import * as vscode from 'vscode';
import { getWebviewContent } from './webview';

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined = undefined;

  const disposable = vscode.commands.registerCommand('extension.showIgnoreWhitespacePanel', () => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.Two);
    } else {
      panel = vscode.window.createWebviewPanel(
        'ignoreWhitespace',
        '空白無視検索パターン作成',
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'search') {
          // VS Code の検索パネルを呼び出す
          await vscode.commands.executeCommand('workbench.action.findInFiles', {
            query: message.pattern,
            triggerSearch: true,
            isRegex: true,
            isCaseSensitive: false,
          });
        }
      }, undefined, context.subscriptions);

      panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}


