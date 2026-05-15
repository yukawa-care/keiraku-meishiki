export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FAFAF7] px-6 py-16 text-center text-[#1A3A5C] font-[family-name:var(--font-noto-serif-jp)]">
      <h1 className="text-5xl font-medium tracking-[0.3em] sm:text-6xl md:text-7xl">
        <span>経絡</span>
        <span className="text-[#C8A951]">命式</span>
      </h1>

      <p className="mt-8 text-sm tracking-[0.2em] sm:text-base md:text-lg">
        鍼灸師が監修する東洋占術鑑定
      </p>

      <div
        className="mt-12 h-px w-16 bg-[#C8A951]"
        aria-hidden="true"
      />

      <p className="mt-12 text-xs tracking-[0.25em] opacity-80 sm:text-sm">
        Coming Soon ― 2026年9月リリース予定
      </p>
    </main>
  );
}
