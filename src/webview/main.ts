console.log("main.js");

import { RegexHelper } from "../utils/regexHelper";
// Webview APIの宣言
declare function acquireVsCodeApi(): {
    postMessage(message: any): void;
};
const vscode = acquireVsCodeApi();
const input = document.getElementById("input") as HTMLTextAreaElement;
const preview = document.getElementById("preview") as HTMLElement;
const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;

const spacer = "[\\s\\r\\n]*";


/**
 * デリミタの入力値をチェックし、分割用の正規表現を生成する
 * @param {string} start - 開始デリミタ
 * @param {string} end - 終了デリミタ
 * @returns {RegExp|null}
 * - RegExp: 分割用パターン
 * - null: 片方のみ入力などの不正
 */
// function createSplitRegex(startDelimiter : string, endDelimiter: string) {
//   // メタ文字をエスケープする関数
//   const escape = (s : string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//   try {
//     const escapedStart = escape(startDelimiter);
//     const escapedEnd = escape(endDelimiter);

//     // 正規表現の生成（非欲張りのマッチング .*? ）
//     // ( ) で囲むことで、split した際の結果に区切り文字自体も含まれるようになります
//     return new RegExp(`(${escapedStart}.*?${escapedEnd})`, "g");
//   } catch (err) {
//     vscode.postMessage({
//       command: "showError",
//       message: "不正なデリミタが指定されています。",
//     });
//   }
// }

function generatePattern(raw : string) {
  const startInput = document.getElementById("startDelimiter") as HTMLInputElement;
  const endInput = document.getElementById("endDelimiter") as HTMLInputElement;
  const startDelimiter = startInput.value;
  const endDelimiter = endInput.value;

  // 入力値の整理
  const trimmedStart = startDelimiter.trim();
  const trimmedEnd = endDelimiter.trim();

  const isStartEmpty = trimmedStart === "";
  const isEndEmpty = trimmedEnd === "";
  // 片方のみ入力されている場合（エラー）
  if (isStartEmpty !== isEndEmpty) {
    vscode.postMessage({
      command: "showError",
      message: "片側のみのデリミタの設定はできません。",
    });
    return null;
  }

  // 開始終了が両方とも空白の場合
  if (isStartEmpty && isEndEmpty) {
    // 何にもマッチしない正規表現（正確には、決して現れないパターン）を返す
    // これにより、input.split(reg) を実行したときに「分割されず、全体が1つ目の要素」として返ってくる
    return RegexHelper.insertSpacer(raw, spacer);
  }

  // ユーザーが指定した開始文字(start)と終了文字(end)から分割用パターンを作る
  // 正規表現の作成（RegexHelperに移動させるのが理想的）
  const escapedStart = RegexHelper.escapeAllMetaChars(trimmedStart);
  const escapedEnd = RegexHelper.escapeAllMetaChars(trimmedEnd);
  const splitRegex = new RegExp(`(${escapedStart}.*?${escapedEnd})`, "g");

  if (splitRegex === null) {
    // 分割パターン作成失敗
    return null;
  }

  // 分割の前にエスケープされたデリミタの処理が必要

  // デリミタの位置で分割
  const parts = raw.split(splitRegex);

  return parts
    .map((part) => {
      if (part.startsWith(trimmedStart) && part.endsWith(trimmedEnd)) {
        // デリミタで囲まれた区間
        return part.slice(trimmedStart.length, -trimmedEnd.length);
      } else {
        return RegexHelper.insertSpacer(part, spacer);
      }
    })
    .join(spacer)
    .replace(/(\[\\s\\r\\n\]\*)+/g, spacer);
}

input.addEventListener("input", () => {
  preview.textContent = "生成結果: " + generatePattern(input.value);
});

searchBtn.addEventListener("click", () => {
  vscode.postMessage({
    command: "showError",
    message: "サーチ",
  });
  vscode.postMessage({
    command: "search",
    pattern: generatePattern(input.value),
  });
});
