/**
 * JS-FORGE Drone Controller & Virtual Hardware API
 * Bridges user JavaScript code with the visual arena and audio synthesis.
 */

import { sound } from '../audio/synth.js';

export const DIRECTIONS = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3
};

export const DIR_VECTORS = [
  { dx: 0, dy: -1 }, // North
  { dx: 1, dy: 0 },  // East
  { dx: 0, dy: 1 },  // South
  { dx: -1, dy: 0 }  // West
];

export class CyberDrone {
  constructor(arenaRenderer, terminalLogger, runner) {
    this.arena = arenaRenderer;
    this.logger = terminalLogger;
    this.runner = runner;

    this.x = 0;
    this.y = 0;
    this.dir = DIRECTIONS.EAST;
    this.battery = 100;
    this.shields = 100;
    this.coresCollected = 0;
    this.totalCrystals = 0;
    this.isDestroyed = false;
    this.reachedPortal = false;
    this.permissionCheck = null;
  }

  setPermissionCheck(fn) {
    this.permissionCheck = fn;
  }

  reset(levelData) {
    this.x = levelData.droneStart?.x ?? 0;
    this.y = levelData.droneStart?.y ?? 0;
    this.dir = levelData.droneStart?.dir ?? DIRECTIONS.EAST;
    this.battery = 100;
    this.shields = 100;
    this.coresCollected = 0;
    this.totalCrystals = (levelData.crystals || []).length;
    this.isDestroyed = false;
    this.reachedPortal = false;

    this.arena.instantSyncDrone(this.x, this.y, this.dir);
  }

