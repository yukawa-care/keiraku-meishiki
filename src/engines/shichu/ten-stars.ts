/**
 * 通変星（つうへんせい）算出
 *
 * 日干（日主）と対象の天干との五行・陰陽の関係から、10 種の通変星を
 * 決定論的に判定する。蔵干に対しても同じ判定を適用する。
 *
 * 関係（日主 D から見た対象 T）:
 *   同行   : 同陰陽=比肩 / 異陰陽=劫財
 *   我生（D生T）: 同陰陽=食神 / 異陰陽=傷官
 *   我剋（D剋T）: 同陰陽=偏財 / 異陰陽=正財
 *   剋我（T剋D）: 同陰陽=偏官 / 異陰陽=正官
 *   生我（T生D）: 同陰陽=偏印 / 異陰陽=印綬
 *
 * 五行（木火土金水）index: 木0 火1 土2 金3 水4
 *   相生: e →(e+1)%5 を生じる。相剋: e →(e+2)%5 を剋す。
 * 天干 index（STEMS）: 甲0乙1丙2丁3戊4己5庚6辛7壬8癸9
 *   五行 = floor(idx/2)、陰陽 = idx 偶数が陽・奇数が陰。
 *
 * 典拠：四柱推命の通変星10種／五行陰陽の標準関係表／『四柱推命の本』小山内彰系。
 */

import { STEMS } from '../shared/types';
import type { Stem, Pillar } from '../shared/types';
import { getHiddenStems } from './hidden-stems';

/** 通変星 10 種 */
export type TenStar =
  | '比肩'
  | '劫財'
  | '食神'
  | '傷官'
  | '偏財'
  | '正財'
  | '偏官'
  | '正官'
  | '偏印'
  | '印綬';

interface StemInfo {
  /** 五行 index（木0 火1 土2 金3 水4） */
  element: number;
  /** 陽（甲丙戊庚壬）なら true */
  yang: boolean;
}

function stemInfo(stem: string): StemInfo {
  const idx = STEMS.indexOf(stem as Stem);
  if (idx < 0) {
    throw new Error(`不正な天干: ${stem}`);
  }
  return { element: Math.floor(idx / 2), yang: idx % 2 === 0 };
}

/**
 * 典拠：四柱推命の通変星10種／五行陰陽の標準関係表／『四柱推命の本』小山内彰系
 *
 * 日干と対象の天干から通変星を返す。日干自身（同干）は標準どおり '比肩'。
 * 未知の天干は沈黙させず Error（計算層の規律）。
 *
 * @param dayStem    日柱の天干（日主）
 * @param targetStem 対象の天干（他柱の天干、または蔵干）
 * @returns          通変星
 */
export function getTenStar(dayStem: string, targetStem: string): TenStar {
  const d = stemInfo(dayStem);
  const t = stemInfo(targetStem);
  const samePolarity = d.yang === t.yang;

  if (d.element === t.element) {
    return samePolarity ? '比肩' : '劫財';
  }
  if (t.element === (d.element + 1) % 5) {
    // 我生（日主が相手を生じる）
    return samePolarity ? '食神' : '傷官';
  }
  if (t.element === (d.element + 2) % 5) {
    // 我剋（日主が相手を剋す）
    return samePolarity ? '偏財' : '正財';
  }
  if (d.element === (t.element + 2) % 5) {
    // 剋我（相手が日主を剋す）
    return samePolarity ? '偏官' : '正官';
  }
  if (d.element === (t.element + 1) % 5) {
    // 生我（相手が日主を生じる）
    return samePolarity ? '偏印' : '印綬';
  }
  // 五行は同行＋相生相剋の 4 関係で網羅（異元素の差は 1〜4 のみ）。
  // ここには到達しないが、計算層では沈黙させない。
  throw new Error(`通変星を判定できません: ${dayStem} vs ${targetStem}`);
}

/**
 * 典拠：四柱推命の通変星10種／五行陰陽の標準関係表／『四柱推命の本』小山内彰系
 *
 * 日干から見た 1 柱分の通変星（天干 1 つ ＋ 蔵干すべて）を返す。
 *
 * @param dayStem 日柱の天干（日主）
 * @param pillar  対象の柱
 * @returns       { stem: 天干の通変星, hidden: 蔵干各々の通変星 }
 */
export function getPillarTenStars(
  dayStem: string,
  pillar: Pillar,
): { stem: TenStar; hidden: TenStar[] } {
  return {
    stem: getTenStar(dayStem, pillar.stem),
    hidden: getHiddenStems(pillar.branch).map((h) => getTenStar(dayStem, h)),
  };
}
