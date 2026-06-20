/**
 * Phase 1 placeholder home page.
 * Confirms the glassmorphism design tokens, fonts, and background render.
 * Will be replaced by the Play (home) flow in a later phase.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 py-12">
      <div className="glass w-full rounded-glass-lg p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-from to-primary-to text-2xl shadow-glass-lift">
          <span aria-hidden>🥒</span>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink">
          PickleIT
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Automated, fair pickleball rotation across your courts.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-cat-beginner px-3 py-1 text-xs font-medium text-cat-beginnerInk">
            Beginner
          </span>
          <span className="rounded-full bg-cat-intermediate px-3 py-1 text-xs font-medium text-cat-intermediateInk">
            Intermediate
          </span>
          <span className="rounded-full bg-cat-pro px-3 py-1 text-xs font-medium text-cat-proInk">
            Pro
          </span>
        </div>

        <button
          type="button"
          className="mt-7 w-full rounded-full bg-gradient-to-r from-primary-from to-primary-to px-6 py-3 font-heading text-sm font-semibold text-white shadow-glass transition-transform duration-200 ease-overshoot hover:-translate-y-0.5 hover:shadow-glass-lift active:translate-y-0"
        >
          Scaffold ready — build in progress
        </button>

        <p className="mt-4 text-[11px] uppercase tracking-wide text-ink/40">
          Phase 1 · Docker + Next.js + Tailwind theme
        </p>
      </div>
    </main>
  );
}
