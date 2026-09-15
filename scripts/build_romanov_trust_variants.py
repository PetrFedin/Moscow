from pathlib import Path
import trimesh

ROOT = Path('assets/models')


def filtered_scene(source: Path, prefixes: tuple[str, ...]):
    scene = trimesh.load(source, force='scene')
    remove = [name for name in scene.geometry.keys() if not name.startswith(prefixes)]
    if remove:
        scene.delete_geometry(remove)
    scene.metadata = dict(scene.metadata or {})
    scene.metadata['trust_filter'] = list(prefixes)
    return scene


def export_variant(era: str, mode: str, prefixes: tuple[str, ...]):
    source = ROOT / f'romanov-{era}-production-candidate-v1.glb'
    if not source.exists():
        raise FileNotFoundError(source)
    scene = filtered_scene(source, prefixes)
    target = ROOT / f'romanov-{era}-{mode}-v1.glb'
    scene.export(target)
    print(f'{target}: {len(scene.geometry)} geometry nodes, {target.stat().st_size} bytes')


for era in ('1857', '1859'):
    export_variant(era, 'documented', ('documented__',))
    export_variant(era, 'public', ('documented__', 'reconstructed__'))
