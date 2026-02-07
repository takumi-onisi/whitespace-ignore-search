import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

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

  let html = fs.readFileSync(htmlPath, "utf8");

  // HTML内のプレースホルダーを実際のURIに置換
  html = html.replace("{{styleUri}}", styleUri.toString());
  html = html.replace("{{scriptUri}}", scriptUri.toString());

  return html;
}

export function deactivate() {}
