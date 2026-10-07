/**
 * JS-FORGE Campaign Mode: "START GAME" Progression
 * Mirroring the LogicForge progression:
 * When you start the game, you have NO bot and NO propulsion.
 * You must build the bot in the fabricator and code each subsystem from scratch to advance!
 */

export const CAMPAIGN_STAGES = [
  {
    id: 1,
    title: "STAGE 1: FABRICATION PROTOCOL",
    subtitle: "Objective: Construct your Cyber Chassis",
    story: `
      <strong>SYSTEM ALERT: OFFLINE.</strong><br>
      You have booted up in the Orbital Scrapyard Hangar. 
      You currently have <strong>NO ROBOT</strong> on the arena floor and <strong>NO PROPULSION CONTROLS</strong>.<br><br>
      <strong>Your First Task:</strong> Click <strong>🎨 DRAW BOT</strong> or <strong>💻 CODE A BOT</strong> in the top menu to design, paint, or program your first robot chassis and install it onto the hangar assembly cradle!
    `,
    hardwareStatus: {
      chassis: false,
      propulsion: false,
      steering: false,
      scanner: false,
      loops: false
    },
    arenaSetup: {
      width: 6,
      height: 6,
      droneStart: { x: 1, y: 1, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0',
        '0,5', '1,5', '2,5', '3,5', '4,5', '5,5',
        '0,1', '0,2', '0,3', '0,4',
        '5,1', '5,2', '5,3', '5,4'
      ],
      crystals: ['4,1'],
      lasers: {},
      portal: { x: 4, y: 1 }
    },
    starterCode: `// STAGE 1: DORMANT SYSTEM
// You have no robot chassis yet!
// Open DRAW BOT or CODE A BOT above to fabricate your machine.
`,
    demoCode: `// STAGE 1: FABRICATION PROTOCOL
// You cannot move or steer yet.
// Click 🎨 DRAW BOT or 💻 CODE A BOT above to build and install your chassis!
`,
    checkWin: (telemetry, hasChassis) => {
      return hasChassis === true;
    },
    winMessage: "Chassis blueprint installed! Power routed to primary bus. Next task: Code forward propulsion!"
  },

  {
    id: 2,
    title: "STAGE 2: VECTOR IGNITION",
    subtitle: "Objective: Code Forward Propulsion",
    story: `
      <strong>CHASSIS DETECTED: ONLINE.</strong><br>
      Your custom chassis is resting on the assembly cradle, but the flight computer has <strong>no movement software</strong>.<br><br>
      <strong>Your Task:</strong> Write your first propulsion script in the code editor using <code>drone.move(steps)</code> to fire the caterpillar tracks, advance 3 tiles forward, and snatch the Spark Plug Core at <code>(4, 1)</code>!
    `,
    hardwareStatus: {
      chassis: true,
      propulsion: false,
      steering: false,
      scanner: false,
      loops: false
    },
    arenaSetup: {
      width: 6,
      height: 6,
      droneStart: { x: 1, y: 1, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0',
        '0,5', '1,5', '2,5', '3,5', '4,5', '5,5',
        '0,1', '0,2', '0,3', '0,4',
        '5,1', '5,2', '5,3', '5,4'
      ],
      crystals: ['4,1'],
      lasers: {},
      portal: { x: 4, y: 1 }
    },
    starterCode: `// STAGE 2: CODE YOUR PROPULSION
// The Spark Plug core is 3 tiles directly ahead East (at 4, 1)

// Code the forward engine ignition here:
drone.move(3);
`,
    demoCode: `// STAGE 2 DEMO: FORWARD PROPULSION
drone.move(3);
`,
    checkWin: (telemetry) => {
      return telemetry.coresCollected >= 1;
    },
    winMessage: "Forward propulsion online! Caterpillar tracks calibrated."
  },

  {
    id: 3,
    title: "STAGE 3: GYRO STEERING SERVOS",
    subtitle: "Objective: Code Rotational Steering",
    story: `
      <strong>PROPULSION CALIBRATED.</strong><br>
      Your tracks can drive straight, but you have no steering controls! The industrial exit pipe makes an L-bend.<br><br>
      <strong>Your Task:</strong> Program the rotational servos using <code>drone.turnRight()</code> to steer South, collect the Gyro Core, and park at the secondary docking station at <code>(4, 4)</code>.
    `,
    hardwareStatus: {
      chassis: true,
      propulsion: true,
      steering: false,
      scanner: false,
      loops: false
    },
    arenaSetup: {
      width: 6,
      height: 6,
      droneStart: { x: 1, y: 1, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0',
        '0,5', '1,5', '2,5', '3,5', '4,5', '5,5',
        '0,1', '0,2', '0,3', '0,4',
        '5,1', '5,2', '5,3', '5,4',
        '1,2', '2,2', '3,2', '1,3', '2,3', '3,3'
      ],
      crystals: ['4,2', '4,4'],
      lasers: {},
      portal: { x: 4, y: 4 }
    },
    starterCode: `// STAGE 3: CODE ROTATIONAL STEERING
// 1. Move East into the turn junction
drone.move(3);

// 2. Program the steering servos to rotate South!
drone.turnRight();

// 3. Drive South to harvest the Gyro Core and reach docking port at (4,4)
drone.move(3);
`,
    demoCode: `// STAGE 3 DEMO: ROTATIONAL STEERING
drone.move(3);
drone.turnRight();
drone.move(3);
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.coresCollected >= 1;
    },
    winMessage: "Steering servos verified! Rotational gyro linked to flight computer."
  },

  {
    id: 4,
    title: "STAGE 4: OPTICAL SCANNER & LASER INTERLOCK",
    subtitle: "Objective: Code Obstacle Sensing & Hack Interlock",
    story: `
      <strong>STEERING ONLINE.</strong><br>
      An electrified laser barrier blocks the transit airlock. If you drive into it blindly, your bot will be destroyed!<br><br>
      <strong>Your Task:</strong> Code the optical sensor using <code>let obstacle = drone.scanAhead();</code> and write an <code>if</code> condition to detect the laser, then fire <code>drone.hack()</code> to drop the firewall!
    `,
    hardwareStatus: {
      chassis: true,
      propulsion: true,
      steering: true,
      scanner: false,
      loops: false
    },
    arenaSetup: {
      width: 7,
      height: 5,
      droneStart: { x: 1, y: 2, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0',
        '0,4', '1,4', '2,4', '3,4', '4,4', '5,4', '6,4',
        '0,1', '0,2', '0,3',
        '6,1', '6,2', '6,3'
      ],
      crystals: ['5,2'],
      lasers: {
        '3,2': { active: true, orientation: 'h' }
      },
      portal: { x: 5, y: 2 }
    },
    starterCode: `// STAGE 4: CODE OPTICAL SENSORS & HACK
// Advance to the security checkpoint at (2, 2)
drone.move();

// Scan the tile ahead:
let item = drone.scanAhead();
console.log("Scanner reported: " + item);

// If the laser is active, hack the barrier!
if (item === 'laser') {
  console.log("Active laser! Initiating bypass hack...");
  drone.hack(); // Disables the firewall
}

// Drive through the safe gateway to extraction at (5, 2)
drone.move(3);
`,
    demoCode: `// STAGE 4 DEMO: OPTICAL SCANNER & HACK
drone.move();
let item = drone.scanAhead();
if (item === 'laser') {
  drone.hack();
}
drone.move(3);
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.shields > 50;
    },
    winMessage: "Optical scanner calibrated! Cyber warfare interlock compiled."
  },

  {
    id: 5,
    title: "STAGE 5: AUTOMATION CO-PROCESSOR",
    subtitle: "Objective: Code Loops to Survive Battery Drain",
    story: `
      <strong>SENSORS ONLINE.</strong><br>
      You have entered the Main Conduit. Six energy cores are lined up, but your auxiliary battery is draining fast!<br><br>
      <strong>Your Task:</strong> Write a <code>for</code> or <code>while</code> loop to harvest all 6 energy cores across the corridor in minimal code cycles.
    `,
    hardwareStatus: {
      chassis: true,
      propulsion: true,
      steering: true,
      scanner: true,
      loops: false
    },
    arenaSetup: {
      width: 9,
      height: 5,
      droneStart: { x: 1, y: 2, dir: 1 },
      walls: [
        '0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '8,0',
        '0,4', '1,4', '2,4', '3,4', '4,4', '5,4', '6,4', '7,4', '8,4',
        '0,1', '0,2', '0,3',
        '8,1', '8,2', '8,3'
      ],
      crystals: ['2,2', '3,2', '4,2', '5,2', '6,2', '7,2'],
      lasers: {},
      portal: { x: 7, y: 2 }
    },
    starterCode: `// STAGE 5: AUTOMATE HARVESTING WITH LOOPS
// Harvest all 6 cores using a loop!

for (let i = 0; i < 6; i++) {
  drone.move();
}
`,
    demoCode: `// STAGE 5 DEMO: AUTOMATION CO-PROCESSOR
for (let i = 0; i < 6; i++) {
  drone.move();
}
`,
    checkWin: (telemetry) => {
      return telemetry.reachedPortal && telemetry.coresCollected >= 6;
    },
    winMessage: "Loop automation co-processor online! You have built your robot from zero to a fully autonomous cyber machine!"
  }
];

