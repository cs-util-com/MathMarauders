/**
 * @file GateSystem.js
 * Manages the creation, display, and interaction with math gates.
 */

import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const GATE_WIDTH = 15; // Width of the area considered for a gate choice
const GATE_DEPTH = 2;   // Depth of the trigger zone for a gate
const GATE_HEIGHT = 5;  // Visual height of the gate posts
const GATE_SPACING = 60; // Distance between gates along Z-axis

class GateSystem {
    /**
     * Initializes the GateSystem.
     * @param {THREE.Scene} scene - The main Three.js scene.
     * @param {GameController} gameController - Reference to the game controller.
     * @param {FlockSystem} flockSystem - Reference to the flock system.
     */
    constructor(scene, gameController, flockSystem) {
        this.scene = scene;
        this.gameController = gameController;
        this.flockSystem = flockSystem;
        this.gates = []; // Stores active gate objects { mesh, labelLeft, labelRight, data, ... }
        this.currentGateIndex = 0;

        // CSS2DRenderer for labels
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none'; // Pass clicks through
        document.getElementById('game-container').appendChild(this.labelRenderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        console.log("GateSystem initialized");
    }

    /**
     * Sets up the gates for the current wave based on data from WaveGenerator.
     * @param {Array<object>} waveGatesData - Array of gate data from WaveGenerator.
     *                                        Example: { choices: [choice1, choice2], optimalChoiceIndex, optimalArmyAfter }
     */
    setupGates(waveGatesData) {
        this.clearGates();
        this.currentGateIndex = 0;
        const initialZ = -GATE_SPACING * 1.5; // Start gates ahead of the player

        waveGatesData.forEach((gateData, index) => {
            const gateZ = initialZ - (index * GATE_SPACING);
            this.createGate(gateData, gateZ, index);
        });
        console.log(`GateSystem: Setup ${waveGatesData.length} gates.`);
    }

    /**
     * Creates a single gate with two choices.
     * @param {object} gateData - Data for the gate from WaveGenerator.
     * @param {number} zPos - Z position for this gate.
     * @param {number} gateIndexInWave - The index of this gate in the current wave.
     */
    createGate(gateData, zPos, gateIndexInWave) {
        const gateY = GATE_HEIGHT / 2;

        // Visual representation (e.g., posts for each choice)
        // Left choice post
        const postGeometry = new THREE.BoxGeometry(1, GATE_HEIGHT, 1);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x007bff });

        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(-GATE_WIDTH / 2, gateY, zPos);
        this.scene.add(leftPost);

        // Right choice post
        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(GATE_WIDTH / 2, gateY, zPos);
        this.scene.add(rightPost);

        // Divider post (optional, for visual separation)
        const dividerPost = new THREE.Mesh(new THREE.BoxGeometry(0.5, GATE_HEIGHT * 0.75, 0.5), new THREE.MeshStandardMaterial({color: 0xffcc00}));
        dividerPost.position.set(0, gateY * 0.75 / 2, zPos);
        this.scene.add(dividerPost);

        // Create labels for choices
        const choice1 = gateData.choices[0];
        const choice2 = gateData.choices[1];

        const labelLeftElement = this.createLabelElement(choice1.text, `gate-${gateIndexInWave}-choice-0`);
        const labelLeft = new CSS2DObject(labelLeftElement);
        labelLeft.position.set(-GATE_WIDTH / 2, GATE_HEIGHT + 1.5, zPos); // Position above left post
        this.scene.add(labelLeft);

        const labelRightElement = this.createLabelElement(choice2.text, `gate-${gateIndexInWave}-choice-1`);
        const labelRight = new CSS2DObject(labelRightElement);
        labelRight.position.set(GATE_WIDTH / 2, GATE_HEIGHT + 1.5, zPos); // Position above right post
        this.scene.add(labelRight);

