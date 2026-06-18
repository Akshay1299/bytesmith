# Bytesmith

### ▶ [**Live app**](https://akshay1299.github.io/bytesmith/)

Fast, **private, in-browser developer tools** for JSON and strings — parse/escape, beautify,
minify, validate, sort keys — with diff and more on the way. Everything runs **client-side**:
your data never leaves the browser.

> A forge for bytes. Built as a clean, extensible full-stack project: a framework-agnostic
> transform core, a React UI, and (soon) a Spring Boot API for share-links and programmatic use.

## Features (v1)

| Tool | What it does |
|------|--------------|
| **JSON Parse String** | Decode an escaped JSON string (`\n`, `\"`, `\uXXXX`) into raw, readable text. |
| **JSON Escape String** | The inverse — turn raw text into a JSON-escaped string. |
| **JSON Beautify** | Pretty-print with configurable indent + optional key sorting. |
| **JSON Minify** | Strip whitespace; reports how much smaller. |
| **JSON Validate** | Validate and summarize shape; errors located by line/column. |
| **JSON Sort Keys** | Recursively sort keys (stable diffs). |

Plus: a real code editor (CodeMirror) with syntax highlighting, **⌘K command palette**,
deep-linkable tools (`#json-beautify`), one-click samples, and copy/paste.

## Architecture

A pnpm monorepo with a deliberately clean separation:

```
bytesmith/
├── packages/
│   ├── core/   # @bytesmith/core — framework-agnostic pure transforms + a Tool registry.
│   │           #   Each tool is a pure (input, options) -> result function. Fully unit-tested.
│   └── web/    # @bytesmith/web — React + Vite UI. Renders whatever the registry exposes,
│               #   so adding a tool never touches the UI (Open/Closed).
└── (planned) server/  # Spring Boot API — share-links + public REST parity.
```

**Design principles:** Open/Closed (register a tool, the UI adapts), Single Responsibility
(one pure function per tool), Dependency Inversion (UI depends on the `Tool` interface only).

## Develop

```bash
pnpm install
pnpm test         # core unit tests (Vitest)
pnpm dev          # web app at http://localhost:5173
pnpm build        # production build of the web app
```

## Roadmap

| Phase | Scope | State |
|------|-------|-------|
| 0 | Monorepo, forge design system, app shell, tool registry | ✅ |
| 1 | JSON & string core tools | ✅ |
| 2 | Diff checker (text + JSON), Web Workers for large inputs | ⬜ |
| 3 | More converters (Base64, URL, JWT, YAML, hashes) | ⬜ |
| 4 | Spring Boot backend — share links + public REST API | ⬜ |
| 5 | PWA/offline, per-tool SEO pages, history | ⬜ |

## Stack

TypeScript · React + Vite · CodeMirror 6 · Framer Motion · pnpm workspaces · (planned) Java 21 + Spring Boot.
