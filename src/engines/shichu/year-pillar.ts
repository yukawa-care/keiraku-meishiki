/**
 * 年柱算出（四柱推命・子平派）
 *
 * 四柱推命の年の境目は元日でも旧正月でもなく「立春」。
 * 立春の瞬間より前に生まれた者は前年の年柱を負う。
 * 立春時刻は astronomy-engine（定気法・国立天文台突合済み）で求める。
 *
 * 【タイムゾーン規律】date は「絶対時刻（瞬間）」として扱う。
 *   JST 壁時計から作るときは solar-term-calculator の jstWallToInstant を
 *   使うこと。判定は絶対時刻（getTime）比較のみで行う。
 */

import { STEMS, BRANCHES } from '../shared/types';
import type { Pillar } from '../shared/types';
import { getSolarTermDateTime, toJstParts } from '../shared/solar-term-calculator';

/**
 * 典拠：四柱推命の五虎遁／立春境界は astronomy-engine、国立天文台2026年5月16日突合済み
 *
 * 出生の絶対時刻が属する四柱推命上の「年」を返す（立春境界）。
 *
 * 立春は通常 2 月初旬。出生が当年の立春より前なら前年扱い。
 * 1 月生まれは必ず前年、12 月生まれは必ず当年に落ちる。
 *
 * @param date 出生の絶対時刻（Date＝瞬間値）
 * @returns    四柱推命上の年（西暦）
 */
export function getSajuYear(date: Date): number {
  const t = date.getTime();
  if (Number.isNaN(t)) {
    throw new Error('date が不正な Date');
  }
  // JST 暦上の年を起点に、その年の立春の瞬間と比較する。
  const jstYear = toJstParts(date).year;
  const risshun = getSolarTermDateTime(jstYear, '立春').getTime();
  return t >= risshun ? jstYear : jstYear - 1;
}

/**
 * 典拠：四柱推命の五虎遁／立春境界は astronomy-engine、国立天文台2026年5月16日突合済み
 *
 * 年柱を算出する。
 *
 * 年干支は「(四柱年 − 4) mod 60」。十干 =(年−4) mod 10、
 * 十二支 =(年−4) mod 12。基準：西暦 4 年 = 甲子。
 * 例：1965 年（立春後）→ (1961) → 乙巳。
 *
 * @param date 出生の絶対時刻（Date＝瞬間値）
 * @returns    年柱 Pillar
 */
export function getYearPillar(date: Date): Pillar {
  const sajuYear = getSajuYear(date);
  const stemIdx = (((sajuYear - 4) % STEMS.length) + STEMS.length) % STEMS.length;
  const branchIdx =
    (((sajuYear - 4) % BRANCHES.length) + BRANCHES.length) % BRANCHES.length;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}
