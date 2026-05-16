/**
 * 二十四節気計算 本実装テスト
 *
 * 検証方針（_spike_solar-term.test.ts で確立した規律を踏襲）:
 *   - 国立天文台と一致するキーケースを最低 5 件アサート。
 *   - ただし「多数の公式時刻を手入力で転記する」と転記ミスで偽の検証に
 *     なる（過去の教訓）。そこで春分・夏至・秋分・冬至は astronomy-engine
 *     の独立ルーチン Seasons() と突合する。Seasons の 2000 年春分は
 *     国立天文台公表値と分一致をスパイクで確認済みのため、これは実質
 *     「国立天文台との一致」を転記ミス無しで担保する。
 *   - 立春は スパイクで国立天文台 暦象年表/暦Wiki と二重確認した
 *     公式 JST 値（1965=09:46 / 2000=21:40 / 2026=05:02）を直接アサート。
 */
import { describe, it, expect } from 'vitest';
import { SearchSunLongitude, SunPosition, Seasons } from 'astronomy-engine';
import { SOLAR_TERMS } from '../types';
import type { SolarTerm } from '../types';
import {
  getSolarTermDateTime,
  getMonthBoundaries,
  findEnclosingSetsu,
  toJstParts,
  formatJstString,
  jstWallToInstant,
} from '../solar-term-calculator';

/** 0/360 境界を跨いだ角度差（度, 0〜180）。 */
function angularDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

const YEARS = [1965, 2000, 2026] as const;

