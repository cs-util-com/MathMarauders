import { PerspectiveCamera, Vector3, CatmullRomCurve3 } from 'three';

const LOOK_LERP = 0.12;
const PHASE_DURATION = {
  forward: 1.8,
  skirmish: 1.2,
  reverse: 1.4,
};

function sampleCurve(points, samples = 120) {
  const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const positions = [];
  for (let i = 0; i < samples; i += 1) {
    const t = i / (samples - 1);
    positions.push(curve.getPoint(t));
  }
  return positions;
}

function createPhaseSamples() {
  return {
    forward: sampleCurve([
      new Vector3(0, 8, 18),
      new Vector3(0, 8, 10),
      new Vector3(0, 7.8, 2),
      new Vector3(0, 7.4, -10),
    ]),
    skirmish: sampleCurve([
      new Vector3(0, 7.2, -6),
      new Vector3(0, 7.1, -10),
      new Vector3(0, 7, -14),
      new Vector3(0, 6.8, -18),
    ]),
    reverse: sampleCurve([
      new Vector3(0, 6.6, -14),
      new Vector3(0, 6.6, -8),
      new Vector3(0, 6.6, 0),
      new Vector3(0, 6.6, 10),
    ]),
  };
}

export function createCameraRig() {
  const samples = createPhaseSamples();
  const camera = new PerspectiveCamera(60, 1, 0.1, 200);
  const look = new Vector3();
  const targetLook = new Vector3();
  let phase = 'idle';
  let progress = 1;

  function applyPhasePose() {
    if (phase === 'idle') {
      camera.position.set(0, 8, 18);
      camera.lookAt(0, 0, 0);
      return;
    }
    const path = samples[phase] ?? samples.forward;
    const index = Math.min(
      path.length - 1,
      Math.floor(progress * (path.length - 1))
    );
    camera.position.copy(path[index]);
  }

  function updateLook(target) {
    if (target) {
      targetLook.copy(target);
    }
    look.lerp(targetLook, LOOK_LERP);
    camera.lookAt(look);
  }

  return {
    camera,
    setPhase(nextPhase) {
      const mapped =
        nextPhase === 'reverse-gate' ? 'reverse' : (nextPhase ?? 'idle');
      if (!(mapped in samples)) {
        phase = mapped === 'idle' ? 'idle' : 'forward';
      } else {
        phase = mapped;
      }
      progress = phase === 'idle' ? 1 : 0;
      applyPhasePose();
    },
    update({ delta, lookTarget, forwardOffset = 0 }) {
      if (phase !== 'idle') {
        const duration = PHASE_DURATION[phase] ?? 1.2;
        progress = Math.min(1, progress + delta / duration);
        applyPhasePose();
        if (phase === 'forward') {
          camera.position.z -= forwardOffset;
        }
      }
      updateLook(lookTarget);
    },
    handleResize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
  };
}
