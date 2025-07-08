/**
 * @file FlockSystem.js
 * Manages the flock of soldiers, including rendering and boids simulation.
 */

import * as THREE from 'three';

// Constants for flock behavior (will be expanded for boids)
const SOLDIER_SPEED = 6.0; // m/s, as per spec for forward run
const FLOCK_SPREAD = 10; // Max spread of the flock

class FlockSystem {
    /**
     * Initializes the FlockSystem.
     * @param {HTMLElement} canvas - The canvas element to render on.
     * @param {object} gameController - Reference to the GameController.
     */
    constructor(canvas, gameController) {
        this.canvas = canvas;
        this.gameController = gameController; // To update army size or interact with game state

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.playerFlock = null; // Will be an InstancedMesh
        this.soldierInstances = []; // Array to store individual soldier data (position, velocity)
        this.flockTargetPosition = new THREE.Vector3(0, 0, 0); // Center of the flock
        this.cameraOffset = new THREE.Vector3(0, 30, 20); // Angled top-down view

        this.setupScene();
        this.createSoldierMesh();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        console.log("FlockSystem initialized");
    }

    /**
     * Sets up the basic scene elements like lighting.
     */
    setupScene() {
        this.scene.background = new THREE.Color(0x102030);
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Ground plane (optional, for visual reference)
        const groundGeo = new THREE.PlaneGeometry(200, 400);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.6; // Slightly below soldiers
        this.scene.add(ground);

        // Initial camera position
        this.camera.position.copy(this.flockTargetPosition).add(this.cameraOffset);
        this.camera.lookAt(this.flockTargetPosition);
    }

    /**
     * Creates the InstancedMesh for soldiers.
     * Soldier mesh: BoxGeometry(0.6, 1.2, 0.6)
     */
    createSoldierMesh() {
        const soldierGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
        const soldierMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green soldiers

        // Placeholder: Max possible soldiers, can be adjusted
        // This count needs to be high enough for max possible army size.
        const maxSoldiers = 5000;
        this.playerFlock = new THREE.InstancedMesh(soldierGeometry, soldierMaterial, maxSoldiers);
        this.playerFlock.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Important for performance
        this.scene.add(this.playerFlock);
    }

    /**
     * Resets the flock to a specific size and initial positions.
     * @param {number} armySize - The number of soldiers in the flock.
     */
    resetFlock(armySize) {
        this.soldierInstances = [];
        this.playerFlock.count = armySize;

        const initialZ = 0; // Starting line
        const initialY = 0.6; // Half height of soldier so they are on the ground

        for (let i = 0; i < armySize; i++) {
            const x = (Math.random() - 0.5) * FLOCK_SPREAD;
            const z = initialZ + (Math.random() - 0.5) * (FLOCK_SPREAD / 2); // Slight depth spread

            const position = new THREE.Vector3(x, initialY, z);
            const velocity = new THREE.Vector3(0, 0, -SOLDIER_SPEED); // Moving towards -Z initially
            // Store more data per instance if needed for boids (e.g. target, state)
            this.soldierInstances.push({
                position,
                velocity,
                id: i
            });

            const dummy = new THREE.Object3D();
            dummy.position.copy(position);
            dummy.updateMatrix();
            this.playerFlock.setMatrixAt(i, dummy.matrix);
        }
        this.playerFlock.instanceMatrix.needsUpdate = true;
        this.flockTargetPosition.set(0, 0, initialZ); // Reset flock center

        console.log(`FlockSystem: Reset flock to ${armySize} soldiers.`);
    }

