import { RegexHelper } from "../utils/regexHelper";
// Webview APIの宣言
declare function acquireVsCodeApi(): {
    postMessage(message: any): void;
};
const vscode = acquireVsCodeApi();
const input = document.getElementById("input") as HTMLTextAreaElement;
const preview = document.getElementById("preview") as HTMLElement;
const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;

// VS Code の検索欄に送る正規表現を生成
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
    // 文字列すべてにスペーサーを挿入して返す
    return RegexHelper.insertSpacer(raw);
  }
  
  // 正規表現許容区間がある場合の検索パターンを生成して返す
  return RegexHelper.generateFinalPattern(raw, trimmedStart, trimmedEnd);
}

input.addEventListener("input", () => {
  preview.textContent = "生成結果: " + generatePattern(input.value);
});

searchBtn.addEventListener("click", () => {
  vscode.postMessage({
    command: "showError",
    message: "サーチ",
  });
});
