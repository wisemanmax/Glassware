# Wiseforge

The host of simplicity — we build **custom AI models**, **custom websites**, and **heavy backend engineering** for all solutions.

A full-screen liquid glass-morphism hero landing page built with React, TypeScript, and Tailwind CSS over a looping muted video background, in a strict grayscale palette.

## Stack

- **React + TypeScript** (Vite)
- **Tailwind CSS**
- **lucide-react** icons
- **Google Fonts:** Poppins (display/body) + Source Serif 4 (italic accent)

## Design notes

- **Two-tier liquid glass** defined under `@layer components` in `src/index.css`:
  - `.liquid-glass` — light tier (`blur(4px)`).
  - `.liquid-glass-strong` — heavy tier (`blur(50px)`) for the CTA and panels.
  - Gradient borders are drawn with a masked `::before` using `mask-composite: exclude` — no `border` classes anywhere.
- **Strict grayscale** — every CSS variable is an `0 0% X%` HSL value.
- **Two-panel split** — a glass content slab on the left (`w-[52%]`), floating glass widgets on the right (`w-[48%]`, desktop only).

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
```
