import colorsys
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

NAMED = {'white': 'ffffff', 'black': '000000', 'red': 'ff0000', 'green': '008000', 'blue': '0000ff', 'gray': '808080', 'grey': '808080', 'silver': 'c0c0c0', 'yellow': 'ffff00', 'orange': 'ffa500', 'purple': '800080', 'pink': 'ffc0cb', 'cyan': '00ffff', 'magenta': 'ff00ff', 'navy': '000080', 'lime': '00ff00', 'maroon': '800000', 'teal': '008080', 'olive': '808000'}
PAINTS = {'fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color'}


def parse_color(value):
    value = value.strip().lower()
    if value in NAMED:
        value = '#' + NAMED[value]
    if value.startswith('#'):
        digits = value[1:]
        if len(digits) in (3, 4):
            digits = ''.join(c * 2 for c in digits)
        if len(digits) in (6, 8) and re.fullmatch('[0-9a-f]+', digits):
            return tuple(int(digits[i:i + 2], 16) / 255 for i in (0, 2, 4)), digits[6:]
    match = re.fullmatch(r'rgba?\((.*?)\)', value)
    if match:
        parts = re.split(r'\s*[,/]\s*|\s+', match[1].strip())
        if len(parts) in (3, 4):
            rgb = tuple(float(p.rstrip('%')) / (100 if p.endswith('%') else 255) for p in parts[:3])
            alpha = format(round(float(parts[3].rstrip('%')) / (100 if parts[3].endswith('%') else 1) * 255), '02x') if len(parts) == 4 else ''
            return rgb, alpha
    return None


def role(rgb):
    h, s, v = colorsys.rgb_to_hsv(*rgb)
    if s < 0.12:
        return 'murmur' if v > 0.28 else 'near'
    hue = h * 360
    if hue < 12 or hue >= 345:
        return 'sharp'
    if hue < 45:
        return 'said'
    if hue < 75:
        return 'flat'
    if hue < 165:
        return 'grown'
    if hue < 195:
        return 'form'
    if hue < 265:
        return 'cue'
    return 'nudge' if hue < 315 else 'call'


