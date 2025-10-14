class BasicObject3D {
  constructor() {
    this.children = [];
    this.position = {
      x: 0,
      y: 0,
      z: 0,
      set: (x, y, z) => {
        this.position.x = x ?? 0;
        this.position.y = y ?? 0;
        this.position.z = z ?? 0;
        return this.position;
      },
      copy: (vec) => {
        this.position.x = vec?.x ?? 0;
        this.position.y = vec?.y ?? 0;
        this.position.z = vec?.z ?? 0;
        return this.position;
      },
    };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = {
      x: 1,
      y: 1,
      z: 1,
      set: (x, y, z) => {
        this.scale.x = x ?? 1;
        this.scale.y = y ?? 1;
        this.scale.z = z ?? 1;
        return this.scale;
      },
    };
    this.visible = true;
    this.layers = { enable: () => {} };
  }

  add(...objects) {
    this.children.push(...objects);
  }

  remove(...objects) {
    this.children = this.children.filter((child) => !objects.includes(child));
  }

  clone() {
    return new this.constructor();
  }

  rotateX(radians) {
    this.rotation.x += radians;
  }

  rotateY(radians) {
    this.rotation.y += radians;
  }

  rotateZ(radians) {
    this.rotation.z += radians;
  }
}

class WebGLRenderer {
  constructor() {
    this.autoClear = true;
  }
  setPixelRatio() {}
  setSize() {}
  dispose() {}
  setClearColor() {}
  render() {}
}

class Scene extends BasicObject3D {
  constructor() {
    super();
    this.background = null;
    this.fog = null;
  }
}

class Color {
  constructor(value = 0xffffff) {
    this.set(value);
  }
  set(value) {
    if (value instanceof Color) {
      this.r = value.r;
      this.g = value.g;
      this.b = value.b;
      return this;
    }
    const hexString =
      typeof value === 'string' ? value.replace('#', '') : value.toString(16);
    const resolvedRaw =
      typeof value === 'number' ? value : parseInt(hexString, 16);
    const resolved = Number.isNaN(resolvedRaw) ? 0 : resolvedRaw;
    const r = (resolved >> 16) & 255;
    const g = (resolved >> 8) & 255;
    const b = resolved & 255;
    this.r = r / 255;
    this.g = g / 255;
    this.b = b / 255;
    return this;
  }
}

class Clock {
  constructor() {
    this._last = Date.now();
  }
  getDelta() {
    const now = Date.now();
    const delta = (now - this._last) / 1000;
    this._last = now;
    return delta;
  }
}

class PerspectiveCamera extends BasicObject3D {
  constructor() {
    super();
    this.aspect = 1;
    this.quaternion = { multiply: () => {} };
  }
  lookAt() {}
  updateProjectionMatrix() {}
}

class Group extends BasicObject3D {}

class Mesh extends BasicObject3D {
  constructor(geometry = null, material = null) {
    super();
    this.geometry = geometry;
    this.material = material ?? {};
    this.castShadow = false;
    this.receiveShadow = false;
    this.userData = {};
  }

  clone() {
    const copy = new this.constructor(this.geometry, this.material);
    copy.position.set(this.position.x, this.position.y, this.position.z);
    copy.rotation = { ...this.rotation };
    copy.scale.set(this.scale.x, this.scale.y, this.scale.z);
    copy.castShadow = this.castShadow;
    copy.receiveShadow = this.receiveShadow;
    return copy;
  }
}

class MeshBasicMaterial {
  constructor(config = {}) {
    Object.assign(this, config);
  }
}
class MeshLambertMaterial {
  constructor(config = {}) {
    Object.assign(this, config);
  }
}
class MeshMatcapMaterial {
  constructor(config = {}) {
    Object.assign(this, config);
  }
}
class MeshStandardMaterial {
  constructor(config = {}) {
    Object.assign(this, config);
  }
}

class BufferAttribute {
  constructor(array = [], itemSize = 3) {
    this.array = array;
    this.itemSize = itemSize;
  }
}

class BufferGeometry {
  constructor() {
    this.attributes = {};
  }
  setAttribute(name, attribute) {
    this.attributes[name] = attribute;
    return this;
  }
  dispose() {}
}

class PlaneGeometry extends BufferGeometry {
  constructor() {
    super();
  }
}
class SphereGeometry extends BufferGeometry {
  constructor() {
    super();
  }
}
class Fog {
  constructor(color, near, far) {
    this.color = color;
    this.near = near;
    this.far = far;
  }
}
class HemisphereLight extends BasicObject3D {}
class DirectionalLight extends BasicObject3D {}

class InstancedMesh extends Mesh {
  constructor(geometry, material, count) {
    super(geometry, material);
    this.count = count;
    this.frustumCulled = false;
    this.instanceMatrix = {
      needsUpdate: false,
      setUsage: () => {},
    };
  }
  setMatrixAt() {}
}

class Matrix4 {
  constructor() {}
  makeTranslation() {
    return this;
  }
}

class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  copy(vec) {
    this.x = vec.x;
    this.y = vec.y;
    this.z = vec.z;
    return this;
  }
  lerp(vec, alpha) {
    this.x += (vec.x - this.x) * alpha;
    this.y += (vec.y - this.y) * alpha;
    this.z += (vec.z - this.z) * alpha;
    return this;
  }
  add(vec) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;
    return this;
  }
  divideScalar(value) {
    if (value !== 0) {
      this.x /= value;
      this.y /= value;
      this.z /= value;
    }
    return this;
  }
}

class CanvasTexture {
  constructor(image) {
    this.image = image;
    this.needsUpdate = false;
  }
  dispose() {}
}

class MeshPhongMaterial {
  constructor(config = {}) {
    Object.assign(this, config);
  }
}

class MeshPhysicalMaterial {
  constructor(config = {}) {
    Object.assign(this, config);
  }
}

class CylinderGeometry {
  constructor() {}
}

class BoxGeometry {
  constructor() {}
}

class CatmullRomCurve3 {
  constructor(points = []) {
    this.points = points;
  }
  getPoint(t) {
    const clamped = Math.max(0, Math.min(1, t));
    const index = Math.floor(clamped * (this.points.length - 1));
    return this.points[index] || this.points[0] || new Vector3();
  }
}

export {
  WebGLRenderer,
  Scene,
  Color,
  Clock,
  PerspectiveCamera,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshStandardMaterial,
  BufferGeometry,
  PlaneGeometry,
  SphereGeometry,
  BufferAttribute,
  Fog,
  HemisphereLight,
  DirectionalLight,
  InstancedMesh,
  Matrix4,
  Vector3,
  CanvasTexture,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  CylinderGeometry,
  BoxGeometry,
  CatmullRomCurve3,
};
