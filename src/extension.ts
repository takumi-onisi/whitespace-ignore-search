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
  // トークン化: エスケープ済み1文字(\.) or 改行以外の1文字
  const tokens = [...input.matchAll(/\\.|[^\r\n]/g)].map(m => m[0]);
  const result: string[] = [];
  let inCharClass = false;
  const whitespacePattern = '(?:\\s|\\r?\\n)*';
  let lastWasWhitespacePattern = false; // 直前に whitespacePattern を挿入したか
  let pendingLiteralWhitespace = false;  // 入力中に実際の空白文字が見つかったか

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];

    // 文字クラスの開始/終了管理
    if (current === '[' && !inCharClass) inCharClass = true;
    if (current === ']' && inCharClass) inCharClass = false;

    // ① 実入力の空白（半角スペース/タブなど）を検出したら
    //    -> すぐ出力せず pendingLiteralWhitespace フラグを立てて次の非空白トークン時にまとめて処理する
    if (/^[ \t]+$/.test(current)) {
      pendingLiteralWhitespace = true;
      continue; // 空白トークンはそのまま出力しない
    }

    // ② 文字クラス内はそのまま current を push（かつ空白フラグクリア）
    if (inCharClass) {
      // 文字クラス内部では pendingLiteralWhitespace があっても挿入しない仕様
      result.push(current);
      lastWasWhitespacePattern = false;
      pendingLiteralWhitespace = false;
      continue;
    }

    // ③ pendingLiteralWhitespace が立っている場合はここでまとめて whitespacePattern を入れる
    if (pendingLiteralWhitespace) {
      if (!lastWasWhitespacePattern) {
        result.push(whitespacePattern);
        lastWasWhitespacePattern = true;
      }
      pendingLiteralWhitespace = false;
    }

    // ④ current（非空白トークン）を出力
    result.push(current);
    lastWasWhitespacePattern = false; // 現在はトークンを出力したのでパターンフラグはリセット

    // ⑤ next が存在し、かつ挿入してよい条件なら whitespacePattern を入れる
    //    - next が非空白で、かつ current/next が正規表現メタでない
    if (
      next &&
      !/^[ \t]+$/.test(next) &&          // next が実入力の空白でない
      !isRegexMeta(current) &&
      !isRegexMeta(next) &&
      !inCharClass
    ) {
      if (!lastWasWhitespacePattern) {
        result.push(whitespacePattern);
        lastWasWhitespacePattern = true;
      }
    }
    // ※ next が実入力空白なら、pendingLiteralWhitespace が次ループで true になるので、
    //    その時に whitespacePattern を入れる（重複防止される）
  }

  return result.join('');
}

function isRegexMeta(token: string): boolean {
  // エスケープペア (^) を含むトークンもメタ扱いする
  return /^\\.|[()|[\]{}+*?.^$]/.test(token);
}


export function deactivate() {}