  getTelemetry() {
    const dirNames = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
      heading: dirNames[this.dir],
      directionIndex: this.dir,
      battery: this.battery,
      shields: this.shields,
      coresCollected: this.coresCollected,
      totalCrystals: this.totalCrystals,
      reachedPortal: this.reachedPortal,
      isDestroyed: this.isDestroyed
    };
  }

  // --- API METHODS EXPOSED TO USER CODE ---

  async move(steps = 1) {
    if (this.permissionCheck && !this.permissionCheck('move')) {
      return false;
    }
    if (this.isDestroyed) {
      this.logger.warn("Drone system destroyed. Reset required.");
      return false;
    }

    const count = Math.max(1, Math.floor(steps));
    for (let i = 0; i < count; i++) {
      if (this.isDestroyed) return false;

      // Report active line & await simulation tick
      await this.runner.tick('move');

      const vec = DIR_VECTORS[this.dir];
      const targetX = this.x + vec.dx;
      const targetY = this.y + vec.dy;
      const key = `${targetX},${targetY}`;

      // Check arena boundaries
      if (targetX < 0 || targetX >= this.arena.gridWidth || targetY < 0 || targetY >= this.arena.gridHeight) {
        sound.playError();
        this.logger.error(`[COLLISION] Boundary breach at (${targetX}, ${targetY})! Path blocked.`);
        return false;
      }

      // Check walls
      if (this.arena.walls.has(key)) {
        sound.playError();
        this.logger.error(`[COLLISION] Wall impact at (${targetX}, ${targetY})!`);
        return false;
      }

      // Check active lasers
      if (this.arena.lasers.has(key)) {
        const laser = this.arena.lasers.get(key);
        if (laser.active !== false) {
          sound.playLaserZap();
          this.arena.triggerLaserZap(targetX, targetY);
          this.shields -= 50;
          this.logger.error(`[HAZARD] Laser beam struck! Shields at ${this.shields}%!`);
          if (this.shields <= 0) {
            this.isDestroyed = true;
            this.logger.error(`[CRITICAL] Drone destroyed by laser firewall.`);
            return false;
          }
        }
      }

      // Valid move!
      this.x = targetX;
      this.y = targetY;
      this.battery = Math.max(0, this.battery - 1);
      sound.playStep();
      this.arena.setDroneTarget(this.x, this.y, this.dir);

      // Check if crystal is at new position
      if (this.arena.crystals.has(key)) {
        this.arena.crystals.delete(key);
        this.coresCollected++;
        sound.playCollect();
        this.arena.triggerCollect(this.x, this.y);
        this.logger.info(`[HARVEST] Energy core acquired! (${this.coresCollected}/${this.totalCrystals})`);
      }

      // Check if portal is reached
      if (this.arena.portal && this.x === this.arena.portal.x && this.y === this.arena.portal.y) {
        this.reachedPortal = true;
        this.logger.info(`[EXTRACTION] Portal zone reached!`);
      }
    }
    return true;
  }

  async moveBackward(steps = 1) {
    if (this.permissionCheck && !this.permissionCheck('move')) {
      return false;
    }
    if (this.isDestroyed) {
      this.logger.warn("Drone system destroyed. Reset required.");
      return false;
    }

    const count = Math.max(1, Math.floor(steps));
    for (let i = 0; i < count; i++) {
      if (this.isDestroyed) return false;

      // Report active line & await simulation tick if running via script runner
      await this.runner.tick('moveBackward');

      const vec = DIR_VECTORS[this.dir];
      const targetX = this.x - vec.dx;
      const targetY = this.y - vec.dy;
      const key = `${targetX},${targetY}`;

      // Check arena boundaries
      if (targetX < 0 || targetX >= this.arena.gridWidth || targetY < 0 || targetY >= this.arena.gridHeight) {
        sound.playError();
        this.logger.error(`[COLLISION] Boundary breach at (${targetX}, ${targetY})! Path blocked.`);
        return false;
      }

      // Check walls
      if (this.arena.walls.has(key)) {
        sound.playError();
        this.logger.error(`[COLLISION] Wall impact at (${targetX}, ${targetY})!`);
        return false;
      }

      // Check active lasers
      if (this.arena.lasers.has(key)) {
        const laser = this.arena.lasers.get(key);
        if (laser.active !== false) {
          sound.playLaserZap();
          this.arena.triggerLaserZap(targetX, targetY);
          this.shields -= 50;
          this.logger.error(`[HAZARD] Laser beam struck! Shields at ${this.shields}%!`);
          if (this.shields <= 0) {
            this.isDestroyed = true;
            this.logger.error(`[CRITICAL] Drone destroyed by laser firewall.`);
            return false;
          }
        }
      }

      // Valid move
      this.x = targetX;
      this.y = targetY;
      this.battery = Math.max(0, this.battery - 1);
      sound.playStep();
      this.arena.setDroneTarget(this.x, this.y, this.dir);

      // Check crystals
      if (this.arena.crystals.has(key)) {
        this.arena.crystals.delete(key);
        this.coresCollected++;
        sound.playCollect();
        this.arena.triggerCollect(this.x, this.y);
        this.logger.info(`[HARVEST] Energy core acquired! (${this.coresCollected}/${this.totalCrystals})`);
      }

      // Check portal
      if (this.arena.portal && this.x === this.arena.portal.x && this.y === this.arena.portal.y) {
        this.reachedPortal = true;
        this.logger.info(`[EXTRACTION] Portal zone reached!`);
      }
    }
    return true;
  }

  async turnRight() {
    if (this.permissionCheck && !this.permissionCheck('turn')) {
      return;
    }
    if (this.isDestroyed) return;
    await this.runner.tick('turnRight');
    this.dir = (this.dir + 1) % 4;
    sound.playTurn();
    this.arena.setDroneTarget(this.x, this.y, this.dir);
  }

  async turnLeft() {
    if (this.permissionCheck && !this.permissionCheck('turn')) {
      return;
    }
    if (this.isDestroyed) return;
    await this.runner.tick('turnLeft');
    this.dir = (this.dir + 3) % 4;
    sound.playTurn();
    this.arena.setDroneTarget(this.x, this.y, this.dir);
  }

  async scanAhead() {
    if (this.permissionCheck && !this.permissionCheck('scan')) {
      return 'uncalibrated';
    }
    if (this.isDestroyed) return 'destroyed';
    await this.runner.tick('scanAhead');
    sound.playScan();
    this.arena.triggerScan(this.x, this.y);

    const vec = DIR_VECTORS[this.dir];
    const targetX = this.x + vec.dx;
    const targetY = this.y + vec.dy;
    const key = `${targetX},${targetY}`;

    if (targetX < 0 || targetX >= this.arena.gridWidth || targetY < 0 || targetY >= this.arena.gridHeight) {
      return 'boundary';
    }
    if (this.arena.walls.has(key)) return 'wall';
    if (this.arena.lasers.has(key)) {
      const laser = this.arena.lasers.get(key);
      return laser.active !== false ? 'laser' : 'laser_disabled';
    }
    if (this.arena.terminals.has(key)) return 'terminal';
    if (this.arena.crystals.has(key)) return 'crystal';
    if (this.arena.portal && targetX === this.arena.portal.x && targetY === this.arena.portal.y) return 'portal';

    return 'empty';
  }

  async scan() {
    if (this.isDestroyed) return {};
    await this.runner.tick('scan');
    sound.playScan();
    this.arena.triggerScan(this.x, this.y);

    const inspectOffset = (dirIndex) => {
      const vec = DIR_VECTORS[dirIndex];
      const tx = this.x + vec.dx;
      const ty = this.y + vec.dy;
      const key = `${tx},${ty}`;

      if (tx < 0 || tx >= this.arena.gridWidth || ty < 0 || ty >= this.arena.gridHeight) return 'boundary';
      if (this.arena.walls.has(key)) return 'wall';
      if (this.arena.lasers.has(key)) {
        return this.arena.lasers.get(key).active !== false ? 'laser' : 'laser_disabled';
      }
      if (this.arena.terminals.has(key)) return 'terminal';
      if (this.arena.crystals.has(key)) return 'crystal';
      if (this.arena.portal && tx === this.arena.portal.x && ty === this.arena.portal.y) return 'portal';
      return 'empty';
    };

    return {
      forward: inspectOffset(this.dir),
      right: inspectOffset((this.dir + 1) % 4),
      rear: inspectOffset((this.dir + 2) % 4),
      left: inspectOffset((this.dir + 3) % 4)
    };
  }

  async radar() {
    if (this.isDestroyed) return [];
    await this.runner.tick('radar');
    sound.playScan();
    this.arena.triggerScan(this.x, this.y);

    const items = [];
    this.arena.crystals.forEach(key => {
      const [cx, cy] = key.split(',').map(Number);
      const distance = Math.abs(cx - this.x) + Math.abs(cy - this.y);
      items.push({ type: 'crystal', x: cx, y: cy, distance });
    });

    this.arena.lasers.forEach((data, key) => {
      const [lx, ly] = key.split(',').map(Number);
      const distance = Math.abs(lx - this.x) + Math.abs(ly - this.y);
      items.push({ type: 'laser', x: lx, y: ly, active: data.active !== false, distance });
    });

    if (this.arena.portal) {
      const px = this.arena.portal.x;
      const py = this.arena.portal.y;
      const distance = Math.abs(px - this.x) + Math.abs(py - this.y);
      items.push({ type: 'portal', x: px, y: py, distance });
    }

    return items;
  }

  async hack(passcode) {
    if (this.permissionCheck && !this.permissionCheck('hack')) {
      return false;
    }
    if (this.isDestroyed) return false;
    await this.runner.tick('hack');

    const vec = DIR_VECTORS[this.dir];
    const targetX = this.x + vec.dx;
    const targetY = this.y + vec.dy;
    const key = `${targetX},${targetY}`;

    if (this.arena.lasers.has(key)) {
      const laser = this.arena.lasers.get(key);
      laser.active = false;
      sound.playCollect();
      this.logger.info(`[HACK SUCCESS] Laser barrier at (${targetX}, ${targetY}) bypassed!`);
      return true;
    }

    if (this.arena.terminals.has(key)) {
      const term = this.arena.terminals.get(key);
      if (String(passcode) === String(term.code)) {
        term.solved = true;
        sound.playVictory();
        this.logger.info(`[HACK SUCCESS] Terminal unlocked! Security barrier lowered.`);
        return true;
      } else {
        sound.playError();
        this.logger.warn(`[ACCESS DENIED] Invalid passcode "${passcode}". Access refused.`);
        return false;
      }
    }

    this.logger.warn(`[SCAN] No hackable interface ahead.`);
    return false;
  }
}
