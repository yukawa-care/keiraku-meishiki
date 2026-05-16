/**
 * 十二運（じゅうにうん）算出
 *
 * 日干（日主）が各地支で迎える「生～養」の 12 段階を決定論的に判定する。
 * 日干ごとに「長生」の地支が定まり、陽干は順行（子→丑→寅…）、
 * 陰干は逆行で 12 運が回る。
 *
 * 長生の地支（火土同根：戊は丙・己は丁と同根とする標準）:
 *   甲=亥 乙=午 丙=寅 丁=酉 戊=寅 己=酉 庚=巳 辛=子 壬=申 癸=卯
 * 陰陽：甲丙戊庚壬=陽（順行）／乙丁己辛癸=陰（逆行）。
 *
 * 地支 index（BRANCHES）: 子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11。
 *
 * 典拠：四柱推命の十二運／陰陽干別の回転規則／『四柱推命の本』小山内彰系。
 */

import { STEMS, BRANCHES } from '../shared/types';
import type { Stem, Branch } from '../shared/types';

/** 十二運 12 種（長生 → … → 養 の順） */
export type TwelveFortune =
  | '長生'
  | '沐浴'
  | '冠帯'
  | '建禄'
  | '帝旺'
  | '衰'
  | '病'
  | '死'
  | '墓'
  | '絶'
  | '胎'
  | '養';

const FORTUNE_ORDER: readonly TwelveFortune[] = [
  '長生', '沐浴', '冠帯', '建禄', '帝旺', '衰',
  '病', '死', '墓', '絶', '胎', '養',
];

/** 各日干の「長生」地支インデックス（BRANCHES 基準）。 */
const CHANGSHENG_BRANCH: Record<Stem, number> = {
  甲: 11, // 亥
  乙: 6, // 午
  丙: 2, // 寅
  丁: 9, // 酉
  戊: 2, // 寅（火土同根：丙と同じ）
  己: 9, // 酉（火土同根：丁と同じ）
  庚: 5, // 巳
  辛: 0, // 子
  壬: 8, // 申
  癸: 3, // 卯
};

/**
 * 典拠：四柱推命の十二運／陰陽干別の回転規則／『四柱推命の本』小山内彰系
 *
 * 日干と地支から十二運を返す。
 * 陽干は長生から順行、陰干は逆行。未知の干支は沈黙させず Error。
 *
 * @param dayStem 日柱の天干（日主）
 * @param branch  対象の地支
 * @returns       十二運
 */
export function getTwelveFortune(
  dayStem: string,
  branch: string,
): TwelveFortune {
  const stemIdx = STEMS.indexOf(dayStem as Stem);
  if (stemIdx < 0) {
    throw new Error(`不正な天干: ${dayStem}`);
  }
  const branchIdx = BRANCHES.indexOf(branch as Branch);
  if (branchIdx < 0) {
    throw new Error(`不正な十二支: ${branch}`);
  }

  const changSheng = CHANGSHENG_BRANCH[dayStem as Stem];
  const isYang = stemIdx % 2 === 0; // 甲丙戊庚壬 = 陽
  const offset = isYang
    ? (branchIdx - changSheng + 12) % 12 // 順行
    : (changSheng - branchIdx + 12) % 12; // 逆行
  return FORTUNE_ORDER[offset];
}
