#!/bin/sh
set -eu

# zcode's hooks file passes this script's own runtime name.
# Literal plugin paths, so a static reader of the hooks file can follow them.
case "${1:-}" in
  zcode)
    sheet="${ZCODE_HOME:-$HOME/.zcode}/rules/pstack-models.md"
    reader="${CLAUDE_PLUGIN_ROOT}/skills/setup-pstack/scripts/read-sheet.sh"
    ;;
  *)
    echo "session-start.sh: unknown runtime '${1:-}' (expected zcode)" >&2
    exit 2
    ;;
esac

# A sheet that cannot be decoded counts as missing, so injection stays on.
found=0
if [ -f "$sheet" ] && [ -r "$sheet" ] && normalized=$(sh "$reader" "$sheet"); then
  found=1
else
  normalized=
fi
if printf '%s\n' "$normalized" | grep -qx 'session hook: off'; then
  exit 0
fi

# zcode parses hook stdout as one JSON object, so the mandate and the sheet's
# known role lines go out as additionalContext, rebuilt from checked values.
# The hooks directory goes through the environment, since awk expands
# backslash escapes in a -v value.
printf '%s\n' "$normalized" | PSTACK_HOOKS="${CLAUDE_PLUGIN_ROOT}/hooks" LC_ALL=C awk -v found="$found" \
  -f "${CLAUDE_PLUGIN_ROOT}/hooks/json.awk" \
  -f "${CLAUDE_PLUGIN_ROOT}/skills/setup-pstack/scripts/sheet.awk" \
  -f "${CLAUDE_PLUGIN_ROOT}/hooks/zcode-context.awk"
