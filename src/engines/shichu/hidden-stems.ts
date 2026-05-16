/**
 * 蔵干（ぞうかん）算出
 *
 * 十二支それぞれに内蔵される天干を返す。完全に決定論（テーブル参照）。
 * 配列順は [本気, 中気, 余気]。四正（子・午・卯・酉）は本気中心で
 * 1〜2 個、土の四墓（辰・戌・丑・未）は墓気を含む 3 個。
 *
 * 典拠：四柱推命の標準的な蔵干表（本気・中気・余気）／
 *       『四柱推命の本』小山内彰系。
 */

import { BRANCHES } from '../shared/types';
import type { Branch, Stem } from '../shared/types';
import type { HiddenStems } from './types';

/**
 * 蔵干テーブル（地支 → [本気, 中気, 余気]）。
 *
 * 子=癸 / 丑=己癸辛 / 寅=甲丙戊 / 卯=乙 / 辰=戊乙癸 / 巳=丙庚戊 /
 * 午=丁己 / 未=己丁乙 / 申=庚壬戊 / 酉=辛 / 戌=戊辛丁 / 亥=壬甲
 */
const HIDDEN_STEMS_TABLE = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
} as const satisfies Record<Branch, HiddenStems>;

/**
 * 典拠：四柱推命の標準的な蔵干表（本気・中気・余気）／『四柱推命の本』小山内彰系
 *
 * 地支から蔵干（[本気, 中気, 余気] 順）を返す。
 * 未知の地支は沈黙させず Error（計算層の規律）。
 *
 * @param branch 十二支（例: '巳'）
 * @returns      蔵干の配列（防御的にコピーを返す。1〜3 個）
 */
export function getHiddenStems(branch: string): Stem[] {
  if (BRANCHES.indexOf(branch as Branch) < 0) {
    throw new Error(`不正な十二支: ${branch}`);
  }
  return [...HIDDEN_STEMS_TABLE[branch as Branch]];
}
