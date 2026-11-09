# Retro Game Portfolio — Design Spec

**Date:** 2026-11-09
**Site:** agungputrap.github.io
**Scope:** Full visual redesign of the single-page portfolio into a 16-bit console aesthetic with a decorative three.js hero backdrop.

---

## 1. Goals & non-goals

### Goals
- Replace the current light Tailwind page with a dark, 16-bit console–styled portfolio that still reads as professional to a recruiter.
- Add a live, animated hero backdrop using three.js without compromising text legibility, SEO, or mobile performance.
- Remove the Tailwind CDN runtime dependency; ship hand-written CSS and ES modules.
- Keep the site a zero-build, push-to-deploy GitHub Pages project.

### Non-goals
- No full game shell, no WASD navigation, no scroll-driven 3D world, no interactive hero object.
- No content authored into canvas or images.
- No light theme, no CMS, no analytics, no contact form, no i18n.
- No build tooling, bundler, or CI workflow.

---

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Ambition | Direction A — retro skin over existing layout | Lowest risk to hiring legibility; content stays in DOM |
| Visual language | 16-bit console | Best long-form readability of the three comps; distinct from the terminal-portfolio trope |
| three.js role | Ambient hero backdrop only | Atmosphere, not navigation or content |
| Stack | No build; drop Tailwind; three.js, fonts, and icons vendored in-repo | One-page site; Tailwind CDN is a runtime compiler and fights custom CSS |
| Extras | Boot screen, sound + mute, SEO/social tags | Confirmed by user |

---

## 3. File layout

```
index.html
assets/
  css/retro.css
  js/starfield.js
  js/ui.js
  js/vendor/three.module.min.js
  js/vendor/three.core.js
  fonts/press-start-2p.woff2
  fonts/silkscreen-400.woff2
  fonts/silkscreen-700.woff2
  fonts/OFL.txt
  icons/*.svg
  me.png
  me.jpg
  favicon.ico
  og-card.html
  og-image.png
docs/superpowers/specs/2026-11-09-retro-portfolio-design.md
```

- `index.html` holds all content as semantic HTML. It must be complete and readable with CSS, JS, and WebGL all disabled.
- `retro.css` contains tokens, resets, and components. No utility framework.
- `starfield.js` is a module that owns only the 3D scene.
- `ui.js` is a module that owns boot screen, sound, and any progressive enhancement. Loaded with `defer`.
- Both JS files are `type="module"` and must fail silently.

---

## 4. Design tokens

Defined once as CSS custom properties on `:root` in `retro.css`.

### Palette
| Token | Value | Use |
|---|---|---|
| `--bg` | `#14162a` | Page background |
| `--bg-deep` | `#0a0b16` | Canvas/boot background, hard shadows, borders |
| `--panel` | `#1d2140` | Card and section panels |
| `--panel-hi` | `#262b52` | Hover state for panels |
| `--ink` | `#d9dcf2` | Body text |
| `--ink-dim` | `#a3a9c9` | Secondary text, dates |
| `--title` | `#fff2c8` | Headings |
| `--blue` | `#41a6f6` | Primary actions, company names |
| `--green` | `#7fe3a0` | Success, checks, skill accents |
| `--yellow` | `#f9c333` | Role badge, focus ring |
| `--purple` | `#c86bd8` | Category badges |
| `--red` | `#ff5c5c` | Achievement bullet |

### Type
| Role | Family | Size | Notes |
|---|---|---|---|
| Name | Press Start 2P | 16–24px (clamp) | 1.8 line-height, `--title`, 4px hard shadow |
| Section titles | Press Start 2P | 12–14px | Uppercase, prefixed `01 ·` |
| Card titles | Press Start 2P | 12–15px | 1.7 line-height |
| Badges | Press Start 2P | 9–10px | Never longer than ~3 words |
| Body | Silkscreen 400 | 15–16px | 1.85 line-height, `--ink` |
| Body emphasis | Silkscreen 700 | inherit | `--green` or `--yellow` |
| Buttons | Press Start 2P | 9–10px | Uppercase |

Rules:
- Press Start 2P is **never** used below 9px or for paragraphs.
- Fonts are self-hosted woff2, `font-display: swap`, preloaded via `<link rel="preload" as="font" crossorigin>`, with a system fallback stack of `ui-monospace, monospace`.
- `OFL.txt` ships alongside the fonts (both are SIL OFL 1.1).

