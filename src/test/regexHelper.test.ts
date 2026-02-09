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