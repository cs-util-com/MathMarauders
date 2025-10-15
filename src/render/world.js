import {
  BufferAttribute,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

const LANE_LENGTH = 80;
const LANE_WIDTH = 10;

function createGradientBackdrop() {
  const geometry = new PlaneGeometry(120, 80, 1, 1);
  const top = new Color('#12151a');
  const bottom = new Color('#1e2633');
  const colors = new Float32Array([
    top.r,
    top.g,
    top.b,
    top.r,
    top.g,
    top.b,
    bottom.r,
    bottom.g,
    bottom.b,
    bottom.r,
    bottom.g,
    bottom.b,
  ]);
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  const material = new MeshBasicMaterial({
    vertexColors: true,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(0, 20, -20);
  mesh.rotation.x = -Math.PI / 12;
  mesh.renderOrder = -1;
  return mesh;
}

function createLane() {
  const root = new Group();
  const baseGeometry = new PlaneGeometry(LANE_WIDTH, LANE_LENGTH, 1, 1);
  const baseMaterial = new MeshStandardMaterial({
    color: '#1c2433',
    roughness: 0.4,
    metalness: 0.1,
  });
  const base = new Mesh(baseGeometry, baseMaterial);
  base.rotateX(-Math.PI / 2);
  base.position.set(0, 0, -LANE_LENGTH / 4);
  root.add(base);

  const edgeMaterial = new MeshBasicMaterial({ color: '#ffd166' });
  const edgeGeometry = new PlaneGeometry(0.22, LANE_LENGTH, 1, 1);
  const leftEdge = new Mesh(edgeGeometry, edgeMaterial);
  leftEdge.rotateX(-Math.PI / 2);
  leftEdge.position.set(-LANE_WIDTH / 2 + 0.12, 0.01, base.position.z);
  root.add(leftEdge);
  const rightEdge = leftEdge.clone();
  rightEdge.position.x = LANE_WIDTH / 2 - 0.12;
  root.add(rightEdge);

  const dashMaterial = new MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.6,
  });
  const dashGeometry = new PlaneGeometry(0.12, 2); // repeated segments
  for (let i = 0; i < 16; i += 1) {
    const dash = new Mesh(dashGeometry, dashMaterial);
    dash.rotateX(-Math.PI / 2);
    dash.position.set(0, 0.011, base.position.z - i * 4 + 12);
    root.add(dash);
  }

  return root;
}

function createTargetIndicator() {
  const geometry = new PlaneGeometry(1, 3);
  const material = new MeshBasicMaterial({
    color: '#33d6a6',
    transparent: true,
    opacity: 0.65,
  });
  const mesh = new Mesh(geometry, material);
  mesh.rotateX(-Math.PI / 2);
  mesh.position.set(0, 0.03, -4);
  return mesh;
}

export function createWorld(scene) {
  scene.background = new Color('#12151a');
  scene.fog = new Fog('#12151a', 25, 60);

  const root = new Group();
  root.name = 'WorldRoot';
  scene.add(root);

  const hemi = new HemisphereLight('#33d6a6', '#12151a', 0.6);
  hemi.position.set(0, 16, 0);
  scene.add(hemi);

  const dir = new DirectionalLight('#ffd166', 0.8);
  dir.position.set(18, 22, 10);
  scene.add(dir);

  const backdrop = createGradientBackdrop();
  scene.add(backdrop);

  const lane = createLane();
  root.add(lane);

  const targetIndicator = createTargetIndicator();
  root.add(targetIndicator);

  let reverseProgress = 0;
  let targetLane = 0.5;
  let pulse = 0;

  return {
    update(delta) {
      pulse = (pulse + delta) % (Math.PI * 2);
      const scale = 1 + Math.sin(pulse * 3) * 0.05;
      targetIndicator.scale.set(scale, 1, scale);
    },
    setReverseProgress(progress) {
      reverseProgress = Math.max(0, Math.min(1, progress));
      const offsetZ = reverseProgress * (LANE_LENGTH * 0.4) - LANE_LENGTH * 0.2;
      targetIndicator.position.z = offsetZ;
    },
    setReverseTargetLane(laneValue) {
      targetLane = Math.max(0, Math.min(1, laneValue));
      const half = LANE_WIDTH / 2;
      targetIndicator.position.x = (targetLane - 0.5) * half * 1.2;
    },
  };
}
