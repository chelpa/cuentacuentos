#!/usr/bin/env python3
"""Pruebas de humo de Para Cona ♥ (versión con agenda y calendario).

Sirve el proyecto en https://chelpa.github.io/cuentacuentos/ mediante interceptación de
Playwright: simula la ruta de GitHub Pages y un contexto seguro sin red ni servidor.
La hora se fija en 31/10/2026 18:30 (America/Santiago) para que los resultados no cambien
con el paso del tiempo.

Requisitos: Python 3 y Playwright con Chromium
    python3 -m pip install playwright && python3 -m playwright install chromium
Uso, desde la raíz del proyecto:
    python3 tests/smoke.py
Si existe dist/Para-Cona.html (tools/build_standalone.py), también se prueba.

Reemplaza a la prueba anterior de la versión de 8 tarjetas, que esperaba 8 tarjetas y
cargaba el HTML con set_content (no cargaba assets/app.js).
"""
import json
import mimetypes
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://chelpa.github.io/cuentacuentos/'
NOW = '2026-10-31T18:30:00-03:00'
LEGACY_IDS = ['barnechea', 'casacontada', 'chilecuentos', 'colina', 'mindbuilder', 'mustakis', 'santiago', 'vitacura']
RESULTS = []


def check(name, ok, evidence=''):
    RESULTS.append((name, bool(ok)))
    print(('PASS ' if ok else 'FAIL ') + name + (f' :: {evidence}' if evidence != '' else ''))


