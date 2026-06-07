"use client";

import { useState } from "react";
import type { BirthInfo, Pillar } from "@/engines/shared/types";
import { getSajuChartFromBirth } from "@/engines/shichu/saju-chart";
import { getHiddenStems } from "@/engines/shichu/hidden-stems";
import { getPillarTenStars } from "@/engines/shichu/ten-stars";
import { getTwelveFortune } from "@/engines/shichu/twelve-fortunes";

const SAMPLE: BirthInfo = {
  year: 1988, month: 4, day: 15, hour: 14, minute: 30,
  longitude: 139.6917, latitude: 35.6895, gender: "male",
};

const STEM_YOMI: Record<string, string> = {
  甲: "きのえ", 乙: "きのと", 丙: "ひのえ", 丁: "ひのと", 戊: "つちのえ",
  己: "つちのと", 庚: "かのえ", 辛: "かのと", 壬: "みずのえ", 癸: "みずのと",
};
const BRANCH_YOMI: Record<string, string> = {
  子: "ね", 丑: "うし", 寅: "とら", 卯: "う", 辰: "たつ", 巳: "み",
  午: "うま", 未: "ひつじ", 申: "さる", 酉: "とり", 戌: "いぬ", 亥: "い",
};

const STEMS = "甲乙丙丁戊己庚辛壬癸".split("");
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥".split("");
const STEM_GOGYO: Record<string, number> = { 甲:0,乙:0,丙:1,丁:1,戊:2,己:2,庚:3,辛:3,壬:4,癸:4 };
const STEM_IS_YIN: Record<string, boolean> = { 甲:false,乙:true,丙:false,丁:true,戊:false,己:true,庚:false,辛:true,壬:false,癸:true };
const STEM_TO_MERIDIAN: Record<string, string> = {
  甲:"肝・胆",乙:"肝・胆",丙:"心・小腸",丁:"心・小腸",戊:"脾・胃",己:"脾・胃",
  庚:"肺・大腸",辛:"肺・大腸",壬:"腎・膀胱",癸:"腎・膀胱",
};
const STEM_FULL: Record<string, string> = {
  甲:"陽の木",乙:"陰の木",丙:"陽の火",丁:"陰の火",戊:"陽の土",
  己:"陰の土",庚:"陽の金",辛:"陰の金",壬:"陽の水",癸:"陰の水",
};
const GOGYO_NAME: Record<string, string> = { 甲:"木",乙:"木",丙:"火",丁:"火",戊:"土",己:"土",庚:"金",辛:"金",壬:"水",癸:"水" };

