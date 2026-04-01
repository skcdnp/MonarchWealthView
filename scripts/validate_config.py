#!/usr/bin/env python3
"""
validate_config.py — CI guard for docs/config.js.

Checks that:
  1. CLIENT_ID is not the placeholder value
  2. SHEET_ID is not the placeholder value
  3. WHITELIST contains at least one non-placeholder email

Run locally:  python scripts/validate_config.py
Run in CI:    called by .github/workflows/deploy.yml before deployment
"""

import re
import sys
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent / "docs" / "config.js"

def main():
    if not CONFIG_PATH.exists():
        print(f"ERROR: {CONFIG_PATH} not found")
        sys.exit(1)

    content = CONFIG_PATH.read_text()
    errors = []

    # Check CLIENT_ID
    match = re.search(r"CLIENT_ID:\s*['\"](.+?)['\"]", content)
    if not match or "YOUR_CLIENT_ID" in match.group(1):
        errors.append("CLIENT_ID is still the placeholder. Set it to your real OAuth Client ID.")

    # Check SHEET_ID
    match = re.search(r"SHEET_ID:\s*['\"](.+?)['\"]", content)
    if not match or "YOUR_GOOGLE_SHEET_ID" in match.group(1):
        errors.append("SHEET_ID is still the placeholder. Set it to your real Google Sheet ID.")

    # Check WHITELIST has at least one real email
    whitelist_match = re.search(r"WHITELIST:\s*\[([^\]]+)\]", content, re.DOTALL)
    if whitelist_match:
        emails = re.findall(r"['\"]([^'\"]+@[^'\"]+)['\"]", whitelist_match.group(1))
        real_emails = [e for e in emails if "your-email" not in e and "example.com" not in e]
        if not real_emails:
            errors.append("WHITELIST has no real email addresses. Add your Gmail address.")
    else:
        errors.append("WHITELIST not found in config.js.")

    if errors:
        print("config.js validation FAILED:")
        for e in errors:
            print(f"  ✗ {e}")
        print()
        print("Edit docs/config.js and fill in the real values before deploying.")
        sys.exit(1)
    else:
        print("config.js validation passed ✓")

if __name__ == "__main__":
    main()
