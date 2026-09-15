from pathlib import Path
import json, math
import numpy as np
import trimesh

OUT = Path('assets/models')
OUT.mkdir(parents=True, exist_ok=True)

COLORS = {
    'documented': np.array([194, 181, 154, 255], dtype=np.uint8),
    'reconstructed': np.array([171, 124, 78, 255], dtype=np.uint8),
    'hypothesis': np.array([108, 126, 145, 150], dtype=np.uint8),
}


def add_mesh(scene, mesh, name, layer='documented'):
    mesh.visual.face_colors = np.tile(COLORS[layer], (len(mesh.faces), 1))
    scene.add_geometry(mesh, node_name=f'{layer}__{name}', geom_name=f'{layer}__{name}')


def box(scene, name, extents, center, layer='documented', rot_y_deg=0):
    mesh = trimesh.creation.box(extents=extents)
    if rot_y_deg:
        mesh.apply_transform(trimesh.transformations.rotation_matrix(math.radians(rot_y_deg), [0, 1, 0]))
    mesh.apply_translation(center)
    add_mesh(scene, mesh, name, layer)


def cylinder(scene, name, radius, height, center, layer='documented', sections=16):
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    mesh.apply_translation(center)
    add_mesh(scene, mesh, name, layer)


def frustum_roof(scene, name, width, depth, z0, z1, top_scale=0.42, layer='reconstructed'):
    w, d = width / 2, depth / 2
    wt, dt = w * top_scale, d * top_scale
    vertices = np.array([
        [-w, -d, z0], [w, -d, z0], [w, d, z0], [-w, d, z0],
        [-wt, -dt, z1], [wt, -dt, z1], [wt, dt, z1], [-wt, dt, z1],
    ], dtype=float)
    faces = np.array([
        [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5],
        [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7],
        [4, 5, 6], [4, 6, 7],
    ], dtype=int)
    add_mesh(scene, trimesh.Trimesh(vertices=vertices, faces=faces, process=True), name, layer)


def gable_roof(scene, name, width, depth, z0, ridge_z, layer='reconstructed'):
    w, d = width / 2, depth / 2
    vertices = np.array([
        [-w, -d, z0], [w, -d, z0], [0, -d, ridge_z],
        [-w, d, z0], [w, d, z0], [0, d, ridge_z],
    ], dtype=float)
    faces = np.array([
        [0, 1, 2], [3, 5, 4], [0, 3, 4], [0, 4, 1],
        [1, 4, 5], [1, 5, 2], [2, 5, 3], [2, 3, 0],
    ], dtype=int)
    add_mesh(scene, trimesh.Trimesh(vertices=vertices, faces=faces, process=True), name, layer)


def window_frame(scene, name, x, y, z, w=1.0, h=1.7, depth=0.14, layer='reconstructed'):
    t = 0.13
    box(scene, f'{name}_left', (t, depth, h), (x - w / 2, y, z), layer)
    box(scene, f'{name}_right', (t, depth, h), (x + w / 2, y, z), layer)
    box(scene, f'{name}_top', (w + t, depth, t), (x, y, z + h / 2), layer)
    box(scene, f'{name}_bottom', (w + t, depth, t), (x, y, z - h / 2), layer)


def rustication(scene, y, z_start, width=11.3, rows=5, cols=13):
    dx = width / (cols - 1)
    for row in range(rows):
        for column in range(cols):
            x = -width / 2 + column * dx + (dx * 0.5 if row % 2 else 0)
            if abs(x) > width / 2:
                continue
            box(scene, f'rust_{row}_{column}', (0.42, 0.10, 0.42), (x, y, z_start + row * 0.56), 'reconstructed', 45)


