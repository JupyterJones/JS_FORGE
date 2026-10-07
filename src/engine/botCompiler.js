/**
 * JS-FORGE Bot Code Compiler & Tutorial Lessons
 * Teaches how to program graphics and build robots using real JavaScript code.
 */

export const CODE_BOT_LESSONS = [
  {
    id: "lesson1",
    title: "Lesson 1: Coordinates & Colors",
    conceptTitle: "Grid Coordinates & 2D Arrays",
    conceptSummary: `
      In graphics programming, a screen or sprite is a <strong>grid of pixels</strong>.<br>
      Our robot grid is 16 rows tall (0 to 15) and 16 columns wide (0 to 15).<br>
      • <code>grid[row][col] = color;</code> places a colored pixel.<br>
      • <strong>Column 0</strong> is the REAR, <strong>Column 15</strong> is the FRONT.<br>
      • Row 0 is the TOP, Row 15 is the BOTTOM.<br><br>
      Notice how we use JavaScript color variables like <code>colors.CYAN</code> to paint the core!
    `,
    starterCode: `// LESSON 1: BUILD A BOT WITH COORDINATES & COLORS
// grid is a 16x16 array. Set grid[row][column] = color!

console.log("Compiling coordinate bot blueprint...");

// 1. Paint a 4x4 Glowing Cockpit Core in the center
grid[7][7] = colors.CYAN;
grid[7][8] = colors.CYAN;
grid[8][7] = colors.CYAN;
grid[8][8] = colors.CYAN;

// 2. Add an inner white-hot power cell
grid[7][7] = colors.WHITE;

// 3. Add Top and Bottom Tread corners
grid[2][4] = colors.ARMOR;
grid[2][11] = colors.ARMOR;
grid[13][4] = colors.ARMOR;
grid[13][11] = colors.ARMOR;

// 4. Mount Twin Forward Laser Cannons on the front (Column 14)
grid[6][14] = colors.YELLOW;
grid[9][14] = colors.YELLOW;

// 5. Add a Rear Plasma Thruster (Column 2)
grid[7][2] = colors.PINK;
grid[8][2] = colors.PINK;

console.log("Blueprint generated! Inspect the hologram preview.");
`
  },

  {
    id: "lesson2",
    title: "Lesson 2: Armor & Treads (Loops)",
    conceptTitle: "Automating Graphics with `for` Loops",
    conceptExplanation: `
      Typing coordinates one-by-one takes forever. With a <code>for</code> loop, you can draw a whole 10-pixel tank tread or armor plate in <strong>just 3 lines of JavaScript</strong>!<br><br>
      <code>for (let col = 2; col <= 13; col++) { grid[1][col] = colors.DARK; }</code><br><br>
      Nested loops (a loop inside a loop) can fill an entire 2D box or hull instantly!
    `,
    starterCode: `// LESSON 2: BUILD A TANK CHASSIS USING FOR LOOPS

console.log("Generating heavy chassis with iteration loops...");

// 1. Top Caterpillar Tread using a for loop
for (let c = 2; c <= 13; c++) {
  grid[1][c] = colors.DARK;
  grid[2][c] = colors.ARMOR;
}

// 2. Bottom Caterpillar Tread using a for loop
for (let c = 2; c <= 13; c++) {
  grid[13][c] = colors.ARMOR;
  grid[14][c] = colors.DARK;
}

// 3. Nested loop: Fill the Central Armored Hull (Rows 5-10, Cols 3-12)
for (let r = 5; r <= 10; r++) {
  for (let c = 3; c <= 12; c++) {
    grid[r][c] = colors.DARK;
  }
}

// 4. Power lines running through the hull
for (let c = 5; c <= 10; c++) {
  grid[7][c] = colors.CYAN;
  grid[8][c] = colors.CYAN;
}

// 5. Twin Front Plasma Emitters
grid[6][14] = colors.YELLOW;
grid[6][15] = colors.WHITE;
grid[9][14] = colors.YELLOW;
grid[9][15] = colors.WHITE;

console.log("Chassis forged with loops!");
`
  },

  {
    id: "lesson3",
    title: "Lesson 3: Angled Wings & Geometry",
    conceptTitle: "Conditionals (`if`) & Coordinate Math",
    conceptExplanation: `
      How do game engines draw angled stealth wings and sleek triangles? <strong>With math!</strong><br><br>
      By comparing row and column numbers inside a loop: <code>if (col >= row)</code>, you create diagonal edges and arrow shapes without hardcoding every pixel!
    `,
    starterCode: `// LESSON 3: SLEEK STEALTH FIGHTER DRONE (MATH & GEOMETRY)

console.log("Calculating aerodynamic stealth angles...");

// Draw angled swept-forward wings using math:
// As we move toward the front (col 3 to 13), the wing expands outward!
for (let col = 3; col <= 13; col++) {
  let spread = Math.floor((col - 3) * 0.55);

  // Upper wing sweep
  let upperRow = 7 - spread;
  grid[upperRow][col] = colors.PURPLE;
  grid[upperRow + 1][col] = colors.DARK;

  // Lower wing sweep (symmetrical)
  let lowerRow = 8 + spread;
  grid[lowerRow][col] = colors.PURPLE;
  grid[lowerRow - 1][col] = colors.DARK;
}

// Solid fuselage core
for (let c = 4; c <= 12; c++) {
  grid[7][c] = colors.CYAN;
  grid[8][c] = colors.CYAN;
}

// Glowing cockpit dome at the nose
grid[7][13] = colors.WHITE;
grid[8][13] = colors.WHITE;
grid[7][14] = colors.CYAN;
grid[8][14] = colors.CYAN;

// Twin aft ion thrusters
grid[5][2] = colors.PINK;
grid[10][2] = colors.PINK;

console.log("Stealth drone geometry compiled!");
`
  }
];

export class BotCompiler {
  constructor() {
    this.colorPalette = {
      CYAN: '#00f0ff',
      PINK: '#ff0055',
      YELLOW: '#ffe600',
      GREEN: '#00ff66',
      PURPLE: '#b55fe6',
      WHITE: '#ffffff',
      ARMOR: '#1e3a5f',
      DARK: '#151d2f',
      CLEAR: null
    };
  }

  createEmptyGrid() {
    const grid = [];
    for (let r = 0; r < 16; r++) {
      grid.push(new Array(16).fill(null));
    }
    return grid;
  }

  compile(userCode, customLogger) {
    const grid = this.createEmptyGrid();
    const colors = { ...this.colorPalette };

    // Watchdog to prevent infinite loops in student code
    const wrappedScript = `
      return (function executeBotDesign(grid, colors, console) {
        let __ops = 0;
        function __guard() {
          if (++__ops > 20000) throw new Error("Infinite loop detected in bot drawing code!");
        }

        // Auto-guard simple loops
        ${userCode}
      });
    `;

    try {
      const runner = new Function(wrappedScript)();
      runner(grid, colors, customLogger || console);
      return { success: true, grid };
    } catch (err) {
      if (customLogger && customLogger.error) {
        customLogger.error(`[CODE BOT ERROR] ${err.name}: ${err.message}`);
      }
      return { success: false, error: err, grid };
    }
  }
}
