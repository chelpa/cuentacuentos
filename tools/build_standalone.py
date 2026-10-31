#!/usr/bin/env python3
"""Genera la copia independiente de la guía: un solo HTML con CSS, JS e imagen embebidos.

Uso (desde la raíz del proyecto):
    python3 tools/build_standalone.py                 # escribe dist/Para-Cona.html
    python3 tools/build_standalone.py ruta/salida.html

Solo usa la biblioteca estándar de Python. No modifica index.html ni assets/.
"""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]


def build() -> str:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'assets' / 'styles.css').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'app.js').read_text(encoding='utf-8')
    image = base64.b64encode((ROOT / 'assets' / 'portada-cona.webp').read_bytes()).decode('ascii')
    if '</style' in css.lower() or '</script' in js.lower():
        raise SystemExit('El CSS o el JS contienen una etiqueta de cierre que rompería el HTML independiente.')
    replacements = [
        ('<link rel="stylesheet" href="assets/styles.css">', '<style>\n' + css.strip() + '\n</style>'),
        ('<script src="assets/app.js" defer></script>', '<script>\n' + js.strip() + '\n</script>'),
        ('src="assets/portada-cona.webp"', 'src="data:image/webp;base64,' + image + '"'),
    ]
    for old, new in replacements:
        if html.count(old) != 1:
            raise SystemExit(f'No se encontró exactamente una vez: {old}')
        html = html.replace(old, new)
    return html


def main() -> None:
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'Para-Cona.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build(), encoding='utf-8')
    print(f'HTML independiente generado: {out} ({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
