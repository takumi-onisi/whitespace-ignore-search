import { describe, it, expect, beforeEach, vi } from "vitest";
import { init } from "../webview/main";

describe("Webview UI Integration", () => {
  beforeEach(async () => {
    // 1. まず DOM を作る
    document.body.innerHTML = `
            <textarea id="input"></textarea>
            <input id="startDelimiter" value="@@">
            <input id="endDelimiter" value="@@">
            <input id="spacerPattern" value="[\\s\\r\\n]*">
            <div id="preview"></div>
            <button id="resetSpacer">Reset</button>
            <button id="searchBtn">Search</button>
        `;

    // 2. 重要：VS Code API のモック（これがないと acquireVsCodeApi で落ちます）
    (window as any).acquireVsCodeApi = () => ({
      postMessage: vi.fn(),
    });

    // 3. メインロジックのセットアップ
    init();
  });

  it("入力欄に文字を入れたとき、プレビューが即座に更新されるか", () => {
    const inputEl = document.getElementById("input") as HTMLTextAreaElement;
    const previewEl = document.getElementById("preview") as HTMLElement;

    inputEl.value = "abc";
    // 手動で input イベントを発生させてリスナーを叩く
    inputEl.dispatchEvent(new Event("input"));

    expect(previewEl.textContent).toContain("a[\\s\\r\\n]*b");
  });

  it("デリミタを設定したとき、正しい検索パターンがプレビューに表示されるか", () => {
    const startDelimiterEl = document.getElementById(
      "startDelimiter",
    ) as HTMLInputElement;
    const endDelimiterEl = document.getElementById(
      "endDelimiter",
    ) as HTMLInputElement;
    const inputEl = document.getElementById("input") as HTMLTextAreaElement;
    const previewEl = document.getElementById("preview") as HTMLElement;

    startDelimiterEl.value = "@";
    endDelimiterEl.value = "@";
    inputEl.value = "a@bc@";
    // 手動で input イベントを発生させてリスナーを叩く
    inputEl.dispatchEvent(new Event("input"));

    expect(previewEl.textContent).toContain("a[\\s\\r\\n]*bc");
  });

  it("デリミタが片方のみ入力されたとき、エラーメッセージが表示されるか", () => {
    const startDelimiterEl = document.getElementById("startDelimiter") as HTMLInputElement;
    const endDelimiterEl = document.getElementById("endDelimiter") as HTMLInputElement;
    const previewEl = document.getElementById("preview") as HTMLElement;

    // 片方だけ入力
    startDelimiterEl.value = "@";
    endDelimiterEl.value = ""; 
    
    // イベントを発生させる
    startDelimiterEl.dispatchEvent(new Event("input"));

    // 生成結果ではなく、エラー文言が含まれているか検証
    expect(previewEl.textContent).toContain("両方とも空文字で設定してください。");
  });

  it("デリミタがエラー状態のとき、検索ボタンを押しても検索が実行されないこと", () => {
    const postMessageSpy = vi.fn();
    (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
    init();

    const startDelimiterEl = document.getElementById("startDelimiter") as HTMLInputElement;
    const endDelimiterEl = document.getElementById("endDelimiter") as HTMLInputElement;
    const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;

    // 不正なデリミタ設定
    startDelimiterEl.value = "@";
    endDelimiterEl.value = "";
    
    // 検索ボタンクリック
    searchBtn.click();

    // postMessageが 'search' コマンドで呼ばれていないことを確認
    // (代わりに 'showError' が呼ばれている、などの検証も可)
    const searchCalls = postMessageSpy.mock.calls.filter(call => call[0].command === "search");
    expect(searchCalls.length).toBe(0);
  });

  it("リセットボタンを押したとき、スペーサーがデフォルトに戻るか", () => {
    const spacerEl = document.getElementById(
      "spacerPattern",
    ) as HTMLInputElement;
    const resetBtn = document.getElementById(
      "resetSpacer",
    ) as HTMLButtonElement;

    spacerEl.value = "MODIFIED";
    resetBtn.click(); // main.ts 内で登録した click リスナーが動くはず

    expect(spacerEl.value).toBe("[\\s\\r\\n]*");
  });

  it("検索ボタンを押したとき、正しいコマンドとパターンがVS Codeに送信されるか", () => {
    // 1. vscode.postMessage の身代わり（スパイ）を準備
    const postMessageSpy = vi.fn();
    (globalThis as any).acquireVsCodeApi = () => ({
      postMessage: postMessageSpy,
    });

    // 2. 再度初期化してスパイを登録
    init();

    const inputEl = document.getElementById("input") as HTMLTextAreaElement;
    const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;

    // 3. 入力値をセットしてボタンをクリック
    inputEl.value = "test";
    searchBtn.click();

    // 4. 検証：postMessageが「適切な引数」で呼ばれたか
    expect(postMessageSpy).toHaveBeenCalledWith({
      command: "search",
      pattern: expect.stringContaining("t"), // RegexHelperの結果が含まれているか
    });
  });
});
