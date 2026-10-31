#!/usr/bin/env node
// File-by-file coverage gate: every file the upstream repo ships must map to a
// disposition in this repository. Prints counts and exits 1 when a file is
// unaccounted for or a claimed port is missing.
//
//   node tools/coverage.mjs            # table + counts
//   node tools/coverage.mjs --markdown # markdown fragment for COMPATIBILITY.md
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const upstreamRoot = process.argv[2] ?? "/tmp/pstack-upstream";

const renamed = new Map([
  [".claude-plugin/marketplace.json", ".zcode-plugin/marketplace.json"],
  ["plugins/pstack/.claude-plugin/plugin.json", "plugins/pstack/.zcode-plugin/plugin.json"],
  ["plugins/pstack/skills/reflect/scripts/claude-project-dir.mjs", "plugins/pstack/skills/reflect/scripts/zcode-project-dir.mjs"],
]);
// same path, but the zcode port rewrote the content
const rewritten = new Set([
  "README.md", "docs/reference.md", "plugins/pstack/README.md",
  "plugins/pstack/models.json", "plugins/pstack/hooks/hooks.json",
  "plugins/pstack/hooks/session-start.sh",
]);

const dropPrefixes = [
  ".codex-plugin/", ".agents/", ".github/", "tests/", "lean/", "tla/",
  "plugins/pstack/.codex-plugin/", "plugins/pstack/pi/",
  "plugins/pstack/.github/", "plugins/pstack/.muse-plugin/",
];
const dropNames = new Set([
  "bun.lock", "bunfig.toml", "package.json", "CONTEXT.md", "CONTRIBUTING.md",
  "CHANGES.md", ".gitignore", ".markdownlint-cli2.jsonc", ".pre-commit-config.yaml",
  "docs/pi-equivalence.md",
  "plugins/pstack/.claude-plugin/icon.png",
  "plugins/pstack/hooks/codex-hooks.json",
  "plugins/pstack/hooks/copilot-hooks.json",
  "plugins/pstack/hooks/copilot-context.awk",
  "plugins/pstack/hooks/muse-context.awk",
  "plugins/pstack/hooks/session-start.ps1",
  "plugins/pstack/hooks/session-start-copilot.md",
  "plugins/pstack/hooks/session-start-copilot-sheet.md",
  "plugins/pstack/hooks/session-start-copilot-setup.md",
  "plugins/pstack/hooks/session-start-muse.md",
  "plugins/pstack/hooks/session-start-muse-sheet.md",
]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.name === ".git") continue;
    if (entry.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

const upstreamFiles = walk(upstreamRoot).map((f) => relative(upstreamRoot, f)).sort();
const rows = [];
const missing = [];

for (const f of upstreamFiles) {
  if (dropNames.has(f)) {
    rows.push([f, "dropped", dropReason(f)]);
    continue;
  }
  if (dropPrefixes.some((p) => f.startsWith(p))) {
    rows.push([f, "dropped", dropReason(f)]);
    continue;
  }
  if (f.startsWith("tools/")) {
    rows.push([f, "replaced", "upstream build tooling; this repo ships tools/zcode-substitutions.json + tools/apply-zcode-port.mjs + tools/coverage.mjs instead"]);
    continue;
  }
  const target = renamed.get(f) ?? f;
  if (existsSync(join(root, target))) {
    rows.push([f, rewritten.has(f) ? "rewritten" : renamed.has(f) ? "renamed" : "ported", target]);
  } else {
    rows.push([f, "MISSING", target]);
    missing.push(f);
  }
}

function dropReason(f) {
  if (f.includes(".codex-plugin")) return "Codex-runtime packaging; zcode-only repo";
  if (f.includes("/pi/") || f.includes("pi-equivalence")) return "Pi-runtime extension and docs; zcode-only repo";
  if (f.includes(".muse-plugin") || f.includes("muse")) return "Muse-runtime packaging; zcode-only repo";
  if (f.includes("copilot") || f.includes(".github/plugin")) return "GitHub Copilot packaging; zcode-only repo";
  if (f.startsWith(".github/")) return "upstream CI and issue templates for the multi-runtime build";
  if (f.startsWith("tests/")) return "upstream test harness for its build tooling; zcode port verified by tools/apply-zcode-port.mjs + live hook checks";
  if (f.startsWith(".agents/")) return "Codex marketplace catalog; zcode marketplace lives at .zcode-plugin/marketplace.json";
  return "upstream repo infra (multi-runtime build configs)";
}

const counts = {};
for (const [, d] of rows) counts[d] = (counts[d] ?? 0) + 1;
const total = rows.length;

if (process.argv.includes("--markdown")) {
  console.log("| upstream file | disposition | here |");
  console.log("| --- | --- | --- |");
  for (const [f, d, t] of rows) console.log(`| ${f} | ${d} | ${t} |`);
} else {
  for (const [f, d, t] of rows) if (d === "MISSING") console.error(`MISSING: ${f} -> ${t}`);
  console.log(`upstream files: ${total}`);
  for (const k of ["ported", "rewritten", "renamed", "replaced", "dropped", "MISSING"]) console.log(`${k}: ${counts[k] ?? 0}`);
}
process.exitCode = missing.length === 0 ? 0 : 1;