type Profile = { metaphor: string; description: string; meridianDetail: string; pillars: string[] };
const STEM_PROFILES: Record<string, Profile> = {
  甲: { metaphor: "大樹（たいじゅ）", description: "地に深く根を張り、まっすぐ天に向かって伸びる1本の木 ― それが、あなたの本質です。曲げない、媚びない、流されない。これは美徳であると同時に、あなたの身体を消耗させる原因にもなります。", meridianDetail: "肝・胆（肝陽中心）", pillars: ["怒りを溜めない","決断を抱え込みすぎない","目を酷使しない","爪と筋を守る","早春（2〜3月）の養生を特に大切にする"] },
  乙: { metaphor: "草花（そうか）", description: "風が吹けば曲がり、雨が降れば葉を広げる、しなやかな草花や蔓 ― それが、あなたの本質です。しなやかさは武器ですが、しなりすぎる木は根が浅くなりやすい。本当に守るべきは肝の血と腎の精です。", meridianDetail: "肝・胆（肝血・肝陰中心）", pillars: ["寝不足を続けない","涙を流すことを我慢しない","人と長く一緒にいすぎない","目を酷使しない","春から初夏の養生を大切にする"] },
  丙: { metaphor: "太陽（たいよう）", description: "空高くから地表のすべてを照らし、ありとあらゆる命に光と熱を届ける太陽 ― それが、あなたの本質です。あまねく照らす力は周囲を喜ばせますが、太陽が常に最大の熱を出し続けると自分を燃え尽きさせます。", meridianDetail: "心・小腸（心陽中心）", pillars: ["夜更かしを習慣にしない","汗をかきすぎたら必ず補う","喜びすぎて気を散らさない","午後の眠気には逆らわず短く休む","夏の養生を大切にする"] },
  丁: { metaphor: "灯火（とうか）", description: "暗闇の中で一点を確かに温める、ろうそくのような繊細な火 ― それが、あなたの本質です。繊細さは相手に深く届きますが、内側ではあなたの心陰と血を少しずつ削っていきます。", meridianDetail: "心・小腸（心陰・神中心）", pillars: ["眠りの質を最優先する","夜の照明を落とす","少しの食を温かくいただく","人混みに長くいない","夏中盤の養生を大切にする"] },
  戊: { metaphor: "大地（だいち）", description: "動かないがゆえに、すべての命の土台になる、雄大な大地や山 ― それが、あなたの本質です。どっしりした安定感は周囲を安心させますが、雨を吸いすぎれば泥になり、太陽を浴びなければ凍えます。", meridianDetail: "脾・胃（脾陽中心）", pillars: ["冷たい飲み物を続けない","食べすぎを続けない","湿気の多い季節は身体を動かす","思い悩みを内側に貯めない","土用の養生を大切にする"] },
  己: { metaphor: "田畑（でんぱた）", description: "人の手で耕され、季節ごとに作物を抱きとめ、命を育てる柔らかな田畑 ― それが、あなたの本質です。育てる力は周囲を確かに育てますが、土自身の養分が痩せれば、どんな種も育たなくなります。", meridianDetail: "脾・胃（脾陰・胃陰中心）", pillars: ["家族や仕事のついでに食べない","よく噛む","冷たいものと脂濃いものを続けない","水分の取り方を整える","土用の養生を大切にする"] },
  庚: { metaphor: "刀剣（とうけん）", description: "よく研がれた一振りの刀。要るものと要らないものを瞬時に見分け、不必要なものをすっと断ち切る ― それが、あなたの本質です。切り分ける鋭さは頼もしいですが、刃を使い続ければ、鋭さを失い欠けていきます。", meridianDetail: "肺・大腸（肺気中心）", pillars: ["深い呼吸を意識する","乾いた空気の中で長く話さない","便通の質を毎朝確認する","悲しみを内側に貯めない","秋初の養生を大切にする"] },
  辛: { metaphor: "宝石（ほうせき）", description: "長い時間をかけて磨かれ、わずかな光を受けて深く美しく輝く密度の高い金 ― それが、あなたの本質です。細やかな感受性は宝石としての価値を高めますが、密度ゆえに強い打撃には割れやすい。", meridianDetail: "肺・大腸（肺陰中心）", pillars: ["乾いた空気を長く吸わない","香りの強い場所を避ける","加湿と白い食材を意識する","悲しみを内側に貯めない","秋中盤の養生を大切にする"] },
  壬: { metaphor: "大海（たいかい）", description: "底の見えない深さと広さを持ち、岸辺の形に合わせて流れる大海・大河 ― それが、あなたの本質です。包む力は周囲に安心を与えますが、太陽の温もりがなければ表面から冷えていきます。", meridianDetail: "腎・膀胱（腎陽中心）", pillars: ["腰と下腹を冷やさない","冷たい飲み物を続けない","恐れを抱え込まない","耳と聴覚を大切にする","冬初の養生を大切にする"] },
  癸: { metaphor: "雨露（うろ）", description: "葉先から滴り、土にしみ通り、見えないところまで命を育む雨露 ― それが、あなたの本質です。しみ通る力は深く届きますが、補われる速度より使う速度が早ければ、源は静かに細っていきます。", meridianDetail: "腎・膀胱（腎陰・腎精中心）", pillars: ["眠りの深さを最優先する","房中（夫婦の営み）に節度を持つ","聴覚と耳を大切にする","骨と歯と髪のケアを怠らない","冬中盤の養生を大切にする"] },
};

