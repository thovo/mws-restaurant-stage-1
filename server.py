#!/usr/bin/env python
import http

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Cache-Control", "max-age=86400")


if __name__ == '__main__':
    http.server.test(HandlerClass=MyHTTPRequestHandler)