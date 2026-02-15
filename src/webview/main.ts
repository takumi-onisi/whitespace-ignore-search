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
    startDelimiter: document.getElementById(
      "startDelimiter",
    ) as HTMLInputElement,
    endDelimiter: document.getElementById("endDelimiter") as HTMLInputElement,
    spacer: document.getElementById("spacerPattern") as HTMLInputElement,
    preview: document.getElementById("preview") as HTMLElement,
    searchBtn: document.getElementById("searchBtn") as HTMLButtonElement,
    resetBtn: document.getElementById("resetSpacer") as HTMLButtonElement,
  };

  // 値を取得したい時は、このオブジェクトから読み取る
  function getValues() {
    return {
      input: el.input.value,
      startDelimiter: el.startDelimiter.value,
      endDelimiter: el.endDelimiter.value,
      spacer: el.spacer.value,
    };
  }

  // VS Code の検索欄に送る正規表現を生成
  function generatePattern(raw: string) {
    const { startDelimiter, endDelimiter, spacer } = getValues();

    // 入力値の整理
    const trimmedStart = startDelimiter.trim();
    const trimmedEnd = endDelimiter.trim();
    const currentSpacer = spacer || ""; // 空なら空文字

    // デリミタが空文字かどうかをチェック
    const isStartEmpty = trimmedStart === "";
    const isEndEmpty = trimmedEnd === "";
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

  // 現在の設定に基づいた「例題」の文字列を生成して返す
  function getExampleText() {
    const { startDelimiter, endDelimiter } = getValues();
    if (!startDelimiter && !endDelimiter) {
      return "<div>";
    }
    // 2連デリミタのエスケープも考慮した例
    return `class=${startDelimiter}.*-active${endDelimiter}`;
  }

  // 生成したパターンのプレビューを更新
  updatePreview(); // 初回起動時
  function updatePreview() {
    const { input } = getValues();
    const error = getDelimiterError();
    const example = getExampleText();

    // プレースホルダーを常に最新の状態に更新
    el.input.placeholder = `例: ${example}`;

    // デリミタのチェック
    if (error) {
      el.preview.textContent = `生成結果: （エラー） ${error}`;
      return; // 次の処理に進まない
    }

    // プレビュー対象を決定（入力があればそれ、なければ例題）
    const targetText = input || example;

    const pattern = generatePattern(targetText);
    // nullチェックも行い ユーザーがわかるように通知
    el.preview.textContent = "生成結果: " + (pattern ?? "（エラーあり）");
  }

  // 入力されたデリミタのチェック 正常なら null を返す
  function getDelimiterError(): string | null {
    const { startDelimiter, endDelimiter } = getValues();
    const s = startDelimiter.trim();
    const e = endDelimiter.trim();
    if ((s === "") !== (e === "")) {
      return "空文字をデリミタに設定する場合は、開始と終了両方とも空文字で設定してください。";
    }
    return null;
  }

  // ユーザーが設定したデリミタを保存する
  function saveDelimiters() {
    const { startDelimiter, endDelimiter } = getValues();

    vscode.postMessage({
      command: "saveDelimiters",
      config: { startDelimiter: startDelimiter, endDelimiter: endDelimiter },
    });
  }

  // ユーザーが設定したスペーサーの保存
  function saveSpacer() {
    const { spacer } = getValues();

    vscode.postMessage({
      command: "saveSpacer",
      spacer: spacer,
    });
  }

  // スペーサーの設定をデフォルト値に戻す
  function resetSpacer() {
    const spacer = RegexHelper.DEFAULT_CONFIG.spacerPattern;
    // viewの更新
    el.spacer.value = spacer;
    updatePreview();
    // 設定の保存
    vscode.postMessage({
      command: "saveSpacer",
      spacer: spacer,
    });
  }

  // 検索実行ボタンを押したときの処理
  function handleSearchButtonClick() {
    // デリミタのチェック
    const error = getDelimiterError();
    if (error) {
      vscode.postMessage({ command: "showError", message: error });
      return;
    }

    const { input } = getValues();
    // 検索パターンを生成
    const pattern = generatePattern(input);

    // メッセージを送信
    vscode.postMessage({
      command: "search",
      pattern: pattern,
    });
  }

  // 文字数(value.length)に応じて幅を変える
  function adjustInputWidth(el: HTMLInputElement) {
    // 完全にピッタリにするのは難しいため、size属性を更新するのが最も軽量
    const minSize = el.id === "spacerPattern" ? 7 : 1;
    el.size = Math.max(minSize, el.value.length || 1);
  }

  // 入力があったらプレビューを更新する
  el.input.addEventListener("input", updatePreview);
  el.startDelimiter.addEventListener("input", updatePreview);
  el.endDelimiter.addEventListener("input", updatePreview);
  el.spacer.addEventListener("input", updatePreview);

  // input要素の横幅を入力文字に合わせる
  [el.startDelimiter, el.endDelimiter, el.spacer].forEach((input) => {
    adjustInputWidth(input); // 初回の横幅調整
    input.addEventListener("input", () => adjustInputWidth(input));
  });

  // 検索ボタンを押したときのハンドラーを登録
  el.searchBtn.addEventListener("click", handleSearchButtonClick);

  // 入力欄からフォーカスが外れた時などに保存
  el.startDelimiter.addEventListener("blur", saveDelimiters);
  el.endDelimiter.addEventListener("blur", saveDelimiters);
  el.spacer.addEventListener("blur", saveSpacer);
  // 設定のリセット
  el.resetBtn.addEventListener("click", resetSpacer);
}