function calcTsuhen(dayStem: string, targetStem: string): string {
  const dG = STEM_GOGYO[dayStem], tG = STEM_GOGYO[targetStem];
  const sameYY = STEM_IS_YIN[dayStem] === STEM_IS_YIN[targetStem];
  if (tG === dG) return sameYY ? "比肩" : "劫財";
  if (tG === (dG + 1) % 5) return sameYY ? "食神" : "傷官";
  if (tG === (dG + 2) % 5) return sameYY ? "偏財" : "正財";
  if (tG === (dG + 3) % 5) return sameYY ? "偏官" : "正官";
  return sameYY ? "偏印" : "印綬";
}
const JUNIKO_12 = ["長生","沐浴","冠帯","建禄","帝旺","衰","病","死","墓","絶","胎","養"];
const JUNIKO_START: Record<string, string> = { 甲:"亥",乙:"午",丙:"寅",丁:"酉",戊:"寅",己:"酉",庚:"巳",辛:"子",壬:"申",癸:"卯" };
function calcJuniko(dayStem: string, branch: string): string {
  const startIdx = BRANCHES.indexOf(JUNIKO_START[dayStem]);
  const targetIdx = BRANCHES.indexOf(branch);
  const diff = STEM_IS_YIN[dayStem] ? (startIdx - targetIdx + 12) % 12 : (targetIdx - startIdx + 12) % 12;
  return JUNIKO_12[diff];
}
const JUNIKO_GROUP: Record<string, string> = { 長生:"成長期",冠帯:"成長期",建禄:"成長期",帝旺:"充実期",衰:"深化期",病:"深化期",死:"転換期",墓:"転換期",絶:"転換期",胎:"再生期",養:"再生期",沐浴:"浄化期" };

type BigRun = { stem: string; branch: string; tsuhen: string; juniko: string; group: string; ageStart: number; ageEnd: number };
function computeBigRuns(monthStem: string, monthBranch: string, dayStem: string, yearStem: string, gender: "male" | "female") {
  const yearYin = STEM_IS_YIN[yearStem];
  const forward = (gender === "male" && !yearYin) || (gender === "female" && yearYin);
  const qiYunAge = forward ? 7 : 5;
  const mSi = STEMS.indexOf(monthStem), mBi = BRANCHES.indexOf(monthBranch);
  const runs: BigRun[] = [];
  for (let i = 0; i < 10; i++) {
    const step = i + 1;
    const sIdx = forward ? (mSi + step) % 10 : (mSi - step + 100) % 10;
    const bIdx = forward ? (mBi + step) % 12 : (mBi - step + 120) % 12;
    const stem = STEMS[sIdx], branch = BRANCHES[bIdx];
    const juniko = calcJuniko(dayStem, branch);
    runs.push({ stem, branch, tsuhen: calcTsuhen(dayStem, stem), juniko, group: JUNIKO_GROUP[juniko] ?? "—", ageStart: qiYunAge + i * 10, ageEnd: qiYunAge + i * 10 + 9 });
  }
  return { runs, forward, qiYunAge };
}

function pad2(n: number): string { return String(n).padStart(2, "0"); }

