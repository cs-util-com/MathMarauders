const descriptor = Object.getOwnPropertyDescriptor(
  HTMLCanvasElement.prototype,
  'getContext'
);

class MockCanvasRenderingContext2D {
  constructor(canvas) {
    this.canvas = canvas;
  }

  fillRect() {}
  clearRect() {}
  drawImage() {}
  getImageData() {
    return { data: [] };
  }
  putImageData() {}
  createImageData() {
    return { data: [] };
  }
  setTransform() {}
  save() {}
  restore() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  fill() {}
  stroke() {}
  arc() {}
  measureText() {
    return { width: 0 };
  }
  fillText() {}
  createLinearGradient() {
    return { addColorStop: () => {} };
  }
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: function getContext(type) {
    if (type === '2d') {
      return new MockCanvasRenderingContext2D(this);
    }
    return null;
  },
});

if (typeof global.cancelAnimationFrame !== 'function') {
  global.cancelAnimationFrame = () => {};
}

if (descriptor && !descriptor.configurable) {
  // noop: just keep awareness that original descriptor existed.
}
