/**
 * 時柱エンジン テスト（五鼠遁 ＋ 経度補正 ＋ 子刻早子説）
 *
 * 湯川先生キーケース（外部突合済み 壬申）、経度補正の有無、子刻境界、
 * 時刻境界、五鼠遁 10日干×12時支=120 パターンの自己整合を検証。
 *
 * 信頼すべきでない情報源の記録（2026年5月16日）:
 *   湯川先生 1965-02-19 15:57 札幌 の四柱を「庚子・戊申」等と誤算定する
 *   占いサイトが存在した。正は 年乙巳/月戊寅/日甲辰/時壬申（複数の信頼
 *   サイトで一致）。誤情報源は信頼基準にしない（国立天文台/複数突合のみ）。
 */
import { describe, it, expect } from 'vitest';
import { STEMS } from '../../shared/types';
import { getKanshiIndex } from '../../shared/kanshi';
import { jstWallToInstant } from '../../shared/solar-term-calculator';
import { getHourPillar, getHourStemBranch } from '../hour-pillar';

describe('getHourPillar 湯川先生キーケース', () => {
  it('1965-02-19 15:57 JST・札幌(東経141.35)・日干甲 → 壬申（外部突合済み）', () => {
    const birth = jstWallToInstant(1965, 2, 19, 15, 57);
    const p = getHourPillar(birth, '甲', 141.35);
    expect(p.stem).toBe('壬');
    expect(p.branch).toBe('申');
  });

  it('経度補正なし（明石135＝既定）でも 15:57 は申の刻 → 壬申', () => {
    const birth = jstWallToInstant(1965, 2, 19, 15, 57);
    expect(getHourPillar(birth, '甲')).toEqual({ stem: '壬', branch: '申' });
    expect(getHourPillar(birth, '甲', 135)).toEqual({ stem: '壬', branch: '申' });
  });

  it('札幌補正は約 +25 分（15:57→約16:22）でも申の刻のまま', () => {
    // 申の刻 15:00-17:00。15:57 も 16:22 も申内＝結果不変。
    const birth = jstWallToInstant(1965, 2, 19, 15, 57);
    expect(getHourPillar(birth, '甲', 141.35).branch).toBe('申');
  });
});

describe('経度補正が時支を跨がせる境界例', () => {
  it('明石 16:55 は申、札幌(+25分)補正で 17:20 → 酉に変わる', () => {
    const t = jstWallToInstant(2000, 6, 1, 16, 55);
    expect(getHourPillar(t, '甲', 135).branch).toBe('申');
    expect(getHourPillar(t, '甲', 141.35).branch).toBe('酉');
  });
});

describe('子刻境界（早子説：23:00 始まり・当日扱い）', () => {
  it('23:30 と 00:30 は同じ「子」の刻。同一日干なら時柱も同一', () => {
    // 早子説：23-24時は当日。よって呼び出し側は同じ日干を渡す前提。
    const night = jstWallToInstant(1965, 2, 19, 23, 30);
    const dawn = jstWallToInstant(1965, 2, 19, 0, 30);
    const a = getHourPillar(night, '甲');
    const b = getHourPillar(dawn, '甲');
    expect(a.branch).toBe('子');
    expect(b.branch).toBe('子');
    expect(a).toEqual(b);
  });

  it('22:59 は亥、23:00 ちょうどから子（早子説の境界）', () => {
    expect(getHourPillar(jstWallToInstant(2000, 6, 1, 22, 59), '甲').branch).toBe('亥');
    expect(getHourPillar(jstWallToInstant(2000, 6, 1, 23, 0), '甲').branch).toBe('子');
  });
});

describe('時刻境界で時支が変わる', () => {
  it('寅の刻の境目 03:00：02:59 は丑、03:00 から寅', () => {
    expect(getHourPillar(jstWallToInstant(2000, 6, 1, 2, 59), '甲').branch).toBe('丑');
    expect(getHourPillar(jstWallToInstant(2000, 6, 1, 3, 0), '甲').branch).toBe('寅');
  });

  it('全 12 区分の代表時刻が正しい時支になる', () => {
    const expected: [number, string][] = [
      [23, '子'], [0, '子'], [1, '丑'], [3, '寅'], [5, '卯'], [7, '辰'],
      [9, '巳'], [11, '午'], [13, '未'], [15, '申'], [17, '酉'], [19, '戌'], [21, '亥'],
    ];
    for (const [h, branch] of expected) {
      expect(getHourPillar(jstWallToInstant(2000, 6, 1, h, 30), '甲').branch).toBe(branch);
    }
  });
});

describe('五鼠遁 10日干 × 12時支 = 120 パターン自己整合', () => {
  it('全パターンが成立干支（偶奇一致）、子刻起が五鼠遁表どおり', () => {
    // 日干 → 子刻の時干（五鼠遁）
    const RAT: Record<string, string> = {
      甲: '甲', 己: '甲',
      乙: '丙', 庚: '丙',
      丙: '戊', 辛: '戊',
      丁: '庚', 壬: '庚',
      戊: '壬', 癸: '壬',
    };
    for (const dayStem of STEMS) {
      for (let h = 0; h < 12; h += 1) {
        const p = getHourStemBranch(dayStem, h);
        expect(() => getKanshiIndex(p.stem, p.branch)).not.toThrow();
      }
      const zi = getHourStemBranch(dayStem, 0);
      expect(zi.stem).toBe(RAT[dayStem]);
      expect(zi.branch).toBe('子');
    }
  });

  it('刻が進むと干支が六十干支上で 1 つずつ進む', () => {
    for (const dayStem of STEMS) {
      for (let h = 1; h < 12; h += 1) {
        const prev = getHourStemBranch(dayStem, h - 1);
        const cur = getHourStemBranch(dayStem, h);
        expect(getKanshiIndex(cur.stem, cur.branch)).toBe(
          (getKanshiIndex(prev.stem, prev.branch) + 1) % 60,
        );
      }
    }
  });

  it('範囲外・不正入力は例外（計算層は沈黙させない）', () => {
    expect(() => getHourStemBranch('甲', -1)).toThrow();
    expect(() => getHourStemBranch('甲', 12)).toThrow();
    // @ts-expect-error 不正な日干
    expect(() => getHourStemBranch('Z', 0)).toThrow();
    expect(() => getHourPillar(jstWallToInstant(2000, 1, 1, 12, 0), '甲', NaN)).toThrow();
    expect(() => getHourPillar(jstWallToInstant(2000, 1, 1, 12, 0), 'X')).toThrow();
  });
});
