import { describe, it, expect } from 'vitest';
import { applyLongitudeCorrection } from '../longitude-correction';

describe('applyLongitudeCorrection', () => {
  const base = new Date('2000-01-01T12:00:00.000Z');

  it('明石（東経135.00度・JST基準）では補正しない', () => {
    const corrected = applyLongitudeCorrection(base, 135.0);
    expect(corrected.getTime()).toBe(base.getTime());
  });

  it('札幌（東経141.35度）は明石より約25分（25.4分）進める', () => {
    const corrected = applyLongitudeCorrection(base, 141.35);
    const diffMinutes = (corrected.getTime() - base.getTime()) / 60_000;
    // (141.35 - 135) × 4 = 25.4 分
    expect(diffMinutes).toBeCloseTo(25.4, 6);
  });

  it('引数の Date を破壊しない（非破壊）', () => {
    const t = base.getTime();
    applyLongitudeCorrection(base, 141.35);
    expect(base.getTime()).toBe(t);
  });

  it('基準より西（東経130度）は時刻を戻す', () => {
    const corrected = applyLongitudeCorrection(base, 130.0);
    const diffMinutes = (corrected.getTime() - base.getTime()) / 60_000;
    expect(diffMinutes).toBeCloseTo(-20, 6);
  });
});
