# Romanov mobile model performance gate

This gate is a **technical mobile budget**, not historical field verification.

It fails CI when a Romanov GLB exceeds the agreed byte/scene-complexity budget, introduces animations/skins into the static heritage scene, or depends on external buffers/images.

For the two production-candidate files, CI additionally proves that:

- actual byte size equals the production manifest;
- actual node count equals the manifest geometry node count;
- manifest units are meters;
- manifest bounds are finite and ordered.

## Current technical budgets

- <= 5 MiB per GLB;
- <= 16 MiB for the four runtime era/trust variants together;
- <= 500 nodes, 250 meshes, 500 primitives, 150,000 triangles per GLB;
- <= 64 materials, 32 textures and 32 images per GLB;
- zero animations and skins for the static heritage scene;
- self-contained GLB: no external buffer/image dependencies.

## What this proves

It prevents unreviewed geometry or texture growth from silently turning the Romanov scene into an unsuitable mobile asset pack, and it checks the generated manifest against the actual binaries.

## What this does not prove

It does not prove physical-device frame rate, GPU memory, thermal behaviour, accurate facade dimensions, on-site scale or AR alignment quality. Those remain separate device and field gates.
