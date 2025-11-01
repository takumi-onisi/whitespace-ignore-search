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

function injectWhitespaceAndNewlineToleranceSafe(input: string): string {
  /**
   * VSCode検索欄に渡す正規表現を安全に生成する。
   * 特徴:
   *  - 特殊文字を正しくエスケープ
   *  - 改行・空白無視をサポート
   *  - 無効な正規表現を絶対に生成しない
   */

  // 1️⃣ 各文字を1つずつ走査して安全に処理
  let result = '';
  const safeChars = /[a-zA-Z0-9]/;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    let safe;

    // 2️⃣ 正規表現メタ文字を個別に安全化
    switch (ch) {
      case '\\': safe = '\\\\'; break; // バックスラッシュは二重に
      case '[': safe = '\\['; break;
      case ']': safe = '\\]'; break;
      case '(': safe = '\\('; break;
      case ')': safe = '\\)'; break;
      case '{': safe = '\\{'; break;
      case '}': safe = '\\}'; break;
      case '+': safe = '\\+'; break;
      case '*': safe = '\\*'; break;
      case '?': safe = '\\?'; break; // 安全にエスケープ
      case '.': safe = '\\.'; break;
      case '^': safe = '\\^'; break;
      case '$': safe = '\\$'; break;
      case '|': safe = '\\|'; break;
      case '<': safe = '<'; break; // HTMLタグなどでは安全
      case '>': safe = '>'; break;
      default:
        safe = safeChars.test(ch) ? ch : `[${ch}]`; // その他の記号は安全にラップ
        break;
    }

    // 3️⃣ 各文字の間に空白・改行無視パターンを挿入
    result += safe;
    if (i < input.length - 1) {
      result += '(?:\\s|\\r?\\n)*';
    }
  }

  return result;
}

function injectWhitespaceAndNewlineToleranceVSCode(input: string): string {
  /**
   * VSCodeの検索欄に直接渡せるよう、
   * エスケープを「片側だけ」にする安全版。
   */

  // ⚠ 正規表現メタ文字を1重バックスラッシュでエスケープ
  const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 空白・改行を無視できるように "(?:\s|\r?\n)*" を挿入
  // ※ VSCode上では \s や \n をそのまま書いてOK
  return escaped.split('').join('(?:\\s|\\r?\\n)*');
}

// function injectWhitespaceToleranceSmart(input: string): string {
//   // トークン化： \? のようなペアは1トークン扱い
//   const tokens = [...input.matchAll(/\\.|[^\r\n]/g)].map(m => m[0]);

//   const result: string[] = [];
//   for (let i = 0; i < tokens.length; i++) {
//     const current = tokens[i];
//     const next = tokens[i + 1];

//     result.push(current);

//     // 条件：次のトークンが存在し、両方とも「通常文字」
//     if (next && !isRegexMeta(current) && !isRegexMeta(next)) {
//       result.push('(?:\\s|\\r?\\n)*');
//     }
//   }

//   return result.join('');
// }

// function isRegexMeta(token: string): boolean {
//   // 正規表現構文 or エスケープペア は注入対象外
//   return /^\\.|[()|[\]{}+*?.^$]/.test(token);
// }

function injectWhitespaceToleranceSmart(input: string): string {
  const tokens = [...input.matchAll(/\\.|[^\r\n]/g)].map(m => m[0]);
  const result: string[] = [];
  let inCharClass = false; // [ ... ] 内かどうか
  const whitespacePattern = '(?:\\s|\\r?\\n)*';

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];

    // 文字クラスの開始検知
    if (current === '[' && !inCharClass) inCharClass = true;
    if (current === ']' && inCharClass) inCharClass = false;

    result.push(current);

    // 文字クラス内では何もしない
    if (inCharClass) continue;

    // 挿入判定（連続空白回避つき）
    if (
      next &&
      !isRegexMeta(current) &&
      !isRegexMeta(next) &&
      !inCharClass
    ) {
      // 直前に同じ空白パターンを入れていない場合のみ追加
      if (result[result.length - 1] !== whitespacePattern) {
        result.push(whitespacePattern);
      }
    }
  }

  return result.join('');
}

function isRegexMeta(token: string): boolean {
  return /^\\.|[()|[\]{}+*?.^$]/.test(token);
}


export function deactivate() {}


