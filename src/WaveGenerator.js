/**
 * @file WaveGenerator.js
 * Procedurally generates wave data including gate count, math operations,
 * optimal path calculations, and skirmish sizes.
 */

/**
 * Defines the types of math operations available for gates.
 * @enum {string}
 */
const MathOperationType = {
    ADD: '+',
    SUBTRACT: '–', // Using en-dash for display
    MULTIPLY: '×',
    DIVIDE: '÷',
    // TODO: Add more for advanced tiers: TWO_STEP, PARENTHESES, EXPONENTS
};

/**
 * Configuration for math operations.
 * Can be expanded for different tiers.
 */
const MATH_CONFIG = {
    TIER_1_OPERATIONS: [MathOperationType.ADD, MathOperationType.SUBTRACT, MathOperationType.MULTIPLY, MathOperationType.DIVIDE],
    OPERAND_RANGES: {
        [MathOperationType.ADD]: { min: 5, max: 50 },
        [MathOperationType.SUBTRACT]: { min: 5, max: 50 }, // Ensure result is positive or handle negative outcome
        [MathOperationType.MULTIPLY]: { min: 2, max: 4 },
        [MathOperationType.DIVIDE]: { min: 2, max: 4 }, // Ensure divisor results in whole numbers or handle floats
    },
    INITIAL_ARMY_SIZE: 10, // Player's starting army size for optimal path calculation
    SKIRMISH_PERCENTAGE: 0.80, // 80% of optimal army
};

class WaveGenerator {
    constructor() {
        console.log("WaveGenerator initialized");
    }

    /**
     * Calculates the number of forward gates for a given wave.
     * Wave 1 = 5 gates; each new wave adds +1 gate.
     * @param {number} waveNumber - The current wave number.
     * @returns {number} The number of gates for the wave.
     */
    getGateCount(waveNumber) {
        return 5 + (waveNumber - 1);
    }

    /**
     * Generates a random math operation and its operand(s) for a gate choice.
     * For now, focuses on Tier 1 operations.
     * @param {number} currentArmySize - The current army size before this gate, for context.
     * @returns {{operation: MathOperationType, value: number, text: string, apply: function(number):number}} A math choice object.
     */
    generateMathChoice(currentArmySize) {
        const tier1Ops = MATH_CONFIG.TIER_1_OPERATIONS;
        const operation = tier1Ops[Math.floor(Math.random() * tier1Ops.length)];
        const range = MATH_CONFIG.OPERAND_RANGES[operation];
        let value = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

        let applyFunc;
        let text = "";

        switch (operation) {
            case MathOperationType.ADD:
                applyFunc = (size) => size + value;
                text = `+${value}`;
                break;
            case MathOperationType.SUBTRACT:
                // Ensure subtraction doesn't immediately lead to <=0 for a choice if possible,
                // or cap value if currentArmySize is small.
                value = Math.min(value, Math.max(0, currentArmySize - 1));
                applyFunc = (size) => Math.max(1, size - value); // Army size should not go below 1 from a single gate.
                text = `–${value}`;
                break;
            case MathOperationType.MULTIPLY:
                applyFunc = (size) => Math.floor(size * value);
                text = `×${value}`;
                break;
            case MathOperationType.DIVIDE:
                // Ensure divisor is not 0 and try to make it a "clean" division if possible, though spec implies whole numbers.
                // For simplicity, we'll allow division that might result in floats, then floor.
                // Or, ensure currentArmySize is divisible by value, or pick value that divides currentArmySize.
                // To keep it simple, we just floor the result.
                value = Math.max(range.min, value); // Ensure value is at least min (e.g. 2)
                applyFunc = (size) => Math.floor(size / value);
                text = `÷${value}`;
                break;
            default:
                throw new Error(`Unknown operation type: ${operation}`);
        }
        return { operation, value, text, apply: applyFunc };
    }

