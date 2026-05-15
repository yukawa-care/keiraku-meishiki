/**
 * 干支（六十干支）算出
 *
 * 十干（10）と十二支（12）の最小公倍数 60 で循環する干支の通し番号と、
 * 日柱の算出を提供する。完全に決定論（同一入力 → 同一出力）。
 */

import { STEMS, BRANCHES } from './types';
import type { Pillar, Stem, Branch } from './types';

/** 六十干支の周期 */
const SEXAGENARY_CYCLE = 60;

/** 1 日のミリ秒数 */
const MS_PER_DAY = 86_400_000;

/**
 * 起点：1900 年 1 月 1 日 = 「甲戌」。
 *
 * 六十干支の通し番号は index → { stem: STEMS[index % 10], branch: BRANCHES[index % 12] }。
 * 甲 = STEMS[0]、戌 = BRANCHES[10] なので index 10 が「甲戌」。
 *
 * 検証（典拠：四柱推命の万年暦 / 標準天文式）:
 *   - 1900-01-01 のユリウス通日 JDN = 2415021
 *   - 標準式 天干 =(JDN+9)%10 → (2415021+9)%10 = 0 → 甲
 *           地支 =(JDN+1)%12 → (2415021+1)%12 = 10 → 戌
 *   よって本起点は実暦と一致する。
 */
const EPOCH_KANSHI_INDEX = 10;

/** 起点日（1900-01-01）の UTC ミリ秒。日数差の基準。 */
const EPOCH_UTC_MS = Date.UTC(1900, 0, 1);

/**
 * 典拠：四柱推命の万年暦
 *
 * 十干名と十二支名から六十干支の通し番号（0〜59）を返す。
 * 干支は十干・十二支の偶奇が一致する 60 通りのみが有効。
 * 不正な組み合わせ・未知の文字は Error を投げる（計算層では沈黙させない）。
 *
 * @param stem   十干（例: '甲'）
 * @param branch 十二支（例: '戌'）
 * @returns      六十干支インデックス 0〜59
 */
export function getKanshiIndex(stem: string, branch: string): number {
  const stemIdx = STEMS.indexOf(stem as Stem);
  const branchIdx = BRANCHES.indexOf(branch as Branch);
  if (stemIdx < 0) {
    throw new Error(`不正な十干: ${stem}`);
  }
  if (branchIdx < 0) {
    throw new Error(`不正な十二支: ${branch}`);
  }
  // 中国剰余定理: index ≡ stemIdx (mod 10) かつ index ≡ branchIdx (mod 12)
  for (let index = 0; index < SEXAGENARY_CYCLE; index += 1) {
    if (index % STEMS.length === stemIdx && index % BRANCHES.length === branchIdx) {
      return index;
    }
  }
  throw new Error(`成立しない干支の組み合わせ: ${stem}${branch}`);
}

/**
 * 典拠：四柱推命の万年暦
 *
 * 暦日（西暦の年月日）から日柱を算出する。
 *
 * 起点 1900-01-01 =「甲戌」(index ${EPOCH_KANSHI_INDEX}) からの経過日数で
 * 六十干支を進める。タイムゾーン・夏時間の影響を排除するため、
 * date のローカル年月日を取り出して UTC 0 時で日数差を計算する。
 *
 * 注: 子刻（23 時）以降を翌日とする日付変更線の扱いは節入り計算ステップで
 *     導入する。本関数は暦日ベース（0〜23 時を同日）で算出する。
 *
 * @param date 暦日を含む Date（経度補正済みの時刻を渡すこと）
 * @returns    日柱 Pillar
 */
export function getDayPillar(date: Date): Pillar {
  const dateUtcMs = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daysSinceEpoch = Math.round((dateUtcMs - EPOCH_UTC_MS) / MS_PER_DAY);
  // JS の % は負になり得るため正規化
  const index =
    (((EPOCH_KANSHI_INDEX + daysSinceEpoch) % SEXAGENARY_CYCLE) +
      SEXAGENARY_CYCLE) %
    SEXAGENARY_CYCLE;

  return {
    stem: STEMS[index % STEMS.length],
    branch: BRANCHES[index % BRANCHES.length],
  };
}
