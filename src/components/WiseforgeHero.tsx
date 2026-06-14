import {
  Sparkles,
  Download,
  Wand2,
  BookOpen,
  ArrowRight,
  Twitter,
  Linkedin,
  Instagram,
  Menu,
} from "lucide-react";
import heroForge from "@/assets/hero-forge.svg";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzzbokvigwjottwixh07lwa1p/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export default function WiseforgeHero() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Background video */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen w-full">
        {/* ---------------------------------------------------------------- */}
        {/* Left panel                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative flex w-full flex-col lg:w-[52%]">
          {/* Frosted slab behind the whole panel */}
          <div className="liquid-glass-strong absolute inset-4 rounded-3xl lg:inset-6" />

          <div className="relative flex flex-1 flex-col px-8 py-8 lg:px-12 lg:py-10">
            {/* Nav */}
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="Wiseforge"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-2xl font-semibold tracking-tighter text-white">
                  wiseforge
                </span>
              </div>

              <button
                type="button"
                className="liquid-glass flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white transition-transform hover:scale-105"
              >
                Menu
                <Menu className="h-4 w-4" />
              </button>
            </header>

            {/* Hero center */}
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <img
                src="/logo.svg"
                alt="Wiseforge"
                width={80}
                height={80}
                className="mb-8 h-20 w-20"
              />

              <h1 className="max-w-[14ch] text-6xl font-medium leading-[1.02] tracking-[-0.05em] text-white lg:text-7xl">
                Forging the{" "}
                <em className="font-serif text-white/80">spirit</em> of simple
                AI
              </h1>

              <button
                type="button"
                className="liquid-glass-strong mt-10 flex items-center gap-3 rounded-full py-2 pl-7 pr-2 text-base text-white transition-transform hover:scale-105 active:scale-95"
              >
                Start Building
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <Download className="h-4 w-4" />
                </span>
              </button>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {["Custom AI Models", "Custom Websites", "Backend Engineering"].map(
                  (pill) => (
                    <span
                      key={pill}
                      className="liquid-glass rounded-full px-4 py-2 text-xs text-white/80"
                    >
                      {pill}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Bottom quote */}
            <footer className="flex flex-col items-center text-center">
              <span className="text-xs uppercase tracking-widest text-white/50">
                Engineered Simplicity
              </span>

              <blockquote className="mt-3 max-w-md text-xl leading-snug text-white">
                <span className="font-display">We build the </span>
                <span className="font-serif italic text-white/80">complex</span>
                <span className="font-display"> so you stay </span>
                <span className="font-serif italic text-white/80">simple</span>
                <span className="font-display">.</span>
              </blockquote>

              <div className="mt-5 flex items-center gap-4">
                <span className="h-px w-10 bg-white/20" />
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  The Wiseforge Team
                </span>
                <span className="h-px w-10 bg-white/20" />
              </div>
            </footer>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Right panel (desktop only)                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative hidden w-[48%] flex-col px-6 py-8 lg:flex lg:px-10 lg:py-10">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="liquid-glass flex items-center gap-4 rounded-full px-5 py-2.5">
              <a
                href="#"
                aria-label="Twitter"
                className="text-white transition-colors hover:text-white/80"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-white transition-colors hover:text-white/80"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-white transition-colors hover:text-white/80"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <ArrowRight className="h-4 w-4 text-white/60" />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="liquid-glass rounded-full px-5 py-2.5 text-sm text-white transition-transform hover:scale-105"
              >
                Account
              </button>
              <button
                type="button"
                aria-label="AI assistant"
                className="liquid-glass flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Community card */}
          <div className="liquid-glass mt-8 w-56 rounded-3xl p-5">
            <h3 className="text-lg font-medium text-white">Enter our forge</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              Join the makers shipping custom models, sites, and backends with
              ruthless simplicity.
            </p>
          </div>

          {/* Bottom feature section */}
          <div className="liquid-glass mt-auto rounded-[2.5rem] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass rounded-3xl p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Wand2 className="h-4 w-4 text-white" />
                </span>
                <h4 className="mt-4 text-base font-medium text-white">
                  Processing
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Train and fine-tune custom AI models on your own data.
                </p>
              </div>

              <div className="liquid-glass rounded-3xl p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <BookOpen className="h-4 w-4 text-white" />
                </span>
                <h4 className="mt-4 text-base font-medium text-white">
                  Growth Archive
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Every build, versioned and documented as you scale.
                </p>
              </div>
            </div>

            {/* Bottom card */}
            <div className="liquid-glass mt-4 flex items-center gap-4 rounded-3xl p-4">
              <img
                src={heroForge}
                alt="Heavy backend engineering"
                width={96}
                height={64}
                className="h-16 w-24 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white">
                  Heavy Backend Engineering
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Robust, scalable systems forged for every solution.
                </p>
              </div>
              <button
                type="button"
                aria-label="Add"
                className="liquid-glass flex h-9 w-9 items-center justify-center rounded-full text-lg text-white transition-transform hover:scale-105"
              >
                +
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
