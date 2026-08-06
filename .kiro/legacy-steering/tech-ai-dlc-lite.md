# Tech Stack

## Type

This is a **documentation/configuration-only repository** — no application code, build system, or runtime dependencies. All content is markdown files that define AI workflow rules and steering guidance.

## Format & Standards

- All files are **Markdown** (`.md`)
- Diagrams use **ASCII art** (box-drawing with `+`, `-`, `|`, `^`, `v`, `<`, `>`) — Unicode box-drawing characters are forbidden
- Conditional **Mermaid** diagrams are used in workflow planning artifacts; fall back to text-based representation if Mermaid parsing fails
- Question files use structured `[Answer]:` tag format for machine-readable user input

## IDE / Tooling

- **VS Code** (`.vscode/settings.json` present)
- Kiro MCP integration is disabled (`"kiroAgent.configureMCP": "Disabled"`)

## No Build / Test Commands

There are no build, compile, lint, or test commands — this repo contains only rule definitions and steering documents.
