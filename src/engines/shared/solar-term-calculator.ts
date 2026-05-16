/**
 * 二十四節気（定気法）の正確な時刻算出
 *
 * 太陽の視黄経が各節気の基準角に達する瞬間を astronomy-engine で求める。
 * 完全に決定論（同一入力 → 同一出力）。LLM は一切介在しない（Layer 1）。
 *
 * 【タイムゾーン規律 ― 本モジュール最重要】
 *   Date は「絶対時刻（瞬間）」であり、タイムゾーンを持たない。
 *   - 内部・返り値はすべて astronomy-engine の UT 瞬間（= 絶対時刻）。
 *   - JST は「表示の解釈」にすぎない。表示が要るときだけ
 *     toJstParts / formatJstString を使い、+9h を 1 回だけ適用する。
 *   - 比較・前後判定は必ず絶対時刻（getTime()）同士で行う。
 *     壁時計の数値同士を比較しない（占術計算で最も多いバグ源）。
 *   この規律により「初期に外部占術サイトで遭遇した 1 時間/9 時間ズレ」
 *   の類の UT/JST 混在バグを構造的に排除する。
 *
 * 典拠：astronomy-engine SearchSunLongitude（VSOP87 / NOVAS C 3.1, ±1′）/
 *       国立天文台 暦象年表で 2026年5月16日 に複数年（1965・2000・2021・
 *       2026）で立春・春分等の一致を確認（_spike_solar-term.test.ts）。
 */

import { SearchSunLongitude, SunPosition } from 'astronomy-engine';
import { SOLAR_TERMS } from './types';
import type { SolarTerm, SolarTermDef } from './types';

/**
 * 太陽視黄経の平均日運動（度/日）。回帰年 365.2422 日で 360°。
 * 目標角までの概算日数を出し、探索窓を 1 交点だけに絞るために使う。
 */
const MEAN_DEG_PER_DAY = 360 / 365.2422;

/**
 * 目標角の概算到達日に対する探索窓。
 * astronomy-engine SearchSunLongitude は探索窓内で同一黄経が 2 回
 * 出現すると null を返す/誤交点を拾う（limitDays≳370 で顕在化）。
 * そこで概算日の PAD 日前から WINDOW 日だけ探索し、窓内の交点を
 * 必ず 1 個に限定する（年毎ジッタ ±数時間 << PAD 日）。
 */
const SEARCH_PAD_DAYS = 6;
const SEARCH_WINDOW_DAYS = 14;

const MS_PER_DAY = 86_400_000;

/** JST = UT + 9 時間（日本は 1951 年以降サマータイム無し、固定オフセット）。 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 月柱の境目となる 12「節」（立春→啓蟄→…→小寒 の月順）。 */
const SETSU_DEFS = SOLAR_TERMS.filter((t) => t.kind === '節');

/** 名称から節気定義を引く。未知の名称は沈黙させず Error（計算層の規律）。 */
function defOf(term: SolarTerm): SolarTermDef {
  const def = SOLAR_TERMS.find((t) => t.name === term);
  if (def === undefined) {
    throw new Error(`未知の節気: ${String(term)}`);
  }
  return def;
}

/**
 * 典拠：astronomy-engine SearchSunLongitude / 国立天文台暦象年表で
 *       2026年5月16日に複数年で一致確認
 *
 * 指定年における特定の節気の正確な時刻（絶対時刻の Date）を返す。
 *
 * 返り値はタイムゾーンを持たない「瞬間」。JST 表示が要る場合は
 * toJstParts / formatJstString を使うこと（返り値に +9h を二重適用しない）。
 *
 * 探索はその年の 1/1 00:00 UT を起点に行う。立春(315°)〜大寒(300°) の
 * いずれも、起点からの最初の到達時刻が暦年内のその節気に一致する
 * （冬至 270° は 12 月、小寒 285°・大寒 300° は 1 月、と暦年内に収まる）。
 *
 * @param year 西暦年（整数）
 * @param term 二十四節気の名称
 * @returns    太陽が当該視黄経に達した絶対時刻（Date＝瞬間値）
 */
export function getSolarTermDateTime(year: number, term: SolarTerm): Date {
  if (!Number.isInteger(year)) {
    throw new Error(`year は整数で指定: ${year}`);
  }
  const def = defOf(term);

  // その年の元日 0 時 UT の太陽視黄経（≈280°）から、目標角までの
  // 角距離 → 概算到達日を求め、その前後だけを探索窓にする。
  // これにより探索窓内の交点を 1 個に限定し、limitDays 過大時の
  // null/誤交点バグ（同一黄経の二重出現）を構造的に回避する。
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const lonAtJan1 = SunPosition(jan1).elon;
  const degToTarget = (def.longitude - lonAtJan1 + 360) % 360;
  const approxDays = degToTarget / MEAN_DEG_PER_DAY;
  const searchStart = new Date(
    jan1.getTime() + (approxDays - SEARCH_PAD_DAYS) * MS_PER_DAY,
  );

  const at = SearchSunLongitude(def.longitude, searchStart, SEARCH_WINDOW_DAYS);
  if (at === null) {
    throw new Error(
      `節気時刻の探索に失敗: year=${year} term=${term} lon=${def.longitude}`,
    );
  }
  // at.date は astronomy-engine の UT 瞬間。オフセットを足さずそのまま返す。
  return at.date;
}

