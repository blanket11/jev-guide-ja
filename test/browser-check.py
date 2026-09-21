"""Optional UI checks. Requires Python playwright and a locally installed Chromium.

Uses in-memory srcdoc rendering of the portable preview; no real HTTP hosting or
Jev API is tested. Run after `node scripts/offline.mjs /path/to/preview.html`.
"""
from pathlib import Path
import argparse
import json
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('preview', type=Path)
parser.add_argument('--browser', default='/usr/bin/chromium')
parser.add_argument('--output', type=Path, default=Path('/mnt/data'))
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
manifest = json.loads((Path(__file__).resolve().parents[1] / 'content/manifest.json').read_text())
results = []
errors = []
external = []

def check(name, condition=True):
    assert condition, name
    results.append(name)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.browser, headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1080}, device_scale_factor=1)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.on('request', lambda request: external.append(request.url) if request.url.startswith(('http:', 'https:')) else None)
    page.set_content(args.preview.read_text())
    f = page.frames[1]
    expect(f.locator('h1')).to_contain_text('判断に使いこなす')
    check('Desktop home renders')
    page.screenshot(path=str(args.output/'jev-guide-ja-desktop.png'))

    def mount(slug):
        page.evaluate('(slug) => mount(slug+".html")', slug)
        f = page.frames[1]
        expect(f.locator('body')).to_have_attribute('data-page', slug)
        return f

    # Every page must render and fit its viewport.
    for entry in manifest:
        f = mount(entry['slug'])
        expect(f.locator('h1')).to_have_count(1)
        check('Desktop chapter ' + entry['slug'], f.evaluate('document.documentElement.scrollWidth <= innerWidth'))

    f = mount('start')
    page.screenshot(path=str(args.output/'jev-guide-ja-article.png'))
    f.locator('#open-search').click()
    f.locator('#search-input').fill('TypeScript')
    expect(f.locator('.search-result')).not_to_have_count(0)
    check('Japanese/English local search')
    f.locator('.search-result', has_text='JavaScript / TypeScriptから呼び出す').click()
    expect(page.frames[1].locator('body')).to_have_attribute('data-page','javascript-sdk')
    check('Search result opens correct chapter')

    f = mount('request-builder')
    f.locator('#request-type').select_option('noul')
    f.locator('#request-state').fill('<script>window.evil=true</script> 日本語')
    value = json.loads(f.locator('#request-output').inner_text())
    check('Request demo switches question type', value['questions']['sample']['type']=='noul')
    check('Request demo safely treats HTML as text', not f.evaluate('Boolean(window.evil)'))
    f.locator('.lab .copy-code').click()
    expect(f.locator('#toast')).to_have_class('toast visible')
    check('Copy control works or provides selection fallback')

    f = mount('score')
    expect(f.locator('#score-result')).to_contain_text('1.500')
    for n in range(3):
        f.locator(f'#score-{n}').fill('0')
    expect(f.locator('#score-result')).to_contain_text('合計が0')
    check('Score zero-weight case')
    f.locator('#score-2').fill('100')
    expect(f.locator('#score-result')).to_contain_text('2.000')
    check('Score weighted mean')
    f.locator('details summary').click()
    expect(f.locator('details')).to_have_attribute('open','')
    check('Answer disclosure opens')

    f = mount('noul')
    for value, label in [('20','いいえとして扱う'),('50','確認対象に回す'),('80','はいとして扱う')]:
        f.locator('#noul-p').fill(value)
        expect(f.locator('#noul-route')).to_contain_text(label)
    check('Noul routes at both boundaries and midpoint')
    f.locator('#theme-toggle').click()
    expect(f.locator('html')).to_have_attribute('data-theme','dark')
    check('Dark theme toggle')
    page.screenshot(path=str(args.output/'jev-guide-ja-dark.png'))

    # localStorage may be prohibited by the in-memory opaque origin. Verify fallback, not persistence.
    f.locator('#mark-read').click()
    saved = f.locator('#mark-read').get_attribute('aria-pressed') == 'true'
    if not saved:
        expect(f.locator('#toast')).to_contain_text('保存できません')
    check('Read marker saves or explicitly reports unavailable storage')

    page.set_viewport_size({'width':390,'height':844})
    f = mount('index')
    # A previous theme may have persisted on browsers permitting localStorage.
    if f.locator('html').get_attribute('data-theme') == 'dark':
        f.locator('#theme-toggle').click()
    page.screenshot(path=str(args.output/'jev-guide-ja-mobile.png'))
    check('Mobile home no horizontal overflow', f.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    f.locator('#menu-toggle').click()
    expect(f.locator('#menu-toggle')).to_have_attribute('aria-expanded','true')
    expect(f.locator('#sidebar')).to_be_visible()
    check('Mobile chapter menu opens')
    f.locator('#sidebar a[href="choice.html"]').click()
    expect(page.frames[1].locator('body')).to_have_attribute('data-page','choice')
    check('Mobile menu navigates')
    for entry in manifest:
        f = mount(entry['slug'])
        check('Mobile chapter ' + entry['slug'], f.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    f = mount('score')
    page.screenshot(path=str(args.output/'jev-guide-ja-mobile-article.png'))
    f.locator('#open-search').click()
    f.locator('#search-input').fill('存在しない語彙xyz')
    expect(f.locator('#search-status')).to_contain_text('ありません')
    check('Search empty state')
    f.locator('#search-input').fill('確率')
    expect(f.locator('.search-result')).not_to_have_count(0)
    check('Mobile Japanese search')
    f.locator('#close-search').click()
    check('No external network requests', external == [])
    check('No JavaScript or CSP errors', errors == [])
    browser.close()

report = {'checked': '2026-09-21', 'rendering': 'Chromium / in-memory self-contained preview; not deployed hosting',
          'checksPassed':len(results), 'checks':results, 'errors':errors,'externalRequests':external,
          'readPersistenceTested':False}
(args.output/'jev-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'checksPassed':len(results),'errors':errors,'externalRequests':external},ensure_ascii=False))
