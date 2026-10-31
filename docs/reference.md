# pstack reference (zcode)

Start with the [README](../README.md) for installation and your first task. This port targets zcode only; for the Codex, Pi, GitHub Copilot, and Muse builds of the same skills tree, see the upstream repository [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude).

## Slash commands

The plugin includes 67 skill directories: 43 public skills and 24 `principle-*` references. In zcode, invoke `/pstack:<name>`; each skill is also loadable by its bare name.

Find each skill's instructions in the [skills tree](../plugins/pstack/skills/).

| command | use it when |
| --- | --- |
| `/poteto-mode` | default entry point for any non-trivial task |
| `/how` | walk through how a subsystem works |
| `/why` | investigate why something was built this way (parallel multi-MCP evidence) |
| `/architect` | settle types and module shape before writing code that crosses a function boundary |
| `/arena` | run N parallel attempts at the same task and pick the best parts |
| `/interrogate` | have three different models try to break a diff |
| `/automate-me` | draft your own personal -mode skill from recent transcripts |
| `/reflect` | capture a long task's lessons as a skill edit |
| `/correct` | find the mistakes agents keep repeating in a repo and make each one impossible, enforced at the highest level that works |
| `/tdd` | fix a bug by writing the failing test first, then the fix |
| `/benchmark-checklist` | vet a measured speedup or regression (limiter, tuning, errors, repeat runs, end-to-end relevance) before you report or act on it |
| `/typescript-best-practices` | ground type-system discipline in TypeScript syntax |
| `/teach` | explain a subsystem plainly by composing how + why |
| `/swarm` | fan out N parallel workers across slices or races, then return one aggregated report |
| `/technical-writing` | write docs, RFCs, readmes, PR descriptions, and commit messages to one layered standard |
| `/bro` | restate the last message in plain human language, no jargon |
| `/in-your-own-words` | play back your goal and the problem before the agent starts |
| `/sharpen` | make a task deeper, not bigger, by naming what a top expert would do and what would show the result is right, then rewrite the prompt to ask for that |
| `/figure-it-out` | design a rigorous, auditable playbook for a task no bundled playbook fits |
| `/show-me-your-work` | log decisions to a reviewable tsv decision trail |
| `/blast-radius` | find what a change could break beyond the diff and prove safety by running code |
| `/recall` | catch up on recent working context from chat history, live state, and the shared record |
| `/ketchup` | catch up on everything in this chat since your last message, with an executive summary for each action item |
| `/ketchup-video` | get the `/ketchup` catch-up as a short silent video of slides, with the calls waiting on you as text under it |
| `/setup-pstack` | configure pstack per-role model choices |
| `/poteto-help` | answer a question about pstack with the prompt to send and the file the answer came from |
| `/unslop` | clean up writing by removing AI tells |
| `/no-comments` | strip comments before review, fix the accepted findings, encode claimed constraints |
| `/create-verification-skill` | generate a project-local verification skill and feature map |
| `/maintain-verification-skill` | re-sync a drifted verification skill and its feature map |
| `/create-formal-verification-skill` | generate a project-local skill that formally verifies one high-risk property |
| `/maintain-formal-verification-skill` | re-sync a formal verification after the code it covers changed |
| `/statechart` | check a TLA+ model and draw it as a Mermaid statechart, with the shortest path to each state that breaks a rule |
| `/deslop` | deslop a diff before commit |
| `/babysit` | monitor an open PR, fix CI/comments, keep it merge-ready |
| `/thermo-nuclear-review` | audit a branch's changes for bugs, breakage, security issues, devex regressions, and feature-gate leaks |
| `/thermo-nuclear-code-quality-review` | extremely strict maintainability audit |
| `/thermos` | run both thermo-nuclear reviews as parallel subagents and synthesize their findings |
| `/make-pr-easy-to-review` | clean noisy history and improve PR description before review |
| `/fix-ci` | find failing PR checks, inspect logs, apply focused fixes |
| `/fix-merge-conflicts` | non-interactively resolve merge conflicts, validate, finalize |
| `/get-pr-comments` | fetch and summarize review comments from the active PR |
| `/what-did-i-get-done` | summarize authored commits over a user-chosen period |

## Runtime support

zcode installs the plugin from the marketplace in [`.zcode-plugin/marketplace.json`](../.zcode-plugin/marketplace.json). Skills use zcode tool names (`Agent`, `Skill`, `AskUserQuestion`, `TodoWrite`), zcode paths, and zcode model defaults; the plugin installs automatic routing and its four subagent definitions.

| Runtime | Setup and recorded verification |
| --- | --- |
| zcode | Add this repository as a marketplace and install the pstack plugin. Skills, agents, and the SessionStart routing hook load natively; the sheet, hook, and transcript helper were verified live in a zcode session. Other runtimes are out of scope for this port; see the upstream repository for their builds. |

### Automatic routing

