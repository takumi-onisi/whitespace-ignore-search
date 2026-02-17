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
          vscode.l10n.t("Whitespace Ignore Search"),
          vscode.ViewColumn.Two,
          {
            enableScripts: true,
            // 拡張機能で使用するリソース読み込みを許可
            localResourceRoots: [
              vscode.Uri.joinPath(context.extensionUri, "media"),
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
  // 各ファイルのURIをWebView用に変換
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "dist", "webview-main.js"),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "style.css"),
  );
  const htmlUri = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "searchPanel.html",
  );

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

  let html = fs.readFileSync(htmlUri.fsPath, "utf8");
  // HTML内のプレースホルダーを実際の値に置換
  html = html.replace("{{lang}}", vscode.l10n.t("en"));
  html = html.replace("{{infoSpacerPrefix}}", vscode.l10n.t("Insert spacer"));
  html = html.replace(
    "{{infoSpacerSuffix}}",
    vscode.l10n.t("between characters. Meta characters are escaped."),
  );
  html = html.replace("{{btnReset}}", vscode.l10n.t("Reset"));
  html = html.replace("{{infoDelimMid}}", vscode.l10n.t("and"));
  html = html.replace(
    "{{infoDelimSuffix}}",
    vscode.l10n.t("treats content as raw Regex. Text is preserved."),
  );
  html = html.replace("{{btnSearch}}", vscode.l10n.t("Search"));
  html = html.replace("{{styleUri}}", styleUri.toString());
  html = html.replace("{{scriptUri}}", scriptUri.toString());
  html = html.replace(/{{startDelim}}/g, safeStart);
  html = html.replace(/{{endDelim}}/g, safeEnd);
  html = html.replace(/{{spacerPattern}}/g, escapeHtml(spacer));

  // ブラウザ環境で動作するスクリプト内の文章の多言語対応
  // 翻訳オブジェクトを準備
  const l10nData = {
    eg: vscode.l10n.t("e.g."),
    result: vscode.l10n.t("Generated Result: "),
    error: vscode.l10n.t("Error"),
    delimiterError: vscode.l10n.t("Delimiters must be either both filled or both empty."),
  };

  // <script> タグを生成（window.WEBVIEW_L10N にデータを格納）
  const l10nScript = `<script>window.WEBVIEW_L10N = ${JSON.stringify(l10nData)};</script>`;

  // HTML内の </head> の直前に挿入する
  html = html.replace("</head>", `${l10nScript}\n</head>`);

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
