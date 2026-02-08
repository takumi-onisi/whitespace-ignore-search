export class RegexHelper {
  // JSの正規表現メタ文字すべて
  private static readonly ALL_META_CHARS = /[.*+?^${}()|[\]\\]/g;

  /**
   * 文字列内のすべての正規表現記号を文字通りに解釈されるようエスケープする
   */
  public static escapeAllMetaChars(text: string): string {
    return text.replace(this.ALL_META_CHARS, "\\$&");
  }

  /**
   * デリミタのエスケープと復元処理をまとめる
   */
  private static getEscapeManager(start: string, end: string) {
    const pStart = `__ST_${Math.random()}__`;
    const pEnd = `__ED_${Math.random()}__`;
    return {
      // 2連デリミタの置換
      hide: (t: string) =>
        t
          .split(start + start) // 2連デリミタ
          .join(pStart)
          .split(end + end) // 2連デリミタ
          .join(pEnd),
      // デリミタの復元
      reveal: (t: string) => t.split(pStart).join(start).split(pEnd).join(end),
    };
  }

  /**
   * 文字の間に空白許容パターンを挿入する
   */
  public static insertSpacer(text: string, spacer: string): string {
    // 全自動でエスケープしてからスペーサーを挟む
    return this.escapeAllMetaChars(text)
      .split("")
      .filter((char) => !/\s/.test(char))
      .join(spacer);
  }

  /**
   * 開始・終了デリミタから、分割用の正規表現を生成する
   */
  public static createSplitRegex(start: string, end: string): RegExp {
    const escapedStart = this.escapeAllMetaChars(start);
    const escapedEnd = this.escapeAllMetaChars(end);
    // (開始.*?終了) の形を作り、キャプチャグループ () で囲むことで split 時にも値を残す
    return new RegExp(`(${escapedStart}.*?${escapedEnd})`, "g");
  }

  /**
   * 生成プロセス全体を管理する
   */
  public static generateFinalPattern(
    raw: string,
    start: string,
    end: string,
    spacer: string,
  ): string {
    // デリミタの2連（エスケープ）を一時的なユニーク文字列に置換
    const PLACEHOLDER_START = `__ST_${Math.random()}__`;
    const PLACEHOLDER_END = `__ED_${Math.random()}__`;

    // 2連を置換 (@@ -> PLACEHOLDER)
    let processed = raw
      .split(start + start)
      .join(PLACEHOLDER_START)
      .split(end + end)
      .join(PLACEHOLDER_END);

    // 本物のデリミタで分割して、各パートを処理
    const splitRegex = this.createSplitRegex(start, end);
    const parts = processed.split(splitRegex);

    const resultParts = parts.map((part) => {
      if (part.startsWith(start) && part.endsWith(end)) {
        // 保護区内：デリミタを除去し、プレースホルダーを元の「単一デリミタ」に戻す
        const inner = part.slice(start.length, -end.length);
        return inner
          .split(PLACEHOLDER_START)
          .join(start)
          .split(PLACEHOLDER_END)
          .join(end);
      } else {
        // 非保護区：プレースホルダーを「単一デリミタ」に戻してから、空白無視化
        const originalText = part
          .split(PLACEHOLDER_START)
          .join(start)
          .split(PLACEHOLDER_END)
          .join(end);
        return this.insertSpacer(originalText, spacer);
      }
    });

    // 結合して余計なスペーサーを掃除
    return resultParts.join(spacer).replace(/(\[\\s\\r\\n\]\*)+/g, spacer);
  }
}
