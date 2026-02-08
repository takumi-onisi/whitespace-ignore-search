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
}
