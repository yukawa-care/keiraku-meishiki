/**
 * 四柱統合（年柱・月柱・日柱・時柱を 1 つの命式に束ねる）
 *
 * 各柱エンジン（決定論・Layer 1）を組み合わせるだけの薄い統合層。
 * ここに占術的判断や LLM は一切入れない。
 *
 * 【日柱と早子説】
 *   日柱は JST 暦日で引く。早子説（23:00〜24:00 は当日）では日柱は
 *   23 時で繰り上がらず深夜 0 時で替わるため、JST 暦日 = 日柱の日で
 *   そのまま正しい（kanshi.getDayPillar に JST 暦日を渡す）。
 *
 * 【経度補正の適用範囲】
 *   出生の「絶対時刻」は経度では変わらない。年・月・日柱は節気/暦日の
 *   絶対時刻比較で決まるため経度補正不要。経度補正は時支（地方時）を
 *   出すためのもので、時柱エンジン内部でのみ適用する。
 */

import type { BirthInfo, Pillar } from '../shared/types';
import { getDayPillar } from '../shared/kanshi';
import {
  jstWallToInstant,
  toJstParts,
} from '../shared/solar-term-calculator';
import { JST_BASE_LONGITUDE_DEG } from '../shared/longitude-correction';
import type { SajuChart } from './types';
import { getYearPillar } from './year-pillar';
import { getMonthPillar } from './month-pillar';
import { getHourPillar } from './hour-pillar';

/**
 * 典拠：四柱推命の五虎遁・五鼠遁／節気は astronomy-engine・国立天文台2026年5月16日突合済み
 *
 * 出生の絶対時刻と出生地経度から四柱を算出する。
 *
 * @param instant   出生の絶対時刻（jstWallToInstant 等で生成した瞬間値）
 * @param longitude 出生地の経度（東経・度）。省略時 135（明石）
 * @returns         四柱（年・月・日・時）
 */
export function getSajuChart(instant: Date, longitude?: number): SajuChart {
  if (Number.isNaN(instant.getTime())) {
    throw new Error('instant が不正な Date');
  }
  const year = getYearPillar(instant);
  const month = getMonthPillar(instant);

  // 早子説：JST 暦日をそのまま日柱の日とする（23 時で繰り上げない）。
  const { year: jY, month: jM, day: jD } = toJstParts(instant);
  const day: Pillar = getDayPillar(new Date(jY, jM - 1, jD));

  const hour = getHourPillar(
    instant,
    day.stem,
    longitude ?? JST_BASE_LONGITUDE_DEG,
  );

  return { year, month, day, hour };
}

/**
 * 典拠：四柱推命の五虎遁・五鼠遁／節気は astronomy-engine・国立天文台2026年5月16日突合済み
 *
 * BirthInfo（出生地時計時刻 = JST 壁時計）から四柱を算出する。
 *
 * @param birth 出生情報
 * @returns     四柱（年・月・日・時）
 */
export function getSajuChartFromBirth(birth: BirthInfo): SajuChart {
  const instant = jstWallToInstant(
    birth.year,
    birth.month,
    birth.day,
    birth.hour,
    birth.minute,
  );
  return getSajuChart(instant, birth.longitude);
}