The plugin's [SessionStart hook](../plugins/pstack/hooks/hooks.json) fires on `startup|resume|clear|compact` and runs [`session-start.sh`](../plugins/pstack/hooks/session-start.sh), which prints the [routing instruction](../plugins/pstack/hooks/session-start-context.md) as JSON `additionalContext`. When the model sheet exists, the hook appends one line per known role from the sheet, rebuilt from checked values by the same POSIX `awk` validator `setup-pstack` uses; a missing sheet adds a note that says to run `setup-pstack` first, and `session hook: off` in the sheet disables injection entirely. The instruction invokes `poteto-mode` when a task meets any of these conditions:

- It touches more than one file or changes a signature other files call.
- It involves a design or architecture choice.
- It concerns a bug with an unknown cause or a performance issue.

Smaller tasks proceed directly. The full skill loads when invoked, and explicit user instructions take precedence.

To disable routing, run `setup-pstack` and turn off the session hook, or write `session hook: off` in the sheet at `~/.zcode/rules/pstack-models.md`. The hook reads that setting before injecting its instruction. Without the setting, routing stays on.

## Configuration and dependencies

Invoke [setup-pstack](../plugins/pstack/skills/setup-pstack/SKILL.md) to choose models for each role. It detects available models, confirms the choices, and writes the override sheet at `~/.zcode/rules/pstack-models.md`. Its [runtime table](../plugins/pstack/skills/setup-pstack/SKILL.md#other-runtimes) names the sheet path and loading mechanism. Defaults live in [models.json](../plugins/pstack/models.json).

For design comparisons and reviews, choose distinct models available to your runtime. The default panel uses `GLM-5.3` and `GLM-5.3-Flash`.

Install dependencies for the workflows you use:

| Dependency | When you need it |
| --- | --- |
| GitHub CLI, `gh` | PR monitoring, shipping, and the `orch` stack frontier. Authenticate with `gh auth login`. The playbooks use Origin's CLI, `origin`, instead when it can resolve the repository. |
| Bun | The bundled `watch-pr` and `orch` scripts. Their bootstrap installs script dependencies on first run. |
| `skill-creator` | zcode skill-authoring guidance used by `automate-me`, `reflect`, and `poteto-mode`. It ships with zcode's bundled official plugins. |

Those authoring workflows need `skill-creator` for their guidance; other workflows do not.

Playbooks use the session's task-tracking tools or an uncommitted `todo.md` checklist. In zcode this is `TodoWrite`; see [platform adaptation](../plugins/pstack/skills/poteto-mode/SKILL.md#platform-adaptation).

Use [create-verification-skill](../plugins/pstack/skills/create-verification-skill/SKILL.md) to record how the agent should run and check your project, following the [driver policy](../plugins/pstack/skills/poteto-mode/SKILL.md#non-negotiables).

## Maintenance

### Repository layout

```text
.zcode-plugin/marketplace.json    zcode marketplace
plugins/pstack/
  .zcode-plugin/plugin.json      zcode plugin manifest
  skills/                        Skills, references, and scripts
  agents/                        Subagent definitions
  hooks/                         SessionStart routing hook and tool-check scripts
  models.json                    Per-role model defaults (zcode)
tools/zcode-substitutions.json   rewrite rules from the upstream port
tools/apply-zcode-port.mjs       Applies the rules and validates the result
docs/reference.md                This reference
```

### Port checks

After editing skill text, run:

```shell
node tools/apply-zcode-port.mjs check
```

It scans the skills tree and this reference against the denylist in [zcode-substitutions.json](../tools/zcode-substitutions.json) — upstream paths, upstream env vars, upstream CLI calls, upstream model names, and the Cursor-era skill names — and exits 1 with file-and-line hits when any survive. `apply` re-applies the substitution rules first; it is idempotent.

### Port scope and attribution

The skill tree is synced against upstream pstack-claude `ab1f702` (skill tree v0.15.35, plugin version 0.9.114), itself a port of Lauren Tan's pstack from Cursor to the Claude Code harness. This repository ports that plugin to zcode: the plugin manifest and marketplace move to `.zcode-plugin/`, the SessionStart hook gains a zcode runtime that emits JSON `additionalContext`, the transcript helper and audit script read zcode's rollout directory, the model sheet lives at `~/.zcode/rules/pstack-models.md`, and skill text speaks zcode tool names, paths, and models. [tools/zcode-substitutions.json](../tools/zcode-substitutions.json) holds the rewrite rules, and [COMPATIBILITY.md](../COMPATIBILITY.md) records the per-file disposition and compatibility percentages.

It includes six cursor-team-kit skills, the three thermos skills with their two review subagents, and an independently authored `babysit` skill, carried over unchanged in role from upstream. The bundled `thermo-nuclear-code-quality-review` provides a maintainability review when a workflow calls for one, `thermo-nuclear-review` a correctness and security audit, and `thermos` runs both as parallel subagents.

See the [license summary](../README.md#license) for licenses and full-plugin attribution. [NOTICE-skills.md](../NOTICE-skills.md) is the notice for skills-only installations.
