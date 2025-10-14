const descriptor = Object.getOwnPropertyDescriptor(
  HTMLCanvasElement.prototype,
  'getContext'
);

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: function getContext(type) {
    if (type === '2d') {
      return {
        canvas: this,
        fillRect: () => {},
        clearRect: () => {},
  drawImage: () => {},
  getImageData: () => ({ data: [] }),
  putImageData: () => {},
  createImageData: () => ({ data: [] }),
  setTransform: () => {},
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        fill: () => {},
        stroke: () => {},
        arc: () => {},
        measureText: () => ({ width: 0 }),
        fillText: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
      };
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
