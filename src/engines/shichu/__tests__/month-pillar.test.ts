/**
 * 月柱エンジン テスト（節入り境界 ＋ 五虎遁）
 *
 * 湯川先生キーケース（外部突合済み 戊寅）、節入り前後の月柱遷移、
 * 立春境界での年干切替、五虎遁 10干×12月=120 パターンの自己整合を検証。
 */
import { describe, it, expect } from 'vitest';
import { STEMS } from '../../shared/types';
import { getKanshiIndex } from '../../shared/kanshi';
import { jstWallToInstant, getSolarTermDateTime } from '../../shared/solar-term-calculator';
import { getMonthPillar, getMonthStemBranch } from '../month-pillar';
import { getYearPillar } from '../year-pillar';

describe('getMonthPillar 湯川先生キーケース', () => {
  it('1965-02-19 15:57 JST → 立春後・啓蟄前＝寅月、年干乙 → 戊寅（外部突合済み）', () => {
    const p = getMonthPillar(jstWallToInstant(1965, 2, 19, 15, 57));
    expect(p.stem).toBe('戊');
    expect(p.branch).toBe('寅');
  });
});

describe('getMonthPillar 節入り境界で月柱が変わる', () => {
  // 啓蟄1965 = 1965-03-06 04:00:37 JST。前後 1 分で寅月→卯月。
  const keichitsu1965 = getSolarTermDateTime(1965, '啓蟄');

  it('啓蟄直前は寅月（戊寅）', () => {
    const justBefore = new Date(keichitsu1965.getTime() - 60_000);
    const p = getMonthPillar(justBefore);
    expect(p.stem).toBe('戊');
    expect(p.branch).toBe('寅');
  });

  it('啓蟄直後は卯月（年干乙の五虎遁で 己卯）', () => {
    const justAfter = new Date(keichitsu1965.getTime() + 60_000);
    const p = getMonthPillar(justAfter);
    expect(p.stem).toBe('己');
    expect(p.branch).toBe('卯');
  });

  it('啓蟄の瞬間ちょうどは卯月に入った扱い（境界包含）', () => {
    const p = getMonthPillar(keichitsu1965);
    expect(p.branch).toBe('卯');
  });
});

describe('getMonthPillar 立春境界では年干が切り替わって五虎遁も変わる', () => {
  it('2000-02-04 20:00 JST（立春前）→ 前年1999己卯・丑月 → 丁丑', () => {
    const date = jstWallToInstant(2000, 2, 4, 20, 0);
    expect(getYearPillar(date).stem).toBe('己'); // 1999 己卯
    const p = getMonthPillar(date);
    // 己年の五虎遁：寅=丙 …（丙丁戊己庚辛壬癸甲乙丙丁）… 丑月=丁丑
    expect(p.stem).toBe('丁');
    expect(p.branch).toBe('丑');
  });

  it('2000-02-04 22:00 JST（立春後）→ 当年2000庚辰・寅月 → 戊寅', () => {
    const date = jstWallToInstant(2000, 2, 4, 22, 0);
    expect(getYearPillar(date).stem).toBe('庚'); // 2000 庚辰
    const p = getMonthPillar(date);
    expect(p.stem).toBe('戊'); // 乙庚年 → 戊寅起
    expect(p.branch).toBe('寅');
  });
});

describe('五虎遁 10干 × 12月 = 120 パターン自己整合', () => {
  it('全パターンが成立する干支（偶奇一致）であり、寅月起が五虎遁表どおり', () => {
    // 年干index → 寅月の月干index（五虎遁）
    const TIGER: Record<string, string> = {
      甲: '丙', 己: '丙',
      乙: '戊', 庚: '戊',
      丙: '庚', 辛: '庚',
      丁: '壬', 壬: '壬',
      戊: '甲', 癸: '甲',
    };
    for (const yearStem of STEMS) {
      for (let m = 0; m < 12; m += 1) {
        const p = getMonthStemBranch(yearStem, m);
        // 成立する干支のみ（不成立なら getKanshiIndex が throw）
        expect(() => getKanshiIndex(p.stem, p.branch)).not.toThrow();
      }
      // 寅月（offset 0）の月干が五虎遁表と一致
      expect(getMonthStemBranch(yearStem, 0).stem).toBe(TIGER[yearStem]);
      expect(getMonthStemBranch(yearStem, 0).branch).toBe('寅');
    }
  });

  it('同一年内で月が進むと干支が六十干支上で 1 つずつ進む', () => {
    for (const yearStem of STEMS) {
      for (let m = 1; m < 12; m += 1) {
        const prev = getMonthStemBranch(yearStem, m - 1);
        const cur = getMonthStemBranch(yearStem, m);
        expect(getKanshiIndex(cur.stem, cur.branch)).toBe(
          (getKanshiIndex(prev.stem, prev.branch) + 1) % 60,
        );
      }
    }
  });

  it('範囲外 monthOffset / 不正年干は例外（計算層は沈黙させない）', () => {
    expect(() => getMonthStemBranch('甲', -1)).toThrow();
    expect(() => getMonthStemBranch('甲', 12)).toThrow();
    // @ts-expect-error 不正な十干を意図的に渡す
    expect(() => getMonthStemBranch('X', 0)).toThrow();
  });
});

describe('代表年の3柱算出（外部突合の参考記録）', () => {
  it('1965 / 2000 / 2026 の代表出生で年柱・月柱を出力', () => {
    // 外部突合の足がかり。日柱は kanshi エンジン管轄のため別途。
    const cases: [string, Date][] = [
      ['湯川 1965-02-19 15:57 JST', jstWallToInstant(1965, 2, 19, 15, 57)],
      ['2000-02-04 22:00 JST(立春後)', jstWallToInstant(2000, 2, 4, 22, 0)],
      ['2026-02-19 12:00 JST', jstWallToInstant(2026, 2, 19, 12, 0)],
    ];
    for (const [label, d] of cases) {
      const y = getYearPillar(d);
      const m = getMonthPillar(d);
      console.log(`  ${label}  年柱=${y.stem}${y.branch}  月柱=${m.stem}${m.branch}`);
    }
    // 既知の確定値（湯川）を回帰ガードとして固定
    const y = getYearPillar(cases[0][1]);
    const m = getMonthPillar(cases[0][1]);
    expect(`${y.stem}${y.branch}`).toBe('乙巳');
    expect(`${m.stem}${m.branch}`).toBe('戊寅');
  });
});
