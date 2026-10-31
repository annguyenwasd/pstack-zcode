# pstack for zcode

**This plugin targets zcode only. It is a 100% port** of [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude) — every skill, agent, hook, and script the upstream plugin ships is carried over and adapted to zcode, file by file. The per-file disposition and compatibility percentages are recorded in [COMPATIBILITY.md](COMPATIBILITY.md).

pstack is Lauren Tan's ([poteto](https://github.com/poteto)) opinionated skill stack: rigorous agent workflows you can parallelize with confidence. Tell `poteto-mode` your goal and it invokes the workflow that fits: reproduce and root-cause a bug, sketch a design with `architect`, race candidates in `arena`, review a diff with `interrogate`, cut prose with `unslop`. It keeps code concise, simple, and verified, and it reports what it checked. Michael Denyer ported it from Cursor to Claude Code; this repository ports that plugin to zcode.

## Install

1. In zcode, open **Settings → Plugin Management → Discover**, click **`+`**, and add this repository as a marketplace: `annguyenwasd/pstack-zcode`.
2. Install the **pstack** plugin. It is enabled by default.
3. Run `/pstack:setup-pstack` once to pick your per-role models. It writes the override sheet at `~/.zcode/rules/pstack-models.md`; the SessionStart hook reads it from then on.

## What it contains

- **67 skills** (43 public + 24 `principle-*` references): invoke `/pstack:<name>`; the bare `/<name>` form also resolves. The menu starts at `/pstack:poteto-mode`, the default entry point for any non-trivial task.
- **4 subagents**: `pstack:poteto-agent`, `pstack:comment-sicko`, `pstack:thermo-nuclear-review-subagent`, `pstack:thermo-nuclear-code-quality-review-subagent`.
- **A SessionStart hook** that injects the poteto-mode routing mandate on `startup|resume|clear|compact`, as JSON `additionalContext`, with your saved role lines from the model sheet.
- **Local scripts** for watching and shipping pull requests, orchestrating multi-phase plans, and auditing worktrees (`plugins/pstack/skills/poteto-mode/scripts/`).

## zcode adaptations

- Plugin manifest and marketplace live at `.zcode-plugin/` (zcode's preferred probe path).
- The SessionStart hook runs `session-start.sh zcode` and emits strict-schema JSON `additionalContext`; the model sheet lives at `~/.zcode/rules/pstack-models.md` and is referenced from `~/.zcode/AGENTS.md`.
- Transcript helpers read zcode's session store at `~/.zcode/cli/rollout/` (`skills/reflect/scripts/zcode-project-dir.mjs`).
- Model tiers default to `GLM-5.3` / `GLM-5.3-Flash` in [`plugins/pstack/models.json`](plugins/pstack/models.json); `/pstack:setup-pstack` adapts them to the models you actually have.
- Skill text speaks zcode tool names (`Agent`, `Skill`, `AskUserQuestion`, `TodoWrite`), zcode paths, and zcode models throughout. The rewrite rules live in [`tools/zcode-substitutions.json`](tools/zcode-substitutions.json); run `node tools/apply-zcode-port.mjs check` to verify the tree stays clean.

## Upstream parity

Synced against upstream pstack-claude at `5851c89` (plugin version `0.9.114`; the skill tree itself carries poteto/pstack's pin `ab1f702`, v0.15.35). Upstream's multi-runtime packaging (Codex, Pi, GitHub Copilot, Muse) is intentionally not shipped here — this repository is zcode only; see [COMPATIBILITY.md](COMPATIBILITY.md) for the exact accounting.

## Data handling

pstack has no server or telemetry. Anything its skills ask your agent to read, including session transcripts, goes to your model provider. Scripts run locally, and PR tools use your GitHub CLI login.

## License

MIT for this port and its additions, © 2026 Michael Denyer. Original pstack © 2026 Lauren Tan; imported cursor-team-kit skills © 2026 Cursor. See [NOTICE.md](NOTICE.md) and [LICENSE](LICENSE).
