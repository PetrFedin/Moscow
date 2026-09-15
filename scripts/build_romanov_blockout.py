import trimesh
import numpy as np
from pathlib import Path

OUT = Path('assets/models/romanov-chambers-blockout-v0.glb')
OUT.parent.mkdir(parents=True, exist_ok=True)
scene = trimesh.Scene()


def add_box(name, extents, center, color):
    mesh = trimesh.creation.box(extents=extents)
    mesh.apply_translation(center)
    mesh.visual.face_colors = np.tile(np.array(color, dtype=np.uint8), (len(mesh.faces), 1))
    scene.add_geometry(mesh, node_name=name, geom_name=name)


# TECHNICAL BLOCKOUT ONLY.
# Dimensions are approximate and exist to test loading, scale, transforms and AR calibration.
# They must not be treated as verified historical measurements.
add_box('lower_masonry', (12.0, 8.0, 5.0), (0.0, 0.0, 2.5), (180, 165, 140, 255))
add_box('upper_chamber', (11.2, 7.4, 4.0), (0.0, 0.0, 7.0), (175, 125, 80, 255))
add_box('entrance_mass', (4.5, 3.0, 2.5), (-7.0, -1.5, 1.25), (155, 145, 125, 255))

for i in range(5):
    add_box(
        f'step_{i}',
        (1.0, 3.0, 0.35),
        (-9.5 + i * 0.9, -1.5, 0.175 + i * 0.35),
        (150, 145, 135, 255),
    )

# Explicit triangular-prism roof, avoiding an extra triangulation dependency.
vertices = np.array([
    [-6, -4, 9], [6, -4, 9], [0, -4, 12.2],
    [-6, 4, 9], [6, 4, 9], [0, 4, 12.2],
], dtype=float)
faces = np.array([
    [0, 1, 2], [3, 5, 4],
    [0, 3, 4], [0, 4, 1],
    [1, 4, 5], [1, 5, 2],
    [2, 5, 3], [2, 3, 0],
], dtype=int)
roof = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
roof.visual.face_colors = np.tile(np.array((85, 80, 78, 255), dtype=np.uint8), (len(roof.faces), 1))
scene.add_geometry(roof, node_name='pitched_roof', geom_name='pitched_roof')

add_box('ground_reference', (18.0, 14.0, 0.05), (0.0, 0.0, -0.025), (70, 70, 70, 120))

scene.metadata['title'] = 'Romanov Chambers technical blockout v0'
scene.metadata['status'] = 'draft-not-historical-reconstruction'
scene.metadata['units'] = 'meters'
scene.export(OUT)

print(f'Generated {OUT} ({OUT.stat().st_size} bytes)')
print(f'Bounds: {scene.bounds.tolist()}')
