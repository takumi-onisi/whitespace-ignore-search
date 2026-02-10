import { RegexHelper } from "../utils/regexHelper";
// Webview APIの宣言
declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
};

if (typeof window !== "undefined") {
  const isTesting =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "test";

  if (!isTesting) {
    // 実際のWebview実行時のみ自動で動かす
    // テスト時はテスト内で明示的に実行させる
    init();
  }
}

// メインロジックを init 関数にまとめる
export function init() {
  const vscode = acquireVsCodeApi();

  const input = document.getElementById("input") as HTMLTextAreaElement;
  const preview = document.getElementById("preview") as HTMLElement;
  const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;

  // VS Code の検索欄に送る正規表現を生成
  function generatePattern(raw: string) {
    const startInput = document.getElementById(
      "startDelimiter",
    ) as HTMLInputElement;
    const endInput = document.getElementById(
      "endDelimiter",
    ) as HTMLInputElement;
    const startDelimiter = startInput.value;
    const endDelimiter = endInput.value;
    const spacerInput = document.getElementById(
      "spacerPattern",
    ) as HTMLInputElement;

    // 入力値の整理
    const trimmedStart = startDelimiter.trim();
    const trimmedEnd = endDelimiter.trim();
    const currentSpacer = spacerInput.value || ""; // 空なら空文字

    // 入力値のチェック
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
      return RegexHelper.insertSpacer(raw, currentSpacer);
    }

    // 正規表現許容区間がある場合の検索パターンを生成して返す
    return RegexHelper.generateFinalPattern(
      raw,
      trimmedStart,
      trimmedEnd,
      currentSpacer,
    );
  }

  // 生成したパターンのプレビューを更新
  function updatePreview() {
    const pattern = generatePattern(input.value);
    // nullチェックも行い ユーザーがわかるように通知
    preview.textContent = "生成結果: " + (pattern ?? "（エラーあり）");
  }

  // ユーザーが設定したデリミタを保存する
  function saveDelimiters() {
    const start = (
      document.getElementById("startDelimiter") as HTMLInputElement
    ).value;
    const end = (document.getElementById("endDelimiter") as HTMLInputElement)
      .value;

    vscode.postMessage({
      command: "saveDelimiters",
      config: { startDelimiter: start, endDelimiter: end },
    });
  }

  // ユーザーが設定したスペーサーの保存
  function saveSpacer() {
    const spacer = (
      document.getElementById("spacerPattern") as HTMLInputElement
    ).value;

    vscode.postMessage({
      command: "saveSpacer",
      spacer: spacer,
    });
  }

  // スペーサーの設定をデフォルト値に戻す
  function resetSpacer() {
    const spacer = RegexHelper.DEFAULT_CONFIG.spacerPattern;
    (document.getElementById("spacerPattern") as HTMLInputElement).value =
      spacer;
    updatePreview();
    vscode.postMessage({
      command: "saveSpacer",
      spacer: spacer,
    });
  }

  // 入力があったらプレビューを更新する
  input.addEventListener("input", updatePreview);
  (
    document.getElementById("startDelimiter") as HTMLInputElement
  ).addEventListener("input", updatePreview);
  (
    document.getElementById("endDelimiter") as HTMLInputElement
  ).addEventListener("input", updatePreview);
  (
    document.getElementById("spacerPattern") as HTMLInputElement
  ).addEventListener("input", updatePreview);

  // 生成したパターンをVSCodeの検索欄に送る
  searchBtn.addEventListener("click", () => {
    vscode.postMessage({
      command: "search",
      pattern: generatePattern(input.value),
    });
  });

  // 入力欄からフォーカスが外れた時などに保存
  document
    .getElementById("startDelimiter")
    ?.addEventListener("blur", saveDelimiters);
  document
    .getElementById("endDelimiter")
    ?.addEventListener("blur", saveDelimiters);
  document
    .getElementById("spacerPattern")
    ?.addEventListener("blur", saveSpacer);
  // 設定のリセット
  document
    .getElementById("resetSpacer")
    ?.addEventListener("click", resetSpacer);
}
