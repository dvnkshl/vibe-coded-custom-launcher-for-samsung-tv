#!/usr/bin/env python3
"""Verify the pristine friend's source bundle, without contacting any device."""
import hashlib
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    count = 0
    for line in (root / 'SHA256SUMS').read_text().splitlines():
        expected, name = line.split('  ', 1)
        path = root / name
        if path.is_symlink() or not path.resolve().is_relative_to(root) or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise RuntimeError('Integrity check failed for ' + name)
        count += 1
    print(f'All {count} original kit files match SHA256SUMS. No TV action taken.')

if __name__ == '__main__': main()
