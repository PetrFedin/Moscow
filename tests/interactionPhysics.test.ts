import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSnapPoint, type SnapPoint } from '../src/ui/interactionPhysics.ts';

const points: SnapPoint[] = [
  { state: 'expanded', position: 72 },
  { state: 'preview', position: 292 },
  { state: 'collapsed', position: 430 }
];

test('high velocity does not overcommit beyond a snap already reached by the pointer', () => {
  const target = resolveSnapPoint(287, 1100, points, 72);
  assert.equal(target.state, 'preview');
  assert.equal(target.position, 292);
});

test('pointer position remains authoritative when user physically traverses multiple snaps', () => {
  const target = resolveSnapPoint(420, 1100, points, 72);
  assert.equal(target.state, 'collapsed');
});

test('fast flick from a stable state commits one adjacent snap even before midpoint', () => {
  const target = resolveSnapPoint(120, 900, points, 72);
  assert.equal(target.state, 'preview');
});

test('slow release resolves only by nearest position', () => {
  const target = resolveSnapPoint(250, 200, points, 72);
  assert.equal(target.state, 'preview');
});

test('reverse high velocity from preview commits expanded without an extra transition', () => {
  const target = resolveSnapPoint(278, -950, points, 292);
  assert.equal(target.state, 'expanded');
});