    /**
     * Updates the flock simulation and rendering.
     * @param {number} deltaTime - Time since last frame in seconds.
     * @param {number} steeringInput - Value from -1 (left) to 1 (right) from the slider.
     */
    update(deltaTime, steeringInput = 0) {
        if (!this.playerFlock || this.soldierInstances.length === 0) return;

        let flockCenterX = 0;
        let flockCenterZ = 0;

        // Basic flock movement (placeholder for boids)
        for (let i = 0; i < this.playerFlock.count; i++) {
            const soldier = this.soldierInstances[i];
            if (!soldier) continue;

            // Apply steering influence (simple version)
            // A more complex boids system would have this integrated into force accumulation
            soldier.velocity.x += steeringInput * deltaTime * 20; // Adjust steering sensitivity
            soldier.velocity.x = Math.max(-SOLDIER_SPEED/2, Math.min(SOLDIER_SPEED/2, soldier.velocity.x)); // Clamp sideways speed

            soldier.position.addScaledVector(soldier.velocity, deltaTime);

            // Dampen sideways velocity if no input
            if (Math.abs(steeringInput) < 0.05) {
                soldier.velocity.x *= (1 - deltaTime * 5); // Dampening factor
            }


            // Update instance matrix
            const dummy = new THREE.Object3D(); // Re-use a single dummy object
            dummy.position.copy(soldier.position);
            // TODO: Add rotation based on velocity if desired
            dummy.lookAt(soldier.position.clone().add(soldier.velocity)); // Make them face movement direction
            dummy.updateMatrix();
            this.playerFlock.setMatrixAt(i, dummy.matrix);

            flockCenterX += soldier.position.x;
            flockCenterZ += soldier.position.z;
        }

        if (this.playerFlock.count > 0) {
            this.flockTargetPosition.x = flockCenterX / this.playerFlock.count;
            this.flockTargetPosition.y = 0.6; // Keep camera focused at soldier height
            this.flockTargetPosition.z = flockCenterZ / this.playerFlock.count;
        }

        this.playerFlock.instanceMatrix.needsUpdate = true;
        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Updates the camera to follow the flock.
     * Lerps for smooth movement.
     */
    updateCamera() {
        const targetCamPos = new THREE.Vector3().copy(this.flockTargetPosition).add(this.cameraOffset);
        this.camera.position.lerp(targetCamPos, 0.05); // Adjust lerp factor for smoothness
        this.camera.lookAt(this.flockTargetPosition);
    }

    /**
     * Reverses camera direction for the retreat phase.
     */
    reverseCameraDirection() {
        // Invert the Z offset, and potentially X if the view should flip
        this.cameraOffset.z *= -1;
        // Could also adjust X if we want the camera to swing around, e.g. this.cameraOffset.x *= -1;
        // Ensure camera still looks at the flock, but from the "front" as they retreat.
        console.log("FlockSystem: Camera direction reversed for retreat.");
    }


    /**
     * Handles window resize events.
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Adds a specific number of soldiers to the flock.
     * @param {number} amount - Number of soldiers to add.
     */
    addSoldiers(amount) {
        const currentSize = this.playerFlock.count;
        const newSize = Math.min(this.playerFlock.geometry.instanceCount, currentSize + amount); // Cap at max instances
        if (newSize === currentSize) return; // Cannot add more

        const addedCount = newSize - currentSize;
        for (let i = 0; i < addedCount; i++) {
            const newIndex = currentSize + i;
            // Add new soldiers near the existing flock center
            const x = this.flockTargetPosition.x + (Math.random() - 0.5) * FLOCK_SPREAD * 0.5;
            const z = this.flockTargetPosition.z + (Math.random() - 0.5) * (FLOCK_SPREAD / 4);
            const position = new THREE.Vector3(x, 0.6, z);
            const velocity = new THREE.Vector3(0, 0, -SOLDIER_SPEED); // Match current flock direction (approx)

            this.soldierInstances[newIndex] = { position, velocity, id: newIndex }; // Use newIndex as ID

            const dummy = new THREE.Object3D();
            dummy.position.copy(position);
            dummy.updateMatrix();
            this.playerFlock.setMatrixAt(newIndex, dummy.matrix);
        }
        this.playerFlock.count = newSize;
        this.playerFlock.instanceMatrix.needsUpdate = true;
        if (this.gameController) this.gameController.updatePlayerArmy(newSize);
        console.log(`FlockSystem: Added ${addedCount} soldiers. New total: ${newSize}`);
    }

    /**
     * Removes a specific number of soldiers from the flock.
     * @param {number} amount - Number of soldiers to remove.
     */
    removeSoldiers(amount) {
        const currentSize = this.playerFlock.count;
        const newSize = Math.max(0, currentSize - amount);
        if (newSize === currentSize) return; // No change or already zero

        // For simplicity, remove from the end of the active instances.
        // A more complex removal might target specific instances (e.g., those hit by projectiles).
        this.soldierInstances.splice(newSize, currentSize - newSize);
        this.playerFlock.count = newSize;
        // No need to update matrices for removed instances, just reduce count.
        // InstancedMesh will simply not draw them.

        if (this.gameController) this.gameController.updatePlayerArmy(newSize);
        console.log(`FlockSystem: Removed ${amount} soldiers. New total: ${newSize}`);
    }

    /**
     * Gets the current number of active soldiers in the flock.
     * @returns {number}
     */
    getFlockSize() {
        return this.playerFlock ? this.playerFlock.count : 0;
    }
}

export { FlockSystem };
