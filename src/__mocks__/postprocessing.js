class EffectComposer {
  constructor(renderer) {
    this.renderer = renderer;
    this.passes = [];
  }
  addPass(pass) {
    this.passes.push(pass);
  }
  setSize() {}
  render() {}
  dispose() {}
}

class RenderPass {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
  }
}

class EffectPass {
  constructor(camera, ...effects) {
    this.camera = camera;
    this.effects = effects;
    this.renderToScreen = false;
  }
}

class FXAAEffect {
  setSize() {}
}

class SelectiveBloomEffect {
  constructor() {
    this.selection = {
      add: () => {},
    };
  }
}

const BlendFunction = {
  SCREEN: 'SCREEN',
};

export {
  EffectComposer,
  RenderPass,
  EffectPass,
  FXAAEffect,
  SelectiveBloomEffect,
  BlendFunction,
};
