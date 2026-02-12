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

  // 起動時に一度だけ取得して固定する（キャッシュ）
  const el = {
    input: document.getElementById("input") as HTMLTextAreaElement,
    startDelim: document.getElementById("startDelimiter") as HTMLInputElement,
    endDelim: document.getElementById("endDelimiter") as HTMLInputElement,
    spacer: document.getElementById("spacerPattern") as HTMLInputElement,
    preview: document.getElementById("preview") as HTMLElement,
    searchBtn: document.getElementById("searchBtn") as HTMLButtonElement,
    resetBtn: document.getElementById("resetSpacer") as HTMLButtonElement,
  };

  // 値を取得したい時は、このオブジェクトから読み取る
  function getValues() {
    return {
      input: el.input.value,
      start: el.startDelim.value,
      end: el.endDelim.value,
      spacer: el.spacer.value,
    };
  }

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
    const { input } = getValues();
    const pattern = generatePattern(input);
    // nullチェックも行い ユーザーがわかるように通知
    el.preview.textContent = "生成結果: " + (pattern ?? "（エラーあり）");
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

  // 生成したパターンをVSCodeの検索欄に送る
  function handleSearchButtonClick() {
    const { input } = getValues();
    const pattern = generatePattern(input);

    // メッセージを送信
    vscode.postMessage({
      command: "search",
      pattern: pattern,
    });
  }

  // 入力があったらプレビューを更新する
  el.input.addEventListener("input", updatePreview);
  (
    document.getElementById("startDelimiter") as HTMLInputElement
  ).addEventListener("input", updatePreview);
  (
    document.getElementById("endDelimiter") as HTMLInputElement
  ).addEventListener("input", updatePreview);
  (
    document.getElementById("spacerPattern") as HTMLInputElement
  ).addEventListener("input", updatePreview);

  // 検索ボタンを押したときのハンドラーを登録
  el.searchBtn.addEventListener("click", handleSearchButtonClick);

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
