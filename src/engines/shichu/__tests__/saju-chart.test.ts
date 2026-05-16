/**
 * 四柱統合テスト ― 湯川先生キーケースの回帰ガード
 *
 * 全エンジンを束ねた getSajuChart が、外部突合済みの 4 柱
 * （乙巳 / 戊寅 / 甲辰 / 壬申）を返すことを固定する。
 */
import { describe, it, expect } from 'vitest';
import type { BirthInfo } from '../../shared/types';
import { jstWallToInstant } from '../../shared/solar-term-calculator';
import { getSajuChart, getSajuChartFromBirth } from '../saju-chart';

const YUKAWA: BirthInfo = {
  year: 1965,
  month: 2,
  day: 19,
  hour: 15,
  minute: 57,
  longitude: 141.35, // 札幌
  latitude: 43.06,
  gender: 'male',
};

describe('getSajuChart 湯川先生キーケース（4柱外部突合済み）', () => {
  it('1965-02-19 15:57 JST・札幌 → 乙巳 / 戊寅 / 甲辰 / 壬申', () => {
    const c = getSajuChartFromBirth(YUKAWA);
    expect(`${c.year.stem}${c.year.branch}`).toBe('乙巳');
    expect(`${c.month.stem}${c.month.branch}`).toBe('戊寅');
    expect(`${c.day.stem}${c.day.branch}`).toBe('甲辰');
    expect(`${c.hour?.stem}${c.hour?.branch}`).toBe('壬申');
  });

  it('instant 直接指定でも同一（BirthInfo ラッパーと一致）', () => {
    const c = getSajuChart(jstWallToInstant(1965, 2, 19, 15, 57), 141.35);
    expect(c).toEqual(getSajuChartFromBirth(YUKAWA));
  });

  it('経度未指定（明石135）でも 15:57 は申のため時柱は壬申のまま', () => {
    const c = getSajuChart(jstWallToInstant(1965, 2, 19, 15, 57));
    expect(`${c.hour?.stem}${c.hour?.branch}`).toBe('壬申');
  });
});
