#!/usr/bin/env python3
# Генерирует st-profdata.js из studio-profiles.json (STUDIO_CONTRACT, приложение с профилями).
# Запуск из папки студии:  python3 tools/gen-profdata.py
# Зачем: студия открывается двойным нажатием на index.html, а из file:// браузер не даёт читать json через fetch.
import json, sys

src = sys.argv[1] if len(sys.argv) > 1 else 'studio-profiles.json'
dst = sys.argv[2] if len(sys.argv) > 2 else 'st-profdata.js'
d = json.load(open(src, encoding='utf-8'))
ROLES = ['display', 'body', 'mono', 'pixel']
DEF = {'display': 'Nunito', 'body': 'Nunito', 'mono': 'Nunito', 'pixel': 'Press Start 2P'}


def cat(stack, role):
    """CSS-стек из контракта -> гарнитура из каталога студии (ST.fonts.CAT)."""
    if not stack:
        return DEF[role]
    if 'Press Start 2P' in stack:
        return 'Press Start 2P'
    if stack.strip().startswith('ui-monospace'):
        return 'JetBrains Mono'
    return 'Nunito'


def low(v):
    """hex в нижнем регистре, как хранит ST.tok.norm; rgba(...) и прочее без изменений."""
    return v.lower() if isinstance(v, str) and v.startswith('#') else v


out = []
for p in d['profiles']:
    L, D, I = {}, {}, {}
    for t in p['tokens']:
        if t['name'] in ('r', 'sh'):
            continue  # не цвета: живут в shape (r, shadow)
        L[t['name']] = low(t['light'])
        D[t['name']] = low(t['dark'])
        I[t['name']] = {'app': t.get('app') or '', 'role': t.get('role') or ''}
    fonts, stacks = {}, {}
    for r in ROLES:
        f = p['fonts'].get(r)
        st = f['family'] if f else ''
        fonts[r] = cat(st, r)
        if st:
            stacks[r] = st
    sh = p['shape']
    out.append({
        'id': p['id'], 'name': p['name'], 'scope': p['scope'], 'base': p.get('base'),
        'locked': bool(p.get('locked')), 'note': p.get('note', ''),
        'tokens': {'light': L, 'dark': D, 'info': I,
                   'grad': {'tile': {'angle': 180, 'stops': [{'c': '@tile0', 'at': 0}, {'c': '@tile1', 'at': 100}]}}},
        'fonts': fonts, 'stacks': stacks,
        'shape': {k: sh[k] for k in ('r', 'rl', 'bw', 'ledge', 'shadow')},
        'icons': p['icons']})

js = '/* Сгенерировано tools/gen-profdata.py из studio-profiles.json (' + d.get('contract', '') + '). Руками не править. */\n'
js += '(function(){var ST=window.ST=window.ST||{};ST.profData=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';})();\n'
open(dst, 'w', encoding='utf-8').write(js)
print('ok', dst, len(js), 'байт, профилей', len(out))
