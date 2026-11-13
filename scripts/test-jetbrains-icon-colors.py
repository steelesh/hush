import importlib.util
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location('icon_colors', ROOT / 'scripts/jetbrains-icon-colors.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
COLORS = {name: entry['hex'] for name, entry in json.loads((ROOT / 'palette.json').read_text())['colors'].items()}
STANDARDS = {color.lower(): name for color, name in json.loads((ROOT / 'data/jetbrains-icon-colors.json').read_text()).items()}
NS = {'svg': 'http://www.w3.org/2000/svg'}


def normalized(body):
    source = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' + body + '</svg>'
    return ET.fromstring(MODULE.normalize(source, COLORS, STANDARDS))


class IconColorsTest(unittest.TestCase):
    def test_standard_fills_precede_brightness_heuristics(self):
        for source, role in [('#EBECF0', 'near'), ('#FFF4EB', 'tint_search'), ('#F2FCF3', 'tint_add'), ('#FFF7F7', 'tint_delete'), ('#FAF5FF', 'tint_change')]:
            with self.subTest(source=source):
                icon = normalized(f'<rect width="16" height="16" fill="{source}"/><path d="M1 1h4" stroke="#3574F0"/>')
                self.assertEqual(icon.find('svg:rect', NS).get('fill'), COLORS[role])

    def test_white_glyph_contrasts_with_colored_tile(self):
        icon = normalized('<rect width="16" height="16" fill="#3574F0"/><path d="M4 4h8v8H4z" fill="#fff"/>')
        self.assertEqual(icon.find('svg:rect', NS).get('fill'), COLORS['cue'])
        self.assertEqual(icon.find('svg:path', NS).get('fill'), COLORS['pitch'])

    def test_white_stroked_glyph_contrasts_with_colored_tile(self):
        icon = normalized('<circle cx="8" cy="8" r="7" fill="#3574F0" stroke="#3574F0"/><path d="M8 4v5" stroke="white"/><circle cx="8" cy="11" r="1" fill="white"/>')
        self.assertEqual(icon.find('svg:path', NS).get('stroke'), COLORS['pitch'])
        self.assertEqual(icon.findall('svg:circle', NS)[1].get('fill'), COLORS['pitch'])

    def test_standalone_monochrome_glyph_stays_visible(self):
        for source, role in [('#000', 'murmur'), ('#fff', 'voice')]:
            with self.subTest(source=source):
                icon = normalized(f'<path d="M1 1h4" fill="{source}"/>')
                self.assertEqual(icon.find('svg:path', NS).get('fill'), COLORS[role])

    def test_mask_and_clip_paints_keep_their_computational_values(self):
        icon = normalized('<defs><mask id="mask"><rect fill="#fff" width="16" height="16"/><path fill="#000" fill-opacity=".4" d="M1 1h4"/></mask><clipPath id="clip"><rect fill="#fff" width="8" height="8"/></clipPath></defs><rect fill="#3574F0" mask="url(#mask)" clip-path="url(#clip)" width="16" height="16"/>')
        self.assertEqual(icon.find('.//svg:mask/svg:rect', NS).get('fill'), '#fff')
        self.assertEqual(icon.find('.//svg:mask/svg:path', NS).get('fill'), '#000')
        self.assertEqual(icon.find('.//svg:mask/svg:path', NS).get('fill-opacity'), '.4')
        self.assertEqual(icon.find('.//svg:clipPath/svg:rect', NS).get('fill'), '#fff')
        self.assertEqual(icon.find('svg:rect', NS).get('mask'), 'url(#mask)')

    def test_currentcolor_uses_the_ancestor_color(self):
        icon = normalized('<g color="#DB3B4B"><g><path d="M1 1h4" fill="currentColor"/></g></g>')
        self.assertEqual(icon.find('.//svg:path', NS).get('fill'), COLORS['sharp'])

    def test_currentcolor_as_color_retains_inherited_color(self):
        icon = normalized('<g color="#DB3B4B"><g color="currentColor"><path d="M1 1h4" fill="currentColor"/></g></g>')
        self.assertEqual(icon.find('.//svg:path', NS).get('fill'), COLORS['sharp'])

    def test_gradient_stops_normalize_without_changing_opacity(self):
        icon = normalized('<defs><linearGradient id="gradient"><stop offset="0" stop-color="#3574F0" stop-opacity=".2"/><stop offset="1" style="stop-color:#DB3B4B;stop-opacity:.8"/></linearGradient></defs><rect fill="url(#gradient)" width="16" height="16"/>')
        stops = icon.findall('.//svg:stop', NS)
        self.assertEqual(stops[0].get('stop-color'), COLORS['cue'])
        self.assertEqual(stops[0].get('stop-opacity'), '.2')
        self.assertEqual(stops[1].get('style'), f"stop-color:{COLORS['sharp']};stop-opacity:.8")
        self.assertEqual(icon.find('svg:rect', NS).get('fill'), 'url(#gradient)')

    def test_unknown_paint_fails_instead_of_leaking_original_color(self):
        with self.assertRaisesRegex(ValueError, 'unsupported paints'):
            normalized('<path fill="var(--unsupported-paint)" d="M1 1h4"/>')


class SourceNoticeTest(unittest.TestCase):
    def test_source_notice_is_preserved(self):
        source = '<!-- upstream license notice -->\n<svg xmlns="http://www.w3.org/2000/svg"><path fill="red" d="M1 1h14v14H1z"/></svg>'
        self.assertTrue(MODULE.normalize(source, COLORS, STANDARDS).startswith('<!-- upstream license notice -->'))


class MutedIconContrastTest(unittest.TestCase):
    def test_half_opacity_neutral_glyph_keeps_visible_foreground(self):
        output = MODULE.normalize('<svg xmlns="http://www.w3.org/2000/svg"><path opacity=".5" fill="#6c707e" d="M1 1h14v14H1z"/></svg>', COLORS, STANDARDS)
        self.assertIn(COLORS['voice'], output)
        self.assertIn('opacity=".5"', output)


if __name__ == '__main__':
    unittest.main()
