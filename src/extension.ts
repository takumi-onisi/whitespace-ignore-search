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
      const pattern = injectWhitespaceToleranceSmart(query);

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

function injectWhitespaceToleranceSmart(input: string): string {
  // トークン化の強化: エスケープ文字、文字クラス、量指定子、または1文字
  // 修正ポイント: 量指定子 (+, *, ?, {n,m}) を独立したトークンとして抽出
  const tokens = input.match(/\\.|\[[^\]]+\]|\{[0-9,]+\}|[+*?]|./g) || [];
  const result: string[] = [];
  const spacer = '[\\s\\r\\n]*';

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];

    result.push(current);

    if (next) {
      // --- 挿入をスキップする条件 ---
      
      // 1. 次が量指定子 (+, *, ?, { ) なら、その前には spacer を入れない
      if (/^[+*?{]/.test(next)) continue;

      // 2. 現在のトークンが特定のメタ文字 ( ^, | など) の場合、
      //    文脈によっては後ろに入れないほうが良いが、
      //    Dreamweaver風なら基本入れてもOK。

      // --- それ以外は spacer を挿入 ---
      result.push(spacer);
    }
  }

  // 最後に、連続してしまった spacer を 1つに掃除
  return result.join('').replace(/(\[\\s\\r\\n\]\*)+/g, '[\\s\\r\\n]*');
}

function isRegexMeta(token: string): boolean {
  // エスケープペア (^) を含むトークンもメタ扱いする
  return /^\\.|[()|[\]{}+*?.^$]/.test(token);
}


export function deactivate() {}


