/**
 * Layer 1（計算エンジン）共通型定義
 *
 * 干支（十干 × 十二支）を中心に、四柱推命・算命学・易経の各エンジンが
 * 共有する基本型を集約する。LLM を介在させない決定論的データのみを扱う。
 */

/** 十干（じっかん）: 甲乙丙丁戊己庚辛壬癸 */
export const STEMS = [
  '甲',
  '乙',
  '丙',
  '丁',
  '戊',
  '己',
  '庚',
  '辛',
  '壬',
  '癸',
] as const;

/** 十干の型（10種） */
export type Stem = (typeof STEMS)[number];

/** 十二支（じゅうにし）: 子丑寅卯辰巳午未申酉戌亥 */
export const BRANCHES = [
  '子',
  '丑',
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
] as const;

/** 十二支の型（12種） */
export type Branch = (typeof BRANCHES)[number];

/** 性別。算命学・紫微斗数で大運の進退方向に影響するため必須。 */
export type Gender = 'male' | 'female';

/**
 * 干支の柱（年柱・月柱・日柱・時柱の 1 単位）。
 * 天干（stem）と地支（branch）の組で表す。
 */
export interface Pillar {
  /** 天干 */
  stem: Stem;
  /** 地支 */
  branch: Branch;
}

/**
 * 出生情報。
 *
 * 生年月日時はユーザーのローカル時計時刻（出生地の時計が示していた値）。
 * 経度補正・節入り判定は後段のエンジンが longitude を用いて行う。
 * year/month/day/hour/minute は機微情報のため、保存時は AES-256 暗号化必須
 * （CLAUDE.md「データ保存」参照）。
 */
export interface BirthInfo {
  /** 西暦年（例: 2000） */
  year: number;
  /** 月 1〜12 */
  month: number;
  /** 日 1〜31 */
  day: number;
  /** 時 0〜23（出生地時計時刻） */
  hour: number;
  /** 分 0〜59（出生地時計時刻） */
  minute: number;
  /** 出生地の経度（東経を正、度。例: 明石 135.00 / 札幌 141.35） */
  longitude: number;
  /** 出生地の緯度（北緯を正、度） */
  latitude: number;
  /** 性別 */
  gender: Gender;
}

/**
 * 二十四節気の種別。
 * - 節（せつ）: 月柱の境目。年の 12 か月境界（立春・啓蟄…小寒）。
 * - 中気（ちゅうき）: 節と節の中点（雨水・春分…大寒）。月柱境界には使わない。
 */
export type SolarTermKind = '節' | '中気';

/** 二十四節気 1 個の定義。 */
export interface SolarTermDef {
  /** 名称（例: '立春'） */
  readonly name: string;
  /** 太陽視黄経（度, 0〜359）。定気法の基準値。 */
  readonly longitude: number;
  /** 節 / 中気 */
  readonly kind: SolarTermKind;
}

/**
 * 二十四節気（定気法）。
 *
 * 四柱推命の年初である「立春」(視黄経 315°) を起点に、視黄経 15° 刻みで
 * 一周する 24 個を順に並べる。longitude が
 *   - ≡ 15 (mod 30) → 「節」（月柱の境目。寅月＝立春 から始まる 12 か月）
 *   - ≡  0 (mod 30) → 「中気」
 *
 * 春分は視黄経 0°（= 360°）。
 *
 * 典拠：国立天文台 暦象年表 / 暦Wiki（定気法による二十四節気の定義）。
 *       本データの実時刻算出を 2026年5月16日 に複数年で国立天文台と一致確認
 *       （src/engines/shared/__tests__/_spike_solar-term.test.ts 参照）。
 */
export const SOLAR_TERMS = [
  { name: '立春', longitude: 315, kind: '節' },
  { name: '雨水', longitude: 330, kind: '中気' },
  { name: '啓蟄', longitude: 345, kind: '節' },
  { name: '春分', longitude: 0, kind: '中気' },
  { name: '清明', longitude: 15, kind: '節' },
  { name: '穀雨', longitude: 30, kind: '中気' },
  { name: '立夏', longitude: 45, kind: '節' },
  { name: '小満', longitude: 60, kind: '中気' },
  { name: '芒種', longitude: 75, kind: '節' },
  { name: '夏至', longitude: 90, kind: '中気' },
  { name: '小暑', longitude: 105, kind: '節' },
  { name: '大暑', longitude: 120, kind: '中気' },
  { name: '立秋', longitude: 135, kind: '節' },
  { name: '処暑', longitude: 150, kind: '中気' },
  { name: '白露', longitude: 165, kind: '節' },
  { name: '秋分', longitude: 180, kind: '中気' },
  { name: '寒露', longitude: 195, kind: '節' },
  { name: '霜降', longitude: 210, kind: '中気' },
  { name: '立冬', longitude: 225, kind: '節' },
  { name: '小雪', longitude: 240, kind: '中気' },
  { name: '大雪', longitude: 255, kind: '節' },
  { name: '冬至', longitude: 270, kind: '中気' },
  { name: '小寒', longitude: 285, kind: '節' },
  { name: '大寒', longitude: 300, kind: '中気' },
] as const satisfies readonly SolarTermDef[];

/** 二十四節気の名称型（24 種のユニオン） */
export type SolarTerm = (typeof SOLAR_TERMS)[number]['name'];
