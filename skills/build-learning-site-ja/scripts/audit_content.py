#!/usr/bin/env python3
"""Audit the block-style Markdown convention; does NOT verify facts or URLs."""
from __future__ import annotations
import argparse
import fnmatch
import re
from pathlib import Path


def audit(text: str, max_paragraph: int = 180) -> list[tuple[str, str]]:
    issues: list[tuple[str, str]] = []
    lines = text.splitlines()
    visible: list[str] = []
    fence = None
    for line in lines:
        match = re.match(r"^\s*(`{3,}|~{3,})(.*)$", line)
        if fence:
            if match and match[1][0] == fence[0] and len(match[1]) >= len(fence) and not match[2].strip():
                fence = None
            visible.append("")
        elif match:
            fence = match[1]
            visible.append("")
        else:
            visible.append(line)
    if fence:
        issues.append(("ERROR", "閉じられていないコードブロックがあります"))
    prose = "\n".join(visible)
    if re.search(r"\{\{[^\n]*?\}\}|REPLACE_WITH_[A-Z_]+", text):
        issues.append(("ERROR", "テンプレートの置換項目が残っています"))
    if not re.search(r"^##\s+\S", prose, re.M):
        issues.append(("ERROR", "本文の見出し（##）がありません"))
    blocks: list[tuple[str, list[str]]] = []
    kind = None
    body: list[str] = []
    for line in visible:
        if line.strip() == ":::" and kind:
            blocks.append((kind, body))
            kind, body = None, []
        elif re.match(r"^:::\w+", line):
            if kind:
                issues.append(("ERROR", "入れ子または閉じ忘れの独自ブロックがあります"))
            kind = line[3:].split()[0]
            body = []
        elif kind:
            body.append(line)
        elif line.strip() == ":::":
            issues.append(("ERROR", "対応する開始行のない ::: があります"))
    if kind:
        issues.append(("ERROR", f"閉じられていない {kind} ブロックがあります"))
    briefs = [body for kind, body in blocks if kind == "brief"]
    if len(briefs) != 1:
        issues.append(("ERROR", "briefブロックは章に1つ必要です"))
    elif sum(bool(re.match(r"^-\s+", line)) for line in briefs[0]) != 3:
        issues.append(("ERROR", "冒頭の要点は3項目に整理してください"))
    diagrams = [body for kind, body in blocks if kind in ("flow", "cards")]
    if not diagrams:
        issues.append(("ERROR", "flowまたはcardsの図解がありません（対象外の記事は除外してください）"))
    elif any(sum(" | " in line and not line.startswith("!") for line in body) < 2 for body in diagrams):
        issues.append(("ERROR", "図解には2つ以上の具体的な項目が必要です"))
    if not re.search(r"\[[^\]\n]+\]\(https?://[^\s)]+\)", prose):
        issues.append(("ERROR", "本文中に参照元の外部リンクがありません"))
    if not any(kind == "answer" for kind, _ in blocks):
        issues.append(("WARN", "確認問題のanswerブロックがありません"))
    paragraph: list[str] = []
    def flush() -> None:
        value = "".join(paragraph)
        if len(value) > max_paragraph:
            issues.append(("WARN", f"長い段落（{len(value)}文字）があります。意味を残して分割を検討してください"))
        paragraph.clear()
    for line in visible + [""]:
        if not line.strip() or re.match(r"^(#{1,6}\s|[-*]\s|\d+[.)]\s|:::|!\s)", line) or " | " in line:
            flush()
        else:
            paragraph.append(line.strip())
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("--exclude", action="append", default=[], help="除外するファイル名または相対パスのglob。複数指定可")
    parser.add_argument("--max-paragraph", type=int, default=180, help="長い段落を警告する文字数。品質の合否基準ではありません")
    args = parser.parse_args()
    if args.max_paragraph < 1:
        parser.error("--max-paragraph must be positive")
    files: set[Path] = set()
    for root in args.paths:
        if not root.exists():
            parser.error(f"path not found: {root}")
        candidates = [root] if root.is_file() else root.rglob("*.md")
        for path in candidates:
            relative = str(path.relative_to(root)) if root.is_dir() else path.name
            if not any(fnmatch.fnmatch(relative, rule) or fnmatch.fnmatch(path.name, rule) for rule in args.exclude):
                files.add(path)
    if not files:
        parser.error("no files to audit")
    errors = warnings = 0
    for path in sorted(files):
        try:
            result = audit(path.read_text(encoding="utf-8"), args.max_paragraph)
        except (OSError, UnicodeError) as exc:
            result = [("ERROR", str(exc))]
        for level, message in result:
            print(f"{level} {path}: {message}")
            errors += level == "ERROR"
            warnings += level == "WARN"
    print(f"{len(files)} files; {errors} errors; {warnings} warnings. 事実確認・URL疎通・ブラウザー検証は別途必要です。")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
