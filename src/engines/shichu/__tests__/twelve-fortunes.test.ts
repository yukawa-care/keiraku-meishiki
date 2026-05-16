/**
 * 十二運エンジン テスト
 *
 * 10干×12支=120 パターン網羅、湯川先生キーケース、陽干（甲）順行・
 * 陰干（乙）逆行を検証。
 *
 * 典拠：四柱推命の十二運／陰陽干別の回転規則／『四柱推命の本』小山内彰系
 */
import { describe, it, expect } from 'vitest';
import { STEMS, BRANCHES } from '../../shared/types';
import { getTwelveFortune } from '../twelve-fortunes';
import type { TwelveFortune } from '../twelve-fortunes';

const ALL: TwelveFortune[] = [
  '長生', '沐浴', '冠帯', '建禄', '帝旺', '衰',
  '病', '死', '墓', '絶', '胎', '養',
];

describe('getTwelveFortune 120パターン網羅・自己整合', () => {
  it('10×12 すべてが 12 種いずれかを返す', () => {
    for (const d of STEMS) {
      for (const b of BRANCHES) {
        expect(ALL).toContain(getTwelveFortune(d, b));
      }
    }
  });

  it('各日干の 12 支は 12 運すべてが過不足なく 1 回ずつ（順列）', () => {
    for (const d of STEMS) {
      const row = BRANCHES.map((b) => getTwelveFortune(d, b));
      expect([...row].sort()).toEqual([...ALL].sort());
    }
  });

  it('不正な干支は例外（計算層は沈黙させない）', () => {
    expect(() => getTwelveFortune('甲', 'X')).toThrow();
    expect(() => getTwelveFortune('子', '子')).toThrow(); // 天干に地支
    expect(() => getTwelveFortune('甲', '甲')).toThrow(); // 地支に天干
    expect(() => getTwelveFortune('', '子')).toThrow();
  });
});

describe('湯川先生キーケース（日干 甲）', () => {
  it.each([
    ['巳', '病'],
    ['寅', '建禄'],
    ['辰', '衰'],
    ['申', '絶'],
  ] as const)('甲 vs %s → %s', (branch, expected) => {
    expect(getTwelveFortune('甲', branch)).toBe(expected);
  });
});

describe('陽干代表（甲）：12支すべて順行', () => {
  it('亥=長生 から子→丑→…→戌=養 の順方向', () => {
    const expected: Record<string, TwelveFortune> = {
      亥: '長生', 子: '沐浴', 丑: '冠帯', 寅: '建禄', 卯: '帝旺', 辰: '衰',
      巳: '病', 午: '死', 未: '墓', 申: '絶', 酉: '胎', 戌: '養',
    };
    for (const b of BRANCHES) {
      expect(getTwelveFortune('甲', b)).toBe(expected[b]);
    }
  });
});

describe('陰干代表（乙）：逆順回転', () => {
  it('午=長生 から巳→辰→…の逆方向', () => {
    const expected: Record<string, TwelveFortune> = {
      午: '長生', 巳: '沐浴', 辰: '冠帯', 卯: '建禄', 寅: '帝旺', 丑: '衰',
      子: '病', 亥: '死', 戌: '墓', 酉: '絶', 申: '胎', 未: '養',
    };
    for (const b of BRANCHES) {
      expect(getTwelveFortune('乙', b)).toBe(expected[b]);
    }
  });

  it('陽干（甲）と陰干（乙）は同支で異なる回転になる', () => {
    // 順行と逆行のため一般に一致しない（長生支同士など特殊点を除く）
    expect(getTwelveFortune('甲', '子')).toBe('沐浴');
    expect(getTwelveFortune('乙', '子')).toBe('病');
  });
});
