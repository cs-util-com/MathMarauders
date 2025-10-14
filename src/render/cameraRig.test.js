import { createCameraRig } from './cameraRig.js';

function createRig() {
  const rig = createCameraRig();
  const { camera } = rig;
  return { rig, camera };
}

// why this test matters: idle phase should snap the camera to the staging pose.
test('setPhase to idle resets camera pose', () => {
  const { rig, camera } = createRig();
  rig.setPhase('idle');
  expect(camera.position.x).toBeCloseTo(0);
  expect(camera.position.y).toBeCloseTo(8);
  expect(camera.position.z).toBeCloseTo(18);
});

// why this test matters: reverse-gate maps onto reverse camera samples.
test('reverse gate phase reuses reverse samples', () => {
  const { rig, camera } = createRig();
  rig.setPhase('reverse-gate');
  expect(camera.position.z).toBeCloseTo(-14);
  expect(camera.position.y).toBeCloseTo(6.6);
});

// why this test matters: unknown phases should fall back to forward to avoid crashes.
test('unknown phase falls back to forward samples', () => {
  const { rig, camera } = createRig();
  rig.setPhase('mystery');
  expect(camera.position.z).toBeCloseTo(18);
});

// why this test matters: updates advance progress and track look targets.
test('update advances progress and lerps look target', () => {
  const { rig, camera } = createRig();
  rig.setPhase('forward');
  const initialZ = camera.position.z;
  rig.update({ delta: 0.9, lookTarget: { x: 1, y: 0, z: -5 } });
  expect(camera.position.z).not.toBe(initialZ);
  rig.update({ delta: 0.9 });
  expect(camera.position.z).toBeCloseTo(-10);
});

// why this test matters: resizing must adjust aspect ratio for postprocessing.
test('handleResize updates aspect ratio', () => {
  const { rig, camera } = createRig();
  rig.handleResize(1920, 1080);
  expect(camera.aspect).toBeCloseTo(1920 / 1080);
});
