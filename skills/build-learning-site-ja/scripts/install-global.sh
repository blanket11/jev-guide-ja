#!/usr/bin/env bash
# macOS Bash 3.2 compatible. Adds only this skill; never edits global configuration.
set -euo pipefail
name='build-learning-site-ja'
if [ "$#" -ne 0 ]; then
  printf 'Usage: bash %s\n' "$0" >&2
  exit 2
fi
case "${HOME:-}" in
  /*) ;;
  *) printf 'HOME must be an absolute path.\n' >&2; exit 2 ;;
esac
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
source_dir="$(cd "$script_dir/.." && pwd -P)"
root="$HOME/.agents/skills"
target="$root/$name"
for file in SKILL.md agents/openai.yaml references/editorial.md references/implementation.md assets/chapter-template.md assets/source-log-template.json scripts/audit_content.py scripts/install-global.sh; do
  if [ ! -f "$source_dir/$file" ]; then
    printf 'Incomplete skill: %s\n' "$source_dir/$file" >&2
    exit 2
  fi
done
if ! grep -qx "name: $name" "$source_dir/SKILL.md"; then
  printf 'Unexpected skill name. Nothing was installed.\n' >&2
  exit 2
fi
if [ -n "$(find "$source_dir" -type l -print)" ]; then
  printf 'Source contains symbolic links. Inspect it before installation.\n' >&2
  exit 2
fi
# Check common legacy/global locations. Do not delete or migrate existing copies.
for other in "$HOME/.codex/skills/$name" "${CODEX_HOME:-$HOME/.codex}/skills/$name"; do
  if [ "$other" != "$target" ] && { [ -e "$other" ] || [ -L "$other" ]; }; then
    printf 'Another installation exists: %s\nNothing was overwritten. Reconcile the locations first.\n' "$other" >&2
    exit 3
  fi
done
if [ -e "$target" ] || [ -L "$target" ]; then
  if [ -d "$target" ] && diff -qr "$source_dir" "$target" >/dev/null 2>&1; then
    printf 'Already installed with identical contents: %s\n' "$target"
    exit 0
  fi
  printf 'Destination already exists: %s\nNothing was overwritten. Review or back up the existing skill first.\n' "$target" >&2
  exit 3
fi
mkdir -p "$root"
# mkdir fails if a concurrent operation created the target; never merge into it.
mkdir "$target"
if ! cp -R "$source_dir/." "$target/"; then
  printf 'Copy failed. Inspect the newly created directory: %s\n' "$target" >&2
  exit 1
fi
if ! diff -qr "$source_dir" "$target" >/dev/null; then
  printf 'Verification failed. Inspect the copied directory: %s\n' "$target" >&2
  exit 1
fi
printf 'Installed and file contents verified: %s\n' "$target"
printf 'Restart Codex if the skill is not visible, then invoke $%s.\n' "$name"
printf 'This verifies file placement, not recognition by a running Codex session.\n'
