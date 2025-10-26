import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.ignoreWhitespaceSearch',
    async () => {
      const query = await vscode.window.showInputBox({
        prompt: '検索語を入力（空白・改行を無視しつつ正規表現も使用可）'
      });
      if (!query) return;

      const replaceText = await vscode.window.showInputBox({
        prompt: '置換後の文字列（スキップする場合は空のまま）'
      });

      const confirm = await vscode.window.showQuickPick(
        ['現在のファイル', 'ワークスペース全体'],
        { placeHolder: '検索範囲を選択' }
      );
      if (!confirm) return;

      const pattern = injectWhitespaceTolerance(query);
      const regex = new RegExp(pattern, 'gis');

      if (confirm === '現在のファイル') {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const text = editor.document.getText();

        if (replaceText && replaceText.length > 0) {
          // 🔁 置換処理
          const newText = text.replace(regex, replaceText);
          const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(text.length)
          );
          await editor.edit(editBuilder => editBuilder.replace(fullRange, newText));
          vscode.window.showInformationMessage('置換が完了しました。');
        } else {
          // 🔍 検索のみ → ハイライト表示
          const matches = [...text.matchAll(regex)];
          if (matches.length === 0) {
            vscode.window.showInformationMessage('一致する箇所はありません。');
            return;
          }

          const ranges = matches.map(m => {
            const start = editor.document.positionAt(m.index!);
            const end = editor.document.positionAt(m.index! + m[0].length);
            return new vscode.Range(start, end);
          });

          const highlight = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 215, 0, 0.3)', // 薄い黄色
            border: '1px solid rgba(255, 200, 0, 0.8)',
          });

          editor.setDecorations(highlight, ranges);
          vscode.window.showInformationMessage(`${matches.length}件一致しました。`);
        }
      } else {
        // 🔎 ワークスペース全体検索
        (vscode.workspace as any).findTextInFiles({ pattern, isRegExp: true }, (result: any) => {
          vscode.window.showInformationMessage(`一致: ${result.uri.fsPath}`);
        });
      }
    }
  );

  context.subscriptions.push(disposable);
}

/** 空白無視のため \s* を挿入 */
function injectWhitespaceTolerance(input: string): string {
  let result = '';
  let inBracket = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '[') inBracket = true;
    if (ch === ']') inBracket = false;
    result += ch;
    if (!inBracket && i < input.length - 1) result += '\\s*';
  }
  return result;
}

export function deactivate() {}
