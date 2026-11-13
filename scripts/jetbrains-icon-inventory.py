import argparse
import hashlib
import json
import re
import struct
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET


def constants(data):
    count = struct.unpack_from('>H', data, 8)[0]
    at = 10
    result = []
    index = 1
    while index < count:
        tag = data[at]
        at += 1
        if tag == 1:
            size = struct.unpack_from('>H', data, at)[0]
            at += 2
            result.append(data[at:at + size].decode('utf-8', 'replace'))
            at += size
        elif tag in (3, 4, 9, 10, 11, 12, 17, 18):
            at += 4
        elif tag in (5, 6):
            at += 8
            index += 1
        elif tag in (7, 8, 16, 19, 20):
            at += 2
        elif tag == 15:
            at += 3
        else:
            raise ValueError(f'unknown class constant tag {tag}')
        index += 1
    return result


def dimensions(data, extension):
    if extension == 'png':
        if data[:8] != b'\x89PNG\r\n\x1a\n':
            return None, None
        return struct.unpack_from('>II', data, 16)
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return None, None
    result = []
    for attribute in ('width', 'height'):
        raw = root.attrib.get(attribute)
        if raw is None or raw.strip() == '100%':
            result.append(16)
        elif re.fullmatch(r'[+]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:px)?', raw.strip()):
            result.append(float(re.sub(r'px$', '', raw.strip())))
        else:
            result.append(None)
    return tuple(result)


def aliases(tree, prefix=()):
    for name, value in tree.items():
        path = prefix + (name,)
        if isinstance(value, dict):
            yield from aliases(value, path)
        elif isinstance(value, str):
            yield value.lstrip('/'), '/'.join(path).lstrip('/')
        elif isinstance(value, list):
            for old in value:
                if isinstance(old, str):
                    yield old.lstrip('/'), '/'.join(path).lstrip('/')


