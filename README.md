# agungputrap.github.io

Personal portfolio for Agung Putra Pasaribu — a 16-bit console–styled single page with a decorative three.js starfield in the hero.

- No build step. Push to `master` and GitHub Pages serves it as-is.
- Every runtime asset is vendored under `assets/`: three.js (r187), the two OFL fonts, and the tech icons. No CDN calls at runtime.
- All content is semantic HTML and remains fully readable with CSS, JS, or WebGL disabled.
- Design spec: `docs/superpowers/specs/2026-11-09-retro-portfolio-design.md`.

## Structure

```
index.html                 page content and metadata
assets/css/retro.css       design tokens and components
assets/js/ui.js            boot screen, audio toggle, footer year
assets/js/music.js         procedural chiptune loop
assets/js/starfield.js     three.js hero scene (lazy, optional)
assets/js/vendor/          three.module.min.js + three.core.js
assets/fonts/              Press Start 2P, Silkscreen, OFL license
assets/icons/              tech stack SVGs
assets/og-card.html        source for the social preview image
```
