import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { RegexHelper } from "./utils/regexHelper";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.showIgnoreWhitespacePanel",
      () => {
        const panel = vscode.window.createWebviewPanel(
          "ignoreWhitespace",
          "空白無視検索パターン作成",
          vscode.ViewColumn.Two,
          {
            enableScripts: true,
            // 拡張機能で使用するリソース読み込みを許可
            localResourceRoots: [
              vscode.Uri.joinPath(context.extensionUri, "src", "webview"),
              vscode.Uri.joinPath(context.extensionUri, "dist"),
            ],
          },
        );

        panel.webview.html = getHtmlContent(context, panel.webview);

        panel.webview.onDidReceiveMessage(async (message) => {
          switch (message.command) {
            case "search":
              // 検索処理
              // VS Code の検索パネルを呼び出す
              await vscode.commands.executeCommand(
                "workbench.action.findInFiles",
                {
                  query: message.pattern,
                  triggerSearch: true,
                  isRegex: true,
                  isCaseSensitive: false,
                },
              );
              break;

            case "showError":
              // VSCode標準のトースト通知
              vscode.window.showErrorMessage(message.message);
              break;

            // 保存
            case "saveDelimiters":
              await context.globalState.update(
                "startDelimiter",
                message.config.startDelimiter,
              );
              await context.globalState.update(
                "endDelimiter",
                message.config.endDelimiter,
              );
              break;

            case "saveSpacer":
              await context.globalState.update("spacerPattern", message.spacer);
              break;
          }
        });
      },
    ),
  );
}

function getHtmlContent(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
): string {
  const webviewPath = path.join(context.extensionPath, "src", "webview");

  // 各ファイルのURIをWebView用に変換
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "dist", "webview-main.js"),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(webviewPath, "style.css")),
  );
  const htmlPath = path.join(webviewPath, "searchPanel.html");

  const config = RegexHelper.DEFAULT_CONFIG;
  // 保存された値を取得（空文字も有効、未設定ならデフォルト）
  const startDelim = context.globalState.get<string>(
    "startDelimiter",
    config.startDelimiter,
  );
  const endDelim = context.globalState.get<string>(
    "endDelimiter",
    config.endDelimiter,
  );
  const spacer = context.globalState.get<string>(
    "spacerPattern",
    config.spacerPattern,
  );

  // エスケープ処理
  const safeStart = escapeHtml(startDelim);
  const safeEnd = escapeHtml(endDelim);
  const safeSpacer = escapeHtml(spacer);

  let placeholderText = "";
  if (startDelim === "" && endDelim === "") {
    placeholderText =
      "デリミタが未設定のため、正規表現のメタ文字はエスケープされ、入力された全文にスペーサーが挿入されます。";
  } else {
    placeholderText = `開始デリミタ:${safeStart}
    閉じデリミタ:${safeEnd}
    デリミタ間は保護区間として扱われます。
    例: <div>${safeStart}保護区間 [^<>\s]+${safeEnd}</div> `;
  }

  let html = fs.readFileSync(htmlPath, "utf8");
  // HTML内のプレースホルダーを実際のURIに置換
  html = html.replace("{{styleUri}}", styleUri.toString());
  html = html.replace("{{scriptUri}}", scriptUri.toString());
  html = html.replace(/{{startDelim}}/g, safeStart);
  html = html.replace(/{{endDelim}}/g, safeEnd);
  html = html.replace(/{{spacerPattern}}/g, escapeHtml(spacer));
  html = html.replace("{{textareaPlaceholder}}", placeholderText);

  return html;
}

// ユーザー入力の値をhtmlに対して無害化する
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function deactivate() {}
