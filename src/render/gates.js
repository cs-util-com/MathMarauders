import {
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { applyGate, formatGateLabel } from '../game/gate.js';

function createPillarArch(material) {
  const geometry = new RoundedBoxGeometry(0.6, 2.8, 0.45, 3, 0.12);
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = false;
  return mesh;
}

function createNumeralCard(material) {
  const geometry = new PlaneGeometry(1.4, 1.6);
  const mesh = new Mesh(geometry, material);
  mesh.position.y = 2.15;
  mesh.position.z = 0.1;
  mesh.castShadow = false;
  return mesh;
}

function createForwardGateGroup(scene, bloomEffect) {
  const root = new Group();
  root.name = 'ForwardGateGroup';
  scene.add(root);

  const pillarMaterial = new MeshLambertMaterial({ color: '#ffd166' });
  const numeralMaterial = new MeshBasicMaterial({ color: '#ffffff' });
  const arch = createPillarArch(pillarMaterial);
  const card = createNumeralCard(numeralMaterial);
  bloomEffect.selection.add(card);

  root.add(arch, card);
  root.visible = false;
  return { root, card, material: numeralMaterial };
}

function createGatePair(scene, bloomEffect, zOffset) {
  const left = createForwardGateGroup(scene, bloomEffect);
  const right = createForwardGateGroup(scene, bloomEffect);
  left.root.position.set(-2.2, 0, zOffset);
  right.root.position.set(2.2, 0, zOffset);
  return { left, right };
}

function updateGateDisplay(group, gate, playerCount) {
  if (!gate) {
    group.root.visible = false;
    return;
  }
  group.root.visible = true;
  group.card.material.color = new Color(gate.color);
  group.card.material.needsUpdate = true;
  const label = formatGateLabel(gate);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx && typeof ctx.clearRect === 'function') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = gate.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b0d12';
    ctx.font = 'bold 140px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  }
  const texture =
    group.card.material.map instanceof CanvasTexture
      ? group.card.material.map
      : new CanvasTexture(canvas);
  texture.image = canvas;
  texture.needsUpdate = true;
  group.card.material.map = texture;
  group.card.material.needsUpdate = true;
  group.card.userData.projected = applyGate(playerCount, gate);
}

export function createGateLayer(scene, bloomEffect) {
  const root = new Group();
  root.name = 'GateLayer';
  scene.add(root);

  const forwardGates = [
    createGatePair(root, bloomEffect, -8),
    createGatePair(root, bloomEffect, -12),
    createGatePair(root, bloomEffect, -16),
  ];

  const reversePromptMaterial = new MeshBasicMaterial({
    color: '#33d6a6',
    transparent: true,
    opacity: 0.6,
  });
  const reversePrompt = new Mesh(
    new PlaneGeometry(4.2, 1.8),
    reversePromptMaterial
  );
  reversePrompt.rotation.x = -Math.PI / 2;
  reversePrompt.position.set(0, 0.05, -10);
  reversePrompt.name = 'ReversePrompt';
  reversePrompt.visible = false;
  root.add(reversePrompt);

  let phase = 'idle';

  return {
    update() {},
    setPhase(nextPhase) {
      phase = nextPhase;
      const showForward = phase === 'forward';
      forwardGates.forEach((pair, index) => {
        const visible = showForward && index === 0;
        pair.left.root.visible = visible;
        pair.right.root.visible = visible;
      });
      reversePrompt.visible = phase.startsWith('reverse');
    },
    showForwardPair({ index, gates, playerCount }) {
      const pair = forwardGates[index];
      if (!pair) return;
      updateGateDisplay(pair.left, gates[0], playerCount);
      updateGateDisplay(pair.right, gates[1], playerCount);
    },
    resolveForwardPair({ index }) {
      const pair = forwardGates[index];
      if (!pair) return;
      pair.left.root.visible = false;
      pair.right.root.visible = false;
      const next = forwardGates[index + 1];
      if (next && phase === 'forward') {
        next.left.root.visible = true;
        next.right.root.visible = true;
      }
    },
    reset() {
      forwardGates.forEach((pair, idx) => {
        const visible = idx === 0;
        pair.left.root.visible = visible;
        pair.right.root.visible = visible;
      });
      reversePrompt.visible = false;
    },
    showReversePair({ options }) {
      reversePrompt.visible = true;
      reversePrompt.material.color = new Color(options[0].color);
    },
    hideReversePair() {
      reversePrompt.visible = false;
    },
    setReverseProgress(progress) {
      reversePrompt.position.z = -10 + progress * 18;
    },
    setReverseTargetLane(lane) {
      reversePrompt.position.x = (lane - 0.5) * 6;
    },
  };
}
