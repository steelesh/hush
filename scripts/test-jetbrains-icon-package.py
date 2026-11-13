import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parent.parent


class IconPackageTest(unittest.TestCase):
    def test_scoped_paths_custom_dark_variants_and_retina_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            inventory, normalized, resources = (root / name for name in ('inventory', 'normalized', 'resources'))
            for directory in (inventory, normalized, resources):
                directory.mkdir()
            records = []
            for scope, plugin, path, content in [
                ('platform', 'com.intellij', 'nodes/folder.svg', '<svg width="16" height="16"/>'),
                ('platform', 'com.intellij', 'nodes/folder_dark.svg', '<svg width="16" height="16"><path/></svg>'),
                ('bundled:example', 'example.plugin', 'nodes/folder.svg', '<svg width="20" height="20"/>'),
                ('platform', 'com.intellij', 'old.png', 'native base bytes'),
                ('platform', 'com.intellij', 'old@2x.png', 'native retina bytes'),
            ]:
                extension = path.rsplit('.', 1)[1]
                name = hashlib.sha256(content.encode()).hexdigest() + '.' + extension
                (normalized / name).write_text(content)
                records.append({'scope': scope, 'pluginId': plugin, 'path': path, 'format': extension, 'source': 'sources/' + name})
            (inventory / 'manifest.json').write_text(json.dumps(records))
            for name in ('scopes.json', 'skipped.json'):
                (inventory / name).write_text('[]')
            for name in ('sotto', 'sotto-black'):
                (resources / (name + '.theme.json')).write_text(json.dumps({'icons': {'ColorPalette': {}, '/nodes/folder.svg': '/icons/sotto/folders/folder.svg'}}))
            subprocess.run(['python3', str(ROOT / 'scripts/jetbrains-icon-package.py'), str(inventory), str(normalized), str(resources)], check=True, capture_output=True)
            for name in ('sotto', 'sotto-black'):
                icons = json.loads((resources / (name + '.theme.json')).read_text())['icons']
                for path in ('nodes/folder.svg', 'nodes/folder_dark.svg'):
                    for prefix in ('', '/'):
                        self.assertEqual(icons[prefix + path], '/icons/sotto/folders/folder.svg')
                self.assertNotEqual(icons['example.plugin']['nodes/folder.svg'], icons['nodes/folder.svg'])
                self.assertEqual(icons['example.plugin']['nodes/folder.svg'], icons['example.plugin']['/nodes/folder.svg'])
                raster = resources / icons['old.png'].lstrip('/')
                self.assertEqual(raster.read_text(), 'native base bytes')
                self.assertEqual(raster.with_name(raster.name.replace('.png', '@2x.png')).read_text(), 'native retina bytes')
            self.assertEqual(len(list((resources / 'icons/sotto/imported').iterdir())), 3)


if __name__ == '__main__':
    unittest.main()
