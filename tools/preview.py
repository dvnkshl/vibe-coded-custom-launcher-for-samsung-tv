#!/usr/bin/env python3
"""Serve only this kit's public web directory on loopback. No TV access."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8890)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535: parser.error('Port must be between 1 and 65535')
    web = Path(__file__).resolve().parents[1] / 'web'
    handler = partial(SimpleHTTPRequestHandler, directory=str(web))
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'Open http://127.0.0.1:{args.port}/?preview=1', flush=True)
        print('Design demo only. Ctrl+C stops the server.', flush=True)
        try: server.serve_forever()
        except KeyboardInterrupt: pass

if __name__ == '__main__': main()
