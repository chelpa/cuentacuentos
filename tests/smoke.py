"""Smoke tests with Playwright. Works without networking by injecting standalone HTML.
Requires: python -m pip install playwright and a Chromium executable.
Usage: python tests/smoke.py
"""
from pathlib import Path
import base64
import shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
IMG = base64.b64encode((ROOT / 'assets' / 'portada-cona.webp').read_bytes()).decode('ascii')
HTML = (ROOT / 'index.html').read_text(encoding='utf-8').replace('src="assets/portada-cona.webp"', f'src="data:image/webp;base64,{IMG}"')


def run():
    with sync_playwright() as p:
        exe = shutil.which('chromium') or shutil.which('google-chrome')
        opts = dict(headless=True)
        if exe:
            opts['executable_path'] = exe
        browser = p.chromium.launch(**opts)
        for name, viewport in [('mobile', {'width': 390, 'height': 844}), ('desktop', {'width': 1365, 'height': 900})]:
            page = browser.new_page(viewport=viewport, device_scale_factor=1)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_content(HTML, wait_until='load')
            assert page.locator('h1').is_visible(), 'hero heading missing'
            assert page.locator('.hero-image img').evaluate('(img) => img.complete && img.naturalWidth > 0'), 'cover image not loaded'
            assert page.locator('.card:visible').count() == 8, 'unexpected card count'
            assert page.locator('body').evaluate('(b) => b.scrollWidth <= window.innerWidth+1'), 'horizontal overflow'
            page.screenshot(path=str(ROOT / f'preview_{name}.png'), full_page=True)
            page.locator('button[data-filter="curso"]').click()
            assert page.locator('.card:visible').count() == 1, 'course filter mismatch'
            page.locator('button[data-filter="all"]').click()
            page.locator('#query').fill('Mindbuilder')
            assert page.locator('.card:visible').count() == 1, 'search mismatch'
            page.locator('#query').fill('')
            page.locator('.card[data-id="barnechea"] .fav').click()
            assert page.locator('.card[data-id="barnechea"] .fav').get_attribute('aria-pressed') == 'true', 'favorite save failed'
            page.locator('#saved-filter').click()
            assert page.locator('.card:visible').count() == 1, 'saved filter mismatch'
            page.locator('#query').fill('sin resultados xyz123')
            assert page.locator('#empty').is_visible(), 'empty state not displayed'
            page.locator('#reset').click()
            assert page.locator('.card:visible').count() == 8, 'reset mismatch'
            assert not errors, f'JS errors {errors}'
            print(f'{name.upper()}: PASS — cover, cards, responsive width, filters, favorites, search, reset, no JS errors')
            page.close()
        browser.close()

if __name__ == '__main__':
    run()