### Spacing & rhythm
- 8px base scale: 8 / 16 / 24 / 32 / 48 / 64 / 96.
- Content column: `min(1040px, 100% - 48px)`, centered.
- Section spacing: 96px desktop, 64px mobile.

---

## 5. Components

All components are plain classes in `retro.css`.

### `.panel`
- `background: var(--panel)`, `border: 3px solid var(--bg-deep)`.
- `box-shadow: 5px 5px 0 var(--bg-deep), inset 3px 3px 0 rgba(255,255,255,.10), inset -3px -3px 0 rgba(0,0,0,.35)`.
- `border-radius: 0`.

### `.btn`
- Base: `.panel` styling scaled down, `padding: 14px 18px`, `cursor: pointer`.
- Variants: `.btn--primary` (blue), `.btn--success` (green), `.btn--gold` (yellow). Text color is `--bg-deep` for contrast.
- Hover/focus: translate +1px/+1px and reduce shadow offset to 3px, simulating a physical press. Disabled under reduced motion.
- Rendered on real `<a>` elements; no JS click handlers required.

### `.badge`
- Press Start 2P, 9–10px, `--purple` background, `--bg-deep` text, `padding: 5px 9px`, 2px hard shadow.
- Alternate `.badge--gold` (yellow) and `.badge--blue`.

### `.list`
- No list-style; each `li` gets a `::before` glyph: `♥` (`--red`) for achievements, `★` (`--yellow`) for awards, `▸` (`--green`) for generic bullets.
- Glyphs are decorative; the text carries the meaning.

### Focus
- `:focus-visible` → `outline: 3px solid var(--yellow); outline-offset: 3px`. Always visible on the dark background; never removed.

---

## 6. Page composition

Section order is unchanged from the current page.

1. **Skip link** — first focusable element, visible on focus.
2. **Top bar** — small fixed bar with `AP` mark and the sound toggle. Not sticky-animated.
3. **Hero**
   - Avatar in a bordered portrait panel with the `AP` initials plate beneath.
   - `h1` name (Press Start 2P), role in a `.badge--gold`, existing intro paragraph, three buttons (Email / GitHub / LinkedIn).
   - `.hero` is `position: relative`, contains the three.js canvas as `position: absolute; inset: 0; z-index: 0; pointer-events: none`, with content at `z-index: 1`.
4. **01 · Featured Portfolio** — two `.panel`s (SEATrax, Digitalisasi SIP). Category as `.badge`, title, body, achievement list, and the external link as `.btn--primary` with the existing SVG icon.
5. **02 · Experience** — quest-log panels. Each role: date range as a Press Start 2P "level" plate on the left, title + company (company in `--blue`), bullets.
6. **03 · Skills & Technologies** — power-up tiles: a flex wrap of `.panel` tiles, each with the existing devicon `<img>` and label. Icons get `image-rendering: pixelated` only if scaled; otherwise left as-is.
7. **04 · Education** — single panel, university + degree, "Graduated" plate.
8. **Footer** — `© <year> Agung Putra Pasaribu` plus a "INSERT COIN TO CONTINUE" line.

Section headings are real `h2` elements; the `01 ·` prefix is inside a `<span aria-hidden="true">` so screen readers announce only the label.

---

## 7. Boot screen

- Injected by `ui.js` only; never present in the HTML, so no-JS and crawler views are unaffected and there is no flash of overlay.
- Fixed, full-viewport, `--bg-deep` background, centered "PRESS START" in Press Start 2P with a blinking block cursor.
- Auto-dismisses after **1200ms**, or immediately on click/Enter/Space/Escape.
- Dismissal is a 200ms opacity fade; the element is then removed from the DOM.
- Shown **once per browser session** via `sessionStorage` key `ap.boot`; if storage is unavailable, show it anyway (fail open, once per load).
- Skipped entirely when `prefers-reduced-motion: reduce` is set.
- Marked `aria-hidden="true"` and never receives focus. Focus is not moved, so keyboard users are unaffected.
- If the page is hidden (`visibilitychange`) before dismissal, dismiss immediately on return.

---

## 8. Sound

