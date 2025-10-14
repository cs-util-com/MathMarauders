import {
  WebGLRenderer,
  Scene,
  Color,
  Clock,
  Vector2,
} from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  FXAAEffect,
  SelectiveBloomEffect,
  BlendFunction,
} from 'postprocessing';
import { createCameraRig } from './cameraRig.js';
import { createWorld } from './world.js';
import { createUnitsLayer } from './units.js';
import { createGateLayer } from './gates.js';

const NOOP = () => {};

function createNoopBridge() {
  return {
    setPhase: NOOP,
    setPlayerUnits: NOOP,
    setEnemyUnits: NOOP,
    resetGates: NOOP,
    showForwardGates: NOOP,
    resolveForwardGate: NOOP,
    showReverseGate: NOOP,
    hideReverseGate: NOOP,
    setReverseProgress: NOOP,
    setReverseTargetLane: NOOP,
    setSteerPosition: NOOP,
    dispose: NOOP,
  };
}

function isWebGLAvailable() {
  if (typeof document === 'undefined') {
    return false;
  }
  const canvas = document.createElement('canvas');
  const contexts = ['webgl2', 'webgl', 'experimental-webgl'];
  let hasContext = false;
  contexts.forEach((type) => {
    try {
      const gl = canvas.getContext(type, { stencil: false });
      if (gl) {
        hasContext = true;
      }
    } catch (error) {
      // ignore probe errors
    }
  });
  return hasContext;
}

function createRenderer(canvas) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.autoClear = false;
  renderer.setClearColor(new Color('#12151a'), 1);
  return renderer;
}

function createComposer(renderer, scene, camera, bloomEffect) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const fxaa = new FXAAEffect();
  const effectPass = new EffectPass(camera, fxaa, bloomEffect);
  effectPass.renderToScreen = true;
  composer.addPass(effectPass);

  return { composer, fxaa };
}

function createBloomEffect(scene, camera) {
  return new SelectiveBloomEffect(scene, camera, {
    intensity: 0.6,
    luminanceThreshold: 0.85,
    luminanceSmoothing: 0.1,
    blendFunction: BlendFunction.SCREEN,
  });
}

export function createRenderEngine({ container }) {
  if (!container) {
    throw new Error('createRenderEngine requires a container element.');
  }

  if (!isWebGLAvailable()) {
    console.warn('WebGL unavailable, falling back to no-op renderer.');
    return createNoopBridge();
  }

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.innerHTML = '';
  container.appendChild(canvas);

  let renderer;
  try {
    renderer = createRenderer(canvas);
  } catch (error) {
    console.warn('Failed to initialise WebGL renderer:', error);
    return createNoopBridge();
  }

  const scene = new Scene();
  const cameraRig = createCameraRig();
  const world = createWorld(scene);
  const units = createUnitsLayer(scene);
  const bloomEffect = createBloomEffect(scene, cameraRig.camera);
  const gates = createGateLayer(scene, bloomEffect);
  const { composer, fxaa } = createComposer(
    renderer,
    scene,
    cameraRig.camera,
    bloomEffect
  );

  const clock = new Clock();
  let animationId = null;
  const size = new Vector2();

  function resizeRenderer() {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
    renderer.setSize(clientWidth, clientHeight, false);
    cameraRig.handleResize(clientWidth, clientHeight);
    composer.setSize(clientWidth, clientHeight);
    fxaa.setSize(clientWidth, clientHeight);
  }

  function renderLoop() {
    const delta = clock.getDelta();
    world.update(delta);
    units.update(delta);
    gates.update(delta);
    cameraRig.update({ delta, lookTarget: units.getCentroid() });
    composer.render(delta);
    animationId = requestAnimationFrame(renderLoop);
  }

  resizeRenderer();
  animationId = requestAnimationFrame(renderLoop);
  window.addEventListener('resize', resizeRenderer);

  return {
    setPhase: (phase) => {
      cameraRig.setPhase(phase);
      gates.setPhase(phase);
    },
    setPlayerUnits: (count) => {
      units.setPlayerCount(count);
    },
    setEnemyUnits: (count) => {
      units.setEnemyCount(count);
    },
    resetGates: () => {
      gates.reset();
    },
    showForwardGates: (payload) => {
      gates.showForwardPair(payload);
    },
    resolveForwardGate: (payload) => {
      gates.resolveForwardPair(payload);
    },
    showReverseGate: (payload) => {
      gates.showReversePair(payload);
    },
    hideReverseGate: () => {
      gates.hideReversePair();
    },
    setReverseProgress: (progress) => {
      gates.setReverseProgress(progress);
      world.setReverseProgress(progress);
    },
    setReverseTargetLane: (lane) => {
      gates.setReverseTargetLane(lane);
      world.setReverseTargetLane(lane);
      units.setTargetLane(lane);
    },
    setSteerPosition: (value) => {
      units.setSteer(value);
    },
    dispose: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resizeRenderer);
      composer.dispose();
      renderer.dispose();
      container.innerHTML = '';
    },
  };
}