        // Store gate info for collision detection and updates
        const gateObject = {
            indexInWave: gateIndexInWave,
            data: gateData,
            zPos: zPos,
            visuals: [leftPost, rightPost, dividerPost], // Store meshes to remove them later
            labels: [labelLeft, labelRight],
            triggered: false,
            triggerZone: new THREE.Box3(
                new THREE.Vector3(-GATE_WIDTH, 0, zPos - GATE_DEPTH / 2),
                new THREE.Vector3(GATE_WIDTH, GATE_HEIGHT, zPos + GATE_DEPTH / 2)
            ),
            // Define sub-zones for left and right choices
            leftChoiceZone: new THREE.Box3(
                new THREE.Vector3(-GATE_WIDTH, 0, zPos - GATE_DEPTH / 2), // x from -GATE_WIDTH to 0
                new THREE.Vector3(0, GATE_HEIGHT, zPos + GATE_DEPTH / 2)
            ),
            rightChoiceZone: new THREE.Box3(
                new THREE.Vector3(0, 0, zPos - GATE_DEPTH / 2), // x from 0 to GATE_WIDTH
                new THREE.Vector3(GATE_WIDTH, GATE_HEIGHT, zPos + GATE_DEPTH / 2)
            )
        };
        this.gates.push(gateObject);
    }

    /**
     * Helper to create a DOM element for a CSS2DLabel.
     * @param {string} text - The text for the label.
     * @param {string} id - DOM ID for the element.
     * @returns {HTMLElement} The created div element.
     */
    createLabelElement(text, id) {
        const div = document.createElement('div');
        div.id = id;
        div.className = 'gate-label'; // From style.css
        div.textContent = text;
        // Style is mostly in CSS, but can add specifics here if needed
        // div.style.backgroundColor = 'rgba(0, 150, 255, 0.7)'; // Example, already in CSS
        // div.style.padding = '8px 12px';
        // div.style.color = 'white';
        // div.style.borderRadius = '4px';
        return div;
    }

    /**
     * Updates gate logic, primarily checking for flock passing through gates.
     * @param {number} deltaTime - Time since the last frame.
     */
    update(deltaTime) {
        if (this.gates.length === 0 || this.currentGateIndex >= this.gates.length) {
            return; // No active gates or all gates passed
        }

        const currentGate = this.gates[this.currentGateIndex];
        if (currentGate.triggered) {
            return; // Gate already processed
        }

        const flockCenter = this.flockSystem.flockTargetPosition;

        // Check if the flock's center Z has passed the gate's Z position
        // A more robust check would use the front of the flock or bounding box
        if (flockCenter.z < currentGate.zPos + GATE_DEPTH / 2) { // Flock is approaching or at the gate depth
             if (flockCenter.z < currentGate.zPos - GATE_DEPTH / 2) { // Flock has passed the gate's depth
                // Determine which choice was made based on X position of flock center
                let chosenIndex = -1;
                if (currentGate.leftChoiceZone.containsPoint(flockCenter)) {
                    chosenIndex = 0;
                } else if (currentGate.rightChoiceZone.containsPoint(flockCenter)) {
                    chosenIndex = 1;
                }

                if (chosenIndex !== -1) {
                    this.processGateChoice(currentGate, chosenIndex);
                    currentGate.triggered = true;
                    this.currentGateIndex++;

                    // Log optimal choice
                    if (chosenIndex === currentGate.data.optimalChoiceIndex) {
                        console.log(`Gate ${currentGate.indexInWave}: Player chose OPTIMAL path (${currentGate.data.choices[chosenIndex].text})`);
                        this.gameController.telemetry.trackEvent('gate_choice_optimal', {
                            wave: this.gameController.currentWave,
                            gate_index: currentGate.indexInWave,
                            choice_text: currentGate.data.choices[chosenIndex].text,
                        });
                    } else {
                        console.log(`Gate ${currentGate.indexInWave}: Player chose sub-optimal path (${currentGate.data.choices[chosenIndex].text}). Optimal was: ${currentGate.data.choices[currentGate.data.optimalChoiceIndex].text}`);
                        this.gameController.telemetry.trackEvent('gate_choice_suboptimal', {
                            wave: this.gameController.currentWave,
                            gate_index: currentGate.indexInWave,
                            choice_text: currentGate.data.choices[chosenIndex].text,
                            optimal_text: currentGate.data.choices[currentGate.data.optimalChoiceIndex].text
                        });
                    }

                    // Check if all forward gates are cleared
                    if (this.currentGateIndex === this.gates.length && this.gameController.gameState === GameState.FORWARD_RUN) {
                        this.gameController.allForwardGatesCleared();
                    }

                } else {
                    // Flock passed through the middle or missed, handle as a pass-through with no effect or a penalty?
                    // For now, assume it means no choice made, no change. Could be a "miss".
                    console.log(`Gate ${currentGate.indexInWave}: Flock passed gate without making a clear choice.`);
                    // To avoid getting stuck, mark as triggered and move to next.
                    // This implies missing a gate has no army change effect unless explicitly designed.
                    currentGate.triggered = true;
                    this.currentGateIndex++;

                     if (this.currentGateIndex === this.gates.length && this.gameController.gameState === GameState.FORWARD_RUN) {
                        this.gameController.allForwardGatesCleared();
                    }
                }
            }
        }
        // The CSS2DRenderer needs to be called in the main animation loop
        this.labelRenderer.render(this.scene, this.flockSystem.camera); // Use flock system's camera
    }

    /**
     * Processes the player's choice at a gate.
     * @param {object} gate - The gate object.
     * @param {number} choiceIndex - The index of the chosen option (0 or 1).
     */
    processGateChoice(gate, choiceIndex) {
        const chosenOperation = gate.data.choices[choiceIndex];
        const oldArmySize = this.flockSystem.getFlockSize();
        const newArmySize = chosenOperation.apply(oldArmySize);

        console.log(`Gate ${gate.indexInWave} Choice: ${chosenOperation.text}. Army: ${oldArmySize} -> ${newArmySize}`);

        if (newArmySize > oldArmySize) {
            this.flockSystem.addSoldiers(newArmySize - oldArmySize);
        } else if (newArmySize < oldArmySize) {
            this.flockSystem.removeSoldiers(oldArmySize - newArmySize);
        }
        // If newArmySize == oldArmySize, no change to flock visual needed, but game logic (army count) is updated by add/remove.

        // Notify GameController about the gate event, which might trigger a skirmish.
        this.gameController.playerMadeGateChoice(gate.indexInWave, chosenOperation, newArmySize);
    }

    /**
     * Removes all gate visuals and labels from the scene.
     */
    clearGates() {
        this.gates.forEach(gate => {
            gate.visuals.forEach(mesh => this.scene.remove(mesh));
            gate.labels.forEach(label => {
                label.element.remove(); // Remove div from DOM
                this.scene.remove(label); // Remove CSS2DObject from scene
            });
        });
        this.gates = [];
        this.currentGateIndex = 0;
    }

    /**
     * Handles window resize events for the label renderer.
     */
    onWindowResize() {
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export { GateSystem };
