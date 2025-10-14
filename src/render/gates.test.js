import { Group, Color } from 'three';
import { createGateLayer } from './gates.js';

function setupGateLayer() {
  const scene = new Group();
  const bloomEffect = { selection: { add: jest.fn() } };
  const layer = createGateLayer(scene, bloomEffect);
  const gateRoot = scene.children.find((child) => child.name === 'GateLayer');
  const forwardGroups = gateRoot.children.filter(
    (child) => child.name === 'ForwardGateGroup'
  );
  const reversePrompt = gateRoot.children.find(
    (child) => child.name === 'ReversePrompt'
  );
  return { layer, forwardGroups, reversePrompt };
}

function groupsAtZ(groups, z) {
  return groups.filter((group) => group.position.z === z);
}

// why this test matters: phase changes must reveal the correct gate pair and hide the reverse prompt until needed.
test('setPhase toggles gate visibility', () => {
  const { layer, forwardGroups, reversePrompt } = setupGateLayer();

  layer.setPhase('forward');
  expect(groupsAtZ(forwardGroups, -8).every((g) => g.visible)).toBe(true);
  expect(groupsAtZ(forwardGroups, -12).every((g) => g.visible)).toBe(false);

  layer.setPhase('reverse-gate');
  expect(reversePrompt.visible).toBe(true);
  expect(groupsAtZ(forwardGroups, -8).every((g) => g.visible)).toBe(false);

  layer.setPhase('idle');
  expect(reversePrompt.visible).toBe(false);
});

// why this test matters: when a gate slot is empty the corresponding mesh should hide instead of rendering stale data.
test('showForwardPair hides empty gate slots', () => {
  const { layer, forwardGroups } = setupGateLayer();

  layer.setPhase('forward');
  layer.showForwardPair({
    index: 0,
    gates: [null, { type: 'add', value: 5, color: '#33d6a6', label: '+5' }],
    playerCount: 20,
  });

  const [leftGate] = groupsAtZ(forwardGroups, -8).filter(
    (group) => group.position.x < 0
  );
  const [rightGate] = groupsAtZ(forwardGroups, -8).filter(
    (group) => group.position.x > 0
  );
  expect(leftGate.visible).toBe(false);
  expect(rightGate.visible).toBe(true);
});

// why this test matters: resolving a gate should advance to the next pair while in the forward phase.
test('resolveForwardPair advances visibility', () => {
  const { layer, forwardGroups } = setupGateLayer();

  layer.setPhase('forward');
  layer.showForwardPair({
    index: 0,
    gates: [
      { type: 'add', value: 3, color: '#33d6a6', label: '+3' },
      { type: 'multiply', value: 2, color: '#ffd166', label: '×2' },
    ],
    playerCount: 30,
  });

  layer.resolveForwardPair({ index: 0 });
  expect(groupsAtZ(forwardGroups, -8).every((g) => g.visible)).toBe(false);
  expect(groupsAtZ(forwardGroups, -12).every((g) => g.visible)).toBe(true);
});

// why this test matters: reverse prompts should surface progress and lane targeting for the HUD.
test('reverse helpers update prompt state', () => {
  const { layer, reversePrompt } = setupGateLayer();

  layer.showReversePair({
    options: [{ type: 'add', value: 1, color: '#33d6a6', label: '+1' }],
  });
  expect(reversePrompt.visible).toBe(true);
  expect(reversePrompt.material.color instanceof Color).toBe(true);

  layer.setReverseProgress(0.5);
  expect(reversePrompt.position.z).toBeCloseTo(-1, 5);

  layer.setReverseTargetLane(0.75);
  expect(reversePrompt.position.x).toBeCloseTo(1.5, 5);

  layer.hideReversePair();
  expect(reversePrompt.visible).toBe(false);
});