    /**
     * Generates the data for all gates in a wave, including math choices.
     * @param {number} gateCount - The number of gates in this wave.
     * @param {number} initialArmySizeForPathCalc - The starting army size for optimal path calculation.
     * @returns {Array<object>} An array of gate data objects. Each object contains two math choices.
     *                          Example gate: { choices: [choice1, choice2], optimalChoiceIndex: 0/1, optimalArmyAfter: X }
     */
    generateGatesData(gateCount, initialArmySizeForPathCalc) {
        const gates = [];
        let currentOptimalArmy = initialArmySizeForPathCalc;

        for (let i = 0; i < gateCount; i++) {
            const choice1 = this.generateMathChoice(currentOptimalArmy);
            const choice2 = this.generateMathChoice(currentOptimalArmy);

            // Ensure choices are distinct if possible (e.g. not two identical "+10")
            // This is a simple check; more robust would be to regenerate if identical and non-trivial
            if (choice1.text === choice2.text && Math.random() < 0.5) {
                 const newChoice2 = this.generateMathChoice(currentOptimalArmy);
                 // Only replace if it's actually different, otherwise keep the original pair
                 if(newChoice2.text !== choice1.text) choice2 = newChoice2;
            }


            const outcome1 = choice1.apply(currentOptimalArmy);
            const outcome2 = choice2.apply(currentOptimalArmy);

            let optimalChoiceIndex = 0;
            if (outcome2 > outcome1) {
                optimalChoiceIndex = 1;
                currentOptimalArmy = outcome2;
            } else if (outcome1 > outcome2) {
                optimalChoiceIndex = 0;
                currentOptimalArmy = outcome1;
            } else {
                // If outcomes are equal, pick one (e.g., first or random)
                optimalChoiceIndex = (Math.random() < 0.5) ? 0 : 1;
                currentOptimalArmy = outcome1; // or outcome2, they are the same
            }

            // Ensure army size doesn't go below 1 for optimal path calculation.
            // The apply functions already try to ensure this for SUBTRACT and DIVIDE for individual choices.
            currentOptimalArmy = Math.max(1, currentOptimalArmy);

            gates.push({
                choices: [choice1, choice2],
                optimalChoiceIndex: optimalChoiceIndex,
                optimalArmySizeAfterThisGate: currentOptimalArmy, // Store optimal size *after* this gate
            });
        }
        return gates;
    }

    /**
     * Generates skirmish data based on the optimal path through the gates.
     * Skirmish size: 80% of optimal-army at that point (after the gate).
     * @param {Array<object>} gatesData - Array of gate data, including optimalArmySizeAfterThisGate.
     * @returns {Array<object>} An array of skirmish data objects.
     *                          Example skirmish: { enemyCount: Y }
     */
    generateSkirmishesData(gatesData) {
        const skirmishes = [];
        for (const gate of gatesData) {
            const enemyCount = Math.floor(gate.optimalArmySizeAfterThisGate * MATH_CONFIG.SKIRMISH_PERCENTAGE);
            skirmishes.push({
                enemyCount: Math.max(1, enemyCount) // Ensure at least 1 enemy if skirmish happens
            });
        }
        return skirmishes;
    }

    /**
     * Generates all data for a given wave.
     * @param {number} waveNumber - The current wave number.
     * @returns {{
     *   waveNumber: number,
     *   gateCount: number,
     *   gates: Array<object>,
     *   skirmishes: Array<object>,
     *   optimalArmySizeAtEnd: number, // Optimal army size after all forward gates and skirmishes (for scoring)
     *   retreatGateCount: number
     * }}
     */
    generateWaveData(waveNumber) {
        const gateCount = this.getGateCount(waveNumber);

        // Optimal path calculation starts with a fixed initial army size.
        // This is distinct from the player's actual starting army size which might be different (e.g. after losses).
        const gatesData = this.generateGatesData(gateCount, MATH_CONFIG.INITIAL_ARMY_SIZE);
        const skirmishesData = this.generateSkirmishesData(gatesData);

        // Calculate the final optimal army size after all gates and *theoretical* skirmishes for scoring reference
        let finalOptimalSize = MATH_CONFIG.INITIAL_ARMY_SIZE;
        for (let i = 0; i < gateCount; i++) {
            const gate = gatesData[i];
            const choice = gate.choices[gate.optimalChoiceIndex];
            finalOptimalSize = choice.apply(finalOptimalSize);
            finalOptimalSize = Math.max(1, finalOptimalSize); // Ensure it doesn't drop below 1

            // Subtract skirmish that would occur after this gate
            // This is a bit tricky: skirmish is based on optimal size *after* gate,
            // but for calculating the *final* optimal size for star rating, we need to see what remains.
            // The spec says "optimal army at that point" for skirmish size.
            // Let's assume the optimal path player *also* fights these optimal skirmishes.
            const skirmish = skirmishesData[i];
            finalOptimalSize -= skirmish.enemyCount;
            finalOptimalSize = Math.max(0, finalOptimalSize); // Can go to 0 after skirmish
        }

        // Retreat gates mirror forward run count
        const retreatGateCount = gateCount;

        return {
            waveNumber: waveNumber,
            gateCount: gateCount,
            gates: gatesData, // Contains choices, optimal choice index, and optimal army size *after each gate choice*
            skirmishes: skirmishesData, // Contains enemy counts for skirmishes *after each gate*
            optimalArmySizeAtEnd: Math.max(1, finalOptimalSize), // For star rating denominator, ensure at least 1
            retreatGateCount: retreatGateCount,
        };
    }
}

export { WaveGenerator, MathOperationType, MATH_CONFIG };
