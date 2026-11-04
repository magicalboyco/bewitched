"""Static file server for local development.

Avoids relying on os.getcwd() (stdlib http.server's CLI does, via an
argparse default, which can fail under some sandboxed/restricted
environments) by resolving the project root from this script's own path
and passing it explicitly to the request handler.
"""
import functools
import http.server
import socketserver
from pathlib import Path

PORT = 8422
ROOT = Path(__file__).resolve().parent.parent

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    with Server(('127.0.0.1', PORT), handler) as httpd:
        print(f'Serving {ROOT} on http://127.0.0.1:{PORT}')
        httpd.serve_forever()