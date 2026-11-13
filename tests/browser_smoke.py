"""End-to-end checks against the real Node server and a project-style static site."""
import functools
import hashlib
import http.client
import http.server
import json
import os
import re
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import threading
import time
from contextlib import ExitStack, contextmanager
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright
from learning_experience import learning_experience

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ("cyberedu.html", "index.html", "style.css", "script.js", "content.js",
          "progress.js", "flags-hash.js", "i18n.js", "sw.js", "manifest.json", "favicon.svg")


def request(base, path, *, data=None, headers=None):
    url = urlsplit(base)
    conn = http.client.HTTPConnection(url.hostname, url.port, timeout=5)
    try:
        conn.request("POST" if data is not None else "GET", path,
                     None if data is None else json.dumps(data), headers or {})
        response = conn.getresponse()
        return response.status, response.read()
    finally:
        conn.close()


@contextmanager
def node_server(directory, enable_run):
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    base = f"http://127.0.0.1:{port}"
    env = dict(os.environ, CYBEREDU_PORT=str(port), CYBEREDU_HOST="127.0.0.1",
               CYBEREDU_NO_OPEN="1", CYBEREDU_ENABLE_RUN="0")
    command = ["node", "server.js"] + (["--enable-run"] if enable_run else [])
    proc = subprocess.Popen(command, cwd=directory, env=env, stdout=subprocess.DEVNULL,
                            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    try:
        for _ in range(100):
            try:
                if request(base, "/api/session")[0] == 200:
                    break
            except OSError:
                time.sleep(0.05)
        else:
            raise RuntimeError("Local server did not start")
        yield base
    finally:
        proc.terminate()
        proc.wait(timeout=5)


class StaticSite(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        if self.path not in ("/v1/chat/completions", "/v1/messages"):
            return self.send_error(404)
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        assert body["messages"][-1]["content"] == "测试本地代理"
        if self.path.endswith("/messages"):
            assert self.headers["x-api-key"] == "local-test-key"
            assert body.get("system") and body["messages"][0]["role"] == "user"
            event = {"type":"content_block_delta", "delta":{"type":"text_delta", "text":"中文代理回复"}}
        else:
            assert self.headers["Authorization"] == "Bearer local-test-key"
            event = {"choices":[{"delta":{"content":"中文代理回复"}}]}
        payload = ("data: " + json.dumps(event, ensure_ascii=False) + "\n\ndata: [DONE]\n\n").encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        # Split a UTF-8 character across writes to exercise streaming decoders.
        split = payload.index("中".encode()) + 1
        self.wfile.write(payload[:split])
        self.wfile.flush()
        time.sleep(0.02)
        self.wfile.write(payload[split:])


def http_guards(base, enabled):
    session = json.loads(request(base, "/api/session")[1])
    for name in ("login-sample.log", "capture.pcap", "landscape.png"):
        status, body = request(base, "/training/" + name)
        assert status == 200 and body == (ROOT / "training" / name).read_bytes()

    assert session["runEnabled"] is enabled
    trusted = {"Origin": base, "Content-Type": "application/json", "X-CyberEdu-Token": session["token"]}
    code = {"lang": "JavaScript", "code": "console.log('local-ok')"}
    for extra, status in [({"Origin": "http://localhost:9999"}, 403),
                          ({"X-CyberEdu-Token": ""}, 403), ({"Content-Type": "text/plain"}, 415)]:
        assert request(base, "/api/run", data=code, headers={**trusted, **extra})[0] == status
    status, body = request(base, "/api/run", data=code, headers=trusted)
    assert status == (200 if enabled else 403)
    if enabled:
        assert json.loads(body)["stdout"].strip() == "local-ok"
        result = request(base, "/api/run", data={"lang":"JavaScript", "code":"process.exit(7)"}, headers=trusted)
        assert json.loads(result[1])["exitCode"] == 7
    invalid = [("ctf-sim", {"challengeId":"ctf-003", "input":{}}),
               ("ctf-verify", {"challengeId":"ctf-001", "flag":{}}),
               ("progress", {"completedSections":[], "revision":["a"*32]})]
    for endpoint in ("chat", "chat/anthropic"):
        for key, messages in [("local-test-key", [None]), ("bad\r\nkey", [{"role":"user", "content":"test"}])]:
            invalid.append((endpoint, {"apiUrl":"http://127.0.0.1:1", "apiKey":key, "messages":messages}))
    for endpoint, data in invalid:
        assert request(base, "/api/" + endpoint, data=data, headers=trusted)[0] == 400, endpoint
    assert request(base, "/api/ctf-sim", data={"challengeId":"constructor", "input":"test"}, headers=trusted)[0] == 200
    assert request(base, "/api/ctf-verify", data={"challengeId":"constructor", "flag":"test"}, headers=trusted)[0] == 404
    for path in ("/server.js", "//server.js", "/./server.js", "/%2e%2e/server.js"):
        assert request(base, path)[0] == 403
    if enabled:
        snapshot = {"completedSections": [], "revision": "a"*32}
        def save(revision, parent):
            return request(base, "/api/progress", data={**snapshot, "revision": revision},
                           headers={**trusted, "X-CyberEdu-Base": parent})[0]
        assert save("a"*32, "0") == save("a"*32, "0") == 200
        assert save("b"*32, "0") == 409
        assert save("b"*32, "a"*32) == 200


def smoke(browser, static, local, app):
    ctx = browser.new_context(reduced_motion="reduce")
    ctx.set_default_timeout(6500)
    # A verified optional local CDN mirror also exercises the rich editor offline.
    asset_dir = os.environ.get("CYBEREDU_TEST_ASSETS")
    def external(route):
        url = route.request.url
        if asset_dir and urlsplit(url).hostname == "cdnjs.cloudflare.com":
            cached = Path(asset_dir) / hashlib.sha256(url.encode()).hexdigest()
            if cached.is_file():
                mime = "text/css" if url.endswith(".css") else "application/javascript"
                return route.fulfill(body=cached.read_bytes(), headers={"Content-Type": mime, "Access-Control-Allow-Origin":"*"})
        route.abort()
    ctx.route("https://**/*", external)
    ctx.add_init_script("try { sessionStorage.setItem('cyberedu_intro_seen','1') } catch {}")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    def open_view(base, route):
        page.goto("about:blank")
        page.goto(base + "#" + route, wait_until="domcontentloaded")
        expect(page.locator("#view-" + route.split("/")[0])).to_have_class(re.compile(r"\bactive\b"))

    public = static + "/cyberedu/cyberedu.html"
    local_app = local + "/cyberedu.html"
    page.goto(static + "/sibling/")
    page.evaluate("""async base => { await fetch(base + '/api/run', {method:'POST',mode:'no-cors',
        headers:{'Content-Type':'text/plain'}, body:JSON.stringify({lang:'JavaScript',
        code:"require('fs').writeFileSync('cross-origin-marker','unexpected execution')"})}); }""", local)
    assert not (app / "cross-origin-marker").exists(), "Cross-origin page executed local code"
    page.evaluate("""async()=>{await caches.open('sibling-test');await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;}""")
    open_view(public, "home")
    assert page.locator("#modules-grid a.module-card").count() == 9
    assert not page.evaluate("()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/lessons/'))")
    assert page.evaluate("""async()=> (await caches.keys()).includes('sibling-test') &&
        (await navigator.serviceWorker.getRegistrations()).some(r=>r.scope.endsWith('/sibling/'))""")
    open_view(public, "ctf")
    page.locator('[onclick*="openCTF"][onclick*="ctf-005"]').first.click()
    page.locator("#ctf-tab-code").click()
    assert len(page.locator("#ctf-code-editor").input_value()) > 100
    assert page.locator("#ctf-code-editor").get_attribute("readonly") is not None
    open_view(public, "ctf")
    page.locator('[onclick*="openCTF"][onclick*="ctf-001"]').first.click()
    page.locator("#ctf-tab-code").click()
    expect(page.locator("#ctf-code-editor")).to_be_editable()

    open_view(public, "progress")
    backup = {"completedSections": [], "timeline":[{"date":"2026-01-01",
              "text":"<img src=x onerror=\"document.body.dataset.injected='yes'\">"}]}
    page.on("dialog", lambda dialog: dialog.accept())
    with page.expect_file_chooser() as chooser:
        page.locator('[onclick="importProgress()"]:visible').first.click()
    chooser.value.set_files({"name":"backup.json","mimeType":"application/json","buffer":json.dumps(backup).encode()})
    expect(page.locator(".timeline-text").first).to_have_text(backup["timeline"][0]["text"])
    assert not page.locator("#timeline img").count()

    open_view(local_app, "practice")
    def run_python(text):
        page.evaluate("code=>{if(cmEditor) cmEditor.setValue(code); else document.querySelector('#code-editor').value=code}",text)
        page.locator('[onclick="runCode()"]').click()
    run_python("print('MEET ME AT THE TREE')")
    expect(page.locator("#code-output")).to_contain_text("MEET ME AT THE TREE")
    run_python("raise RuntimeError('example-failure')")
    expect(page.locator("#code-output")).to_contain_text("example-failure")
    page.locator("#lang-toggle").click()
    expect(page.locator("#practice-question")).to_contain_text("编写")
    page.locator("#ai-fab").click()
    for api_type in ("openai", "anthropic"):
        page.locator('[onclick="toggleAISettings()"]').click()
        page.locator("#ai-api-type").select_option(api_type)
        page.locator("#ai-api-url").fill(static + "/v1")
        page.locator("#ai-api-key").fill("local-test-key")
        page.locator("#ai-model").fill("test-model")
        page.locator('[onclick="saveAISettings()"]').click()
        expect(page.locator("#ai-input")).to_be_visible()
        expect(page.locator("#ai-input")).to_be_focused()
        assert page.evaluate("localStorage.getItem('cyberedu_ai_key')") is None
        assert page.evaluate("sessionStorage.getItem('cyberedu_ai_key')") == "local-test-key"
        page.locator("#ai-input").fill("测试本地代理")
        page.locator("#ai-send-btn").click()
        expect(page.locator(".ai-response-wrapper").last).to_contain_text("中文代理回复")
        expect(page.locator("#ai-send-btn")).not_to_have_class(re.compile(r"\bai-streaming\b"))
    open_view(public, "practice")
    expect(page.locator("#code-output")).to_contain_text("npm run start:runner")
    page.locator("#ai-fab").click()
    page.locator('[onclick="toggleAISettings()"]').click()
    expect(page.locator("#ai-settings")).to_be_hidden()
    expect(page.locator("#ai-messages")).to_contain_text("npm start")

    open_view(local_app, "hub/programming/prog-01-01")
    expect(page.locator(".complete-btn")).to_be_visible()
    page.route("**/api/progress", lambda route: route.fulfill(status=429, json={})
               if route.request.method=="POST" else route.continue_())
    page.locator(".complete-btn").click()
    open_view(local_app, "progress")
    assert page.evaluate("()=>userProgress.completedSections.includes('prog-01-01')")
    page.unroute("**/api/progress")
    open_view(local_app, "progress")
    assert "prog-01-01" in json.loads(request(local,"/api/progress")[1])["completedSections"]
    page.wait_for_function("pendingBase === null && !savingProgress")
    current = json.loads(request(local, "/api/progress")[1])
    token = json.loads(request(local, "/api/session")[1])["token"]
    remote = {**current, "revision":"c"*32, "completedSections":["prog-01-01", "prog-01-02"]}
    assert request(local, "/api/progress", data=remote, headers={"Origin":local,
        "Content-Type":"application/json", "X-CyberEdu-Token":token, "X-CyberEdu-Base":current["revision"]})[0] == 200
    page.evaluate("navigate('hub','programming','prog-01-03')")
    page.locator(".complete-btn").click()
    page.evaluate("navigate('progress')")
    expect(page.locator("#sync-resolve")).to_be_visible()
    assert page.evaluate("userProgress.completedSections.includes('prog-01-03')")
    assert "prog-01-03" not in json.loads(request(local, "/api/progress")[1])["completedSections"]
    page.locator("#sync-resolve").click()
    expect(page.locator("#sync-resolve")).to_be_hidden()
    page.wait_for_function("pendingBase === null && !savingProgress")
    assert "prog-01-03" in json.loads(request(local, "/api/progress")[1])["completedSections"]

    open_view(public, "hub/websec/web-01-02")
    page.evaluate("setLang('zh')")
    quiz = page.locator("#cp-web-01-02-0")
    expect(quiz.locator(".checkpoint-option")).to_have_count(4)
    expect(quiz).to_contain_text("<script>")
    correct = page.evaluate("SECTION_CHECKPOINTS['web-01-02'][0].answer")
    quiz.locator(f'[data-opt="{correct}"]').click()
    expect(quiz.locator(".checkpoint-explanation")).to_be_visible()
    page.locator(".section-nav .next-btn").click()
    expect(page).to_have_url(re.compile(r'#hub/websec/web-01-03$'))
    page.go_back()
    expect(page.locator("#cp-web-01-02-0")).to_be_visible()

    page.set_viewport_size({"width":390,"height":844})
    open_view(public, "hub/programming/prog-01-01")
    expect(page.locator(".complete-btn")).to_be_visible()
    assert page.evaluate("()=>document.documentElement.scrollWidth <= innerWidth"), "mobile horizontal overflow"
    page.locator("#mobile-catalog").click()
    expect(page.locator("#mobile-catalog")).to_have_attribute("aria-expanded","true")
    page.evaluate("""async()=>{await navigator.serviceWorker.ready;const url=new URL('lessons/programming.zh.js',location);
      for(let i=0;i<100;i++){if(await caches.match(url))return;await new Promise(r=>setTimeout(r,50))}throw Error('lesson cache missing')}""")
    ctx.set_offline(True)
    try:
        page.reload(wait_until="domcontentloaded")
        expect(page.locator(".complete-btn")).to_be_visible()
        assert page.evaluate("""async()=> (await Promise.all(
          ['login-sample.log','capture.pcap','landscape.png'].map(async name=>{
            const res=await fetch('training/'+name); return res.ok && (await res.arrayBuffer()).byteLength>0;
          }))).every(Boolean)""")
    finally:
        ctx.set_offline(False)
    open_view((app / "cyberedu.html").as_uri(), "hub/programming/prog-01-01")
    expect(page.locator(".complete-btn")).to_be_visible()
    assert not errors, errors
    ctx.close()


def main():
    with tempfile.TemporaryDirectory(prefix="cyberedu-smoke-") as temp, ExitStack() as stack:
        root = Path(temp)
        app = root / "cyberedu"
        app.mkdir()
        for file in (*ASSETS, "server.js"):
            shutil.copyfile(ROOT / file, app / file)
        shutil.copytree(ROOT / "lessons", app / "lessons")
        shutil.copytree(ROOT / "training", app / "training")
        sibling = root / "sibling"
        sibling.mkdir()
        (sibling / "index.html").write_text("<title>Sibling</title>")
        (sibling / "sw.js").write_text("self.addEventListener('install',()=>self.skipWaiting())")
        site = http.server.ThreadingHTTPServer(("127.0.0.1",0), functools.partial(StaticSite,directory=root))
        threading.Thread(target=site.serve_forever,daemon=True).start()
        stack.callback(site.server_close)
        stack.callback(site.shutdown)
        with node_server(app,False) as ordinary:
            http_guards(ordinary,False)
        with node_server(app,True) as enabled:
            http_guards(enabled,True)
        local = stack.enter_context(node_server(app,True))
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            try:
                smoke(browser, f"http://127.0.0.1:{site.server_port}", local, app)
                learning_experience(browser, f"http://127.0.0.1:{site.server_port}/cyberedu/cyberedu.html", local)
            finally:
                browser.close()
    print("HTTP boundaries, learning flows, progress, mobile, offline and file mode passed")


if __name__ == "__main__":
    main()
