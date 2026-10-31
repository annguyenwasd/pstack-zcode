#!/usr/bin/env node
// Apply the Claude Code -> zcode substitution table and validate the result.
//
//   node tools/apply-zcode-port.mjs apply     # rewrite skills/** and docs/reference.md in place
//   node tools/apply-zcode-port.mjs check     # denylist scan only, exit 1 on leftovers
//
// The table is tools/zcode-substitutions.json. `apply` is idempotent: after the
// first pass no pattern matches, so a second run changes nothing.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const table = JSON.parse(readFileSync(join(root, "tools/zcode-substitutions.json"), "utf8"));
const targets = ["plugins/pstack/skills", "plugins/pstack/agents", "docs/reference.md"];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (/\.(md|mjs|sh|json|txt|awk)$/.test(entry.name)) files.push(p);
  }
  return files;
}

const files = targets.flatMap((t) => {
  const p = join(root, t);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

function applyRule(text, rule) {
  let n = 0;
  if (rule.regex) {
    const re = new RegExp(rule.regex, "gm");
    text = text.replace(re, () => { n++; return rule.replacement ?? ""; });
  } else {
    while (text.includes(rule.pattern)) {
      text = text.replace(rule.pattern, rule.replacement);
      n++;
    }
  }
  return [text, n];
}

const mode = process.argv[2] ?? "check";
if (mode === "apply") {
  let total = 0;
  for (const file of files) {
    let text = readFileSync(file, "utf8");
    const before = text;
    for (const rule of table.substitutions) [text] = applyRule(text, rule);
    if (text !== before) { writeFileSync(file, text); total++; }
  }
  console.log(`applied substitutions to ${total} of ${files.length} files`);
}

let bad = 0;
const hitFiles = new Set();
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);
  for (const line of text.split("\n")) {
    for (const rule of table.denylist) {
      if (rule.allowFiles?.includes(rel)) continue; // allowlisted provenance file
      if (new RegExp(rule.regex).test(line)) {
        console.error(`${rel}: ${rule.hint}\n    ${line.trim().slice(0, 160)}`);
        bad++;
        hitFiles.add(rel);
      }
    }
  }
}
console.log(bad === 0 ? `denylist clean across ${files.length} files` : `${bad} denylist hits in ${hitFiles.size} files`);
process.exitCode = bad === 0 ? 0 : 1;