def normalize(source, colors, standards):
    tree = ET.fromstring(source, parser=ET.XMLParser(target=ET.TreeBuilder(insert_comments=True)))
    protected = set()
    for node in tree.iter():
        if isinstance(node.tag, str) and node.tag.rsplit('}', 1)[-1] in ('mask', 'clipPath'):
            protected.update(node.iter())

    def resolve_current(node, current):
        inherited = current
        current = node.get('color', current)
        style_color = re.search(r'(?:^|;)\s*color\s*:\s*([^;]+)', node.get('style', ''))
        if style_color:
            current = style_color[1]
        if current.lower() == 'currentcolor':
            current = inherited
        for key, value in list(node.attrib.items()):
            if key in PAINTS and value.lower() == 'currentcolor':
                node.set(key, current)
            elif key == 'style':
                node.set(key, re.sub('currentColor', current, value, flags=re.IGNORECASE))
        for child in node:
            resolve_current(child, current)

    resolve_current(tree, '#6c707e')
    paint_values = []
    for node in tree.iter():
        if not isinstance(node.tag, str) or node in protected:
            continue
        for key, value in node.attrib.items():
            if key in PAINTS:
                paint_values.append(value)
            elif key == 'style':
                paint_values.extend(m[1] for m in re.findall(r'(fill|stroke|stop-color|color)\s*:\s*([^;]+)', value))
        if node.tag.rsplit('}', 1)[-1] == 'style' and node.text:
            paint_values.extend(m[1] for m in re.findall(r'(fill|stroke|stop-color|color)\s*:\s*([^;}]+)', node.text))
    parsed = [p[0] for v in paint_values if (p := parse_color(v))]
    saturated = any(colorsys.rgb_to_hsv(*rgb)[1] > 0.35 for rgb in parsed)
    inverse = any((parsed_fill := parse_color(node.get('fill', node.get('stop-color', 'none')))) and colorsys.rgb_to_hsv(*parsed_fill[0])[1] > 0.35 for node in tree.iter() if node not in protected)
    two_tone = not saturated and any(max(rgb) > 0.5 for rgb in parsed) and any(max(rgb) < 0.35 for rgb in parsed)
    has_light = any(max(rgb) > 0.9 and min(rgb) > 0.85 for rgb in parsed)
    opacity_values = re.findall(r'(?:fill-opacity|stroke-opacity|opacity)[="\s:]+([0-9.]+)', source)
    muted_opacity = any(0.45 <= float(value) <= 0.7 for value in opacity_values)
    unresolved = set()

    def paint(value, key):
        value = value.strip()
        if value == 'null':
            return 'none' if key == 'stroke' else colors['murmur']
        if value.lower() in ('none', 'transparent', 'inherit') or value.startswith('url('):
            return value
        if value.lower() == 'currentcolor':
            return colors['murmur']
        parsed_color = parse_color(value)
        if not parsed_color:
            unresolved.add(value)
            return value
        rgb, alpha = parsed_color
        h, s, v = colorsys.rgb_to_hsv(*rgb)
        canonical = '#' + ''.join(format(round(c * 255), '02x') for c in rgb)
        if canonical in standards and canonical not in ('#ffffff', '#000000'):
            name = standards[canonical]
        elif s < 0.12 and v >= 0.92:
            name = 'pitch' if inverse and key in ('fill', 'stroke') else 'voice'
        elif v < 0.08:
            name = 'pitch' if saturated or has_light else 'murmur'
        elif canonical in standards:
            name = standards[canonical]
        elif two_tone and v < 0.4:
            name = 'pitch'
        elif key == 'stroke':
            name = role(rgb)
            if name == 'near':
                name = 'murmur'
        elif s < 0.12:
            name = 'murmur' if not saturated else ('near' if v < 0.5 else 'voice')
        elif v < 0.28:
            name = 'tint_add' if 75 <= h * 360 < 195 else 'tint_delete' if h * 360 < 12 or h * 360 >= 345 else 'tint_change'
        else:
            name = role(rgb)
        if name in ('murmur', 'whisper', 'breath') and muted_opacity:
            name = 'voice'
        return colors[name] + alpha

    def styles(text):
        return re.sub(r'(?<![-\w])(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}]+)', lambda m: m[1] + ':' + paint(m[2], m[1]), text)

    for node in tree.iter():
        if not isinstance(node.tag, str) or node in protected:
            continue
        for key in list(node.attrib):
            if key in PAINTS:
                node.set(key, paint(node.get(key), key))
            elif key == 'style':
                node.set(key, styles(node.get(key)))
        if node.tag.rsplit('}', 1)[-1] == 'style' and node.text:
            node.text = styles(node.text)
    if 'fill' not in tree.attrib:
        tree.set('fill', colors['murmur'])
    if unresolved:
        raise ValueError('unsupported paints: ' + ', '.join(sorted(unresolved)))
    prefix = re.split(r'<(?:[\w-]+:)?svg\b', source, maxsplit=1)[0]
    notices = re.findall(r'<!--[\s\S]*?-->', prefix)
    return ('\n'.join(notices) + '\n' if notices else '') + ET.tostring(tree, encoding='unicode') + '\n'


def main():
    manifest_path, palette_path, output = map(Path, sys.argv[1:4])
    colors = {name: item['hex'] for name, item in json.loads(palette_path.read_text())['colors'].items()}
    standards = {key.lower(): value for key, value in json.loads((Path(__file__).parent.parent / 'data/jetbrains-icon-colors.json').read_text()).items()}
    output.mkdir(parents=True, exist_ok=True)
    errors = []
    count = 0
    for source in sorted((manifest_path.parent / 'sources').glob('*.svg')):
        try:
            (output / source.name).write_text(normalize(source.read_text(), colors, standards))
            count += 1
        except Exception as error:
            errors.append({'source': source.name, 'error': str(error)})
    (output.parent / 'normalization.json').write_text(json.dumps({'svg': count, 'errors': errors}, indent=2) + '\n')
    print(f'{count} SVG sources normalized, {len(errors)} errors')
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
