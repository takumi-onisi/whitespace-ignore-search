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
    const startDelimiterEl = document.getElementById("startDelimiter") as HTMLInputElement;
    const endDelimiterEl = document.getElementById("endDelimiter") as HTMLInputElement;
    const inputEl = document.getElementById("input") as HTMLTextAreaElement;
    const previewEl = document.getElementById("preview") as HTMLElement;

    startDelimiterEl.value = "@";
    endDelimiterEl.value = "@";
    inputEl.value = "a@bc@";
    // 手動で input イベントを発生させてリスナーを叩く
    inputEl.dispatchEvent(new Event("input"));

    expect(previewEl.textContent).toContain("a[\\s\\r\\n]*bc");
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
});
