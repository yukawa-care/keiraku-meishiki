/**
 * 年柱エンジン テスト（立春境界）
 *
 * 立春の瞬間（astronomy-engine・国立天文台突合済み）を境に年柱が
 * 切り替わることを、湯川先生キーケースと立春前後ケースで検証する。
 */
import { describe, it, expect } from 'vitest';
import { jstWallToInstant, getSolarTermDateTime } from '../../shared/solar-term-calculator';
import { getYearPillar, getSajuYear } from '../year-pillar';

describe('getYearPillar 湯川先生キーケース', () => {
  it('1965-02-19 15:57 JST（立春後）→ 乙巳（外部突合済み）', () => {
    const p = getYearPillar(jstWallToInstant(1965, 2, 19, 15, 57));
    expect(p.stem).toBe('乙');
    expect(p.branch).toBe('巳');
    expect(getSajuYear(jstWallToInstant(1965, 2, 19, 15, 57))).toBe(1965);
  });
});

describe('getYearPillar 立春境界', () => {
  // 立春2000 = 2000-02-04 21:40:18 JST（国立天文台一致確認済み）
  it('立春直前 2000-02-04 20:00 JST → 前年1999扱い → 己卯', () => {
    const p = getYearPillar(jstWallToInstant(2000, 2, 4, 20, 0));
    expect(getSajuYear(jstWallToInstant(2000, 2, 4, 20, 0))).toBe(1999);
    expect(p.stem).toBe('己');
    expect(p.branch).toBe('卯');
  });

  it('立春直後 2000-02-04 22:00 JST → 当年2000扱い → 庚辰', () => {
    const p = getYearPillar(jstWallToInstant(2000, 2, 4, 22, 0));
    expect(getSajuYear(jstWallToInstant(2000, 2, 4, 22, 0))).toBe(2000);
    expect(p.stem).toBe('庚');
    expect(p.branch).toBe('辰');
  });

  it('立春の瞬間ちょうどは「立春に入った」＝当年（境界包含）', () => {
    const risshun2000 = getSolarTermDateTime(2000, '立春');
    expect(getSajuYear(risshun2000)).toBe(2000);
  });

  it('1月生まれは必ず前年： 1965-01-10 JST → 1964 → 甲辰', () => {
    const p = getYearPillar(jstWallToInstant(1965, 1, 10, 12, 0));
    expect(getSajuYear(jstWallToInstant(1965, 1, 10, 12, 0))).toBe(1964);
    expect(p.stem).toBe('甲');
    expect(p.branch).toBe('辰');
  });

  it('12月生まれは必ず当年： 2000-12-31 23:00 JST → 2000 → 庚辰', () => {
    const p = getYearPillar(jstWallToInstant(2000, 12, 31, 23, 0));
    expect(getSajuYear(jstWallToInstant(2000, 12, 31, 23, 0))).toBe(2000);
    expect(p.stem).toBe('庚');
    expect(p.branch).toBe('辰');
  });
});

describe('getYearPillar 60干支整合', () => {
  it('60 年で年柱が一巡する', () => {
    const base = jstWallToInstant(1924, 6, 1, 12, 0); // 立春後・甲子
    const a = getYearPillar(base);
    const b = getYearPillar(jstWallToInstant(1984, 6, 1, 12, 0)); // +60年
    expect(a).toEqual(b);
    expect(a.stem).toBe('甲');
    expect(a.branch).toBe('子');
  });
});