describe('24節気網羅（1965 / 2000 / 2026 の全 24 節気）', () => {
  it('全節気の算出時刻で太陽視黄経が基準角に収束する（誤差 < 1e-3°）', () => {
    for (const year of YEARS) {
      for (const t of SOLAR_TERMS) {
        const instant = getSolarTermDateTime(year, t.name);
        const elon = SunPosition(instant).elon;
        expect(angularDiff(elon, t.longitude)).toBeLessThan(1e-3);
      }
    }
  });

  it('各年 24 節気はすべて算出でき、暦年内（前後の常識的範囲）に収まる', () => {
    for (const year of YEARS) {
      for (const t of SOLAR_TERMS) {
        const j = toJstParts(getSolarTermDateTime(year, t.name));
        // 立春(315)〜大寒(300) はいずれも当該暦年内に出現する
        expect(j.year).toBe(year);
        expect(j.month).toBeGreaterThanOrEqual(1);
        expect(j.month).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe('国立天文台と一致するキーケース（最低 5 件）', () => {
  /** スパイクで国立天文台 暦象年表/暦Wiki と二重確認済みの立春 JST。 */
  const RISSHUN_NAOJ_JST: Record<number, { h: number; m: number }> = {
    1965: { h: 9, m: 46 },
    2000: { h: 21, m: 40 },
    2026: { h: 5, m: 2 },
  };

  it('[1-3] 立春 1965/2000/2026 が国立天文台公式 JST と ±60 秒一致', () => {
    for (const year of YEARS) {
      const j = toJstParts(getSolarTermDateTime(year, '立春'));
      const ref = RISSHUN_NAOJ_JST[year];
      const deltaSec = Math.abs(
        j.hour * 3600 + j.minute * 60 + j.second - (ref.h * 3600 + ref.m * 60),
      );
      expect(j.month).toBe(2);
      expect(deltaSec).toBeLessThan(60);
    }
  });

  it('[4] 2000年 春分 = 2000-03-20 16:35 JST（公表値）に ±120 秒一致', () => {
    // 2000 春分: 国立天文台/精密暦表 2000-03-20 07:35 UT = 16:35 JST。
    const j = toJstParts(getSolarTermDateTime(2000, '春分'));
    expect(j.year).toBe(2000);
    expect(j.month).toBe(3);
    expect(j.day).toBe(20);
    const deltaSec = Math.abs(j.hour * 3600 + j.minute * 60 + j.second - (16 * 3600 + 35 * 60));
    expect(deltaSec).toBeLessThan(120);
  });

  it('[5] 2021年 立春 は 2月3日 JST（124年ぶりの2/3立春・国内広報の公知事実）', () => {
    const j = toJstParts(getSolarTermDateTime(2021, '立春'));
    expect(j.month).toBe(2);
    expect(j.day).toBe(3);
  });

  it('[6+] 春分/夏至/秋分/冬至が独立ルーチン Seasons() と ±2 秒一致（転記ミス排除の交差検証）', () => {
    // Seasons() は SearchSunLongitude とは別実装の春分点/至点ルーチン。
    // 一致すれば、国立天文台一致をスパイクで確認した Seasons と等価＝
    // 本実装も国立天文台と一致、と転記ミス無しに担保できる。
    for (const year of YEARS) {
      const s = Seasons(year);
      const pairs: [SolarTerm, Date][] = [
        ['春分', s.mar_equinox.date],
        ['夏至', s.jun_solstice.date],
        ['秋分', s.sep_equinox.date],
        ['冬至', s.dec_solstice.date],
      ];
      for (const [term, seasonsDate] of pairs) {
        const mine = getSolarTermDateTime(year, term);
        expect(Math.abs(mine.getTime() - seasonsDate.getTime())).toBeLessThan(2000);
      }
    }
  });
});

describe('getMonthBoundaries（12「節」・中気を含まない）', () => {
  it('立春→啓蟄→…→小寒 の 12 節を月順で返す', () => {
    expect(getMonthBoundaries(2000)).toEqual([
      '立春', '啓蟄', '清明', '立夏', '芒種', '小暑',
      '立秋', '白露', '寒露', '立冬', '大雪', '小寒',
    ]);
  });

  it('中気（雨水・春分・穀雨・大寒 等）は 1 つも含まない', () => {
    const boundaries = new Set<string>(getMonthBoundaries(2026));
    for (const chuki of ['雨水', '春分', '穀雨', '夏至', '秋分', '冬至', '大寒']) {
      expect(boundaries.has(chuki)).toBe(false);
    }
    expect(boundaries.size).toBe(12);
  });
});

describe('境界判定 findEnclosingSetsu', () => {
  it('1965-02-19 15:57 JST の前後の節は「立春 → 啓蟄」', () => {
    const birth = jstWallToInstant(1965, 2, 19, 15, 57);
    const { current, next } = findEnclosingSetsu(birth);
    expect(current).toBe('立春'); // 寅月（四柱推命の第1月）
    expect(next).toBe('啓蟄');
  });

  it('暦年を跨ぐケース: 1965-01-03 JST は前年12月「大雪」→ 当年1月「小寒」', () => {
    const birth = jstWallToInstant(1965, 1, 3, 12, 0);
    const { current, next } = findEnclosingSetsu(birth);
    expect(current).toBe('大雪');
    expect(next).toBe('小寒');
  });

  it('節入りの瞬間ちょうどは「その節に入った」と判定（current 側）', () => {
    const risshun2000 = getSolarTermDateTime(2000, '立春');
    const { current } = findEnclosingSetsu(risshun2000);
    expect(current).toBe('立春');
  });
});

describe('TZ取り違え防止（UT/JST 混在ロジックが無いことの保証）', () => {
  it('getSolarTermDateTime の返りは astronomy-engine の生 UT 瞬間そのもの（オフセット未混入）', () => {
    // 別の開始日・短窓で独立に引いた生 UT と完全一致＝オフセット未混入。
    const raw = SearchSunLongitude(315, new Date(Date.UTC(2000, 0, 20)), 30);
    expect(raw).not.toBeNull();
    const mine = getSolarTermDateTime(2000, '立春');
    expect(mine.toISOString()).toBe(raw!.date.toISOString());
    // 返り瞬間の視黄経は確かに 315°（+9h 等を足していれば 315 から外れる）
    expect(angularDiff(SunPosition(mine).elon, 315)).toBeLessThan(1e-3);
  });

  it('toJstParts は +9h を 1 回だけ適用（手計算の +9h 分解と一致）', () => {
    const instant = getSolarTermDateTime(2000, '立春');
    const manual = new Date(instant.getTime() + 9 * 3600 * 1000);
    const j = toJstParts(instant);
    expect(j).toEqual({
      year: manual.getUTCFullYear(),
      month: manual.getUTCMonth() + 1,
      day: manual.getUTCDate(),
      hour: manual.getUTCHours(),
      minute: manual.getUTCMinutes(),
      second: manual.getUTCSeconds(),
    });
  });

  it('jstWallToInstant ⇄ toJstParts は完全往復（二重オフセットが起きない）', () => {
    const instant = jstWallToInstant(1965, 2, 19, 15, 57);
    expect(toJstParts(instant)).toEqual({
      year: 1965, month: 2, day: 19, hour: 15, minute: 57, second: 0,
    });
    // 絶対時刻は JST−9h の UTC（1965-02-19 06:57Z）
    expect(instant.toISOString()).toBe('1965-02-19T06:57:00.000Z');
  });

  it('formatJstString は JST 表記で末尾 " JST"、toJstParts と整合', () => {
    const s = formatJstString(getSolarTermDateTime(2026, '立春'));
    expect(s.endsWith(' JST')).toBe(true);
    expect(s).toBe('2026-02-04 05:01:54 JST');
  });
});
