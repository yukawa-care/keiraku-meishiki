import { describe, it, expect } from 'vitest';
import { getDayPillar, getKanshiIndex } from '../kanshi';
import { applyLongitudeCorrection } from '../longitude-correction';

describe('getKanshiIndex', () => {
  it('起点 甲戌 = index 10', () => {
    expect(getKanshiIndex('甲', '戌')).toBe(10);
  });

  it('甲子 = index 0', () => {
    expect(getKanshiIndex('甲', '子')).toBe(0);
  });

  it('癸亥 = index 59（周期の最後）', () => {
    expect(getKanshiIndex('癸', '亥')).toBe(59);
  });

  it('戊午 = index 54', () => {
    expect(getKanshiIndex('戊', '午')).toBe(54);
  });

  it('成立しない干支（甲丑：偶奇不一致）は例外', () => {
    expect(() => getKanshiIndex('甲', '丑')).toThrow();
  });

  it('未知の文字は例外', () => {
    expect(() => getKanshiIndex('X', '子')).toThrow();
  });
});

describe('getDayPillar', () => {
  it('起点 1900-01-01 は 甲戌', () => {
    const p = getDayPillar(new Date(1900, 0, 1));
    expect(p.stem).toBe('甲');
    expect(p.branch).toBe('戌');
  });

  /**
   * 2000-01-01 の日柱。
   *
   * プロンプトでは「丙午」を期待値として指示されたが、暦学的検証の結果、
   * 正しい値は「戊午」である（プロンプトの誤りと判断）。根拠:
   *   - 1900-01-01〜2000-01-01 は厳密に 36524 日
   *     （100年 = 36500 + うるう年24回、1900年は非うるう年）
   *   - index = (10 + 36524) mod 60 = 54 → 戊午
   *   - 標準天文式でも JDN 2451545:
   *       天干 =(2451545+9)%10 = 4 → 戊
   *       地支 =(2451545+1)%12 = 6 → 午
   * 起点（甲戌=10）と独立計算の両方が「戊午」で一致するため、
   * CLAUDE.md「暦学的精度を絶対に妥協しない／誤差はコメントで原因記録」に従い
   * 正しい値「戊午」で固定する。
   *
   * 外部サイト（zired.net 等）で 2000-01-01 の日柱 = 戊午 を確認済み
   * （2026年5月15日、運営者確認）。
   */
  it('2000-01-01 は 戊午（プロンプトの「丙午」は誤り）', () => {
    const p = getDayPillar(new Date(2000, 0, 1));
    expect(p.stem).toBe('戊');
    expect(p.branch).toBe('午');
  });

  it('時刻（0〜23時）が変わっても同一暦日なら同じ日柱', () => {
    const morning = getDayPillar(new Date(2000, 0, 1, 0, 30));
    const night = getDayPillar(new Date(2000, 0, 1, 23, 45));
    expect(morning).toEqual(night);
  });

  it('翌日は六十干支が 1 つ進む', () => {
    const d1 = getDayPillar(new Date(2000, 0, 1)); // 戊午 = 54
    const d2 = getDayPillar(new Date(2000, 0, 2)); // 己未 = 55
    expect(getKanshiIndex(d2.stem, d2.branch)).toBe(
      (getKanshiIndex(d1.stem, d1.branch) + 1) % 60,
    );
  });

  /**
   * 検証2：湯川先生 実データ照合（1965年2月19日 15:57 JST・男性・札幌）。
   *
   * ※ 当初提示の「1966-01-20」「1965-02-19=癸卯」はいずれも入力／記憶側の
   *   訂正を経たもの。出生時刻は 15:57 JST で確定。
   *
   * 本エンジンの算出: 甲辰（index 40）
   * 当初の記憶期待値: 癸卯（index 39）… 前日 1965-02-18 に相当（1 日ズレ）
   *
   * 暦学的検証（独立 2 法が一致）:
   *   - 起点法: 1900-01-01〜1965-02-19 = 厳密に 23790 日
   *       index = (10 + 23790) mod 60 = 40 → 甲辰
   *   - 標準天文式: JDN(1965-02-19) = 2438811
   *       天干 =(2438811+9)%10 = 0 → 甲
   *       地支 =(2438811+1)%12 = 4 → 辰
   *
   * 「癸卯」が成立しないことの根拠:
   *   - 出生 15:57 は子刻(23時)より前。晩子説でも早子説でも日柱は同一日に
   *     属するため、流派差で甲辰↔癸卯のズレは説明できない。
   *   - 経度補正の実測（本エンジン）: 明石135 / 東京139.69 / 札幌141.35 の
   *     いずれの基準でも 15:57→最大16:22 にしか動かず、結果はすべて甲辰。
   *     経度補正で日柱が変わり得るのは出生時刻が真夜中±約25分の場合のみ。
   *   - 本エンジンは 2000-01-01=戊午（外部サイト確認済）と同一起点。
   *     同一連続カウント上にあるため、戊午が正しい限り甲辰も数学的に確定。
   *
   * 結論: 1965-02-19 15:57 JST の日柱は「甲辰」が暦学的に正しい。
   *   「癸卯」は出典／記憶の誤記（前日カウント等）と判断。
   *
   * 外部サイト（複数）で 2026年5月16日 確認済み:
   *   「1965-02-19 15:57 男性」の日柱 = 甲辰 を外部の信頼できる
   *   占いサイト（複数）で照合し、本期待値（甲辰）を最終確定した。
   *   過去出典の「癸卯」は誤りと確定。
   *   これにより本エンジンは外部突合 2 件で精度を二重に証明:
   *     - 2000-01-01 = 戊午（外部一致）
   *     - 1965-02-19 15:57 = 甲辰（外部一致）
   */
  it('湯川先生 1965-02-19 15:57 JST → 甲辰（戊午と同一起点で数学的に確定／外部サイト複数で確認済み）', () => {
    const p = getDayPillar(new Date(1965, 1, 19, 15, 57));
    expect(p.stem).toBe('甲');
    expect(p.branch).toBe('辰');
    expect(getKanshiIndex(p.stem, p.branch)).toBe(40);
  });

  it('1965-02-19 15:57 は経度補正(明石/東京/札幌)でも日柱不変＝甲辰', () => {
    const birth = new Date(1965, 1, 19, 15, 57);
    for (const lon of [135.0, 139.69, 141.35]) {
      const p = getDayPillar(applyLongitudeCorrection(birth, lon));
      expect(`${p.stem}${p.branch}`).toBe('甲辰');
    }
  });
});
