---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
---

# Reflect

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Before fanning out, find this conversation's transcript in zcode's session transcripts directory at `$HOME/.zcode/cli/rollout/` — one flat `model-io-sess_<session-id>.jsonl` per session, shared by every project on the machine. Never glob across that directory: it mixes every project's private chats.

This session's file prints directly:

```bash
node <plugin>/skills/reflect/scripts/zcode-project-dir.mjs --session-file
```

It resolves the session id from the environment (`ZCODE_SESSION_ID`, or `CLAUDE_SESSION_ID` as the hook runtime injects it) and falls back to the newest model-io file. A top-level zcode model-io rollout records no user prompts — its `request.messages` window holds only assistant, tool, and system entries (subagent model-io files carry task prompts, not the session's opening one) — so `find-transcript.mjs` refuses them rather than guess. Read the session file for what the run did (its assistant and tool records carry the reasoning, calls, and results), and for a prior session list the newest files with `ls -t` and open candidates individually; never sweep the directory. If the transcript is unusable, write a tight digest of the session and pass that instead. It lists, one line each in turn order, the user's prompts and corrections as far as the records carry them, the tool calls and their results, and the files touched. It states no diagnosis, verdict, or cause. The reviewers judge the session, not your conclusions about it. `find-transcript.mjs` still serves the upstream per-project layouts, Pi sessions, and Copilot `events.jsonl` the other-runtime mappings describe.

## 2. Spawn three reviewers in parallel

One message, three `Agent` calls, `subagent_type: "general-purpose"`. Reviewers need MCP access to look up the tickets, chat threads, and observability traces the transcript references, so pick a subagent_type that retains MCP access. The prompt forbids file writes. The parent applies edits.

Each reviewer and the synthesizer name a role line in `pstack-models.md` and a default in [Models](#models). Set `model` to that line's value, or to the default if the sheet or the line is missing. Leave `model` unset when the value is `auto` or `inherit-parent`. If the `Agent` tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message. Pick each subagent's reasoning level for the job, per the Subagents section of the **poteto-mode** skill.

| Lens | Role line | Prompt template |
|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Add nothing beside a transcript path, not even a focus note for a long transcript. Reviewers return findings in the `Agent` response body.

## 3. Synthesize

One `Agent` call, `subagent_type: "general-purpose"`, `model` from the `reflect judgment, divergent, synthesizer` line (default in [Models](#models)). It spot-verifies citations through MCP, so pick a subagent_type that retains MCP access. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, or runtime check would enforce more reliably to Backlog. See the **encode-lessons-in-structure** principle skill.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

File each Backlog item to your team's devex or backlog tracker without waiting. Only the Accepted list waits for approval.

Never edit a skill under `plugins/cache/`. Before approval, show its destination, `.zcode/skills/<skill>/` or `$HOME/.zcode/skills/<skill>/`. After approval, copy the skill folder there and edit the copy. Never open a PR or push.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to the **skill-creator** skill and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `skill-creator` and run its description-optimization loop.
- `new skill via skill-creator: <kebab-name>`: hand creation to `skill-creator`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it at `~/.zcode/rules/pstack-models.md`.

- reflect tooling: `GLM-5.3`
- reflect judgment, divergent, synthesizer: `GLM-5.3`

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `GLM-5.3 @xhigh`. Levels in zcode: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without `@` takes the sheet's `default effort` line, a level or `session`, and `session` when the sheet has no such line. In zcode, `session` sets no effort. On other runtimes, follow the platform mapping for `session`. Strip the suffix before reading the model: `inherit-parent` or `auto` still omits `model` at every level, and a model name is passed as `model`. Pass the level as the dispatch's effort field and keep the `subagent_type` you would otherwise use. That is `effort` on the zcode `Agent` call and `reasoning_effort` on Codex's `spawn_agent`. On Muse it is `effort` on a Workflow child; a `subagent_spawn` dispatch keeps the session's effort.
