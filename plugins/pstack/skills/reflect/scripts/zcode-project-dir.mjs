#!/usr/bin/env node
// Print zcode's transcripts directory for this session.
//
//   node zcode-project-dir.mjs [workspace]
//
// zcode keeps every session's model I/O transcript in one flat directory,
// $HOME/.zcode/cli/rollout, as model-io-sess_<session-id>.jsonl. There is no
// per-project encoding to build, so with no arguments this prints the rollout
// directory. When the session id is known (ZCODE_SESSION_ID, or
// CLAUDE_SESSION_ID as the zcode hook runtime injects it), the matching
// model-io file is printed after the directory when it exists. With a
// workspace argument the directory is checked to exist and printed the same
// way; the argument is accepted so callers of the upstream helper keep
// working. Exits 1 when the directory does not exist.
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SESSION_ID = /^[A-Za-z0-9._-]+$/;

function sessionFile(rollout, env) {
  const id = env.ZCODE_SESSION_ID || env.CLAUDE_SESSION_ID;
  if (!id || !SESSION_ID.test(id) || !existsSync(rollout)) return null;
  return readdirSync(rollout).find((n) => n.includes(id) && n.endsWith(".jsonl")) ?? null;
}

function main(argv) {
  if (argv.length > 1) {
    console.error("usage: zcode-project-dir.mjs [workspace]");
    return 2;
  }
  const workspace = argv[0]
    ? realpathSync(argv[0])
    : process.cwd();
  const rollout = join(process.env.ZCODE_HOME || join(process.env.HOME || homedir(), ".zcode"), "cli", "rollout");
  if (!existsSync(rollout)) {
    console.error(`no zcode transcripts directory for ${workspace} (looked at ${rollout})`);
    return 1;
  }
  console.log(rollout);
  const file = sessionFile(rollout, process.env);
  if (file) console.log(join(rollout, file));
  return 0;
}

// node leaves argv[1] unresolved and may set it to a non-file (`node -e ... arg`).
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  process.exitCode = main(process.argv.slice(2));
}
