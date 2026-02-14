import { describe, it, expect } from 'vitest';
import { RegexHelper } from '../utils/regexHelper'; // パスは適宜調整してください

describe('RegexHelperの基本テスト', () => {
    it('デリミタがない場合、すべての文字の間にスペーサーが入ること', () => {
        const input = 'abc';
        const spacer = '[\\s]*';
        const result = RegexHelper.insertSpacer(input, spacer);
        
        // a[...]*b[...]*c になっているか
        expect(result).toBe('a[\\s]*b[\\s]*c');
    });

    it('デリミタで囲まれた部分はスペーサーが挿入されないこと', () => {
        const input = 'a@@bc@@d';
        const result = RegexHelper.generateFinalPattern(input, '@@', '@@', '[\\s]*');
        
        // "bc" の間にはスペーサーが入らず、"a" と "d" の周りだけ入るはず
        expect(result).toContain('bc');
        expect(result).not.toContain('b[\\s]*c');
    });
});

describe('RegexHelperのメタ文字のエスケープをテスト', () => {
    const spacer = '[\\s\\r\\n]*';

    it('非保護区のメタ文字が正しくエスケープされ、スペーサーが入ること', () => {
        // 入力: .? (正規表現では「任意の一文字の0回か1回」という意味)
        const input = '.?';
        const result = RegexHelper.insertSpacer(input, spacer);
        
        // 期待値: \. と \? にエスケープされた上でスペーサーが入る
        expect(result).toBe(`\\.${spacer}\\?`);
    });

    it('デリミタ使用時、保護区外のメタ文字のみがエスケープされること', () => {
        const start = '@';
        const end = '@';
        // 入力: . (非保護) と @.*?@ (保護)
        const input = '.@.*?@';
        const result = RegexHelper.generateFinalPattern(input, start, end, spacer);
        
        // 期待値: \. はエスケープされ、中の .*? はそのまま
        // (注: 文字と保護区間の間にもスペーサーが入る想定)
        expect(result).toBe(`\\.${spacer}.*?`);
    });

    it('スペーサー自体のメタ文字（[]など）が二重エスケープされないこと', () => {
        const input = 'a';
        const result = RegexHelper.insertSpacer(input, spacer);
        
        // 期待値: a だけ（単体ならスペーサーはつかない、または前後に影響しない）
        // もしバグがあると \[\\s\\r\\n\]\* のようになってしまう
        expect(result).toBe('a');
        
        const input2 = 'ab';
        const result2 = RegexHelper.insertSpacer(input2, spacer);
        expect(result2).toBe(`a${spacer}b`);
    });
});