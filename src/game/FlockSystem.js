import { MAX_RENDERED_AGENTS, STRAGGLER_TIMEOUT_MS } from "../core/constants.js";

function createAgent(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    outOfBoundsTime: 0
  };
}

/**
 * Simple 2D boids-inspired simulation for visualising the armies.
 */
export class FlockSystem {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.playerAgents = [];
    this.enemyAgents = [];
    this.obstacles = [
      { x: canvas.width * 0.33, y: canvas.height * 0.5, r: 45 },
      { x: canvas.width * 0.66, y: canvas.height * 0.4, r: 50 }
    ];
    this.direction = 1;
    this.laneBias = 0;
    this.running = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /**
   * Sets the active travel direction. 1 for forward, -1 for retreat.
   * @param {number} direction
   */
  setDirection(direction) {
    this.direction = direction;
  }

  /**
   * Adjusts the horizontal bias coming from the slider.
   * @param {number} bias
   */
  setLaneBias(bias) {
    this.laneBias = Math.max(-1, Math.min(1, bias));
  }

  /**
   * Updates the number of rendered player agents.
   * @param {number} count
   */
  setPlayerCount(count) {
    const target = Math.min(MAX_RENDERED_AGENTS, Math.max(4, Math.round(Math.sqrt(count) * 3)));
    this.adjustAgents(this.playerAgents, target);
  }

  /**
   * Updates the number of rendered enemy agents.
   * @param {number} count
   */
  setEnemyCount(count) {
    const target = Math.min(MAX_RENDERED_AGENTS, Math.max(3, Math.round(Math.sqrt(count) * 2.5)));
    this.adjustAgents(this.enemyAgents, target);
  }

  adjustAgents(list, target) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    while (list.length < target) {
      list.push(createAgent(width, height));
    }
    while (list.length > target) {
      list.pop();
    }
  }

  loop() {
    if (!this.running) {
      return;
    }
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;
    this.updateAgents(this.playerAgents, dt, true);
    this.updateAgents(this.enemyAgents, dt, false);
    this.render();
    requestAnimationFrame(this.loop);
  }

  updateAgents(list, dt, isPlayer) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cohesionStrength = isPlayer ? 0.05 : 0.03;
    const speed = isPlayer ? 1.4 : 1.3;
    const direction = isPlayer ? this.direction : -this.direction;
    const laneTarget = (this.laneBias + 1) / 2;

    for (const agent of list) {
      const dx = width * laneTarget - agent.x;
      const dy = height * (isPlayer ? 0.2 : 0.8) - agent.y;
      agent.vx += dx * cohesionStrength * (dt / 16);
      agent.vy += dy * cohesionStrength * (dt / 16);
      agent.vy += direction * speed * 0.01;

      this.avoidObstacles(agent);

      const mag = Math.hypot(agent.vx, agent.vy);
      const maxSpeed = isPlayer ? 2.6 : 2.4;
      if (mag > maxSpeed) {
        agent.vx = (agent.vx / mag) * maxSpeed;
        agent.vy = (agent.vy / mag) * maxSpeed;
      }

      agent.x += agent.vx * (dt / 16);
      agent.y += agent.vy * (dt / 16);

      if (agent.x < -20 || agent.x > width + 20 || agent.y < -20 || agent.y > height + 20) {
        agent.outOfBoundsTime += dt;
        if (agent.outOfBoundsTime > STRAGGLER_TIMEOUT_MS) {
          agent.x = Math.random() * width;
          agent.y = Math.random() * height;
          agent.outOfBoundsTime = 0;
        }
      } else {
        agent.outOfBoundsTime = 0;
      }
    }
  }

  avoidObstacles(agent) {
    for (const obstacle of this.obstacles) {
      const dx = agent.x - obstacle.x;
      const dy = agent.y - obstacle.y;
      const distance = Math.hypot(dx, dy);
      if (distance < obstacle.r + 20) {
        const factor = (obstacle.r + 20 - distance) / (obstacle.r + 20);
        agent.vx += (dx / distance) * factor * 0.8;
        agent.vy += (dy / distance) * factor * 0.8;
      }
    }
  }

  render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawRocks();
    this.drawAgents(this.enemyAgents, "#ff6f6f");
    this.drawAgents(this.playerAgents, "#6ff2ff");
  }

  drawRocks() {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = "rgba(80, 90, 120, 0.4)";
    for (const obstacle of this.obstacles) {
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAgents(list, color) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = color;
    for (const agent of list) {
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
