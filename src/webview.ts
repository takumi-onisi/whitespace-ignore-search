export function getWebviewContent(): string {
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="ja">
  <head>
    <meta charset="UTF-8">
    <style>
      /* ご提示のスタイルを継承しつつ、微調整 */
      :root {
        --vscode-bg:#1e1e1e; --vscode-panel:#252526; --vscode-foreground:#d4d4d4;
        --vscode-border:#3c3c3c; --vscode-button:#0e639c; --vscode-muted:#9a9a9a;
      }
      body { background:var(--vscode-bg); color:var(--vscode-foreground); font-family: sans-serif; padding:16px; }
      .editor { width:100%; min-height:120px; background:var(--vscode-panel); color:var(--vscode-foreground); border:1px solid var(--vscode-border); padding:8px; font-family:monospace; resize:vertical; box-sizing:border-box; }
      .output-preview { margin-top:10px; padding:8px; background:#000; color:#aaa; font-size:11px; border:1px solid #333; white-space:pre-wrap; word-break:break-all; }
      .controls { margin-top:12px; display:flex; gap:8px; }
      button.vscode { background:var(--vscode-button); color:white; border:none; padding:8px 16px; border-radius:2px; cursor:pointer; }
      .info { font-size:11px; color:var(--vscode-muted); margin-top:8px; }
      code { color: #569cd6; }
    </style>
  </head>
  <body>
    <h2>Whitespace Ignore Search</h2>
    <p class="info"><code>@正規表現@</code> で囲った部分は保護されます。それ以外は空白/改行が許容されます。</p>
    
    <textarea id="input" class="editor" placeholder="例: const @[a-z]+@ = 10"></textarea>
    
    <div class="output-preview" id="preview"></div>

    <div class="controls">
      <button id="searchBtn" class="vscode">VS Code 検索パネルへ注入</button>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      const input = document.getElementById('input');
      const preview = document.getElementById('preview');
      const searchBtn = document.getElementById('searchBtn');

      const spacer = '[\\\\s\\\\r\\\\n]*';

      function generatePattern(raw) {
        // @...@ で分割。例: ["const ", "@[a-z]+@", " = 10"]
        const parts = raw.split(/(@[^@]*@)/);
        
        return parts.map(part => {
          if (part.startsWith('@') && part.endsWith('@')) {
            // 保護エリア：@を取り除いてそのまま返す
            return part.slice(1, -1);
          } else {
            // 通常エリア：1文字ずつ分解して spacer を入れる
            // メタ文字をエスケープしつつ、文字間に spacer を挿入
            return part
              .replace(/[.*+?^$\\{}()|[\\]]/g, '\\\\$&') // 基本エスケープ
              .split('')
              .filter(char => !/\\s/.test(char)) // 入力内の空白は一旦無視
              .join(spacer);
          }
        }).join(spacer).replace(/(\\[\\\\s\\\\r\\\\n\\]\\*)+/g, spacer);
      }

      input.addEventListener('input', () => {
        preview.textContent = "生成結果: " + generatePattern(input.value);
      });

      searchBtn.addEventListener('click', () => {
        vscode.postMessage({
          command: 'search',
          pattern: generatePattern(input.value)
        });
      });
    </script>
  </body>
  </html>
  `;
}