class Site:
    def __init__(self):
        self.errors, self.external = [], []

    def attach(self, context):
        def handler(route):
            url = route.request.url
            if not url.startswith('https://chelpa.github.io/cuentacuentos/'):
                self.external.append(url)
                return route.abort()
            rel = url.split('/cuentacuentos/', 1)[1].split('?')[0].split('#')[0] or 'index.html'
            path = ROOT / rel
            if not path.is_file():
                return route.fulfill(status=404, body='not found')
            ctype = 'image/webp' if path.suffix == '.webp' else (mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
            return route.fulfill(status=200, body=path.read_bytes(), headers={'Content-Type': ctype})
        context.route('**/*', handler)

    def page(self, context, iso=NOW):
        page = context.new_page()
        page.on('pageerror', lambda e: self.errors.append(str(e)))
        page.on('console', lambda m: self.errors.append(m.text) if m.type == 'error' else None)
        page.clock.set_fixed_time(iso)
        return page


def visible(page):
    return page.eval_on_selector_all('#cards .card:not([hidden])', 'els => els.map(e => e.dataset.id)')


def search(page, text):
    page.fill('#query', text)
    ids = visible(page)
    page.fill('#query', '')
    return ids


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        site = Site()

        # Carga, rutas relativas y contenido
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, timezone_id='America/Santiago')
        ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin='https://chelpa.github.io')
        site.attach(ctx)
        page = site.page(ctx)
        page.goto(BASE)
        cards = page.locator('.card').count()
        check('Carga bajo /cuentacuentos/ con portada, CSS y JS', page.eval_on_selector('.hero-image img', 'i => i.naturalWidth > 0') and page.evaluate("document.documentElement.className") == 'js')
        check('19 tarjetas y contador', cards == 19 and page.inner_text('#result-count') == '19 opciones visibles', page.inner_text('#result-count'))
        ids = page.eval_on_selector_all('.card', 'els => els.map(e => e.dataset.id)')
        check('Se conservan los identificadores de la versión publicada', all(i in ids for i in LEGACY_IDS))

        # Favoritos de la versión de 8 tarjetas
        page.evaluate("ids => localStorage.setItem('cona-favorites-v2', JSON.stringify(ids))", ['barnechea', 'vitacura', 'actividad-retirada'])
        page.reload()
        pressed = page.eval_on_selector_all('.fav[aria-pressed="true"]', 'b => b.map(x => x.closest(".card").dataset.id)')
        check('Favoritos anteriores se reconocen', sorted(pressed) == ['barnechea', 'vitacura'], pressed)
        page.click('.card[data-id="teatristas"] .fav')
        stored = json.loads(page.evaluate("localStorage.getItem('cona-favorites-v2')"))
        check('Editar favoritos conserva IDs desconocidos y el formato', stored == ['barnechea', 'vitacura', 'actividad-retirada', 'teatristas'], stored)
        page.click('[data-scope="favorites"]')
        check('Mis favoritos en tarjetas', sorted(visible(page)) == ['barnechea', 'teatristas', 'vitacura'], visible(page))
        page.click('[data-scope="all"]')
        page.evaluate("localStorage.removeItem('cona-favorites-v2')")
        page.reload()

        # Búsqueda positiva
        kinds = page.eval_on_selector_all('.card', 'els => Object.fromEntries(els.map(e => [e.dataset.id, e.dataset.kind]))')
        curso = search(page, 'curso')
        check('Buscar "curso" solo trae cursos o talleres', curso and all(kinds[i] in ('curso', 'online') for i in curso), curso)
        presencial = search(page, 'presencial')
        check('Buscar "presencial" excluye online y modalidad pendiente', not set(presencial) & {'casacontada', 'cuenteros', 'domestika', 'truz'}, presencial)
        check('Buscar "online" trae solo online', set(search(page, 'online')) == {'cuenteros', 'casacontada', 'domestika'})
        check('Gratuidad solo con respaldo vigente', search(page, 'gratis') == ['chilecuentos'])
        check('Varias palabras y sin tildes', search(page, 'la reina teatristas') == ['lareina'] and search(page, 'NUNOA') == ['gala'])
        check('Textos negativos no coinciden', 'mindbuilder' not in search(page, 'formacion'))

        # Filtros, vacíos y orden
        page.click('[data-kind-filter="online"]')
        check('Casa Contada está en Online', 'casacontada' in visible(page))
        page.click('[data-kind-filter="all"]')
        page.click('[data-scope="favorites"]')
        check('Vacío específico de favoritos', page.inner_text('#empty-title') == 'Todavía no guardas favoritos.')
        page.click('#empty-action')
        page.select_option('#sort', 'price-asc')
        order = visible(page)
        check('Precio ascendente: vigentes, históricos y desconocidos al final', order[:4] == ['chilecuentos', 'gala', 'cuenteros', 'teatristas'] and order.index('barnechea') < order.index('truz'), order[:6])
        page.select_option('#sort', 'date')
        check('Fecha próxima', visible(page)[:4] == ['gala', 'santiago', 'cuenteros', 'chilecuentos'])
        page.select_option('#sort', 'recommended')

        # Agenda, calendario y detalle
        page.click('[data-view="agenda"]')
        upcoming = page.eval_on_selector_all('#ag-next ~ .agenda-day [data-open-session]', 'e => e.map(x => x.dataset.openSession)')
        check('Agenda: próximas fechas ordenadas', upcoming == ['gala-2026-11-01', 'santiago-2026-11-04', 'cuenteros-2026-11-05', 'chilecuentos-2026-11-07'], upcoming)
        recurrent = page.eval_on_selector_all('#ag-recurrent ~ ul [data-open-activity]', 'e => e.map(x => x.dataset.openActivity)')
        check('Agenda: recurrencias sin fechas como pendientes', sorted(recurrent) == ['mindbuilder', 'vitacura'], recurrent)
        page.click('[data-open-session="gala-2026-11-01"]')
        check('Detalle accesible abierto', page.evaluate("document.getElementById('detail').matches(':modal')") and page.evaluate('document.activeElement.id') == 'detail-title')
        page.keyboard.press('Escape')
        check('Esc cierra y devuelve el foco', page.evaluate('document.activeElement.dataset.openSession') == 'gala-2026-11-01')
        page.click('[data-view="calendar"]')
        page.click('#cal-next')
        days = page.eval_on_selector_all('[data-day]', 'e => e.map(x => x.dataset.day)')
        check('Calendario: solo fechas concretas en noviembre', days == ['2026-11-01', '2026-11-04', '2026-11-05', '2026-11-07'], days)
        page.click('#cal-today')
        check('Botón Hoy', page.inner_text('#cal-title') == 'Octubre de 2026')
        page.click('[data-view="cards"]')

        # Copiar y compartir
        page.click('#copy')
        page.wait_for_timeout(150)
        check('Copiar mensaje', 'Puerto Varas' in page.evaluate('navigator.clipboard.readText()'))
        page.click('#share')
        page.wait_for_timeout(150)
        check('Compartir copia el enlace publicado', page.evaluate('navigator.clipboard.readText()') == BASE)

        # Impresión
        page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
        opened = page.evaluate("document.querySelector('#mas-lugares details').open")
        page.evaluate("window.dispatchEvent(new Event('afterprint'))")
        check('Impresión abre y restaura el desplegable', opened and not page.evaluate("document.querySelector('#mas-lugares details').open"))
        page.emulate_media(media='print')
        printed = page.evaluate("[...document.querySelectorAll('.card')].filter(c => getComputedStyle(c).display !== 'none').length")
        check('Impresión muestra las 19 tarjetas', printed == 19, printed)
        page.emulate_media(media='screen')
        ctx.close()

        # Fechas que caducan
        ctx = browser.new_context(timezone_id='America/Santiago')
        site.attach(ctx)
        page = site.page(ctx, '2026-11-08T10:00:00-03:00')
        page.goto(BASE)
        steps = page.inner_text('#pasos .steps')
        check('Después del 7/11 cambia el paso 03 y las insignias', 'Pep Bruno' not in steps and 'Fecha pasada' in page.inner_text('.card[data-id="chilecuentos"] .badge'))
        ctx.close()

        # 320 px
        ctx = browser.new_context(viewport={'width': 320, 'height': 640})
        site.attach(ctx)
        page = site.page(ctx)
        page.goto(BASE)
        page.click('#mas-lugares summary')
        widths = [page.evaluate('document.documentElement.scrollWidth - innerWidth')]
        for view in ('agenda', 'calendar'):
            page.click(f'[data-view="{view}"]')
            widths.append(page.evaluate('document.documentElement.scrollWidth - innerWidth'))
        check('Sin desborde a 320 px', widths == [0, 0, 0], widths)
        ctx.close()

        # Almacenamiento bloqueado
        ctx = browser.new_context()
        site.attach(ctx)
        ctx.add_init_script("Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})")
        page = site.page(ctx)
        page.goto(BASE)
        page.click('.card[data-id="lareina"] .fav')
        page.wait_for_timeout(150)
        check('Almacenamiento bloqueado: aviso y favorito de sesión', 'no permite guardar' in page.inner_text('#toast'))
        ctx.close()

        check('Sin errores de JavaScript ni peticiones externas', not site.errors and not site.external, site.errors + site.external)

        # HTML independiente (opcional)
        standalone = ROOT / 'dist' / 'Para-Cona.html'
        if standalone.is_file():
            ctx = browser.new_context()
            page = ctx.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(standalone.as_uri())
            check('HTML independiente: 19 tarjetas, imagen y sin errores', page.locator('.card').count() == 19 and page.eval_on_selector('.hero-image img', 'i => i.naturalWidth > 0') and not errors, errors)
            ctx.close()
        else:
            print('NOT TESTED HTML independiente (ejecuta tools/build_standalone.py)')
        browser.close()

    failed = [name for name, ok in RESULTS if not ok]
    print(f'\n{len(RESULTS) - len(failed)}/{len(RESULTS)} PASS')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