def base_path(path):
    return re.sub(r'(?:@2x|_dark|@3x)(?=\.|_|@|$)', '', path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--app', default='/Applications/IntelliJ IDEA.app/Contents')
    parser.add_argument('--plugins', default=str(Path.home() / 'Library/Application Support/JetBrains/IntelliJIdea2026.3/plugins'))
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    app = Path(args.app).resolve()
    plugins = Path(args.plugins).resolve()
    output = Path(args.output).resolve()
    if output.exists() and any(output.iterdir()):
        raise ValueError(f'output must be empty: {output}')
    sources = output / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    scopes = {}
    jars = []
    images = []
    registrations = []
    mapping_files = []
    errors = []
    skipped = []
    references = defaultdict(set)
    mapping_from = defaultdict(set)
    mapping_to = defaultdict(set)
    for jar in sorted(set(app.rglob('*.jar')) | set(plugins.rglob('*.jar'))):
        if jar.is_relative_to(plugins):
            origin, folder = 'user', jar.relative_to(plugins).parts[0]
        elif jar.is_relative_to(app / 'plugins'):
            origin, folder = 'bundled', jar.relative_to(app / 'plugins').parts[0]
        else:
            origin, folder = 'platform', 'platform'
        scope = 'platform' if origin == 'platform' else f'{origin}:{folder}'
        info = scopes.setdefault(scope, {'scope': scope, 'origin': origin, 'folder': folder, 'ids': [], 'primaryIds': [], 'jars': []})
        info['jars'].append(str(jar))
        if '/gateway-standalone/' in str(jar):
            skipped.append({'jar': str(jar), 'reason': 'standalone gateway app outside IntelliJ plugin classpath'})
            continue
        source_jar = bool(re.search(r'(-sources?|-src)\.jar$|/src/', str(jar)))
        if source_jar:
            skipped.append({'jar': str(jar), 'reason': 'source archive is not the plugin runtime'})
            continue
        jars.append({'scope': scope, 'jar': str(jar)})
        try:
            with zipfile.ZipFile(jar) as archive:
                for path in archive.namelist():
                    lower = path.lower()
                    if lower.endswith(('.svg', '.png')):
                        data = archive.read(path)
                        extension = lower[-3:]
                        width, height = dimensions(data, extension)
                        record = {'scope': scope, 'jar': str(jar), 'path': path, 'format': extension, 'width': width, 'height': height, 'sha256': hashlib.sha256(data).hexdigest()}
                        if extension == 'svg':
                            try:
                                attrs = ET.fromstring(data).attrib
                                record.update({'svgWidth': attrs.get('width'), 'svgHeight': attrs.get('height'), 'viewBox': attrs.get('viewBox')})
                            except ET.ParseError:
                                pass
                        images.append(record)
                    elif path.endswith('IconMappings.json'):
                        try:
                            mapping = json.loads(archive.read(path))
                            mapping_files.append({'scope': scope, 'jar': str(jar), 'path': path, 'mapping': mapping})
                            for old, new in aliases(mapping):
                                mapping_to[(scope, old)].add(new)
                                mapping_from[(scope, new)].add(old)
                        except (ValueError, TypeError) as error:
                            errors.append({'jar': str(jar), 'path': path, 'error': str(error)})
                    elif lower.endswith('.xml'):
                        try:
                            document = ET.fromstring(archive.read(path))
                            if document.tag == 'idea-plugin':
                                plugin_id = document.findtext('id') or (document.findtext('name') if path == 'META-INF/plugin.xml' else None)
                                if plugin_id:
                                    info['ids'].append(plugin_id)
                                    if path == 'META-INF/plugin.xml':
                                        info['primaryIds'].append(plugin_id)
                            for element in document.iter():
                                tag = element.tag.rsplit('}', 1)[-1]
                                if tag in ('fileType', 'fileTypeFactory', 'fileIconProvider', 'iconProvider', 'iconMapper'):
                                    registrations.append({'scope': scope, 'jar': str(jar), 'descriptor': path, 'tag': tag, 'attributes': element.attrib})
                                icon = element.attrib.get('icon', '')
                                if icon.lower().endswith(('.svg', '.png')):
                                    references[(scope, icon.lstrip('/'))].add(f'{path}:{tag}')
                        except ET.ParseError:
                            pass
                    elif path.endswith('.class') and (re.search(r'(?:^|/)[^/]*Icons(?:\$[^/]*)?\.class$', path) or path.endswith('FileType.class')):
                        try:
                            for value in constants(archive.read(path)):
                                if value.lower().endswith(('.svg', '.png')) and '\n' not in value and len(value) < 500:
                                    references[(scope, value.lstrip('/'))].add(path[:-6].replace('/', '.'))
                        except (ValueError, IndexError, struct.error) as error:
                            errors.append({'jar': str(jar), 'path': path, 'error': str(error)})
        except zipfile.BadZipFile as error:
            errors.append({'jar': str(jar), 'error': str(error)})
    for info in scopes.values():
        info['ids'] = sorted(set(info['ids']))
        info['primaryIds'] = sorted(set(info['primaryIds']))
        info['pluginId'] = info['primaryIds'][0] if len(info['primaryIds']) == 1 else (info['ids'][0] if len(info['ids']) == 1 else None)
    user_ids = {info['pluginId'] for info in scopes.values() if info['origin'] == 'user' and info['pluginId']}
    selected = {}
    collisions = []
    for record in images:
        info = scopes[record['scope']]
        reason = None
        if info['origin'] == 'bundled' and info['pluginId'] in user_ids:
            reason = 'bundled plugin superseded by installed user plugin with same id'
        elif info['pluginId'] == 'dev.steelesh.sotto' or info['folder'] == 'sotto':
            reason = 'sotto output excluded to prevent recursive import'
        elif 'META-INF/resources/webjars/' in record['path'] or record['path'].startswith(('static/', 'org/testng/')):
            reason = 'embedded web or report asset outside IDE icon loader'
        elif record['width'] is not None and record['height'] is not None and max(record['width'], record['height']) > 64 and re.search(r'banner|preview|thumbnail|illustration|onboarding', record['path'], re.IGNORECASE):
            reason = 'large UI illustration rather than an icon glyph'
        key = (record['scope'], record['path'])
        base = (record['scope'], base_path(record['path']))
        refs = sorted(references.get(key, set()) | references.get(base, set()))
        mapped_from = sorted(mapping_from.get(key, set()) | mapping_from.get(base, set()))
        mapped_to = sorted(mapping_to.get(key, set()) | mapping_to.get(base, set()))
        if not reason and not refs and not mapped_from and not mapped_to:
            if record['width'] is None or record['height'] is None:
                reason = 'unknown dimensions and no static icon reference'
            elif max(record['width'], record['height']) > 64:
                reason = 'larger than 64px and no static icon reference'
        if reason:
            skipped.append({**record, 'reason': reason})
            continue
        record.update({'pluginId': info['pluginId'], 'referencedBy': refs, 'mappedFrom': mapped_from, 'mappedTo': mapped_to})
        previous = selected.get(key)
        if previous:
            if previous['sha256'] != record['sha256']:
                collisions.append({'scope': record['scope'], 'path': record['path'], 'first': previous, 'second': record})
            else:
                skipped.append({**record, 'reason': 'duplicate resource with identical contents in same scope'})
            continue
        selected[key] = record
    manifest = sorted(selected.values(), key=lambda item: (item['scope'], item['path']))
    opened = {}
    try:
        for record in manifest:
            source = f"sources/{record['sha256']}.{record['format']}"
            record['source'] = source
            if not (output / source).exists():
                if record['jar'] not in opened:
                    opened[record['jar']] = zipfile.ZipFile(record['jar'])
                (output / source).write_bytes(opened[record['jar']].read(record['path']))
    finally:
        for archive in opened.values():
            archive.close()
    report = {
        'app': str(app), 'plugins': str(plugins), 'scannedJars': len(jars), 'foundImages': len(images),
        'selectedImages': len(manifest), 'uniqueSources': len(list(sources.iterdir())),
        'formats': dict(Counter(record['format'] for record in manifest)),
        'byScope': dict(Counter(record['scope'] for record in manifest)),
        'skippedReasons': dict(Counter(record['reason'] for record in skipped)),
        'registrationCounts': dict(Counter(record['tag'] for record in registrations)),
        'mappingFiles': len(mapping_files), 'collisions': len(collisions), 'errors': len(errors)
    }
    for name, value in [('manifest', manifest), ('scopes', list(scopes.values())), ('registrations', registrations), ('mappings', mapping_files), ('skipped', skipped), ('collisions', collisions), ('errors', errors), ('summary', report)]:
        (output / f'{name}.json').write_text(json.dumps(value, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key not in ('app', 'plugins', 'byScope', 'skippedReasons')}, indent=2))
    if errors or collisions:
        raise SystemExit('inventory has errors or conflicting resources; inspect errors.json and collisions.json')


if __name__ == '__main__':
    main()
