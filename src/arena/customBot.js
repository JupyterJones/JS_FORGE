/**
 * JS-FORGE Custom Bot Fabricator & Pixel Matrix
 * Stores, saves, loads, and manages custom user-drawn robot sprites (16x16 grid).
 */

export const GRID_SIZE = 16;

// Pre-designed default templates
export const PRESETS = {
  rover: {
    name: "Cyber Rover (Classic)",
    pixels: [
      // Row 0 - 15 (East is facing right: column 15 is FRONT, column 0 is REAR)
      // Top caterpillar track
      "................",
      "...##########...",
      "...##########...",
      "....#......#....",
      "....#777777#....",
      "...#77777777#...",
      "..#7711117777#..",
      "..#77111177773#.",
      "..#77111177773#.",
      "..#7711117777#..",
      "...#77777777#...",
      "....#777777#....",
      "....#......#....",
      "...##########...",
      "...##########...",
      "................"
    ]
  },

  scout: {
    name: "Stealth Scout Drone",
    pixels: [
      "................",
      "................",
      ".......##.......",
      "......#11#......",
      ".....#1111#.....",
      "....#112211#....",
      "...#11222211#...",
      "..#1122332211#..",
      "..#1122332211#..",
      "...#11222211#...",
      "....#112211#....",
      ".....#1111#.....",
      "......#11#......",
      ".......##.......",
      "................",
      "................"
    ]
  },

  tank: {
    name: "Heavy Siege Mech",
    pixels: [
      "................",
      "..############..",
      "..#2222222222#..",
      "..#22......22#..",
      "..#22.####.22#..",
      "..#22#7777#22#..",
      "..#22#7117#22#..",
      "..#22#7117#22#33",
      "..#22#7117#22#33",
      "..#22#7117#22#..",
      "..#22#7777#22#..",
      "..#22.####.22#..",
      "..#22......22#..",
      "..#2222222222#..",
      "..############..",
      "................"
    ]
  }
};

export const COLOR_PALETTE = [
  { id: '1', name: 'Cyan Neon', hex: '#00f0ff' },
  { id: '2', name: 'Plasma Pink', hex: '#ff0055' },
  { id: '3', name: 'Electric Yellow', hex: '#ffe600' },
  { id: '4', name: 'Toxic Green', hex: '#00ff66' },
  { id: '5', name: 'Electric Purple', hex: '#b55fe6' },
  { id: '6', name: 'Pure White', hex: '#ffffff' },
  { id: '7', name: 'Armor Blue', hex: '#1e3a5f' },
  { id: '#', name: 'Dark Chassis', hex: '#151d2f' },
  { id: '.', name: 'Transparent / Eraser', hex: null }
];

export class BotFabricator {
  constructor() {
    this.grid = this.createEmptyGrid();
    this.loadFromStorage();
  }

  createEmptyGrid() {
    const grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      grid.push(new Array(GRID_SIZE).fill(null));
    }
    return grid;
  }

  loadPreset(presetKey) {
    const preset = PRESETS[presetKey] || PRESETS.rover;
    const grid = this.createEmptyGrid();

    preset.pixels.forEach((rowStr, r) => {
      if (r < GRID_SIZE) {
        for (let c = 0; c < GRID_SIZE && c < rowStr.length; c++) {
          const char = rowStr[c];
          const colorObj = COLOR_PALETTE.find(p => p.id === char);
          grid[r][c] = colorObj ? colorObj.hex : null;
        }
      }
    });

    this.grid = grid;
    return this.grid;
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('jsforge_custom_bot');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === GRID_SIZE) {
          this.grid = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read custom bot from storage", e);
    }
    // Default to classic cyber rover
    this.loadPreset('rover');
  }

  saveToStorage() {
    try {
      localStorage.setItem('jsforge_custom_bot', JSON.stringify(this.grid));
    } catch (e) {
      console.warn("Could not save custom bot to storage", e);
    }
  }

  getPixel(r, c) {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      return this.grid[r][c];
    }
    return null;
  }

  setPixel(r, c, colorHex, symmetry = true) {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      this.grid[r][c] = colorHex;
      // Top-bottom vertical symmetry (relative to facing East direction)
      if (symmetry) {
        const symR = GRID_SIZE - 1 - r;
        this.grid[symR][c] = colorHex;
      }
    }
  }

  floodFill(startR, startC, targetColorHex) {
    const originalColor = this.getPixel(startR, startC);
    if (originalColor === targetColorHex) return;

    const queue = [[startR, startC]];
    const visited = new Set();

    while (queue.length > 0) {
      const [r, c] = queue.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
      if (this.grid[r][c] !== originalColor) continue;

      this.grid[r][c] = targetColorHex;

      queue.push([r + 1, c]);
      queue.push([r - 1, c]);
      queue.push([r, c + 1]);
      queue.push([r, c - 1]);
    }
  }

  clear() {
    this.grid = this.createEmptyGrid();
  }
}
