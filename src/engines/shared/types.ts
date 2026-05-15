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
