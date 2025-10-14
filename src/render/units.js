import {
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshMatcapMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import {
  computeFormationPositions,
  applySteerOffset,
} from './math/formation.js';

const MAX_UNITS = 400;
const PLAYER_COLOR = new Color('#00d1ff');
const ENEMY_COLOR = new Color('#ff7a59');

function createInstancedGroup(color) {
  const geometry = new SphereGeometry(0.35, 12, 8);
  const material = new MeshMatcapMaterial({ color });
  const mesh = new InstancedMesh(geometry, material, MAX_UNITS);
  mesh.frustumCulled = false;
  return mesh;
}

export function createUnitsLayer(scene) {
  const root = new Group();
  root.name = 'UnitsLayer';
  scene.add(root);

  const playerMesh = createInstancedGroup(PLAYER_COLOR);
  const enemyMesh = createInstancedGroup(ENEMY_COLOR);
  root.add(playerMesh, enemyMesh);

  const matrix = new Matrix4();
  const centroid = new Vector3();
  const temp = new Vector3();
  let playerCount = 0;
  let enemyCount = 0;
  let steer = 0;

  function updateMesh(mesh, positions, count) {
    for (let i = 0; i < MAX_UNITS; i += 1) {
      if (i < count) {
        temp.copy(positions[i]);
        mesh.setMatrixAt(i, matrix.makeTranslation(temp.x, temp.y, temp.z));
      } else {
        mesh.setMatrixAt(i, matrix.makeTranslation(0, -999, 0));
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    update() {
      const playerPositions = applySteerOffset(
        computeFormationPositions(playerCount),
        steer
      );
      const enemyPositions = computeFormationPositions(enemyCount).map(
        (pos) => ({ ...pos, z: pos.z - 8 })
      );
      updateMesh(playerMesh, playerPositions, playerCount);
      updateMesh(enemyMesh, enemyPositions, enemyCount);

      if (playerCount > 0) {
        centroid.set(0, 0, 0);
        playerPositions.forEach((pos) => {
          centroid.x += pos.x;
          centroid.z += pos.z;
        });
        centroid.x /= playerPositions.length;
        centroid.z /= playerPositions.length;
      } else {
        centroid.set(0, 0, 0);
      }
    },
    setPlayerCount(count) {
      playerCount = Math.min(MAX_UNITS, Math.max(0, Math.floor(count)));
    },
    setEnemyCount(count) {
      enemyCount = Math.min(MAX_UNITS, Math.max(0, Math.floor(count)));
    },
    setSteer(value) {
      steer = Math.max(-1, Math.min(1, value));
    },
    getCentroid() {
      return centroid;
    },
  };
}