export class CampaignManager {
  constructor() {
    this.isActive = false;
    this.currentStageIndex = 0;
    this.hasBuiltChassis = false;
    this.loadState();
  }

  loadState() {
    try {
      const active = localStorage.getItem('jsforge_campaign_active');
      if (active !== null) {
        this.isActive = active === 'true';
      }
      const stage = localStorage.getItem('jsforge_campaign_stage');
      if (stage !== null) {
        this.currentStageIndex = parseInt(stage, 10) || 0;
      }
      const built = localStorage.getItem('jsforge_custom_bot_installed');
      if (built !== null) {
        this.hasBuiltChassis = built === 'true';
      }
    } catch (e) {
      console.warn("Storage restricted", e);
    }
  }

  saveState() {
    try {
      localStorage.setItem('jsforge_campaign_active', this.isActive);
      localStorage.setItem('jsforge_campaign_stage', this.currentStageIndex);
      localStorage.setItem('jsforge_custom_bot_installed', this.hasBuiltChassis);
    } catch (e) {
      // Ignore
    }
  }

  startNewGame() {
    this.isActive = true;
    this.currentStageIndex = 0;
    this.hasBuiltChassis = false;
    this.saveState();
  }

  exitToDemo() {
    this.isActive = false;
    this.saveState();
  }

  getCurrentStage() {
    return CAMPAIGN_STAGES[this.currentStageIndex] || CAMPAIGN_STAGES[0];
  }

  markChassisBuilt() {
    this.hasBuiltChassis = true;
    this.saveState();
  }

  advanceStage() {
    if (this.currentStageIndex < CAMPAIGN_STAGES.length - 1) {
      this.currentStageIndex++;
      this.saveState();
      return true;
    }
    return false;
  }
}
