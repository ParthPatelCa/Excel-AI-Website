#!/usr/bin/env python3
import os
import re
import sys

PATTERNS = [
    (re.compile(r"OPENAI_API_KEY\s*=\s*['\"]sk-[A-Za-z0-9]{20,}['\"]"), "OpenAI API key inline"),
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "sk- style secret"),
    (re.compile(r"api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9-_]{16,}['\"]", re.I), "Generic api key assignment"),
    (re.compile(r"bearer\s+[A-Za-z0-9-_]{20,}", re.I), "Bearer token"),
]

IGNORE_DIRS = {'.git', 'node_modules', 'dist', 'build', '.githooks', '.venv', 'venv', '__pycache__', 'playwright-report', 'test-results'}
IGNORE_FILES = {'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'}

def should_skip(path: str) -> bool:
    parts = path.split(os.sep)
    if any(part in IGNORE_DIRS for part in parts):
        return True
    base = os.path.basename(path)
    if base in IGNORE_FILES:
        return True
    return False

def scan_file(path: str):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return []
    findings = []
    for rx, label in PATTERNS:
        for m in rx.finditer(content):
            findings.append((label, path))
            break
    return findings

def main():
    root = os.getcwd()
    findings = []
    for dirpath, dirnames, filenames in os.walk(root):
        if should_skip(dirpath):
            dirnames[:] = []
            continue
        for name in filenames:
            path = os.path.join(dirpath, name)
            if should_skip(path):
                continue
            # Skip env files by design, they are allowed locally
            if name.startswith('.env'):
                continue
            findings.extend(scan_file(path))

    if findings:
        print("[SECRET-SCAN] Potential secrets detected:")
        for label, path in findings:
            print(f" - {label}: {path}")
        print("\nIf these are false positives, adjust tools/secret_scan.py or move secrets to backend .env.")
        return 1
    else:
        print("[SECRET-SCAN] No secrets detected.")
        return 0

if __name__ == '__main__':
    sys.exit(main())