function PillarCard({ label, pillar, dayStem, isDay = false }: { label: string; pillar: Pillar; dayStem: string; isDay?: boolean }) {
  const tenStars = getPillarTenStars(dayStem, pillar);
  return (
    <div className="flex flex-col items-center">
      <span className="text-[0.7rem] tracking-[0.3em] text-[#1A3A5C]/70 sm:text-xs">{label}</span>
      <span className="mt-2 text-xs tracking-[0.15em] text-[#1A3A5C]/70 sm:text-sm">{isDay ? "日干" : tenStars.stem}</span>
      <div className="mt-2 flex w-full flex-col items-center rounded-md border border-[#C8A951]/60 bg-white/70 px-3 py-5 shadow-sm sm:px-5 sm:py-7">
        <span className="text-4xl font-medium leading-none text-[#1A3A5C] sm:text-5xl md:text-6xl">{pillar.stem}</span>
        <span className="mt-3 text-4xl font-medium leading-none text-[#C8A951] sm:mt-4 sm:text-5xl md:text-6xl">{pillar.branch}</span>
      </div>
      <span className="mt-2 text-[0.65rem] tracking-[0.2em] text-[#1A3A5C]/55 sm:text-xs">{getTwelveFortune(dayStem, pillar.branch)}</span>
      <span className="mt-2 text-[0.65rem] tracking-[0.15em] text-[#1A3A5C]/60 sm:text-xs">{STEM_YOMI[pillar.stem]}・{BRANCH_YOMI[pillar.branch]}</span>
      <span className="mt-2 text-[0.6rem] leading-tight tracking-[0.1em] text-[#1A3A5C]/45 sm:text-[0.7rem]">蔵干 {getHiddenStems(pillar.branch).join("・")}</span>
      <span className="mt-1 text-[0.55rem] leading-tight tracking-[0.1em] text-[#1A3A5C]/70 sm:text-[0.65rem]">{tenStars.hidden.join("・")}</span>
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
  const [currentGender, setCurrentGender] = useState<"male" | "female">(SAMPLE.gender);

  function handleCalculate() {
    const birth: BirthInfo = { year, month, day, hour, minute, longitude: SAMPLE.longitude, latitude: SAMPLE.latitude, gender };
    setChart(getSajuChartFromBirth(birth));
    setCurrentGender(gender);
  }
  const dateValue = `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
  const timeValue = `${pad2(hour)}:${pad2(minute)}`;
  function handleDateChange(value: string) {
    const [y, m, d] = value.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) { setYear(y); setMonth(m); setDay(d); }
  }
  function handleTimeChange(value: string) {
    const [h, mi] = value.split(":").map(Number);
    if (Number.isFinite(h) && Number.isFinite(mi)) { setHour(h); setMinute(mi); }
  }

  const dayStem = chart.day.stem;
  const profile = STEM_PROFILES[dayStem];
  const stemFull = STEM_FULL[dayStem];
  const meridian = STEM_TO_MERIDIAN[dayStem];
  const gogyo = GOGYO_NAME[dayStem];
  const { runs, forward, qiYunAge } = computeBigRuns(chart.month.stem, chart.month.branch, dayStem, chart.year.stem, currentGender);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age--;
  const currentRunIndex = runs.findIndex((r) => r.ageStart <= age && age <= r.ageEnd);

  return (
    <main className="flex flex-1 flex-col items-center bg-[#FAFAF7] px-6 py-16 text-center text-[#1A3A5C] font-[family-name:var(--font-noto-serif-jp)]">
      <h1 className="text-5xl font-medium tracking-[0.3em] sm:text-6xl md:text-7xl"><span>経絡</span><span className="text-[#C8A951]">命式</span></h1>
      <p className="mt-8 text-sm tracking-[0.2em] sm:text-base md:text-lg">鍼灸師監修 ─ AI 養生鑑定</p>
      <div className="mt-12 h-px w-16 bg-[#C8A951]" aria-hidden="true" />
      <p className="mt-12 text-xs tracking-[0.25em] opacity-80 sm:text-sm">ゆかわ鍼灸マッサージ治療院 ─ 養生鑑定サービス</p>

      <section className="mt-16 w-full max-w-xl rounded-md border border-[#C8A951]/40 bg-white/60 p-7 text-left shadow-sm">
        <p className="text-sm leading-loose sm:text-base">この鑑定書は、占いではありません。</p>
        <p className="mt-3 text-sm leading-loose sm:text-base">四柱推命の命式から、あなたの身体の傾向と養生の方針を読み解く ― 札幌の鍼灸師、湯川研一が32年の臨床から書いた、養生の実践書です。</p>
        <p className="mt-3 text-sm leading-loose sm:text-base">下のフォームに生年月日を入れると、<strong className="text-[#C8A951]">あなたの命式・大運・養生方針のサンプル</strong>がご覧いただけます。完全版（100ページ）も無料でお受け取りいただけます。</p>
      </section>

      <section className="mt-16 w-full max-w-md">
        <h2 className="text-sm leading-relaxed tracking-[0.2em] sm:text-base">あなたの生年月日と<wbr />出生時刻を入力してください</h2>
        <div className="mx-auto mt-4 h-px w-10 bg-[#C8A951]/70" aria-hidden="true" />
        <div className="mt-10 flex flex-col gap-6">
          <label className="flex flex-col items-start gap-2 text-left">
            <span className="text-xs tracking-[0.2em] text-[#1A3A5C]/70">生年月日</span>
            <input type="date" value={dateValue} onChange={(e) => handleDateChange(e.target.value)} min="1900-01-01" max="2100-12-31" className="w-full rounded-md border border-[#C8A951]/60 bg-white/70 px-4 py-3 text-base text-[#1A3A5C] shadow-sm outline-none focus:border-[#1A3A5C]" />
          </label>
          <label className="flex flex-col items-start gap-2 text-left">
            <span className="text-xs tracking-[0.2em] text-[#1A3A5C]/70">出生時刻</span>
            <input type="time" value={timeValue} onChange={(e) => handleTimeChange(e.target.value)} className="w-full rounded-md border border-[#C8A951]/60 bg-white/70 px-4 py-3 text-base text-[#1A3A5C] shadow-sm outline-none focus:border-[#1A3A5C]" />
          </label>
          <label className="flex flex-col items-start gap-2 text-left">
            <span className="text-xs tracking-[0.2em] text-[#1A3A5C]/70">性別</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")} className="w-full rounded-md border border-[#C8A951]/60 bg-white/70 px-4 py-3 text-base text-[#1A3A5C] shadow-sm outline-none focus:border-[#1A3A5C]">
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </label>
          <button type="button" onClick={handleCalculate} className="mt-2 rounded-md bg-[#1A3A5C] px-6 py-3 text-sm tracking-[0.3em] text-white shadow-sm transition-opacity hover:opacity-90">命式を計算する</button>
        </div>
      </section>

      <section className="mt-20 w-full max-w-2xl">
        <h2 className="text-base tracking-[0.3em] sm:text-lg">命式</h2>
        <div className="mx-auto mt-4 h-px w-10 bg-[#C8A951]/70" aria-hidden="true" />
        <p className="mt-4 text-xs tracking-[0.15em] text-[#1A3A5C]/70 sm:text-sm">日干「<span className="font-medium text-[#C8A951]">{dayStem}</span>」（{stemFull}）・本質経絡：<span className="font-medium text-[#C8A951]">{meridian}</span></p>
        <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-5">
          <PillarCard label="年柱" pillar={chart.year} dayStem={dayStem} />
          <PillarCard label="月柱" pillar={chart.month} dayStem={dayStem} />
          <PillarCard label="日柱" pillar={chart.day} dayStem={dayStem} isDay />
          {chart.hour && <PillarCard label="時柱" pillar={chart.hour} dayStem={dayStem} />}
        </div>
      </section>

      {profile && (
        <section className="mt-20 w-full max-w-2xl">
          <h2 className="text-base tracking-[0.3em] sm:text-lg">あなたの本質と養生方針</h2>
          <div className="mx-auto mt-4 h-px w-10 bg-[#C8A951]/70" aria-hidden="true" />
          <div className="mt-10 rounded-md border border-[#C8A951]/50 bg-gradient-to-b from-white to-[#FAFAF7] p-8 text-left shadow-sm">
            <p className="text-2xl font-medium tracking-[0.15em] text-[#C8A951] sm:text-3xl">{profile.metaphor}</p>
            <p className="mt-4 text-sm leading-loose sm:text-base">{profile.description}</p>
          </div>
          <h3 className="mt-10 text-left text-sm tracking-[0.05em] sm:text-base">あなたの経絡：{profile.meridianDetail}</h3>
          <p className="mt-3 text-left text-sm leading-loose text-[#1A3A5C]/80 sm:text-base">{gogyo}の気は、五臓六腑では <strong className="text-[#C8A951]">{meridian}</strong> に対応します。{dayStem}の人の身体は、この経絡を中心に動いています。</p>
          <h3 className="mt-10 text-left text-sm tracking-[0.05em] sm:text-base">{dayStem}の人の養生・5本柱</h3>
          <div className="mt-3 rounded-md border border-[#C8A951]/30 bg-white/60 p-6">
            <ol className="space-y-3 text-left text-sm sm:text-base">
              {profile.pillars.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#C8A951] text-xs text-white">{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="mt-20 w-full max-w-2xl">
        <h2 className="text-base tracking-[0.3em] sm:text-lg">あなたの大運表（{forward ? "順行" : "逆行"}・{qiYunAge}歳起運）</h2>
        <div className="mx-auto mt-4 h-px w-10 bg-[#C8A951]/70" aria-hidden="true" />
        <div className="mt-8 overflow-x-auto">
          <table className="mx-auto w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#C8A951]/40 text-[#C8A951]">
                <th className="p-2 font-medium tracking-[0.1em]">年代</th>
                <th className="p-2 font-medium tracking-[0.1em]">干支</th>
                <th className="p-2 font-medium tracking-[0.1em]">通変星</th>
                <th className="p-2 font-medium tracking-[0.1em]">十二運</th>
                <th className="p-2 font-medium tracking-[0.1em]">グループ</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={i} className={`border-b border-[#C8A951]/20 ${i === currentRunIndex ? "bg-[#C8A951]/15 font-medium" : ""}`}>
                  <td className="p-2">{r.ageStart}〜{r.ageEnd}歳</td>
                  <td className="p-2">{r.stem}{r.branch}</td>
                  <td className="p-2">{r.tsuhen}</td>
                  <td className="p-2">{r.juniko}</td>
                  <td className="p-2">{r.group}{i === currentRunIndex ? "（現在）" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[0.65rem] text-[#1A3A5C]/50 sm:text-xs">※ 起運年齢は順行7歳・逆行5歳の概算値です（精密版は完全版にて）</p>
      </section>

      <section className="mt-20 w-full max-w-2xl rounded-md border-2 border-[#C8A951] bg-white p-8 text-left shadow-sm">
        <h2 className="text-center text-lg tracking-[0.1em] sm:text-xl">完全版・100ページの養生鑑定書を、無料でお届けします</h2>
        <p className="mt-5 text-sm leading-loose text-[#1A3A5C]/80 sm:text-base">このページに表示したのは、養生鑑定書のほんの入口です。</p>
        <p className="mt-3 text-sm leading-loose text-[#1A3A5C]/80 sm:text-base">完全版では、あなたの命式に基づく <strong className="text-[#C8A951]">養生4分野（食事・睡眠・運動・心）</strong>、現在の大運に応じた <strong className="text-[#C8A951]">これから10年の養生方針</strong>、症状別の <strong className="text-[#C8A951]">養生逆引き辞典30項目</strong>、<strong className="text-[#C8A951]">30日養生ワーク</strong> など、約40,000字・100ページにわたる実践マニュアルをお届けします。</p>
        <div className="mt-6 rounded-md border border-[#C8A951] bg-[#C8A951]/10 p-4 text-center text-sm tracking-[0.05em] text-[#C8A951] sm:text-base">ゆかわ鍼灸マッサージ治療院のサービスとして、無料でご提供しています</div>
        <div className="mt-6 text-center">
          <a href="href="https://ssgform.com/s/https://business.form-mailer.jp/fms/6ef3cf1e352260"" className="inline-block rounded-md bg-[#C8A951] px-10 py-4 text-sm tracking-[0.2em] text-white shadow-sm transition-opacity hover:opacity-90 sm:text-base">完全版をお申込みする →</a>
        </div>
        <p className="mt-4 text-center text-[0.65rem] text-[#1A3A5C]/50 sm:text-xs">※ お申込み後、PDFを5〜10日程度でメールにてお送りします</p>
      </section>

      <section className="mt-20 w-full max-w-2xl rounded-md border border-[#C8A951]/30 bg-white/60 p-7 text-left">
        <h3 className="text-sm tracking-[0.05em] sm:text-base">この鑑定書に書かれていないこと</h3>
        <p className="mt-3 text-sm leading-loose text-[#1A3A5C]/80 sm:text-base">金運・仕事運・恋愛運は、扱いません。鍼灸師の範疇外だからです。命式に出てくる「財星」「官星」も、本書では <strong className="text-[#C8A951]">「気の流れ」「気質の傾向」「対人での消耗の仕方」</strong> として読み替えています。</p>
        <p className="mt-3 text-sm leading-loose text-[#1A3A5C]/80 sm:text-base">あなたが知りたいのは「明日から何をすればいいか」のはず。その問いに、まっすぐお答えする鑑定書です。</p>
      </section>

      <footer className="mt-20 w-full max-w-2xl border-t border-[#C8A951]/30 pt-10 text-center">
        <p className="text-sm tracking-[0.15em] text-[#C8A951] sm:text-base">ゆかわ鍼灸マッサージ治療院</p>
        <p className="mt-2 text-xs text-[#1A3A5C]/70 sm:text-sm">監修 ・ 鑑定：湯川 研一</p>
        <p className="mt-1 text-xs text-[#1A3A5C]/70 sm:text-sm">札幌市中央区南17条西9丁目2-23</p>
        <p className="mt-4 text-[0.65rem] text-[#1A3A5C]/50 sm:text-xs">© 2026 湯川 研一　無断複製・再配布を禁じます</p>
      </footer>
    </main>
  );
}