/**
 * 典拠：astronomy-engine SearchSunLongitude / 国立天文台暦象年表で
 *       2026年5月16日に複数年で一致確認
 *
 * 月柱の境目となる 12 の「節」を、四柱推命の月順
 * （寅月＝立春 → … → 丑月＝小寒）で返す。
 *
 * 「中気」（雨水・春分・穀雨…大寒）は月柱境界ではないため含めない。
 * 12 節の顔ぶれは年に依らず一定（year は API 対称性と入力検証のため受ける）。
 *
 * @param year 西暦年（整数。妥当性検証のみに使用）
 * @returns    12 個の「節」名（立春・啓蟄・清明・立夏・芒種・小暑・
 *             立秋・白露・寒露・立冬・大雪・小寒）
 */
export function getMonthBoundaries(year: number): SolarTerm[] {
  if (!Number.isInteger(year)) {
    throw new Error(`year は整数で指定: ${year}`);
  }
  return SETSU_DEFS.map((t) => t.name);
}

/**
 * 典拠：astronomy-engine SearchSunLongitude / 国立天文台暦象年表で
 *       2026年5月16日に複数年で一致確認
 *
 * 出生時刻を挟む前後 2 つの「節」（月柱境界）を返す。月柱算出に使う。
 *
 * birth は「絶対時刻」として扱う（壁時計ではない）。JST の壁時計から
 * 構築する場合は jstWallToInstant を使うこと。判定は絶対時刻比較のみ。
 * 節入りの瞬間ちょうどは「その節に入った」とみなす（current 側に含める）。
 *
 * @param birthJST 出生の絶対時刻（Date＝瞬間値）
 * @returns        current（直前に入った節）/ next（次に来る節）
 */
export function findEnclosingSetsu(birthJST: Date): {
  current: SolarTerm;
  next: SolarTerm;
} {
  const t = birthJST.getTime();
  if (Number.isNaN(t)) {
    throw new Error('birthJST が不正な Date');
  }

  // 暦年境界（1 月生まれは前年 12 月の節が直前）に対応するため、
  // 前年・当年・翌年の 36 個の節入りを集めて絶対時刻で並べる。
  const baseYear = birthJST.getUTCFullYear();
  const setsu: { term: SolarTerm; ms: number }[] = [];
  for (const y of [baseYear - 1, baseYear, baseYear + 1]) {
    for (const s of SETSU_DEFS) {
      setsu.push({ term: s.name, ms: getSolarTermDateTime(y, s.name).getTime() });
    }
  }
  setsu.sort((a, b) => a.ms - b.ms);

  for (let i = 0; i < setsu.length - 1; i += 1) {
    if (setsu[i].ms <= t && t < setsu[i + 1].ms) {
      return { current: setsu[i].term, next: setsu[i + 1].term };
    }
  }
  // 前後 1 年窓で必ず挟めるため、ここに来るのは入力異常時のみ。
  throw new Error(
    `出生時刻を挟む節が見つからない（入力異常）: ${birthJST.toISOString()}`,
  );
}

/**
 * 絶対時刻を JST の暦要素（年月日時分秒）に分解する。
 * +9h を 1 回だけ適用する唯一の場所のひとつ（二重適用しないこと）。
 */
export function toJstParts(instant: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const d = new Date(instant.getTime() + JST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

/** 絶対時刻を 'YYYY-MM-DD HH:mm:ss JST' 文字列にする（表示用）。 */
export function formatJstString(instant: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  const j = toJstParts(instant);
  return (
    `${j.year}-${p(j.month)}-${p(j.day)} ` +
    `${p(j.hour)}:${p(j.minute)}:${p(j.second)} JST`
  );
}

/**
 * JST 壁時計（出生地の時計が示した値）から絶対時刻 Date を構築する。
 * 出生時刻入力や、システム TZ に依存しないテストのための安全な入口。
 * 例: 1965-02-19 15:57 JST → jstWallToInstant(1965, 2, 19, 15, 57)
 *
 * @param year   西暦年
 * @param month  月 1〜12
 * @param day    日 1〜31
 * @param hour   時 0〜23（JST 壁時計）
 * @param minute 分 0〜59（JST 壁時計）
 * @param second 秒 0〜59（既定 0）
 */
export function jstWallToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
): Date {
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second) - JST_OFFSET_MS,
  );
}
