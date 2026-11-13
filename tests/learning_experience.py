"""Browser checks for theme, beginner learning feedback and narrow-screen navigation."""
import hashlib
import json
import os
from pathlib import Path
import re
from urllib.parse import urlsplit
from playwright.sync_api import expect


def learning_experience(browser, public, local):
    ctx = browser.new_context(color_scheme='light', reduced_motion='reduce', viewport={'width':1365,'height':900})
    ctx.set_default_timeout(7000)
    def external(route):
        directory = os.environ.get('CYBEREDU_TEST_ASSETS')
        url = route.request.url
        if directory and urlsplit(url).hostname == 'cdnjs.cloudflare.com':
            path = Path(directory) / hashlib.sha256(url.encode()).hexdigest()
            if path.is_file():
                return route.fulfill(body=path.read_bytes(), headers={'Access-Control-Allow-Origin':'*',
                    'Content-Type':'text/css' if url.endswith('.css') else 'application/javascript'})
        route.abort()
    ctx.route('https://**/*', external)
    ctx.add_init_script("localStorage.setItem('cyberedu_lang_v3','zh')")
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def shot(name):
        directory = os.environ.get('CYBEREDU_SCREENSHOTS')
        if directory:
            Path(directory).mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(Path(directory) / (name+'.png')))
    def go(route):
        page.goto(public+'#'+route, wait_until='domcontentloaded')
        expect(page.locator('#view-'+route.split('/')[0])).to_have_class(re.compile(r'\bactive\b'))
    def no_overflow():
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'horizontal overflow'

    go('home')
    expect(page.locator('html')).to_have_attribute('data-theme','light')
    expect(page.locator('#home-primary')).to_have_attribute('href','#hub/programming/prog-01-01')
    expect(page.locator('#home-primary')).to_contain_text('开始')
    assert page.locator('.starter-steps a').count() == 5
    # Check primary reading/link text tokens against both light surfaces.
    assert page.evaluate("""() => {
      const css=getComputedStyle(document.documentElement);
      const lum=key=>{
        const hex=css.getPropertyValue(key).trim().slice(1);
        const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255)
          .map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
        return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
      };
      return ['--text-main','--text-dim','--text-muted','--color-green','--color-cyan']
        .every(f=>['--bg-panel','--bg-deep'].every(b=>(Math.max(lum(f),lum(b))+.05)/(Math.min(lum(f),lum(b))+.05)>=4.5));
    }""")
    shot('desktop-home-light')
    page.locator('#theme-toggle').click()
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('html')).to_have_attribute('data-theme','dark')
    page.emulate_media(color_scheme='dark')
    page.emulate_media(color_scheme='light')
    expect(page.locator('html')).to_have_attribute('data-theme','dark')
    shot('desktop-home-dark')
    page.locator('#home-primary').click()
    expect(page.locator('#lesson-task')).to_be_visible()
    assert page.locator('.advanced-reading[open]').count() == 0
    assert page.locator('#article-body h1').count() == 0
    # Merely reading must not mark quiz answers or output exercises as passed.
    page.locator('.complete-btn').click()
    assert page.evaluate("!progressSchema.quizPassed(userProgress,'prog-01-01') && !userProgress.exercisePassed.length")
    card = page.locator('#cp-prog-01-01-0')
    answer = page.evaluate("SECTION_CHECKPOINTS['prog-01-01'][0].answer")
    card.locator(f'[data-opt="{(answer+1)%4}"]').click()
    page.wait_for_timeout(2800)
    expect(card.locator('.wrong-exp')).to_be_visible()
    expect(card.locator('.quiz-retry')).to_be_visible()
    card.locator('.quiz-retry').click()
    expect(card.locator('.checkpoint-option').first).to_be_enabled()
    # Retrying without correcting still belongs in the review queue after reload.
    page.reload(wait_until='domcontentloaded')
    go('progress')
    expect(page.locator('#review-list a')).to_have_count(1)
    page.locator('#review-list a').click()
    expect(page.locator('#cp-prog-01-01-0')).to_be_visible()
    for index in (0,1):
        answer = page.evaluate(f"SECTION_CHECKPOINTS['prog-01-01'][{index}].answer")
        page.locator(f'#cp-prog-01-01-{index} [data-opt="{answer}"]').click()
    expect(page.locator('#lesson-status')).to_contain_text('测验通过')
    page.locator('#task-field-0').fill('wrong')
    page.locator('#task-field-1').fill('True')
    page.locator('#lesson-task button').click()
    expect(page.locator('#task-field-0')).to_have_attribute('aria-invalid','true')
    page.locator('#task-field-0').fill('444')
    page.locator('#task-field-1').fill('False')
    page.locator('#lesson-task button').click()
    assert page.evaluate("userProgress.exercisePassed.includes('prog-01-01')")
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('#lesson-status')).to_contain_text('测验通过')
    expect(page.locator('#lesson-task .task-feedback')).to_contain_text('练习')
    go('progress')
    expect(page.locator('#review-list a')).to_have_count(0)
    # The backup UI preserves all three kinds of evidence; section reset clears them together.
    with page.expect_download() as download:
        page.locator('[onclick="exportProgress()"]').first.click()
    backup = json.loads(Path(download.value.path()).read_text(encoding='utf-8-sig'))
    assert backup['quizProgress']['prog-01-01']['passed'] == [0,1]
    assert backup['exercisePassed'] == ['prog-01-01']
    reset = page.evaluate('resetProgressData(userProgress,{sections:true})')
    assert reset['completedSections'] == reset['exercisePassed'] == [] and reset['quizProgress'] == {}
    go('home')
    expect(page.locator('#home-primary')).to_have_attribute('href','#hub/programming/prog-01-02')
    page.locator('[onclick="openSkillDiagnostic()"]').first.click()
    for _ in range(5):
        page.locator('#diag-modal-container .checkpoint-option').first.click()
    expect(page.locator('.diagnostic-results li')).to_have_count(5)
    assert '%' not in page.locator('#diag-modal-container').inner_text()
    page.locator('.diagnostic-results a').first.click()
    expect(page.locator('#hub-title')).to_contain_text('SQL')

    go('ctf')
    page.locator('[onclick="openCTF(\'ctf-015\')"]').click()
    expect(page.locator('#ctf-material-info')).to_contain_text('案例')
    page.locator('[onclick="closeCTFModal()"]:visible').first.click()
    page.locator('[onclick="openCTF(\'ctf-018\')"]').click()
    page.locator('#ctf-tab-code').click()
    expect(page.locator('#ctf-code-actions')).to_be_hidden()
    assert page.locator('#ctf-code-editor').get_attribute('readonly') is not None
    page.locator('[onclick="closeCTFModal()"]:visible').first.click()
    for challenge, filename, magic in [('ctf-006','capture.pcap',bytes.fromhex('d4c3b2a1')),
                                      ('ctf-021','landscape.png',bytes.fromhex('89504e47'))]:
        page.locator(f'[onclick="openCTF(\'{challenge}\')"]').click()
        with page.expect_download() as download:
            page.locator('#ctf-material-info a').click()
        assert download.value.suggested_filename == filename
        assert Path(download.value.path()).read_bytes().startswith(magic)
        page.locator('[onclick="closeCTFModal()"]:visible').first.click()

    page.set_viewport_size({'width':390,'height':844})
    go('home')
    page.locator('#theme-toggle').click()
    shot('mobile-home-light')
    for width in (390,320):
        page.set_viewport_size({'width':width,'height':844})
        no_overflow()
        page.locator('#nav-menu-toggle').click()
        expect(page.locator('#nav-menu-toggle')).to_have_attribute('aria-expanded','true')
        for item in page.locator('#nav-menu .nav-link').all():
            expect(item).to_be_visible()
            assert item.bounding_box()['height'] >= 44
        shot('mobile-menu-'+str(width))
        page.keyboard.press('Escape')
        expect(page.locator('#nav-menu-toggle')).to_be_focused()
        page.locator('#nav-menu-toggle').click()
        page.mouse.click(4, 600)
        expect(page.locator('#nav-menu-toggle')).to_have_attribute('aria-expanded','false')
    page.locator('#nav-menu-toggle').click()
    page.locator('#nav-menu [onclick="navigate(\'hub\')"]').click()
    expect(page.locator('#nav-menu-toggle')).to_have_attribute('aria-expanded','false')
    go('hub/programming/prog-01-01')
    expect(page.locator('#lesson-task')).to_be_visible()
    no_overflow()
    for control in ('#nav-menu-toggle','#mobile-catalog','#theme-toggle','#lang-toggle'):
        box = page.locator(control).bounding_box()
        assert box['x'] >= 0 and box['x']+box['width'] <= 320, (control, box)
    shot('mobile-lesson-320-light')
    page.locator('#mobile-catalog').click()
    expect(page.locator('#catalog-scrim')).to_be_visible()
    page.locator('#catalog-scrim').click(position={'x':310,'y':500})
    expect(page.locator('#sidebar')).to_have_attribute('inert','')
    page.locator('#mobile-catalog').click()
    page.keyboard.press('Escape')
    expect(page.locator('#mobile-catalog')).to_be_focused()
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('scrollTo(0,0)')
    shot('mobile-lesson-light')
    page.set_viewport_size({'width':1365,'height':900})
    shot('desktop-lesson-light')
    page.locator('#theme-toggle').click()
    shot('desktop-lesson-dark')

    # A lesson example must not inherit the language or expected output of a previous C exercise.
    page.goto(local+'/cyberedu.html#practice',wait_until='domcontentloaded')
    page.evaluate('renderPractice(4)')
    page.evaluate("navigate('hub','programming','prog-01-01')")
    page.locator('#article-body .code-run-btn').first.click()
    expect(page.locator('#editor-lang')).to_have_text('Python')
    page.locator('[onclick="runCode()"]').click()
    expect(page.locator('#code-output')).to_contain_text('FAILED\n4\nFalse')
    assert not errors, errors
    ctx.close()
    # Fresh narrow-screen visit follows OS dark mode without inherited desktop catalog state.
    ctx = browser.new_context(color_scheme='dark',reduced_motion='reduce',viewport={'width':320,'height':720})
    ctx.route('https://**/*', lambda route: route.abort())
    page = ctx.new_page()
    page.goto(public+'#hub/programming/prog-01-01',wait_until='domcontentloaded')
    expect(page.locator('#lesson-task')).to_be_visible()
    expect(page.locator('html')).to_have_attribute('data-theme','dark')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    expect(page.locator('#sidebar')).to_have_attribute('inert','')
    ctx.close()
    print('Theme, mobile navigation, learning evidence, review queue, examples and downloads passed')
