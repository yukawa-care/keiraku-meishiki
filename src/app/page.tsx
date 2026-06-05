"use client";

import { useState } from "react";
import type { BirthInfo, Pillar } from "@/engines/shared/types";
import {
  getSajuChartFromBirth,
} from "@/engines/shichu/saju-chart";
import { getHiddenStems } from "@/engines/shichu/hidden-stems";
import { getPillarTenStars } from "@/engines/shichu/ten-stars";
import { getTwelveFortune } from "@/engines/shichu/twelve-fortunes";

// Layer 1 計算エンジンのキーテストケース（架空サンプル）。
// この入力に対し、四柱は 年柱=戊辰 / 月柱=丙辰 / 日柱=庚子 / 時柱=癸未
const SAMPLE: BirthInfo = {
  year: 1988,
  month: 4,
  day: 15,
  hour: 14,
  minute: 30,
  longitude: 139.6917, // 東京都心
  latitude: 35.6895,
  gender: "male",
};

/** 十干の訓読み */
const STEM_YOMI: Record<string, string> = {
  甲: "きのえ", 乙: "きのと", 丙: "ひのえ", 丁: "ひのと", 戊: "つちのえ",
  己: "つちのと", 庚: "かのえ", 辛: "かのと", 壬: "みずのえ", 癸: "みずのと",
};

/** 十二支の訓読み */
const BRANCH_YOMI: Record<string, string> = {
  子: "ね", 丑: "うし", 寅: "とら", 卯: "う", 辰: "たつ", 巳: "み",
  午: "うま", 未: "ひつじ", 申: "さる", 酉: "とり", 戌: "いぬ", 亥: "い",
};

/** ゼロ詰め 2 桁 */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function PillarCard({
  label,
  pillar,
  dayStem,
  isDay = false,
}: {
  label: string;
  pillar: Pillar;
  dayStem: string;
  isDay?: boolean;
}) {
  const tenStars = getPillarTenStars(dayStem, pillar);
  return (
    <div className="flex flex-col items-center">
      <span className="text-[0.7rem] tracking-[0.3em] text-[#1A3A5C]/70 sm:text-xs">
        {label}
      </span>
      <span className="mt-2 text-xs tracking-[0.15em] text-[#1A3A5C]/70 sm:text-sm">
        {isDay ? "日干" : tenStars.stem}
      </span>
      <div className="mt-2 flex w-full flex-col items-center rounded-md border border-[#C8A951]/60 bg-white/70 px-3 py-5 shadow-sm sm:px-5 sm:py-7">
        <span className="text-4xl font-medium leading-none text-[#1A3A5C] sm:text-5xl md:text-6xl">
          {pillar.stem}
        </span>
        <span className="mt-3 text-4xl font-medium leading-none text-[#C8A951] sm:mt-4 sm:text-5xl md:text-6xl">
          {pillar.branch}
        </span>
      </div>
      <span className="mt-2 text-[0.65rem] tracking-[0.2em] text-[#1A3A5C]/55 sm:text-xs">
        {getTwelveFortune(dayStem, pillar.branch)}
      </span>
      <span className="mt-2 text-[0.65rem] tracking-[0.15em] text-[#1A3A5C]/60 sm:text-xs">
        {STEM_YOMI[pillar.stem]}・{BRANCH_YOMI[pillar.branch]}
      </span>
      <span className="mt-2 text-[0.6rem] leading-tight tracking-[0.1em] text-[#1A3A5C]/45 sm:text-[0.7rem]">
        蔵干 {getHiddenStems(pillar.branch).join("・")}
      </span>
      <span className="mt-1 text-[0.55rem] leading-tight tracking-[0.1em] text-[#1A3A5C]/70 sm:text-[0.65rem]">
        {tenStars.hidden.join("・")}
      </span>
    </div>
  );
}

