# Bytesmith

Fast, private, in-browser developer tools. Everything runs client-side — your data never leaves the browser. No ads, no sign-up, no server.

**[Live App](https://akshay1299.github.io/bytesmith/)** · [GitHub](https://github.com/Akshay1299/bytesmith)

---

## Tools

| Group | Tools |
|-------|-------|
| **JSON** | Beautify · Parse String · Minify · Validate · Sort Keys · Escape · Size |
| **Diff** | Text Diff · JSON Diff (semantic, key-order insensitive) — side-by-side, color-coded |
| **Time** | Unix Timestamp (epoch ⇄ Local / UTC / IST / ISO) · Timezone Converter with interactive 3D globe |
| **Generate** | UUID v4 (count / case / hyphen options) |
| **String** | Case Converter (camelCase / PascalCase / snake_case / kebab-case / CONSTANT / Title) |
| **Encode** | Base64 encode/decode · URL encode/decode |

## Highlights

- **Interactive 3D globe** (three.js / globe.gl) for the Timezone Converter — night-Earth city-lights texture, atmosphere glow, auto-rotation, and an animated arc between your two zones. Lazy-loaded so the main bundle stays light.
- **⌘K command palette** with keyword aliases ("format", "unescape", "compress") — find any tool by what you'd type, not just its exact name.
- **CodeMirror 6** editor with JSON syntax highlighting, a custom forge theme, and per-tool isolated state.
- Fully responsive with a mobile slide-in drawer and deep-linkable tool routes (`#json-beautify`).

## Architecture

pnpm monorepo with a clean logic / presentation split:

```
bytesmith/
├── packages/
│   ├── core/   # @bytesmith/core — pure TypeScript. Tool registry + all transform/diff/time logic.
│   │           # Unit-tested with Vitest. Zero React dependency.
│   └── web/    # @bytesmith/web — React + Vite UI. Renders whatever the registry exposes;
│               # bespoke views for rich tools (timezone globe, unix timestamp).
└── .github/workflows/pages.yml   # CI build + deploy to GitHub Pages
```

**Design decisions**

- **Open/Closed** — register a tool and the sidebar, search, and routing pick it up with no UI edits required.
- **Single Responsibility** — every transform is a pure `(input, options) → result` function.
- **Privacy by default** — no backend; CSP + security headers enforced in production (`vercel.json`).

## Tech stack

TypeScript · React · Vite · CodeMirror 6 · Framer Motion · three.js / globe.gl · Vitest · pnpm workspaces

## Local development

```bash
pnpm install
pnpm dev        # start Vite dev server
pnpm test       # run @bytesmith/core unit tests
pnpm build      # production build
pnpm typecheck  # type-check all packages
```

Requires Node 20+ and pnpm.
