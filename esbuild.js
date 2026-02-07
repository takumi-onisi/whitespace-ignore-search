const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
  // 1. Extension 本体用 (Node.js)
  const extensionCtx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
  });

  // 2. Webview 側スクリプト用 (Browser)
  const webviewCtx = await esbuild.context({
    entryPoints: ['src/webview/main.ts'],
    bundle: true,
    format: 'iife', // ブラウザでそのまま実行可能な形式
    minify: production,
    sourcemap: !production,
    platform: 'browser', // ブラウザ向けに設定
    outfile: 'dist/webview-main.js', // 出力ファイル名を分ける
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    // 両方の監視を開始
    await Promise.all([
      extensionCtx.watch(),
      webviewCtx.watch()
    ]);
  } else {
    // 両方を一括ビルド
    await Promise.all([
      extensionCtx.rebuild(),
      webviewCtx.rebuild()
    ]);
    await extensionCtx.dispose();
    await webviewCtx.dispose();
  }
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
