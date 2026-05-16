import type { BirthInfo, Pillar } from "@/engines/shared/types";
import { getSajuChartFromBirth } from "@/engines/shichu/saju-chart";
import { getHiddenStems } from "@/engines/shichu/hidden-stems";
import { getPillarTenStars } from "@/engines/shichu/ten-stars";
import { getTwelveFortune } from "@/engines/shichu/twelve-fortunes";

// 湯川研一（運営者）の出生情報。Layer 1 計算エンジンの正典キーケース。
// この入力に対し、四柱は必ず 年柱=乙巳 / 月柱=戊寅 / 日柱=甲辰 / 時柱=壬申
// （いずれも複数の信頼サイトで外部突合済み 2026-05-16）。
const YUKAWA: BirthInfo = {
  year: 1965,
  month: 2,
  day: 19,
  hour: 15,
  minute: 57,
  longitude: 141.35, // 札幌
  latitude: 43.06,
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
      {/* 天干の通変星（柱名とカード本体の間）。日柱は日主のため「日干」。 */}
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
      {/* 十二運（地支の下・ふりがなの上） */}
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
  // Server Component：Layer 1 エンジンをサーバーで 1 回だけ実行。
  const chart = getSajuChartFromBirth(YUKAWA);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FAFAF7] px-6 py-16 text-center text-[#1A3A5C] font-[family-name:var(--font-noto-serif-jp)]">
      <h1 className="text-5xl font-medium tracking-[0.3em] sm:text-6xl md:text-7xl">
        <span>経絡</span>
        <span className="text-[#C8A951]">命式</span>
      </h1>

      <p className="mt-8 text-sm tracking-[0.2em] sm:text-base md:text-lg">
        鍼灸師が監修する東洋占術鑑定
      </p>

      <div className="mt-12 h-px w-16 bg-[#C8A951]" aria-hidden="true" />

      <p className="mt-12 text-xs tracking-[0.25em] opacity-80 sm:text-sm">
        Coming Soon ― 2026年9月リリース予定
      </p>

      {/* ── 中間チェックポイント：Layer 1 計算エンジンの結実 ── */}
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

        <p className="mt-10 text-[0.65rem] leading-relaxed tracking-[0.15em] text-[#1A3A5C]/55 sm:text-xs">
          ※ 湯川研一（運営者）の四柱・参考表示
          <br />
          1965年2月19日 15:57 JST／札幌・男性
        </p>
      </section>
    </main>
  );
}
