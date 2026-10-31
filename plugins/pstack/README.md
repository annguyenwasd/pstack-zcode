# pstack

Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack) is an opinionated skill stack that improves agent outcomes. This is the zcode port of [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude): the same skills, with the upstream runtime's primitives translated to zcode's tools.

Tell `poteto-mode` your goal and it invokes the workflow that fits: reproduce and root-cause a bug, sketch a design with `architect`, race candidates in `arena`, review a diff with `interrogate`, cut prose with `unslop`. It keeps code concise, simple, and verified, and it reports what it checked.

## What it contains

- Skills: Markdown instructions the agent reads. They appear as `/pstack:<name>` slash commands in zcode.
- Agents: `pstack:poteto-agent`, `pstack:comment-sicko`, and the two thermo-nuclear review subagents.
- A SessionStart hook that injects the poteto-mode routing mandate unless your `~/.zcode/rules/pstack-models.md` sheet turns it off.
- Local scripts for watching and shipping pull requests, orchestrating multi-phase plans, and auditing worktrees.

## Data handling

pstack has no server or telemetry. Anything its skills ask your agent to read, including session transcripts, goes to your model provider. Scripts run locally, and PR tools use your GitHub CLI login.

## Links

- [Skills, slash commands, setup, and model configuration](../../docs/reference.md)
- [Compatibility report](../../COMPATIBILITY.md)
- [Issues and support](https://github.com/annguyenwasd/pstack-zcode/issues)
- [Security policy](../../SECURITY.md)

## License

MIT for this port and its additions, © 2026 Michael Denyer. Original pstack © 2026 Lauren Tan; imported cursor-team-kit skills © 2026 Cursor. See [NOTICE.md](../../NOTICE.md).
