from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import os
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            return self.proxy()
        return super().do_GET()
    def do_POST(self): self.proxy()
    def do_PUT(self): self.proxy()
    def proxy(self):
        data=self.rfile.read(int(self.headers.get('Content-Length',0))) or None
        req=Request('http://127.0.0.1:8000'+self.path,data=data,headers={k:v for k,v in self.headers.items() if k.lower() not in ['host','content-length']},method=self.command)
        try: res=urlopen(req)
        except HTTPError as e: res=e
        self.send_response(res.status)
        self.send_header('Content-Type',res.headers.get('Content-Type','application/json'))
        self.end_headers(); self.wfile.write(res.read())
os.chdir(os.path.join(os.path.dirname(__file__),'../frontend/dist'))
ThreadingHTTPServer(('127.0.0.1',5173),Handler).serve_forever()
