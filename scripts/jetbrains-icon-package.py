import hashlib
import json
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path


def canonical(path):
    return re.sub(r'(?:@2x|_dark)(?=\.[^.]+$|@2x|_dark)', '', path)


def main():
    inventory, normalized, resources = map(Path, sys.argv[1:4])
    records = json.loads((inventory / 'manifest.json').read_text())
    groups = defaultdict(list)
    for record in records:
        groups[(record['pluginId'], canonical(record['path']))].append(record)
    imported = resources / 'icons/sotto/imported'
    imported.mkdir(parents=True, exist_ok=True)
    replacements = {}
    coverage = []
    for (plugin, base_path), variants in sorted(groups.items(), key=lambda item: (item[0][0] or '', item[0][1])):
        preferred = max(variants, key=lambda item: ('_dark' in item['path'], '@2x' in item['path']))
        retina = None
        if preferred['format'] == 'png':
            native = [item for item in variants if '@2x' not in item['path']]
            if not native:
                raise ValueError('raster family has no native base image: ' + base_path)
            preferred = max(native, key=lambda item: '_dark' in item['path'])
            high = [item for item in variants if '@2x' in item['path']]
            retina = max(high, key=lambda item: '_dark' in item['path']) if high else None
            content = (normalized / Path(preferred['source']).name).read_bytes()
            doubled = (normalized / Path(retina['source']).name).read_bytes() if retina else b''
            name = hashlib.sha256(content + doubled).hexdigest()[:24] + '.png'
            (imported / name).write_bytes(content)
            if retina:
                (imported / name.replace('.png', '@2x.png')).write_bytes(doubled)
        else:
            source = normalized / (Path(preferred['source']).stem + '.svg')
            content = source.read_text()
            name = hashlib.sha256(content.encode()).hexdigest()[:24] + '.svg'
            (imported / name).write_text(content)
        target = '/icons/sotto/imported/' + name
        for variant in variants:
            scope = replacements if variant['scope'] == 'platform' else replacements.setdefault(plugin, {})
            for key in (variant['path'], '/' + variant['path']):
                scope[key] = target
            coverage.append({**variant, 'target': target, 'selectedSource': preferred['source'], 'selectedPath': preferred['path'], 'retinaSource': retina['source'] if retina else None})
    for theme_file in resources.glob('*.theme.json'):
        theme = json.loads(theme_file.read_text())
        custom = theme['icons']
        scoped = {plugin: paths for plugin, paths in custom.items() if isinstance(paths, dict) and plugin != 'ColorPalette'}
        theme['icons'] = {**replacements, **{key: value for key, value in custom.items() if key not in scoped}}
        for plugin, paths in scoped.items():
            theme['icons'][plugin] = {**replacements.get(plugin, {}), **paths, **{path.lstrip('/'): target for path, target in paths.items()}}
        for path, target in custom.items():
            if path.startswith('/'):
                theme['icons'][path.lstrip('/')] = target
        for record in coverage:
            custom_key = '/' + canonical(record['path'])
            if record['scope'] == 'platform' and custom_key in custom:
                record['target'] = custom[custom_key]
                theme['icons'][record['path']] = record['target']
                theme['icons']['/' + record['path']] = record['target']
            elif record['scope'] != 'platform' and custom_key in scoped.get(record['pluginId'], {}):
                record['target'] = scoped[record['pluginId']][custom_key]
                theme['icons'][record['pluginId']][record['path']] = record['target']
                theme['icons'][record['pluginId']]['/' + record['path']] = record['target']
        theme_file.write_text(json.dumps(theme, indent=2) + '\n')
    used = {Path(record['target']).name for record in coverage if record['target'].startswith('/icons/sotto/imported/')}
    used.update(name.replace('.png', '@2x.png') for name in list(used) if name.endswith('.png'))
    for asset in imported.iterdir():
        if asset.name not in used:
            asset.unlink()
    report = {'resources': len(records), 'families': len(groups), 'assets': len(list(imported.iterdir())), 'svg': sum(r['format'] == 'svg' for r in records), 'raster': sum(r['format'] == 'png' for r in records), 'records': coverage}
    report_path = resources.parent / 'icon-coverage.json'
    report_path.write_text(json.dumps(report, indent=2) + '\n')
    provenance = resources / 'META-INF/sotto-icons'
    provenance.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(report_path, provenance / 'coverage.json')
    shutil.copyfile(inventory / 'skipped.json', provenance / 'skipped.json')
    shutil.copyfile(inventory / 'scopes.json', provenance / 'scopes.json')
    print(f"{len(records)} icon resources, {len(groups)} families, {report['assets']} imported icon assets")


if __name__ == '__main__':
    main()
