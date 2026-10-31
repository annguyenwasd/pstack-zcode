# Compatibility report: pstack-zcode vs upstream pstack-claude

Upstream: [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude) `5851c89` (plugin version 0.9.114, skill tree v0.15.35). This repository: **zcode only, 100% port**.

**Bottom line: 100% of the runtime surface — skills, slash commands, agents, hooks, and scripts — is ported and works on zcode.** Every one of the 784 files upstream ships is accounted for below (see [File disposition](#file-disposition)); nothing is silently dropped.

## Headline percentages

| Surface | Upstream | Ported | Adapted for zcode | Compatibility |
| --- | --- | --- | --- | --- |
| Skills | 67 skills, 585 files | 67 / 67 (**100%**) | 40 files across 17 skills, +1 renamed script | **100%** |
| Slash commands | skills double as commands (no separate `commands/`) | 67 / 67 invocable as `/pstack:<name>` (bare `/name` resolves too) | — | **100%** |
| Agents | 4 subagent definitions | 4 / 4 (**100%**) | 1 (`poteto-agent.md`: plugin-cache path) | **100%** |
| Hooks (zcode runtime) | 1 SessionStart hook (`hooks.json` + `session-start.sh`) | 1 / 1 (**100%**), verified live | both rewritten for zcode | **100%** |
| Hook files for other runtimes | 10 runtime-specific files (Codex / Copilot / Muse / PowerShell) | 0 — not applicable; dropped, zcode-only. The 3 shared `pre-tool-use` support files ship unwired, exactly as upstream ships them | N/A |
| Models config (`models.json`) | 1 | 1 / 1 (**100%**) | tiers → `GLM-5.3` / `GLM-5.3-Flash`; `codex` / `pi` / `muse` blocks removed | **100%** |
| Bundled scripts (`skills/*/scripts/`, 453 files) | all | all (**100%**) | 2 (`worktree-audit.mjs`, `sheet.awk`) + 1 renamed (`zcode-project-dir.mjs`) | **100%** |

## What was adapted, and to what

| Claude Code mechanism (upstream) | zcode equivalent (this repo) |
| --- | --- |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | `.zcode-plugin/plugin.json`, `.zcode-plugin/marketplace.json` (zcode's preferred manifest probe path) |
| `session-start.sh claude`, plain-text stdout context | `session-start.sh zcode`, strict-schema JSON `additionalContext` (zcode parses hook stdout as JSON) |
| Model sheet at `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/pstack-models.md` | `~/.zcode/rules/pstack-models.md`, referenced from `~/.zcode/AGENTS.md` |
| Transcripts at `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/<encoded-cwd>/` | zcode's flat `$HOME/.zcode/cli/rollout/` store; helper renamed `zcode-project-dir.mjs` with `--session-file` |
| `plugin-dev:skill-development` authoring skill | `skill-creator` (ships with zcode's bundled official plugins) |
| `CLAUDE.md` instructions file | `AGENTS.md` |
| Model tiers `opus` / `fable` / `sonnet` / `haiku` | `GLM-5.3` / `GLM-5.3-Flash` (override sheet adapts per user) |
| `claude mcp list` | MCP servers appear as `mcp__<server>__<name>` tools; `.mcp.json` |
| `CLAUDE_CODE_PLUGIN_CACHE_DIR/.../plugins` plugin cache | `~/.zcode/cli/plugins/cache/` |
| sheet.awk slug charset `[a-z0-9.-]` | widened to zcode model IDs (`account:provider/GLM-5.3`-style IDs validate) |
| `/loop` (Claude Code bundled skill) | the `loop-me` skill |

### The 17 adapted skills

`poteto-mode` (17 files), `reflect` (6), `setup-pstack` (3), `architect`, `arena`, `automate-me`, `babysit`, `create-formal-verification-skill`, `create-verification-skill`, `how`, `interrogate`, `maintain-verification-skill`, `poteto-help`, `recall`, `show-me-your-work`, `swarm`, `why` (1 each). The remaining 50 skills needed no content change beyond the mechanical substitution pass.

The substitution pass is mechanical and auditable: [`tools/zcode-substitutions.json`](tools/zcode-substitutions.json) holds the ordered rewrite rules, [`tools/apply-zcode-port.mjs`](tools/apply-zcode-port.mjs) applies them (idempotent) and enforces a denylist — any surviving Claude path, env var, CLI call, or model name fails the check. Current state: **denylist clean across all 194 content files**.

## File disposition (784 / 784 accounted for)

| Disposition | Files | Meaning |
| --- | --- | --- |
| ported | 604 | shipped here unchanged or after the mechanical substitution pass |
| rewritten | 6 | same path, zcode-specific rewrite (root README, docs/reference.md, plugin README, models.json, hooks.json, session-start.sh) |
| renamed | 3 | `.claude-plugin/*` → `.zcode-plugin/*`, `claude-project-dir.mjs` → `zcode-project-dir.mjs` |
| replaced | 10 | upstream build tooling (`tools/*.mjs`, sync/substitution tables); this repo ships its own `tools/zcode-substitutions.json`, `apply-zcode-port.mjs`, `coverage.mjs` |
| dropped | 161 | with reasons — see below |

Dropped files are exclusively things a zcode-only repository cannot use: Codex packaging (`.codex-plugin/`, 44 files), the Pi extension and its docs (`plugins/pstack/pi/`, `docs/pi-equivalence.md`), GitHub Copilot packaging and hooks, Muse packaging, upstream's multi-runtime CI/test/lean/TLA infrastructure. Each drop is itemized with its reason — run:

```shell
node tools/coverage.mjs --markdown
```

to print the full 784-row table (source: the upstream clone passed as the argument, default `/tmp/pstack-upstream`).

## Verified live

- `session-start.sh zcode`: no sheet → JSON `additionalContext` with the mandate and a run-`setup-pstack`-first note; valid sheet → role lines injected from checked values; `session hook: off` → silent, exit 0.
- `zcode-project-dir.mjs`: prints `~/.zcode/cli/rollout` by default and the session's own `model-io` file with `--session-file` (env session id, newest-file fallback).
- `sheet.awk`: accepts the real zcode sheet (`account:.../GLM-5.3` IDs) after the charset widening; adversarial sheets (quotes, backslashes, UTF-8, CRLF, UTF-16LE) stay rejected.
- `find-transcript.mjs`: refuses zcode rollout files with the pointing error, keeping the upstream/Pi/Copilot readers intact; `worktree-audit.mjs`, which shares only the directory walker, still byte-scans real rollout files.
- `node tools/apply-zcode-port.mjs check`: denylist clean, 194 files.
- `node tools/coverage.mjs`: 784 upstream files, 0 missing.

Agents were additionally confirmed against zcode's live plugin discovery: the upstream agent definitions load as `pstack:comment-sicko` / `pstack:poteto-agent`, exactly the names the skills dispatch.

## Known limits

- The upstream multi-runtime story (Codex, Pi, Copilot, Muse) is out of scope by design. Upstream architecture docs that describe it ship dormant: the four `poteto-mode/references/*-tools.md` mappings (routing conditions exist for other runtimes), the other-runtime rows of setup-pstack's runtime table, and `setup-pstack/copilot.md`. zcode users never route into them.
- zcode exposes no bundled `run` or `verify` skill, so poteto-mode's runtime-verification path resolves through the driver-skill policy in its Non-negotiables and project-local `verify` skills.
- **Transcript capability regression, stated honestly:** Claude Code records each chat message, so upstream's `find-transcript.mjs` locates a session by a fragment of its opening prompt. zcode's rollout files record no user prompts (their windows hold only assistant, tool, and system records), so no fragment match is possible. The port makes that explicit: `find-transcript.mjs` refuses zcode rollout files with a pointing error, `zcode-project-dir.mjs --session-file` resolves the current session's file, and prior sessions open individually from `ls -t`. `reflect`, `recall`, and session pickup work from the session file or a digest, as upstream's own fallback prescribes.
- zcode reads `AGENTS.md` rather than `CLAUDE.md`; the sheet include is a prose reference line (as upstream's Codex row does), because zcode's `@`-include support for AGENTS.md is unverified — the SessionStart hook injects the role lines regardless, so setup works either way.
