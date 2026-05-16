/**
 * 四柱推命（子平派）エンジン共通型
 *
 * 年柱・月柱・日柱・時柱の表現は共有の Pillar 型を流用する。
 * ここでは月柱算出に必要な月支の並び等、四柱推命固有のデータ型を足す。
 */

import type { Pillar, Branch } from '../shared/types';

export type { Pillar };

/**
 * 月支の並び：寅月（＝立春起算の第1月）から 丑月（＝小寒）まで。
 *
 * 四柱推命の月は暦月ではなく「節入り」で区切る。年初は立春＝寅月。
 * 五虎遁・月柱算出はこの 0 起点オフセット（寅=0 … 丑=11）で行う。
 *
 * 典拠：四柱推命の月建（子平派）。
 */
export const MONTH_BRANCH_SEQUENCE = [
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
  '子',
  '丑',
] as const satisfies readonly Branch[];

/**
 * 四柱（年柱・月柱・日柱・時柱）。
 * 時柱は別エンジンで後付けするため optional。
 */
export interface SajuChart {
  /** 年柱 */
  year: Pillar;
  /** 月柱 */
  month: Pillar;
  /** 日柱 */
  day: Pillar;
  /** 時柱（時柱エンジン未実装のため任意） */
  hour?: Pillar;
}
