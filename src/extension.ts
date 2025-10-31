import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.ignoreWhitespaceSearch',
    async () => {
      const query = await vscode.window.showInputBox({
        prompt: '検索語を入力（空白・改行を無視しつつ正規表現検索）',
      });
      if (!query) return;

      // 改行も無視できるよう拡張した正規表現を生成
      const pattern = injectWhitespaceAndNewlineTolerance(query);

      // VSCode の検索欄に正規表現を注入
      await vscode.commands.executeCommand('workbench.action.findInFiles', {
        query: pattern,
        triggerSearch: true,
        isRegex: true,
        matchWholeWord: false,
        isCaseSensitive: false,
      });

      vscode.window.showInformationMessage(
        '空白・改行無視の正規表現検索を開始しました（Ctrl+Shift+F で確認できます）'
      );
    }
  );

  context.subscriptions.push(disposable);
}

/**
 * 空白・改行無視対応の正規表現パターンを生成する
 * 例: "検索 文字列" → "検(?:\\s|\\r?\\n)*索(?:\\s|\\r?\\n)*文(?:\\s|\\r?\\n)*字(?:\\s|\\r?\\n)*列"
 */
function injectWhitespaceAndNewlineTolerance(input: string): string {
  // 正規表現メタ文字をすべてエスケープ
  const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 各文字の間に (?:\s|\r?\n)* を挿入（空白や改行を無視）
  return escaped.split('').join('(?:\\s|\\r?\\n)*');
}

export function deactivate() {}
