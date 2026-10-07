/**
 * JS-FORGE Curriculum & Mission Definitions
 * Each sector has:
 * - Clear JavaScript pedagogical concept
 * - Interactive Lesson Card with code examples
 * - "Watch Demo" optimal solution script
 * - "Play Mission" starter template for the student
 * - Verification / Win Condition checker
 */

export const MISSIONS = [
  {
    id: 0,
    title: "SECTOR 0: The Grand Showcase",
    subtitle: "System Awakening // Visual Code-to-Action Demo",
    conceptTitle: "How JavaScript Controls Hardware",
    conceptExplanation: `
      Welcome to <strong>JS-FORGE</strong>, Jack!<br><br>
      In JavaScript, instructions run sequentially from top to bottom. Every function call you issue communicates with the drone's virtual flight controller in real-time.<br><br>
      Click <strong>📺 WATCH DEMO</strong> to watch the master script run. Notice how <strong>each line lights up in the editor</strong> at the exact millisecond the cyber rover executes the maneuver!
    `,
    syntaxTip: `
// 1. Move forward
drone.move(2);

// 2. Turn 90 degrees
drone.turnRight();

// 3. Scan the tile ahead
let item = drone.scanAhead();

// 4. Loops to automate repeat tasks
for (let i = 0; i < 3; i++) {
  drone.move();
}
    `,
    levelData: {
      width: 8,
      height: 8,
      droneStart: { x: 1, y: 1, dir: 1 }, // East
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0',
        '0,7', '1,7', '2,7', '3,7', '4,7', '5,7', '6,7', '7,7',
        '0,1', '0,2', '0,3', '0,4', '0,5', '0,6',
        '7,1', '7,2', '7,3', '7,4', '7,5', '7,6',
        '3,1', '3,2', '3,4', '3,5'
      ],
      crystals: ['2,1', '5,3', '2,5'],
      lasers: {
        '5,4': { active: true, orientation: 'h' }
      },
      terminals: {},
      portal: { x: 6, y: 6 }
    },
    demoCode: `// SECTOR 0: MASTER DEMO SCRIPT
// Watch the lines highlight as the cyber rover maneuvers!

console.log("=== AWAKENING CYBER ROVER ===");

// 1. Harvest first energy crystal
drone.move();
console.log("Collected Core 1!");

// 2. Navigate around the central barrier
drone.turnRight();
drone.move(2);
drone.turnLeft();

// 3. Collect second crystal
drone.move(3);
drone.turnRight();
drone.move();
console.log("Collected Core 2!");

// 4. Bypass the laser firewall
console.log("Approaching laser barrier...");
drone.hack(); // Disables the laser barrier

// 5. Navigate through disabled laser to reach the extraction portal
drone.move(2);
drone.turnRight();
drone.move(3);

// 6. Harvest final crystal
drone.move();
console.log("All systems nominal. Sector 0 Complete!");

// 7. Extract to portal
drone.turnLeft();
drone.turnLeft();
drone.move(4);
drone.turnLeft();
drone.move();
`,
    starterCode: `// Try running the code yourself or modify the drone's path!
console.log("Manual Flight Control Initialized.");

drone.move();
drone.turnRight();
drone.move(2);
drone.turnLeft();
drone.move(3);
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.coresCollected >= 2;
    },
    winMessage: "Sector 0 Demo Complete! You are ready to take full command of the forge."
  },

  {
    id: 1,
    title: "SECTOR 1: Vector Ignition",
    subtitle: "Variables, Numbers & Basic Navigation",
    conceptTitle: "Variables (`let`, `const`) and Movement Methods",
    conceptExplanation: `
      Computers use <strong>variables</strong> to remember values. In modern JavaScript, we declare variables with <code>let</code> (if the value can change) or <code>const</code> (if it stays constant).<br><br>
      Our drone understands four foundational navigation methods:<br>
      • <code>drone.move(steps)</code> — Advances forward by <code>steps</code> tiles (default is 1).<br>
      • <code>drone.turnRight()</code> — Rotates 90° clockwise.<br>
      • <code>drone.turnLeft()</code> — Rotates 90° counter-clockwise.<br><br>
      <strong>Your Mission:</strong> Navigate the winding test course, collect both Energy Cores, and park at the Extraction Portal (green swirling ring at 6, 4).
    `,
    syntaxTip: `
// Store numbers in variables
const stepDistance = 3;
let turns = 1;

// Use variables as arguments
drone.move(stepDistance);
drone.turnRight();
drone.move(2);
    `,
    levelData: {
      width: 8,
      height: 6,
      droneStart: { x: 1, y: 1, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0',
        '0,5', '1,5', '2,5', '3,5', '4,5', '5,5', '6,5', '7,5',
        '0,1', '0,2', '0,3', '0,4',
        '7,1', '7,2', '7,3', '7,4',
        '2,2', '3,2', '4,2',
        '4,3', '3,4', '2,4'
      ],
      crystals: ['4,1', '1,4'],
      lasers: {},
      terminals: {},
      portal: { x: 6, y: 4 }
    },
    demoCode: `// SECTOR 1 DEMO SOLUTION
const firstLeg = 3;
drone.move(firstLeg); // Collects crystal at (4,1)

drone.turnRight();
drone.move(2);
drone.turnRight();
drone.move(3); // Collects crystal at (1,4)

// Reverse direction toward portal
drone.turnLeft();
drone.move(2);
drone.turnLeft();
drone.move(5); // Reach portal at (6,4)
`,
    starterCode: `// SECTOR 1: VECTOR IGNITION
// Objective: Collect both crystals and reach the extraction portal.

// 1. Move East to collect the first crystal at (4, 1)
const leg1 = 3;
drone.move(leg1);

// 2. Steer South and West to get the crystal at (1, 4)
drone.turnRight();
// TODO: Add your drone moves here!

`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.coresCollected >= 2;
    },
    winMessage: "Vector calculations verified! Energy reserves charged."
  },

  {
    id: 2,
    title: "SECTOR 2: Laser Interlocks",
    subtitle: "Conditionals (`if`, `else`) & Optical Sensors",
    conceptTitle: "Conditionals & Logic Interlocks",
    conceptExplanation: `
      Real autonomous systems cannot blindly move forward—they must sense obstacles! In JavaScript, we use <code>if</code> statements to branch logic:<br><br>
      <code>if (condition) { /* do this */ } else { /* do that */ }</code><br><br>
      The drone's scanner method <code>drone.scanAhead()</code> inspects the tile immediately in front of it and returns a string:<br>
      • <code>'laser'</code> (Dangerous active laser!)<br>
      • <code>'wall'</code> (Steel barrier)<br>
      • <code>'crystal'</code> (Energy core)<br>
      • <code>'empty'</code> (Safe to step)<br><br>
      <strong>Your Mission:</strong> Scan the corridor ahead. If a laser is active, divert around the upper access tunnel. Otherwise, march straight through!
    `,
    syntaxTip: `
let obstacle = drone.scanAhead();

if (obstacle === 'laser') {
  console.log("Hazard detected! Taking bypass route.");
  drone.turnLeft();
  drone.move(2);
  drone.turnRight();
} else {
  console.log("Path clear!");
  drone.move();
}
    `,
    levelData: {
      width: 9,
      height: 6,
      droneStart: { x: 1, y: 3, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0',
        '0,5', '1,5', '2,5', '3,5', '4,5', '5,5', '6,5', '7,5', '8,5',
        '0,1', '0,2', '0,3', '0,4',
        '8,1', '8,2', '8,3', '8,4',
        '3,2', '4,2', '5,2',
        '3,4', '4,4', '5,4'
      ],
      crystals: ['4,1', '7,3'],
      lasers: {
        '4,3': { active: true, orientation: 'h' }
      },
      terminals: {},
      portal: { x: 7, y: 3 }
    },
    demoCode: `// SECTOR 2 DEMO SOLUTION
drone.move(); // Move to (2, 3)

// Scan the corridor ahead
let scanResult = drone.scanAhead();
console.log("Scanner reported: " + scanResult);

if (scanResult === 'laser') {
  console.log("Active laser detected! Taking upper bypass tunnel.");
  drone.turnLeft();
  drone.move(2);
  drone.turnRight();
  drone.move(3); // Collects crystal in bypass
  drone.turnRight();
  drone.move(2);
  drone.turnLeft();
} else {
  console.log("Corridor is safe. Proceeding straight.");
  drone.move(4);
}

// Reach the portal and final core
drone.move();
`,
    starterCode: `// SECTOR 2: SENSOR INTERLOCKS
// Advance to the scanner checkpoint at (2,3)
drone.move();

// Scan ahead: check if a laser is blocking the straight path
let itemAhead = drone.scanAhead();
console.log("Item ahead is: " + itemAhead);

if (itemAhead === 'laser') {
  // TODO: The direct path is blocked!
  // Turn left, move through the upper bypass, and rejoin the path.

} else {
  // Path is open, step right through!
  drone.move(4);
}
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.shields > 50;
    },
    winMessage: "Optical sensor interlocks passed with 100% shield integrity!"
  },

  {
    id: 3,
    title: "SECTOR 3: Harvesting Loops",
    subtitle: "Iteration Mastery with `for` and `while` Loops",
    conceptTitle: "Don't Repeat Yourself (DRY) with Loops",
    conceptExplanation: `
      Typing <code>drone.move();</code> 10 times is slow and prone to errors. A <code>for</code> loop repeats code a set number of times:<br><br>
      <code>for (let i = 0; i < 5; i++) { drone.move(); }</code><br><br>
      A <code>while</code> loop continues running as long as a condition is true:<br><br>
      <code>while (drone.scanAhead() !== 'wall') { drone.move(); }</code><br><br>
      <strong>Your Mission:</strong> Clean out a long serpentine energy grid containing 5 crystals using compact loops!
    `,
    syntaxTip: `
// Loop exactly 5 times:
for (let i = 0; i < 5; i++) {
  drone.move();
}

// Loop until scanner spots a wall:
while (drone.scanAhead() === 'empty' || drone.scanAhead() === 'crystal') {
  drone.move();
}
    `,
    levelData: {
      width: 9,
      height: 7,
      droneStart: { x: 1, y: 1, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0',
        '0,6', '1,6', '2,6', '3,6', '4,6', '5,6', '6,6', '7,6', '8,6',
        '0,1', '0,2', '0,3', '0,4', '0,5',
        '8,1', '8,2', '8,3', '8,4', '8,5',
        '1,2', '2,2', '3,2', '4,2', '5,2', '6,2',
        '2,4', '3,4', '4,4', '5,4', '6,4', '7,4'
      ],
      crystals: ['3,1', '5,1', '7,1', '1,3', '5,3', '1,5', '4,5'],
      lasers: {},
      terminals: {},
      portal: { x: 7, y: 5 }
    },
    demoCode: `// SECTOR 3 DEMO SOLUTION: ELEGANT LOOPS
console.log("Beginning automated grid harvest...");

// Lane 1: Sweep East using a while loop
while (drone.scanAhead() !== 'wall') {
  drone.move();
}

// Turn into Lane 2
drone.turnRight();
drone.move(2);
drone.turnRight();

// Lane 2: Sweep West using a for loop
for (let i = 0; i < 6; i++) {
  drone.move();
}

// Turn into Lane 3
drone.turnLeft();
drone.move(2);
drone.turnLeft();

// Lane 3: Sweep East to extraction portal
while (drone.scanAhead() !== 'wall') {
  drone.move();
}
console.log("All energy lanes harvested!");
`,
    starterCode: `// SECTOR 3: HARVESTING LOOPS
// Harvest the entire serpentine grid with loops!

// Lane 1: Use a loop to advance until the wall
while (drone.scanAhead() !== 'wall') {
  drone.move();
}

// TODO: Turn into Lane 2, sweep West with a loop, then sweep Lane 3 to the portal!
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.coresCollected >= 5;
    },
    winMessage: "Automated iteration cycle complete! Full grid harvested."
  },

  {
    id: 4,
    title: "SECTOR 4: Subroutine Protocols",
    subtitle: "Custom Functions, Arguments & Reusability",
    conceptTitle: "Functions: Building Your Own Drone Commands",
    conceptExplanation: `
      Functions allow you to bundle multiple instructions into a single custom command that you can call whenever you need it:<br><br>
      <code>function clearAlcove(depth) { ... }</code><br><br>
      Functions make your code clean, readable, and reusable. Instead of writing the same 6 moves for every side room, define one function and call it multiple times with different numbers!<br><br>
      <strong>Your Mission:</strong> Three separate security alcoves branch off from the main hall. Write a function <code>harvestAlcove()</code> that dips into an alcove, collects the energy crystal, and returns to the main corridor.
    `,
    syntaxTip: `
// Define a function with a parameter:
function leap(distance) {
  for (let i = 0; i < distance; i++) {
    drone.move();
  }
}

// Call the function:
leap(3);
    `,
    levelData: {
      width: 9,
      height: 7,
      droneStart: { x: 1, y: 3, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0',
        '0,6', '1,6', '2,6', '3,6', '4,6', '5,6', '6,6', '7,6', '8,6',
        '0,1', '0,2', '0,3', '0,4', '0,5',
        '8,1', '8,2', '8,3', '8,4', '8,5',
        '1,2', '3,2', '5,2', '7,2',
        '1,4', '3,4', '5,4', '7,4'
      ],
      crystals: ['2,1', '4,1', '6,1'],
      lasers: {},
      terminals: {},
      portal: { x: 7, y: 3 }
    },
    demoCode: `// SECTOR 4 DEMO SOLUTION: CUSTOM SUBROUTINES
function harvestAlcove() {
  drone.turnLeft();
  drone.move(2); // Snatch crystal in alcove
  // Turn 180 degrees back
  drone.turnRight();
  drone.turnRight();
  drone.move(2);
  drone.turnLeft(); // Face East along main hall again
}

// Main hall traversal with subroutine calls
drone.move(); // At first alcove entrance
harvestAlcove();

drone.move(2); // At second alcove entrance
harvestAlcove();

drone.move(2); // At third alcove entrance
harvestAlcove();

drone.move(); // Reach extraction portal
`,
    starterCode: `// SECTOR 4: SUBROUTINE PROTOCOLS
// Define a reusable subroutine to harvest any alcove to the left

function harvestAlcove() {
  drone.turnLeft();
  drone.move(2);
  // TODO: Turn around, return to the hall, and face East again!

}

// Main sequence:
drone.move(); // Arrive at alcove 1
harvestAlcove();

// TODO: Advance and harvest the remaining two alcoves!
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.coresCollected >= 3;
    },
    winMessage: "Subroutine protocols compiled and deployed with zero redundancy!"
  },

  {
    id: 5,
    title: "SECTOR 5: Radar Array Lock",
    subtitle: "Arrays, Objects & Functional Filters",
    conceptTitle: "Targeting with Arrays (`.filter()`, `.forEach()`)",
    conceptExplanation: `
      The method <code>drone.radar()</code> sweeps the entire arena and returns a <strong>JavaScript Array</strong> of target objects:<br><br>
      <code>[ { type: 'crystal', x: 4, y: 2, distance: 3 }, ... ]</code><br><br>
      You can filter arrays using JavaScript's built-in <code>.filter()</code> method to separate crystals from hazards, and inspect <code>.length</code> to see how many remain!<br><br>
      <strong>Your Mission:</strong> Scan the room with <code>drone.radar()</code>, find all crystals, and program the drone to collect them.
    `,
    syntaxTip: `
let targets = drone.radar();
console.log("Radar detected " + targets.length + " targets.");

// Filter for only crystals:
let crystals = targets.filter(t => t.type === 'crystal');
console.log("Crystals detected: " + crystals.length);
    `,
    levelData: {
      width: 8,
      height: 8,
      droneStart: { x: 1, y: 1, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0',
        '0,7', '1,7', '2,7', '3,7', '4,7', '5,7', '6,7', '7,7',
        '0,1', '0,2', '0,3', '0,4', '0,5', '0,6',
        '7,1', '7,2', '7,3', '7,4', '7,5', '7,6',
        '3,3', '4,3', '3,4', '4,4'
      ],
      crystals: ['5,1', '1,5', '6,6'],
      lasers: {},
      terminals: {},
      portal: { x: 6, y: 2 }
    },
    demoCode: `// SECTOR 5 DEMO SOLUTION: RADAR TARGETING
let contacts = drone.radar();
let cores = contacts.filter(item => item.type === 'crystal');
console.log("Radar locked onto " + cores.length + " energy cores!");

// Target Core 1 (East)
drone.move(4);

// Target Core 2 (South-West)
drone.turnRight();
drone.move(4);
drone.turnRight();
drone.move(4);

// Target Core 3 (South-East)
drone.turnLeft();
drone.move();
drone.turnLeft();
drone.move(5);

// Head to Portal
drone.turnLeft();
drone.move(4);
`,
    starterCode: `// SECTOR 5: RADAR ARRAY LOCK
// Sweep arena and inspect targets
let targets = drone.radar();
console.log("Total radar contacts: " + targets.length);

// Filter array for energy cores
let energyCores = targets.filter(t => t.type === 'crystal');
console.log("Energy cores waiting: " + energyCores.length);

// Navigate to collect each core and extract to portal!
drone.move(4);
// TODO: Continue targeting!
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.coresCollected >= 3;
    },
    winMessage: "Radar telemetry parsed! Array filtering operations verified."
  }
];
