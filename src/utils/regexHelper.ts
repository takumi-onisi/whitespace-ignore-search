export class RegexHelper {
  // 空白として捕捉する文字をスペーサーとして定義
  private static readonly DEFAULT_SPACER = "[\\s\\r\\n]*";
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
  public static insertSpacer(text: string): string {
    const spacer = this.DEFAULT_SPACER;
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
  ): string {
    // エスケープ対象のデリミタ文字の管理を担当
    const esc = this.getEscapeManager(start, end);

    // エスケープされたデリミタ文字を一時的にマスクする
    const maskedText = esc.hide(raw);

    // 本物のデリミタで分割して、各パートを処理
    const splitRegex = new RegExp(
      `(${this.escapeAllMetaChars(start)}.*?${this.escapeAllMetaChars(end)})`,
      "g",
    );
    const parts = maskedText.split(splitRegex);

    const processedParts = parts.map((part) => {
      // デリミタで囲まれた区間かどうかをチェック
      const isProtected = part.startsWith(start) && part.endsWith(end);

      if (isProtected) {
        // デリミタで囲まれた区間：デリミタを剥ぎ取ってから復元
        const inner = part.slice(start.length, -end.length);
        return esc.reveal(inner);
      } else {
        // スペーサー挿入対象区間：復元してからスペーサー挿入
        return this.insertSpacer(esc.reveal(part));
      }
    });

    // 結合して余計なスペーサーを掃除
    const spacer = this.DEFAULT_SPACER;
    return processedParts
            .join(spacer)
            .replace(/(\[\\s\\r\\n\]\*)+/g, spacer);
  }
}
