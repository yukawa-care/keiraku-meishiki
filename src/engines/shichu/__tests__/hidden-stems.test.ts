/**
 * 蔵干エンジン テスト
 *
 * 12 支すべての蔵干テーブルと、湯川先生の四柱（乙巳・戊寅・甲辰・壬申）
 * の地支から正しい蔵干が取れることを検証。
 *
 * 典拠：四柱推命の標準的な蔵干表（本気・中気・余気）／『四柱推命の本』小山内彰系
 */
import { describe, it, expect } from 'vitest';
import { BRANCHES } from '../../shared/types';
import { getHiddenStems } from '../hidden-stems';

describe('getHiddenStems 12支テーブル網羅', () => {
  const TABLE: Record<string, string[]> = {
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
  };

  it('12 支すべてが表どおりの蔵干（順序＝本気→中気→余気）', () => {
    for (const branch of BRANCHES) {
      expect(getHiddenStems(branch)).toEqual(TABLE[branch]);
    }
  });

  it('全 12 支を網羅している（テスト表が抜けなし）', () => {
    expect(Object.keys(TABLE).sort()).toEqual([...BRANCHES].sort());
  });
});

describe('湯川先生の四柱（乙巳・戊寅・甲辰・壬申）の蔵干', () => {
  it('巳の蔵干：丙・庚・戊', () => {
    expect(getHiddenStems('巳')).toEqual(['丙', '庚', '戊']);
  });
  it('寅の蔵干：甲・丙・戊', () => {
    expect(getHiddenStems('寅')).toEqual(['甲', '丙', '戊']);
  });
  it('辰の蔵干：戊・乙・癸', () => {
    expect(getHiddenStems('辰')).toEqual(['戊', '乙', '癸']);
  });
  it('申の蔵干：庚・壬・戊', () => {
    expect(getHiddenStems('申')).toEqual(['庚', '壬', '戊']);
  });
});

describe('防御的挙動', () => {
  it('返り値は防御コピー（破壊してもテーブル不変）', () => {
    const a = getHiddenStems('寅');
    a.push('癸');
    expect(getHiddenStems('寅')).toEqual(['甲', '丙', '戊']);
  });

  it('不正な十二支は例外（計算層は沈黙させない）', () => {
    expect(() => getHiddenStems('X')).toThrow();
    expect(() => getHiddenStems('甲')).toThrow(); // 天干を渡した
    expect(() => getHiddenStems('')).toThrow();
  });
});
