/**
 * 通変星エンジン テスト
 *
 * 10干×10干=100 パターン網羅、湯川先生キーケース、蔵干との関係を検証。
 *
 * 典拠：四柱推命の通変星10種／五行陰陽の標準関係表／『四柱推命の本』小山内彰系
 */
import { describe, it, expect } from 'vitest';
import { STEMS } from '../../shared/types';
import { getTenStar, getPillarTenStars } from '../ten-stars';
import type { TenStar } from '../ten-stars';

const ALL: TenStar[] = [
  '比肩', '劫財', '食神', '傷官', '偏財',
  '正財', '偏官', '正官', '偏印', '印綬',
];

describe('getTenStar 100パターン網羅・自己整合', () => {
  it('10×10 すべてが 10 種いずれかを返す', () => {
    for (const d of STEMS) {
      for (const t of STEMS) {
        expect(ALL).toContain(getTenStar(d, t));
      }
    }
  });

  it('各日干の行は 10 種すべてが過不足なく 1 回ずつ出る（順列）', () => {
    for (const d of STEMS) {
      const row = STEMS.map((t) => getTenStar(d, t));
      expect([...row].sort()).toEqual([...ALL].sort());
    }
  });

  it('同干（対角）は必ず 比肩', () => {
    for (const d of STEMS) {
      expect(getTenStar(d, d)).toBe('比肩');
    }
  });

  it('不正な天干は例外（計算層は沈黙させない）', () => {
    expect(() => getTenStar('甲', 'X')).toThrow();
    expect(() => getTenStar('子', '甲')).toThrow(); // 地支を渡した
    expect(() => getTenStar('', '甲')).toThrow();
  });
});

describe('湯川先生キーケース（日干 甲）', () => {
  it.each([
    ['乙', '劫財'],
    ['戊', '偏財'],
    ['甲', '比肩'],
    ['壬', '偏印'],
  ] as const)('甲 vs %s → %s', (target, expected) => {
    expect(getTenStar('甲', target)).toBe(expected);
  });
});

describe('蔵干との関係（日干 甲）', () => {
  it.each([
    ['巳', ['丙', '庚', '戊'], ['食神', '偏官', '偏財']],
    ['寅', ['甲', '丙', '戊'], ['比肩', '食神', '偏財']],
    ['辰', ['戊', '乙', '癸'], ['偏財', '劫財', '印綬']],
    ['申', ['庚', '壬', '戊'], ['偏官', '偏印', '偏財']],
  ] as const)('%s の蔵干 %j → %j', (_branch, hidden, expected) => {
    expect(hidden.map((h) => getTenStar('甲', h))).toEqual(expected);
  });
});

describe('getPillarTenStars 湯川先生の四柱（日干 甲）', () => {
  it('年柱 乙巳 → stem 劫財 / hidden 食神・偏官・偏財', () => {
    expect(getPillarTenStars('甲', { stem: '乙', branch: '巳' })).toEqual({
      stem: '劫財',
      hidden: ['食神', '偏官', '偏財'],
    });
  });
  it('月柱 戊寅 → stem 偏財 / hidden 比肩・食神・偏財', () => {
    expect(getPillarTenStars('甲', { stem: '戊', branch: '寅' })).toEqual({
      stem: '偏財',
      hidden: ['比肩', '食神', '偏財'],
    });
  });
  it('日柱 甲辰 → stem 比肩（日干本人）/ hidden 偏財・劫財・印綬', () => {
    expect(getPillarTenStars('甲', { stem: '甲', branch: '辰' })).toEqual({
      stem: '比肩',
      hidden: ['偏財', '劫財', '印綬'],
    });
  });
  it('時柱 壬申 → stem 偏印 / hidden 偏官・偏印・偏財', () => {
    expect(getPillarTenStars('甲', { stem: '壬', branch: '申' })).toEqual({
      stem: '偏印',
      hidden: ['偏官', '偏印', '偏財'],
    });
  });
});
