/**
 * 経度補正（出生地真太陽時の近似）
 *
 * 日本標準時（JST）は東経 135 度（兵庫県明石市）の地方平均時を基準とする。
 * 地球は 24 時間で 360 度回転するため経度 1 度あたり 4 分の時差が生じる。
 * 出生地の経度が東に行くほど時計時刻より太陽は先行するため、
 * 命式（特に時柱・節入り判定）はこの差を補正した時刻で行う必要がある。
 *
 * 例: 札幌（東経 141.35 度）は明石より (141.35 - 135) × 4 ≒ 25.4 分
 *     時刻が「進んでいる」ため、補正後時刻は約 25 分加算される。
 *
 * 注: 均時差（地球公転に伴う ±16 分程度の補正）は本関数では扱わない。
 *     より高精度が必要な場合は節気計算ステップ（astronomy-engine）で別途考慮する。
 */

/** 日本標準時の基準経度（東経・明石） */
export const JST_BASE_LONGITUDE_DEG = 135;

/** 経度 1 度あたりの時差（分）。360 度 / 24 時間 = 15 度/時 → 1 度 = 4 分。 */
const MINUTES_PER_DEGREE = 4;

/**
 * 典拠：日本天文学会の標準時計算
 *
 * 与えられた時計時刻 date を、出生地経度 longitudeDeg における
 * 地方平均時に補正した新しい Date を返す（引数 date は非破壊）。
 *
 * @param date         出生地の時計が示していた時刻（JST 基準の Date）
 * @param longitudeDeg 出生地の経度（東経を正、度）
 * @returns            経度補正後の時刻（新しい Date インスタンス）
 */
export function applyLongitudeCorrection(
  date: Date,
  longitudeDeg: number,
): Date {
  const offsetMinutes =
    (longitudeDeg - JST_BASE_LONGITUDE_DEG) * MINUTES_PER_DEGREE;
  return new Date(date.getTime() + offsetMinutes * 60_000);
}
