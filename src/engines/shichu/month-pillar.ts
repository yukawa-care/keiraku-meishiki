/**
 * 月柱算出（四柱推命・子平派）
 *
 * 月は暦月ではなく「節入り」（24節気のうち 12 の「節」）で区切る。
 * 月支は出生を挟む節で決まり、月干は年干から「五虎遁（ごこじゅん）」で導く。
 *
 * 五虎遁（年干 → 寅月の月干）:
 *   甲・己年 → 丙寅起 / 乙・庚年 → 戊寅起 / 丙・辛年 → 庚寅起 /
 *   丁・壬年 → 壬寅起 / 戊・癸年 → 甲寅起
 *   ⇒ 寅月の月干index = (年干index × 2 + 2) mod 10
 *   以降の月は寅月から十干・十二支を 1 つずつ進める。
 *
 * 年干は立春境界の年柱（getYearPillar）に従う。1 月生まれ等で
 * 前年扱いになる場合も、その前年の年干で五虎遁を引く（自動的に整合）。
 */

import { STEMS } from '../shared/types';
import type { Pillar, Stem } from '../shared/types';
import { findEnclosingSetsu, getMonthBoundaries } from '../shared/solar-term-calculator';
import { MONTH_BRANCH_SEQUENCE } from './types';
import { getYearPillar } from './year-pillar';

/** 月柱境界 12「節」の月順 [立春,啓蟄,…,小寒]（年に依らず一定）。 */
const SETSU_ORDER = getMonthBoundaries(2000);

/**
 * 典拠：四柱推命の五虎遁／立春境界は astronomy-engine、国立天文台2026年5月16日突合済み
 *
 * 年干と月オフセット（寅=0 … 丑=11）から月柱の干支を導く純関数。
 * 五虎遁テーブルを式で表現（10干 × 12月 を網羅）。
 *
 * @param yearStem    年柱の天干
 * @param monthOffset 寅月からのオフセット 0〜11
 * @returns           月柱 Pillar
 */
export function getMonthStemBranch(yearStem: Stem, monthOffset: number): Pillar {
  if (!Number.isInteger(monthOffset) || monthOffset < 0 || monthOffset > 11) {
    throw new Error(`monthOffset は 0〜11: ${monthOffset}`);
  }
  const yearStemIdx = STEMS.indexOf(yearStem);
  if (yearStemIdx < 0) {
    throw new Error(`不正な年干: ${yearStem}`);
  }
  // 五虎遁：寅月（offset 0）の月干
  const tigerStemIdx = (yearStemIdx * 2 + 2) % STEMS.length;
  const stemIdx = (tigerStemIdx + monthOffset) % STEMS.length;
  return {
    stem: STEMS[stemIdx],
    branch: MONTH_BRANCH_SEQUENCE[monthOffset],
  };
}

/**
 * 典拠：四柱推命の五虎遁／立春境界は astronomy-engine、国立天文台2026年5月16日突合済み
 *
 * 月柱を算出する。
 *
 * 1. findEnclosingSetsu で出生を挟む「節」を求める（中気は使わない）。
 * 2. その節の月順位置（寅=0 … 丑=11）が月支を決める。
 * 3. 年柱（立春境界）の年干から五虎遁で月干を決める。
 * 例：1965-02-19 15:57 JST → 立春後・啓蟄前＝寅月、年干 乙 → 戊寅。
 *
 * @param date 出生の絶対時刻（Date＝瞬間値。jstWallToInstant 推奨）
 * @returns    月柱 Pillar
 */
export function getMonthPillar(date: Date): Pillar {
  const { current } = findEnclosingSetsu(date);
  const monthOffset = SETSU_ORDER.indexOf(current);
  if (monthOffset < 0) {
    // findEnclosingSetsu は必ず「節」を返す設計だが、計算層では沈黙させない。
    throw new Error(`月柱境界の節ではない: ${String(current)}`);
  }
  const yearStem = getYearPillar(date).stem;
  return getMonthStemBranch(yearStem, monthOffset);
}