def arch_ring(scene, name, center_x, y, base_z, outer_r=1.55, inner_r=1.08, depth=0.55, layer='reconstructed', segments=28):
    vertices, faces = [], []
    for yy in [y - depth / 2, y + depth / 2]:
        for radius in [outer_r, inner_r]:
            for i in range(segments + 1):
                theta = math.pi * i / segments
                vertices.append([center_x + radius * math.cos(theta), yy, base_z + radius * math.sin(theta)])
    vertices = np.array(vertices, float)
    n = segments + 1

    def idx(side, ring, i):
        return side * (2 * n) + ring * n + i

    for i in range(segments):
        for side in [0, 1]:
            a, b, c, d = idx(side, 0, i), idx(side, 0, i + 1), idx(side, 1, i + 1), idx(side, 1, i)
            faces += [[a, b, c], [a, c, d]]
        a, b, c, d = idx(0, 0, i), idx(0, 0, i + 1), idx(1, 0, i + 1), idx(1, 0, i)
        faces += [[a, d, c], [a, c, b]]
        a, b, c, d = idx(0, 1, i), idx(0, 1, i + 1), idx(1, 1, i + 1), idx(1, 1, i)
        faces += [[a, b, c], [a, c, d]]
    for i in [0, segments]:
        a, b, c, d = idx(0, 0, i), idx(1, 0, i), idx(1, 1, i), idx(0, 1, i)
        faces += [[a, b, c], [a, c, d]]
    add_mesh(scene, trimesh.Trimesh(vertices=vertices, faces=np.array(faces, int), process=True), name, layer)
    leg_h = base_z
    box(scene, f'{name}_leg_left', (outer_r - inner_r, depth, leg_h), (center_x - (outer_r + inner_r) / 2, y, leg_h / 2), layer)
    box(scene, f'{name}_leg_right', (outer_r - inner_r, depth, leg_h), (center_x + (outer_r + inner_r) / 2, y, leg_h / 2), layer)


def stairs(scene, name, start_x, y, width, run, rise, count, layer='reconstructed'):
    for i in range(count):
        height = rise * (i + 1)
        box(scene, f'{name}_{i}', (run, width, height), (start_x + run * (i + 0.5), y, height / 2), layer)


def make_1857():
    scene = trimesh.Scene()
    box(scene, 'masonry_lower', (12.6, 7.6, 4.3), (0, 0, 2.15), 'documented')
    box(scene, 'masonry_upper', (12.6, 7.6, 3.5), (0, 0, 6.05), 'documented')
    for i, x in enumerate(np.linspace(-4.8, 4.8, 6)):
        window_frame(scene, f'street_window_{i}', x, -3.86, 6.15, 0.95, 1.45, 0.16, 'documented')
    frustum_roof(scene, 'pre_restoration_roof', 13.0, 8.0, 7.8, 9.25, 0.70, 'documented')
    for i, x in enumerate([-2.3, 2.3]):
        window_frame(scene, f'lower_opening_{i}', x, -3.86, 2.6, 0.55, 0.75, 0.12, 'documented')
    box(scene, 'west_service_mass', (3.8, 4.8, 3.2), (-7.8, -0.4, 1.6), 'hypothesis')
    scene.metadata.update({
        'title': 'Romanov Chambers 1857 research state v1',
        'status': 'production-candidate-not-field-certified',
        'units': 'meters',
        'era': '1857-pre-restoration',
        'scale_status': 'provisional-pending-architectural-survey',
        'evidence_layers': ['documented', 'hypothesis'],
    })
    return scene


