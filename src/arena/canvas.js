/**
 * JS-FORGE Cyber Arena Canvas Renderer
 * Smooth 60 FPS HTML5 Canvas with particle effects, dynamic lighting, and animated interpolation.
 */

export class ArenaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.gridWidth = 10;
    this.gridHeight = 10;
    this.tileSize = 54;

    // Camera / display offsets
    this.offsetX = 0;
    this.offsetY = 0;

    // Entities in world
    this.walls = new Set();      // "x,y"
    this.crystals = new Set();   // "x,y"
    this.lasers = new Map();     // "x,y" -> { active: boolean, orientation: 'h'|'v' }
    this.portal = { x: 9, y: 9 };
    this.terminals = new Map();  // "x,y" -> { solved: false, code: '77' }

    // Drone visual state (with smooth interpolation)
    this.drone = {
      x: 0,
      y: 0,
      dir: 1, // 0: North, 1: East, 2: South, 3: West
      targetX: 0,
      targetY: 0,
      targetAngle: Math.PI / 2,
      currentAngle: Math.PI / 2,
      isMoving: false,
      isScanning: false,
      shieldActive: true,
      laserHit: false
    };

    // Particle systems & visual FX
    this.particles = [];
    this.floatingTexts = [];
    this.scanWaves = [];

    // Custom user-drawn bot pixel grid
    this.customBotGrid = null;
    this.isCradleMode = false;

    this.lastTime = performance.now();
    this.animFrameId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startLoop();
  }

  setCustomBot(grid) {
    this.customBotGrid = grid;
  }

  setCradleMode(val) {
    this.isCradleMode = !!val;
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Calculate tile size to fit nicely
    const availableW = rect.width - 40;
    const availableH = rect.height - 40;
    const sizeX = Math.floor(availableW / this.gridWidth);
    const sizeY = Math.floor(availableH / this.gridHeight);
    this.tileSize = Math.max(36, Math.min(68, Math.min(sizeX, sizeY)));

    this.offsetX = Math.floor((rect.width - this.gridWidth * this.tileSize) / 2);
    this.offsetY = Math.floor((rect.height - this.gridHeight * this.tileSize) / 2);
  }

  setGridSize(w, h) {
    this.gridWidth = w;
    this.gridHeight = h;
    this.resize();
  }

  loadLevel(levelData) {
    this.gridWidth = levelData.width || 8;
    this.gridHeight = levelData.height || 8;

    this.walls = new Set(levelData.walls || []);
    this.crystals = new Set(levelData.crystals || []);
    this.lasers = new Map(Object.entries(levelData.lasers || {}));
    this.terminals = new Map(Object.entries(levelData.terminals || {}));
    this.portal = levelData.portal ? { ...levelData.portal } : { x: 7, y: 7 };

    // Reset drone
    const startX = levelData.droneStart?.x ?? 0;
    const startY = levelData.droneStart?.y ?? 0;
    const startDir = levelData.droneStart?.dir ?? 1;

    this.drone.x = startX;
    this.drone.y = startY;
    this.drone.targetX = startX;
    this.drone.targetY = startY;
    this.drone.dir = startDir;
    this.drone.targetAngle = this.dirToAngle(startDir);
    this.drone.currentAngle = this.drone.targetAngle;
    this.drone.laserHit = false;

    this.particles = [];
    this.floatingTexts = [];
    this.scanWaves = [];

    this.resize();
  }

  dirToAngle(dir) {
    // 0: North (-PI/2), 1: East (0), 2: South (PI/2), 3: West (PI)
    switch (dir) {
      case 0: return -Math.PI / 2;
      case 1: return 0;
      case 2: return Math.PI / 2;
      case 3: return Math.PI;
      default: return 0;
    }
  }

  setDroneTarget(x, y, dir) {
    this.drone.targetX = x;
    this.drone.targetY = y;
    this.drone.dir = dir;
    this.drone.targetAngle = this.dirToAngle(dir);
    this.drone.isMoving = (this.drone.x !== x || this.drone.y !== y);
  }

  instantSyncDrone(x, y, dir) {
    this.drone.x = x;
    this.drone.y = y;
    this.drone.targetX = x;
    this.drone.targetY = y;
    this.drone.dir = dir;
    this.drone.targetAngle = this.dirToAngle(dir);
    this.drone.currentAngle = this.drone.targetAngle;
  }

  triggerScan(x, y) {
    const px = this.offsetX + (x + 0.5) * this.tileSize;
    const py = this.offsetY + (y + 0.5) * this.tileSize;
    this.scanWaves.push({ x: px, y: py, radius: 0, maxRadius: this.tileSize * 3, alpha: 1.0 });
  }

  triggerCollect(x, y) {
    const px = this.offsetX + (x + 0.5) * this.tileSize;
    const py = this.offsetY + (y + 0.5) * this.tileSize;
    this.floatingTexts.push({ text: '+1 CORE', x: px, y: py, alpha: 1.0, dy: -0.6 });

    // Burst of sparkle particles
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.5;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#00f0ff' : '#ffe600',
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.02
      });
    }
  }

  triggerLaserZap(x, y) {
    const px = this.offsetX + (x + 0.5) * this.tileSize;
    const py = this.offsetY + (y + 0.5) * this.tileSize;
    this.floatingTexts.push({ text: 'SHIELD DAMAGED!', x: px, y: py, alpha: 1.0, dy: -0.7, color: '#ff0055' });
    this.drone.laserHit = true;

    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: '#ff0055',
        alpha: 1.0,
        decay: 0.03
      });
    }
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min(0.06, (now - this.lastTime) / 1000);
      this.lastTime = now;

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  update(dt) {
    // Smooth drone interpolation
    const moveLerp = Math.min(1.0, dt * 8.0);
    this.drone.x += (this.drone.targetX - this.drone.x) * moveLerp;
    this.drone.y += (this.drone.targetY - this.drone.y) * moveLerp;

    // Angle interpolation (handling wraparound)
    let dAngle = this.drone.targetAngle - this.drone.currentAngle;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    this.drone.currentAngle += dAngle * Math.min(1.0, dt * 10.0);

    // Thruster exhaust particles if moving
    const distSq = (this.drone.targetX - this.drone.x) ** 2 + (this.drone.targetY - this.drone.y) ** 2;
    if (distSq > 0.005) {
      const dronePx = this.offsetX + (this.drone.x + 0.5) * this.tileSize;
      const dronePy = this.offsetY + (this.drone.y + 0.5) * this.tileSize;
      const backAngle = this.drone.currentAngle + Math.PI;

      for (let i = 0; i < 2; i++) {
        const spread = (Math.random() - 0.5) * 0.5;
        const spd = 1.0 + Math.random() * 2.0;
        this.particles.push({
          x: dronePx + Math.cos(backAngle) * (this.tileSize * 0.28),
          y: dronePy + Math.sin(backAngle) * (this.tileSize * 0.28),
          vx: Math.cos(backAngle + spread) * spd,
          vy: Math.sin(backAngle + spread) * spd,
          size: 2.5 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#00f0ff' : '#0077ff',
          alpha: 0.8,
          decay: 0.05
        });
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.dy;
      ft.alpha -= 0.018;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update scan waves
    for (let i = this.scanWaves.length - 1; i >= 0; i--) {
      const wave = this.scanWaves[i];
      wave.radius += dt * 180;
      wave.alpha = Math.max(0, 1 - wave.radius / wave.maxRadius);
      if (wave.alpha <= 0) {
        this.scanWaves.splice(i, 1);
      }
    }
  }

  render() {
    const { ctx } = this;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    // Deep space arena background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    // Subtle arena glow gradient
    const grad = ctx.createRadialGradient(
      this.offsetX + (this.gridWidth * this.tileSize) / 2,
      this.offsetY + (this.gridHeight * this.tileSize) / 2,
      50,
      this.offsetX + (this.gridWidth * this.tileSize) / 2,
      this.offsetY + (this.gridHeight * this.tileSize) / 2,
      this.gridWidth * this.tileSize
    );
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Tiles
    this.renderGrid();

    // Draw Extraction Portal
    this.renderPortal();

    // Draw Interactive Elements (Lasers, Terminals, Crystals, Walls)
    this.renderElements();

    // Draw Scan Waves
    this.renderScanWaves();

    // Draw Particles
    this.renderParticles();

    // Draw Drone (Cyber Rover)
    this.renderDrone();

    // Draw Floating Text Popups
    this.renderFloatingTexts();
  }

  renderGrid() {
    const { ctx, tileSize, gridWidth, gridHeight, offsetX, offsetY } = this;

    for (let gx = 0; gx < gridWidth; gx++) {
      for (let gy = 0; gy < gridHeight; gy++) {
        const px = offsetX + gx * tileSize;
        const py = offsetY + gy * tileSize;

        // Tile base
        ctx.fillStyle = (gx + gy) % 2 === 0 ? 'rgba(15, 23, 42, 0.7)' : 'rgba(20, 30, 52, 0.7)';
        ctx.fillRect(px, py, tileSize, tileSize);

        // Tile border
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, tileSize, tileSize);

        // Subtle coordinate watermark in tile corner
        ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.font = '9px monospace';
        ctx.fillText(`${gx},${gy}`, px + 3, py + 11);
      }
    }

    // Outer arena border glow
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, gridWidth * tileSize, gridHeight * tileSize);
  }

  renderPortal() {
    const { ctx, tileSize, offsetX, offsetY, portal } = this;
    if (!portal) return;

    const px = offsetX + (portal.x + 0.5) * tileSize;
    const py = offsetY + (portal.y + 0.5) * tileSize;
    const time = performance.now() * 0.002;

    ctx.save();
    ctx.translate(px, py);

    // Pulsing outer aura
    const auraRadius = (tileSize * 0.42) + Math.sin(time * 3) * 3;
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraRadius);
    auraGrad.addColorStop(0, 'rgba(0, 255, 170, 0.4)');
    auraGrad.addColorStop(1, 'rgba(0, 255, 170, 0.0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Rotating outer ring
    ctx.rotate(time);
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, tileSize * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Counter-rotating inner ring
    ctx.rotate(-time * 2.2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, tileSize * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing core pad
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderElements() {
    const { ctx, tileSize, offsetX, offsetY } = this;
    const time = performance.now() * 0.003;

    // 1. Walls
    this.walls.forEach(key => {
      const [gx, gy] = key.split(',').map(Number);
      const px = offsetX + gx * tileSize;
      const py = offsetY + gy * tileSize;

      // Dark steel block
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

      // Cyber bevel
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

      // Warning hazard diagonal lines
      ctx.strokeStyle = 'rgba(255, 180, 0, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 8, py + tileSize - 8);
      ctx.lineTo(px + tileSize - 8, py + 8);
      ctx.stroke();
    });

    // 2. Crystals (Energy Cores)
    this.crystals.forEach(key => {
      const [gx, gy] = key.split(',').map(Number);
      const px = offsetX + (gx + 0.5) * tileSize;
      const py = offsetY + (gy + 0.5) * tileSize;
      const bob = Math.sin(time * 2.5 + gx) * 3;

      ctx.save();
      ctx.translate(px, py + bob);

      // Glow behind crystal
      const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, tileSize * 0.38);
      glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.6)');
      glowGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, tileSize * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Rotating diamond
      ctx.rotate(Math.sin(time) * 0.3);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -tileSize * 0.28);
      ctx.lineTo(tileSize * 0.22, 0);
      ctx.lineTo(0, tileSize * 0.28);
      ctx.lineTo(-tileSize * 0.22, 0);
      ctx.closePath();
      ctx.fill();

      // Diamond inner highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -tileSize * 0.18);
      ctx.lineTo(tileSize * 0.09, 0);
      ctx.lineTo(0, tileSize * 0.18);
      ctx.lineTo(-tileSize * 0.09, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // 3. Lasers
    this.lasers.forEach((data, key) => {
      const [gx, gy] = key.split(',').map(Number);
      const px = offsetX + gx * tileSize;
      const py = offsetY + gy * tileSize;
      const active = data.active !== false;

      // Laser emitters
      ctx.fillStyle = '#475569';
      ctx.fillRect(px + 1, py + (tileSize / 2) - 4, 6, 8);
      ctx.fillRect(px + tileSize - 7, py + (tileSize / 2) - 4, 6, 8);

      if (active) {
        // High voltage plasma beam
        const pulse = Math.sin(time * 12) * 2;
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.9)';
        ctx.lineWidth = 3 + pulse;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + (tileSize / 2));
        ctx.lineTo(px + tileSize - 4, py + (tileSize / 2));
        ctx.stroke();

        // White hot center line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Disabled / hacked laser beam (faint green)
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px + 4, py + (tileSize / 2));
        ctx.lineTo(px + tileSize - 4, py + (tileSize / 2));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 4. Terminals
    this.terminals.forEach((data, key) => {
      const [gx, gy] = key.split(',').map(Number);
      const px = offsetX + gx * tileSize;
      const py = offsetY + gy * tileSize;

      ctx.fillStyle = data.solved ? '#064e3b' : '#312e81';
      ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
      ctx.strokeStyle = data.solved ? '#10b981' : '#818cf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 6, py + 6, tileSize - 12, tileSize - 12);

      // Terminal symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data.solved ? '✓' : '>_', px + tileSize / 2, py + tileSize / 2 + 4);
      ctx.textAlign = 'start';
    });
  }

  renderScanWaves() {
    const { ctx } = this;
    this.scanWaves.forEach(wave => {
      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${wave.alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  renderParticles() {
    const { ctx } = this;
    this.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderDrone() {
    const { ctx, tileSize, offsetX, offsetY, drone } = this;
    const px = offsetX + (drone.x + 0.5) * tileSize;
    const py = offsetY + (drone.y + 0.5) * tileSize;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(drone.currentAngle);

    // Empty Assembly Cradle Mode (Campaign Start)
    if (this.isCradleMode) {
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-tileSize * 0.38, -tileSize * 0.38, tileSize * 0.76, tileSize * 0.76);
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffe600';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("NO BOT", 0, -4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '7px monospace';
      ctx.fillText("CRADLE EMPTY", 0, 8);
      ctx.restore();
      return;
    }

    // 1. Headlights / Scanner Beam Cone
    const coneGrad = ctx.createRadialGradient(0, 0, 5, tileSize * 1.5, 0, tileSize * 2);
    coneGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    coneGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.08)');
    coneGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(tileSize * 0.2, 0);
    ctx.arc(0, 0, tileSize * 1.8, -0.42, 0.42);
    ctx.closePath();
    ctx.fill();

    // 2. Drone Chassis (Custom Drawn Pixel Matrix OR Default Vector Rover)
    if (this.customBotGrid && this.customBotGrid.length > 0) {
      const spriteSize = tileSize * 0.82;
      const pixelSize = spriteSize / 16;
      const startX = -spriteSize / 2;
      const startY = -spriteSize / 2;

      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          const colorHex = this.customBotGrid[r][c];
          if (colorHex) {
            ctx.fillStyle = drone.laserHit ? '#ff0055' : colorHex;
            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    } else {
      const bodyW = tileSize * 0.38;
      const bodyH = tileSize * 0.28;

      // Tread pods (top & bottom tracks)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-bodyW * 0.8, -bodyH - 4, bodyW * 1.6, 5);
      ctx.strokeRect(-bodyW * 0.8, -bodyH - 4, bodyW * 1.6, 5);
      ctx.fillRect(-bodyW * 0.8, bodyH - 1, bodyW * 1.6, 5);
      ctx.strokeRect(-bodyW * 0.8, bodyH - 1, bodyW * 1.6, 5);

      // Main hull
      ctx.fillStyle = drone.laserHit ? '#ff0055' : '#1e293b';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bodyW, 0);
      ctx.lineTo(bodyW * 0.5, -bodyH);
      ctx.lineTo(-bodyW * 0.7, -bodyH);
      ctx.lineTo(-bodyW, 0);
      ctx.lineTo(-bodyW * 0.7, bodyH);
      ctx.lineTo(bodyW * 0.5, bodyH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sensor cockpit dome / core
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(bodyW * 0.15, 0, bodyW * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Optical forward radar lens
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(bodyW * 0.65, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Shield perimeter aura
    if (drone.shieldActive) {
      const shieldPulse = Math.sin(performance.now() * 0.005) * 2;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, (tileSize * 0.44) + shieldPulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderFloatingTexts() {
    const { ctx } = this;
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.fillStyle = ft.color || '#00f0ff';
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color || '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
    ctx.textAlign = 'start';
  }
}