- Synthesized with the Web Audio API. No audio files.
- Sounds: `select` (square wave, ~660Hz, 40ms), `confirm` (two-note 660→990Hz, 90ms), `toggle` (330Hz, 30ms).
- Master gain 0.04; no oscillators are created until the AudioContext exists.
- **Default: enabled**, but the AudioContext is created only on the first user gesture (click or keypress), per browser autoplay policy. No sound can fire before that, including hover.
- Connection points: button hover (`select`), button/link click (`confirm`), sound toggle (`toggle`).
- A toggle button in the top bar shows `SOUND: ON` / `SOUND: OFF`, is a real `<button>` with `aria-pressed`, and persists the choice in `localStorage` under `ap.sound`.
- Muted state stops all scheduling; hovering muted elements produces nothing.
- Sound never conveys information that isn't also visible.

---

## 9. three.js scene

### Load strategy
- `starfield.js` is loaded as a module. It performs `await import('./vendor/three.module.min.js')` against the copy vendored in the repo, so there is no runtime CDN dependency and no importmap.
- three.js **r187** is vendored. That release splits its build: `three.module.min.js` imports `./three.core.js`, so both files must ship together and the core file keeps the exact name the module requests. Bumping three means replacing both files.
- The import happens after `window.load` plus `requestIdleCallback` (with a `setTimeout` fallback), so it never competes with first paint.
- The whole scene init is wrapped in `try/catch`; any failure leaves the CSS fallback in place.

### Preconditions — scene is skipped when any is true
- `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
- `window.innerWidth < 768`
- WebGL context creation fails
- `navigator.connection.saveData` is true

### Scene
- `WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })`.
- `setPixelRatio(Math.min(devicePixelRatio, 2))`.
- `PerspectiveCamera(60, w/h, 0.1, 200)`, `camera.z = 40`.
- `THREE.Points` with `BufferGeometry`:
  - Count: `Math.min(1400, Math.round(innerWidth * 0.9))`.
  - Distribution: random within `x ∈ [-60, 60]`, `y ∈ [-40, 40]`, `z ∈ [-20, 40]`, sized 0.4–1.4.
  - Color: sampled from `--title`, `--blue`, `--green`.
  - `PointsMaterial({ size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false })`.
- Motion: constant slow upward drift plus pointer parallax. Pointer offset is eased toward the target at 0.04/frame; drift and parallax are scaled by clamped delta time so the speed is frame-rate independent.
- No lights, no postprocessing, no controls, no shadows.

### Lifecycle
- `ResizeObserver` on the hero (debounced 150ms) updates size, camera aspect, and pixel ratio.
- `IntersectionObserver` on the hero pauses the render loop when it leaves the viewport.
- `visibilitychange` pauses when the document is hidden.
- The loop resumes only when both the hero is visible and the document is visible.
- Canvas gets `aria-hidden="true"`, `role="presentation"`, and `pointer-events: none`.

### Fallback
- `.hero` carries a CSS background of small radial-gradient dots on `--bg-deep`, visible at all times. The canvas simply draws over it when active, so there is no layout shift and no empty state.

---

## 10. Accessibility requirements

- Every text/background pair meets WCAG AA (4.5:1 body, 3:1 large). `--ink` on `--panel` and `--bg`, `--title` on `--panel`, and dark text on all accent buttons are verified; any pair that fails is adjusted before merge.
- Logical heading order: one `h1`, `h2` per section, `h3` per card/role.
- All interactive elements are native and keyboard reachable; no custom widgets.
- Skip link to `#main`.
- `prefers-reduced-motion: reduce` disables: starfield, boot screen, hover transforms, blinking cursor, and all transitions longer than 0.01s.
- The page is fully usable with JS disabled: boot screen absent, sound absent, static star background, all content visible.
- Forced-colors mode is checked; borders remain visible because they are real borders, not shadows alone.

---

## 11. Performance budget

| Item | Budget | Measured |
|---|---|---|
| Own CSS (uncompressed) | < 16 KB | 14.8 KB (3.4 KB gzip) |
| Own JS (uncompressed, excluding three) | < 8 KB each | 5.2 KB starfield, 4.3 KB ui |
| Fonts total | < 70 KB | 28 KB woff2 |
| three.js | lazy, must not block LCP | 195 KB gzip, deferred to idle |
| LCP (4G, mobile) | < 1.8s | 1.5s |
| CLS | < 0.05 | 0.048 (hero copy reflows on font swap) |
| Long tasks at load | none > 100ms | 110ms once, from parsing the deferred three.js |

