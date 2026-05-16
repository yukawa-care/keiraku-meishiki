/**
 * 時柱算出（四柱推命・子平派）
 *
 * 時支は 1 日を 12 等分した「時刻」で決まり、時干は日干から
 * 「五鼠遁（ごねずとん）」で導く。出生地経度による地方時補正を行う。
 *
 * 五鼠遁（日干 → 子刻の時干）:
 *   甲・己日 → 甲子起 / 乙・庚日 → 丙子起 / 丙・辛日 → 戊子起 /
 *   丁・壬日 → 庚子起 / 戊・癸日 → 壬子起
 *   ⇒ 子刻の時干index = (日干index × 2) mod 10
 *   以降の刻は子刻から十干・十二支を 1 つずつ進める。
 *
 * 【子刻境界の流派 ― 本プロダクトの採用】
 *   早子説を採用する（2026年5月16日 湯川先生決定）。
 *   ・子刻 = 23:00〜01:00。23:00 を子刻の始まりとする。
 *   ・23:00〜24:00 の子刻は「当日」に属する（翌日に繰り上げない）。
 *   ＝ 日柱（日干）は 23:00 では繰り上がらず、深夜 0 時で日が替わる。
 *   本関数は日干を引数で受け取るため、23:00〜24:00 を当日扱いにする
 *   責務は呼び出し側（日柱エンジン）にある。本関数は早子説の時支
 *   区分（23:00 始まり）のみを担う。
 *
 * 【タイムゾーン規律】date は絶対時刻（瞬間）。JST 壁時計から作るときは
 *   solar-term-calculator の jstWallToInstant を使うこと。
 */

import { STEMS, BRANCHES } from '../shared/types';
import type { Pillar, Stem } from '../shared/types';
import {
  applyLongitudeCorrection,
  JST_BASE_LONGITUDE_DEG,
} from '../shared/longitude-correction';
import { toJstParts } from '../shared/solar-term-calculator';

/**
 * 典拠：五鼠遁／経度補正は longitude-correction.ts ／子刻早子説採用（2026年5月16日 湯川先生決定）
 *
 * 補正後の「時」(0〜23) から時支インデックス（子=0 … 亥=11）を求める。
 *
 * 早子説の区分：
 *   子 23-01 / 丑 01-03 / 寅 03-05 / 卯 05-07 / 辰 07-09 / 巳 09-11 /
 *   午 11-13 / 未 13-15 / 申 15-17 / 酉 17-19 / 戌 19-21 / 亥 21-23
 * 境界は各 2 時間ブロックの開始時（奇数時／23 時）。
 *
 * @param hour24 補正後の時（0〜23）
 * @returns      時支インデックス 0〜11（BRANCHES と同順：子=0 … 亥=11）
 */
function hourBranchIndex(hour24: number): number {
  // 23時を子(=0)に寄せるため +1 してから 2 時間で割る。
  return Math.floor(((hour24 + 1) % 24) / 2);
}

/**
 * 典拠：五鼠遁／経度補正は longitude-correction.ts ／子刻早子説採用（2026年5月16日 湯川先生決定）
 *
 * 日干と時支インデックス（子=0 … 亥=11）から時柱の干支を導く純関数。
 * 五鼠遁テーブルを式で表現（10 日干 × 12 時支 を網羅）。
 *
 * @param dayStem        日柱の天干
 * @param hourBranchIdx  時支インデックス 0〜11
 * @returns              時柱 Pillar
 */
export function getHourStemBranch(
  dayStem: Stem,
  hourBranchIdx: number,
): Pillar {
  if (
    !Number.isInteger(hourBranchIdx) ||
    hourBranchIdx < 0 ||
    hourBranchIdx > 11
  ) {
    throw new Error(`hourBranchIdx は 0〜11: ${hourBranchIdx}`);
  }
  const dayStemIdx = STEMS.indexOf(dayStem);
  if (dayStemIdx < 0) {
    throw new Error(`不正な日干: ${dayStem}`);
  }
  // 五鼠遁：子刻（index 0）の時干 = (日干index × 2) mod 10
  const ziStemIdx = (dayStemIdx * 2) % STEMS.length;
  const stemIdx = (ziStemIdx + hourBranchIdx) % STEMS.length;
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[hourBranchIdx],
  };
}

/**
 * 典拠：五鼠遁／経度補正は longitude-correction.ts ／子刻早子説採用（2026年5月16日 湯川先生決定）
 *
 * 時柱を算出する。
 *
 * 1. 出生地経度で地方時に補正（既定は東経 135 度＝明石＝補正なし）。
 * 2. 補正後の時刻から時支（早子説：23:00 始まりの 12 区分）を決める。
 * 3. 日干から五鼠遁で時干を決める。
 * 例：1965-02-19 15:57 JST・札幌(東経141.35) → +約25分 → 16:22 →
 *     申の刻、日干「甲」→ 五鼠遁 → 壬申。
 *
 * @param date      出生の絶対時刻（Date＝瞬間値。jstWallToInstant 推奨）
 * @param dayStem   日柱の天干（早子説のため 23-24 時は当日の日干を渡す）
 * @param longitude 出生地の経度（東経・度）。省略時 135（明石＝補正なし）
 * @returns         時柱 Pillar
 */
export function getHourPillar(
  date: Date,
  dayStem: string,
  longitude?: number,
): Pillar {
  if (Number.isNaN(date.getTime())) {
    throw new Error('date が不正な Date');
  }
  if (STEMS.indexOf(dayStem as Stem) < 0) {
    throw new Error(`不正な日干: ${dayStem}`);
  }
  const lon = longitude ?? JST_BASE_LONGITUDE_DEG;
  if (!Number.isFinite(lon)) {
    throw new Error(`longitude は有限数: ${longitude}`);
  }

  const corrected = applyLongitudeCorrection(date, lon);
  const { hour } = toJstParts(corrected);
  return getHourStemBranch(dayStem as Stem, hourBranchIndex(hour));
}