def make_1859():
    scene = trimesh.Scene()
    box(scene, 'lower_masonry', (12.6, 7.6, 4.3), (0, 0, 2.15), 'documented')
    box(scene, 'stone_chamber', (12.6, 7.6, 3.5), (0, 0, 6.05), 'documented')
    rustication(scene, -3.86, 1.1)
    for i, x in enumerate(np.linspace(-4.6, 4.6, 5)):
        window_frame(scene, f'white_stone_window_{i}', x, -3.88, 6.15, 0.95, 1.55, 0.16, 'reconstructed')
        box(scene, f'pediment_{i}', (0.9, 0.12, 0.10), (x, -3.96, 7.15), 'reconstructed')
    box(scene, 'timber_terem', (9.7, 6.6, 3.0), (0, 0, 9.30), 'reconstructed')
    for i, x in enumerate(np.linspace(-3.7, 3.7, 5)):
        window_frame(scene, f'terem_window_{i}', x, -3.36, 9.35, 0.75, 1.35, 0.12, 'reconstructed')
    frustum_roof(scene, 'terem_roof', 10.1, 7.0, 10.8, 12.35, 0.66, 'reconstructed')
    for i, x in enumerate([-1.4, 1.2]):
        cylinder(scene, f'chimney_{i}', 0.18, 1.05, (x, 0.9, 12.45), 'reconstructed', 12)
    arch_ring(scene, 'porch_arch', -7.0, -3.35, 2.55, 1.55, 1.08, 0.8, 'reconstructed')
    box(scene, 'porch_upper', (3.8, 2.7, 2.2), (-7.0, -2.9, 4.35), 'reconstructed')
    gable_roof(scene, 'porch_roof', 4.2, 3.1, 5.45, 6.65, 'reconstructed')
    stairs(scene, 'grand_stair', -10.5, -2.7, 2.7, 0.48, 0.24, 8, 'reconstructed')
    box(scene, 'side_mass_pending_survey', (2.0, 3.8, 4.8), (7.2, 0.5, 2.4), 'hypothesis')
    scene.metadata.update({
        'title': 'Romanov Chambers 1859/1883 research reconstruction v1',
        'status': 'production-candidate-not-field-certified',
        'units': 'meters',
        'era': '1859-restoration-as-documented-by-1883-photo',
        'scale_status': 'provisional-pending-architectural-survey',
        'evidence_layers': ['documented', 'reconstructed', 'hypothesis'],
    })
    return scene


def export_scene(scene, stem):
    glb_path = OUT / f'{stem}.glb'
    scene.export(glb_path)
    gltf = trimesh.exchange.gltf.export_gltf(scene, merge_buffers=True, embed_buffers=True)
    gltf_name = next(name for name in gltf if name.endswith('.gltf'))
    gltf_path = OUT / f'{stem}.gltf'
    gltf_path.write_bytes(gltf[gltf_name])
    return {
        'glb': str(glb_path),
        'glb_bytes': glb_path.stat().st_size,
        'gltf': str(gltf_path),
        'gltf_bytes': gltf_path.stat().st_size,
        'bounds': scene.bounds.round(3).tolist(),
        'geometry_nodes': len(scene.geometry),
    }


scenes = {'1857': make_1857(), '1859': make_1859()}
report = {era: export_scene(scene, f'romanov-{era}-production-candidate-v1') for era, scene in scenes.items()}
manifest = {
    'model_pack': 'Romanov Chambers production candidate v1',
    'status': 'research reconstruction; not field-certified',
    'units': 'meters',
    'source_basis': [
        {'type': 'official museum history', 'url': 'https://shm.ru/kollektsii-i-muzeynyy-kompleks/museum_history/palaty-romanovykh/history/'},
        {'type': '1859 architectural graphic', 'url': 'https://catalog.shm.ru/entity/OBJECT/6323005'},
        {'type': '1857 pre-restoration image', 'url': 'https://commons.wikimedia.org/wiki/File:Палаты_бояр_Романовых._1857.jpg'},
        {'type': 'official Moscow architectural-archaeological documentation', 'url': 'https://www.mos.ru/upload/documents/files/614/Romanovperd2_6str3.pdf'},
        {'type': 'official Moscow floor-plan material', 'url': 'https://www.mos.ru/upload/documents/files/8873/25082020_16-31-570_20_Emelyanov_AA_Rojdestvenskaya_SA.pdf'},
    ],
    'confidence_policy': {
        'documented': 'visible in archival/current evidence or confirmed by official museum/restoration documentation; exact dimensions still require survey',
        'reconstructed': 'associated with the Richter restoration / inferred from early post-restoration imagery; exact proportions provisional',
        'hypothesis': 'placeholder massing pending survey; hidden from public historical mode until resolved',
    },
    'field_gate': [
        'verify global width/depth/height against official measured drawing or field measurement',
        'survey at least five stable facade control points',
        'replace hypothesis side mass with measured geometry',
        'validate window spacing and porch/stair dimensions',
        'record AR alignment error at 5m, 10m and 15m viewing distance',
    ],
    'outputs': report,
}
(OUT / 'romanov-production-candidate-v1.manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False, indent=2))
