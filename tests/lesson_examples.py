"""Execute the exact beginner examples and SQL predicate shipped to learners."""
from html.parser import HTMLParser
from pathlib import Path
import json
import sqlite3
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


class CodeBlocks(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.blocks, self.current = [], None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == 'code':
            self.current = [dict(attrs), '']

    def handle_data(self, text):
        if self.current is not None:
            self.current[1] += text

    def handle_endtag(self, tag):
        if tag == 'code' and self.current is not None:
            self.blocks.append(self.current)
            self.current = None


def main():
    count = 0
    for language in ('zh', 'en'):
        def pack(module):
            result = subprocess.run(['node', '-e',
                f"process.stdout.write(JSON.stringify(require('./lessons/{module}.{language}.js')))"],
                cwd=ROOT, capture_output=True, check=True)
            return json.loads(result.stdout)
        lessons = pack('programming')
        for index in range(1, 6):
            lesson = lessons[f'prog-01-0{index}']
            blocks = [(attrs, code) for attrs, code in CodeBlocks(lesson['html']).blocks if 'data-expected' in attrs]
            assert len(blocks) == 1
            attrs, code = blocks[0]
            result = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, check=True, timeout=5)
            assert result.stdout.strip() == attrs['data-expected'], (language, index, result.stdout)
            assert len(lesson['checkpoints']) == 2 and lesson['task']['fields']
            count += 1
            if index == 5:
                sample = (ROOT / 'training/login-sample.log').read_text().splitlines()
                result = subprocess.run([sys.executable, '-c', code + '\nprint(summarize(' + repr(sample) + '))'],
                    capture_output=True, text=True, check=True, timeout=5)
                assert "({'192.0.2.10': 3, '192.0.2.20': 1}, 2)" in result.stdout
        sql = next(code for attrs, code in CodeBlocks(pack('websec')['web-01-01']['html']).blocks
                   if code.startswith('SELECT') and "username = 'admin' OR" in code)
        with sqlite3.connect(':memory:') as db:
            db.execute('CREATE TABLE users(username TEXT, password TEXT)')
            db.executemany('INSERT INTO users VALUES (?,?)', [('alice','secret'),('admin','other'),('bob','xxx')])
            assert {row[0] for row in db.execute(sql)} == {'admin', 'bob'}
            assert list(db.execute('SELECT * FROM users WHERE username = ? AND password = ?',
                                   ("admin' OR '1'='1", 'xxx'))) == []
    print(f'{count} beginner examples, downloaded log results and bilingual SQL precedence passed')


if __name__ == '__main__':
    main()
