#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Локальный сервер для сайта-портфолио.
Запускает http://localhost:8000 и позволяет панели admin.html сохранять content.js напрямую
через POST /save (кнопка «Сохранить»).

Запуск:  python server.py
         или  py server.py  (Windows)
Откройте: http://localhost:8000/admin.html
"""
import http.server
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == "/save":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            # Пишем в content.js атомарно
            target = os.path.join(DIRECTORY, "content.js")
            tmp = target + ".tmp"
            try:
                with open(tmp, "wb") as f:
                    f.write(body)
                os.replace(tmp, target)
                self.send_response(200)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(b"OK")
                print(f"[save] content.js обновлён ({len(body)} байт)")
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode("utf-8"))
                print(f"[save] ошибка: {e}", file=sys.stderr)
            return
        self.send_error(404)

    def end_headers(self):
        # Кэш отключаем, чтобы видеть правки сразу
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

if __name__ == "__main__":
    print(f"Папка сайта: {DIRECTORY}")
    print(f"Сервер запущен: http://localhost:{PORT}/")
    print(f"Админка:        http://localhost:{PORT}/admin.html")
    print(f"Сайт:           http://localhost:{PORT}/index.html")
    print("Нажмите Ctrl+C для остановки.")
    try:
        with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановлен.")
