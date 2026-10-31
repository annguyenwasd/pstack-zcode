#!/usr/bin/env node
// Print zcode's transcripts directory, or this session's transcript file.
//
//   node zcode-project-dir.mjs [--session-file] [workspace]
//
// zcode keeps every session's model I/O transcript in one flat directory,
// $HOME/.zcode/cli/rollout, as model-io-sess_<session-id>.jsonl — shared by
// every project on the machine, with no per-project subdirectory. With no
// flag this prints the rollout directory. --session-file prints the one
// model-io file for this session, resolved from ZCODE_SESSION_ID (or
// CLAUDE_SESSION_ID as the zcode hook runtime injects it), or the newest
// model-io file when no id is known. A workspace argument is accepted and
// checked so callers of the upstream helper keep working. Exits 1 when the
// directory does not exist, and --session-file exits 1 when the directory
// holds no model-io file.
import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SESSION_ID = /^[A-Za-z0-9._-]+$/;

function sessionFile(rollout, env) {
  if (!existsSync(rollout)) return null;
  const names = readdirSync(rollout).filter((n) => n.startsWith("model-io-") && n.endsWith(".jsonl"));
  const id = env.ZCODE_SESSION_ID || env.CLAUDE_SESSION_ID;
  if (id && SESSION_ID.test(id)) {
    const named = names.find((n) => n.includes(id));
    if (named) return join(rollout, named);
  }
  const newest = names
    .flatMap((n) => {
      const stat = statSync(join(rollout, n), { throwIfNoEntry: false });
      return stat ? [{ n, mtime: stat.mtimeMs }] : [];
    })
    .sort((a, b) => b.mtime - a.mtime)[0];
  return newest ? join(rollout, newest.n) : null;
}

function main(argv) {
  const wantFile = argv[0] === "--session-file";
  const rest = wantFile ? argv.slice(1) : argv;
  if (rest.length > 1) {
    console.error("usage: zcode-project-dir.mjs [--session-file] [workspace]");
    return 2;
  }
  const workspace = rest[0] ? realpathSync(rest[0]) : process.cwd();
  const rollout = join(process.env.ZCODE_HOME || join(process.env.HOME || homedir(), ".zcode"), "cli", "rollout");
  if (!existsSync(rollout)) {
    console.error(`no zcode transcripts directory for ${workspace} (looked at ${rollout})`);
    return 1;
  }
  if (!wantFile) {
    console.log(rollout);
    return 0;
  }
  const file = sessionFile(rollout, process.env);
  if (!file) {
    console.error(`no zcode session transcript for ${workspace} under ${rollout}`);
    return 1;
  }
  console.log(file);
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