Techniques: no framework, no Tailwind runtime, preloaded fonts with `display: swap`, explicit width/height on the avatar and devicon images, `loading="lazy"` + `decoding="async"` on below-fold images, and the deferred three.js import described above.

---

## 12. SEO & social

- `<title>`: `Agung Putra Pasaribu — Full Stack Developer & Solution Architect`
- `<meta name="description">`: 140–160 chars summarizing the 10+ years, Java/Go/PHP, and current government role.
- `<link rel="canonical" href="https://agungputrap.github.io/">`
- Open Graph: `og:type=website`, `og:title`, `og:description`, `og:url`, `og:image` (absolute URL to `assets/og-image.png`, 1200×630).
- Twitter: `summary_large_image`.
- JSON-LD `Person`: `name`, `jobTitle`, `url`, `sameAs` (GitHub, LinkedIn), `alumniOf` (Universitas Indonesia), `worksFor` (Ministry of Communication and Digital Affairs).
- `og-image.png` is produced by rendering a 1200×630 static HTML card in the same 16-bit style and screenshotting it at that exact size; the source card is kept at `assets/og-card.html` for future regeneration.
- `theme-color` meta set to `#14162a`.

---

## 13. Content changes

- Hero copy: change **"8+ years"** → **"10+ years"** to match the 2015 start date.
- Experience: the 2022–2024 Core Initiative Studio role is labelled **(Part-time)** — confirmed by the user as concurrent part-time work alongside the full-time Ministry role.
- All other copy carries over verbatim; no rewriting, no new claims.

---

## 14. Verification checklist

Run before considering the redesign complete:

1. Lighthouse (mobile) — performance ≥ 95, accessibility 100, best practices 100, SEO 100.
2. axe DevTools — zero critical/serious issues.
3. Keyboard-only pass: skip link, all links/buttons, visible focus, boot screen never traps focus.
4. `prefers-reduced-motion: reduce` — no starfield, no boot screen, no transforms.
5. JavaScript disabled — full content readable, static star background, no layout breakage.
6. WebGL disabled — page looks complete, only the motion is missing.
7. Responsive: 320px, 375px, 768px, 1024px, 1440px; 200% browser zoom.
8. Browsers: Chrome, Safari, Firefox, iOS Safari, Android Chrome.
9. Social preview validators for OG/Twitter tags.
10. Two full reloads: boot screen appears once per session, sound preference persists, no console errors.

### Results (2026-11-09)

- Lighthouse (mobile emulation): performance **99**, accessibility **100**, best practices **100**, SEO **100**.
- DOM audit: no duplicate IDs, every image has an `alt` (decorative icons use `alt=""`), no broken in-page anchors, heading order `h1 → h2 → h3`.
- Contrast: all 13 text/background pairs pass WCAG AA (lowest is 5.16:1).
- No horizontal overflow at 390px or 1440px (`scrollWidth === innerWidth`).
- Reduced motion: no canvas, no boot screen.
- Boot screen: appears on a fresh session, auto-dismisses, sets `ap.boot`.
- Keyboard: first Tab lands on the skip link.
- No-JS: all copy is in the served HTML; the boot screen and starfield are absent by construction.

---

## 15. Out of scope

Direction B/C, scroll-driven 3D, interactive hero object, game navigation, sound on page load, light theme, analytics, contact form, blog, and any build tooling. If the site later needs these, they get their own spec.

---

## 16. Risks

| Risk | Mitigation |
|---|---|
| Vendored three split-build mismatch (module imports a missing core file) | Both `three.module.min.js` and `three.core.js` ship together; a missing core fails silently to the CSS star fallback. |
| Pixel fonts hurting readability | Press Start 2P restricted to headings/badges; Silkscreen for all body copy; tested at 320px and 200% zoom. |
| Sound annoying on shared machines | Mute toggle always visible; no audio before a user gesture; preference persisted. |
| Boot screen feeling like a blocker | 1200ms cap, any input dismisses, once per session, skipped for reduced motion, absent without JS. |
| three.js version drift | The dependency is vendored, so it cannot drift underneath the page; upgrading is a deliberate two-file replacement. |
