#!/usr/bin/env python3
"""Build an unsigned design demo from its fixed public-file allowlist."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

def main():
    root = Path(__file__).resolve().parents[1]
    web = root / 'web'
    names = json.loads((root / 'ORIGIN.json').read_text())['widget_files']
    config = ET.parse(web / 'config.xml').getroot()
    app = config.find('{http://tizen.org/ns/widgets}application')
    if app is None or app.attrib['id'] != 'ScenicKit1.Home' or app.attrib['package'] != 'ScenicKit1':
        raise RuntimeError('This builder packages only the separate ScenicKit1 demo identity')
    files = {}
    for name in names:
        path = web / name
        if not path.resolve().is_relative_to(web.resolve()) or path.is_symlink():
            raise RuntimeError('Unexpected file path')
        files[name] = path.read_bytes()
    output = root / 'build' / ('ScenicKit1-' + config.attrib['version'] + '.unsigned.wgt')
    output.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            entry = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED; entry.external_attr = 0o100644 << 16
            archive.writestr(entry, data)
    receipt = {'package': output.name, 'app_id': 'ScenicKit1.Home', 'version': config.attrib['version'],
               'signed': False, 'installed': False, 'demo_only': True,
               'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
               'source_sha256': {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}}
    Path(str(output) + '.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(f'Created {output.name} ({output.stat().st_size:,} bytes). UNSIGNED; no TV action taken.')

if __name__ == '__main__': main()