export default function Home() {
  const [year, setYear] = useState(SAMPLE.year);
  const [month, setMonth] = useState(SAMPLE.month);
  const [day, setDay] = useState(SAMPLE.day);
  const [hour, setHour] = useState(SAMPLE.hour);
  const [minute, setMinute] = useState(SAMPLE.minute);
  const [gender, setGender] = useState<"male" | "female">(SAMPLE.gender);

  const [chart, setChart] = useState(() => getSajuChartFromBirth(SAMPLE));

  function handleCalculate() {
    const birth: BirthInfo = {
      year,
      month,
      day,
      hour,
      minute,
      longitude: SAMPLE.longitude,
      latitude: SAMPLE.latitude,
      gender,
    };
    setChart(getSajuChartFromBirth(birth));
  }

  const dateValue = `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
  const timeValue = `${pad2(hour)}:${pad2(minute)}`;

  function handleDateChange(value: string) {
    const [y, m, d] = value.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }

  function handleTimeChange(value: string) {
    const [h, mi] = value.split(":").map(Number);
    if (Number.isFinite(h) && Number.isFinite(mi)) {
      setHour(h);
      setMinute(mi);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FAFAF7] px-6 py-16 text-center text-[#1A3A5C] font-[family-name:var(--font-noto-serif-jp)]">
      <h1 className="text-5xl font-medium tracking-[0.3em] sm:text-6xl md:text-7xl">
        <span>経絡</span>
        <span className="text-[#C8A951]">命式</span>
      </h1>

      <p className="mt-8 text-sm tracking-[0.2em] sm:text-base md:text-lg">
        鍼灸師監修 ─ AI 養生鑑定
      </p>

      <div className="mt-12 h-px w-16 bg-[#C8A951]" aria-hidden="true" />

      <p className="mt-12 text-xs tracking-[0.25em] opacity-80 sm:text-sm">
        ゆかわ鍼灸マッサージ治療院 ─ 養生鑑定サービス
      </p>

      <section className="mt-20 w-full max-w-md">
        <h2 className="text-sm leading-relaxed tracking-[0.2em] sm:text-base">
          あなたの生年月日と
          <wbr />
          出生時刻を入力してください
        </h2>
        <div
          className="mx-auto mt-4 h-px w-10 bg-[#C8A951]/70"
          aria-hidden="true"
        />

        <div className="mt-10 flex flex-col gap-6">
          <label className="flex flex-col items-start gap-2 text-left">
            <span className="text-xs tracking-[0.2em] text-[#1A3A5C]/70">
              生年月日
            </span>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => handleDateChange(e.target.value)}
              min="1900-01-01"
              max="2100-12-31"
              className="w-full rounded-md border border-[#C8A951]/60 bg-white/70 px-4 py-3 text-base text-[#1A3A5C] shadow-sm outline-none focus:border-[#1A3A5C]"
            />
          </label>

          <label className="flex flex-col items-start gap-2 text-left">
            <span className="text-xs tracking-[0.2em] text-[#1A3A5C]/70">
              出生時刻
            </span>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full rounded-md border border-[#C8A951]/60 bg-white/70 px-4 py-3 text-base text-[#1A3A5C] shadow-sm outline-none focus:border-[#1A3A5C]"
            />
          </label>

          <label className="flex flex-col items-start gap-2 text-left">
            <span className="text-xs tracking-[0.2em] text-[#1A3A5C]/70">
              性別
            </span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female")}
              className="w-full rounded-md border border-[#C8A951]/60 bg-white/70 px-4 py-3 text-base text-[#1A3A5C] shadow-sm outline-none focus:border-[#1A3A5C]"
            >
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleCalculate}
            className="mt-2 rounded-md bg-[#1A3A5C] px-6 py-3 text-sm tracking-[0.3em] text-white shadow-sm transition-opacity hover:opacity-90"
          >
            命式を計算する
          </button>
        </div>
      </section>

      <section className="mt-20 w-full max-w-2xl">
        <h2 className="text-base tracking-[0.3em] sm:text-lg">命式</h2>
        <div
          className="mx-auto mt-4 h-px w-10 bg-[#C8A951]/70"
          aria-hidden="true"
        />

        <div className="mt-10 grid grid-cols-4 gap-2 sm:gap-5">
          <PillarCard label="年柱" pillar={chart.year} dayStem={chart.day.stem} />
          <PillarCard label="月柱" pillar={chart.month} dayStem={chart.day.stem} />
          <PillarCard label="日柱" pillar={chart.day} dayStem={chart.day.stem} isDay />
          {chart.hour && (
            <PillarCard label="時柱" pillar={chart.hour} dayStem={chart.day.stem} />
          )}
        </div>
      </section>
    </main>
  );
}
