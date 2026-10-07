/**
 * JS-FORGE Interactive Manual & Theory Data
 * Formatted structured content for in-game reference viewer.
 */

export const MANUAL_CHAPTERS = [
  {
    id: "chap1",
    num: "1",
    title: "Execution Engine & JS Theory",
    content: `
      <h3>1. The Execution Engine & Core Theory</h3>
      <p>In 1995, Brendan Eich developed JavaScript in just 10 days. Originally intended for simple browser animations, JavaScript has evolved into the world's most ubiquitous programming language, powering mission-critical web applications, cloud infrastructure (Node.js), and game engines.</p>
      
      <h4>1.1 Sequential Execution (The Program Counter)</h4>
      <p>JavaScript executes statements <strong>sequentially from top to bottom</strong>. Each instruction runs in exact chronological order:</p>
      <pre><code>drone.move();       // Step 1: Physical advance
drone.turnRight();  // Step 2: Rotational torque
drone.move(2);      // Step 3: Advance 2 units</code></pre>
      <p>In <strong>JS-FORGE</strong>, the simulation clock steps through your script asynchronously so you can see each physical servo and track move in real time!</p>

      <h4>1.2 Synchronous vs. Asynchronous Actuation</h4>
      <p>In real robotics, physical actuators take time to traverse physical space. While a mathematical calculation (like <code>let total = 4 + 2</code>) executes in nanoseconds, moving a cyber rover requires waiting for motors. In JavaScript, asynchronous operations are represented by <code>Promises</code> and the <code>await</code> keyword.</p>
    `
  },

  {
    id: "chap2",
    num: "2",
    title: "Variables, Types & Memory",
    content: `
      <h3>2. Variables, Types & Memory Allocation</h3>
      <p>Variables are named memory storage slots that hold values for calculation during flight.</p>

      <h4>2.1 Variable Keywords: <code>let</code> vs <code>const</code></h4>
      <table class="manual-table">
        <tr><th>Keyword</th><th>Mutability</th><th>Scope</th><th>Robotics Purpose</th></tr>
        <tr><td><code>const</code></td><td><strong>Immutable</strong> (Permanent)</td><td>Block <code>{}</code></td><td>Portal coordinates, physics constants, pin numbers</td></tr>
        <tr><td><code>let</code></td><td><strong>Mutable</strong> (Reassignable)</td><td>Block <code>{}</code></td><td>Battery levels, crystal counters, step distances</td></tr>
      </table>

      <pre><code>const TARGET_X = 6;      // Cannot change!
let batteryLevel = 100;  // Can change
batteryLevel = batteryLevel - 1; // Drain battery</code></pre>

      <h4>2.2 Essential Data Types</h4>
      <ul>
        <li><strong>Number:</strong> <code>42</code>, <code>3.14</code>, <code>-1</code> — Coordinates, speeds, distances.</li>
        <li><strong>String:</strong> <code>'laser'</code>, <code>'wall'</code>, <code>'crystal'</code> — Sensor readings & codes.</li>
        <li><strong>Boolean:</strong> <code>true</code> or <code>false</code> — Contact bumpers, shield status.</li>
        <li><strong>Array:</strong> <code>[1, 4, 7]</code> — Radar lists and waypoint coordinates.</li>
        <li><strong>Object:</strong> <code>{ x: 3, y: 5, hp: 100 }</code> — Complex drone telemetry.</li>
      </ul>
    `
  },

  {
    id: "chap3",
    num: "3",
    title: "Conditionals & Logic Interlocks",
    content: `
      <h3>3. Conditionals & Logic Interlocks</h3>
      <p>Autonomous machines cannot rely on rigid, hardcoded paths. They must inspect their environment and make dynamic branching decisions.</p>

      <h4>3.1 Equality & Comparisons</h4>
      <table class="manual-table">
        <tr><th>Operator</th><th>Meaning</th><th>Example</th><th>Result</th></tr>
        <tr><td><code>===</code></td><td>Strict Equality</td><td><code>'laser' === 'laser'</code></td><td><code>true</code></td></tr>
        <tr><td><code>!==</code></td><td>Not Equal</td><td><code>5 !== 10</code></td><td><code>true</code></td></tr>
        <tr><td><code>&gt;</code></td><td>Greater Than</td><td><code>shields &gt; 50</code></td><td><code>true</code> if &gt; 50</td></tr>
        <tr><td><code>&lt;</code></td><td>Less Than</td><td><code>battery &lt; 20</code></td><td><code>true</code> if &lt; 20</td></tr>
      </table>

      <h4>3.2 Logic Gates in Code</h4>
      <p>Just like the digital TTL IC chips in LogicForge (AND, OR, NOT), JavaScript uses logical operators:</p>
      <pre><code>// AND (&&): Both conditions must be true
if (drone.scanAhead() === 'empty' && battery > 10) {
  drone.move();
}

// OR (||): At least one condition must be true
if (item === 'crystal' || item === 'portal') {
  drone.move();
}

// NOT (!): Inverts the boolean
if (!isDestroyed) {
  drone.move();
}</code></pre>

      <h4>3.3 The <code>if / else</code> Branch</h4>
      <pre><code>let obstacle = drone.scanAhead();

if (obstacle === 'laser') {
  console.log("Hazard! Taking bypass tunnel.");
  drone.turnLeft();
  drone.move(2);
  drone.turnRight();
} else {
  console.log("Clear corridor. Advancing.");
  drone.move();
}</code></pre>
    `
  },

  {
    id: "chap4",
    num: "4",
    title: "Loops & Automation",
    content: `
      <h3>4. Loops & Iteration Automation</h3>
      <p>Loops adhere to the foundational software principle of <strong>DRY (Don't Repeat Yourself)</strong>. Instead of typing the same command ten times, loops automate repetitive actions.</p>

      <h4>4.1 The <code>for</code> Loop (Counted Repetition)</h4>
      <p>Use a <code>for</code> loop when you know in advance how many cycles are required:</p>
      <pre><code>for (let i = 0; i < 5; i++) {
  drone.move();
}</code></pre>
      <p><strong>How it works:</strong></p>
      <ol>
        <li><code>let i = 0;</code> — Initializes counter variable <code>i</code> at 0.</li>
        <li><code>i &lt; 5;</code> — Condition checked before each step.</li>
        <li><code>drone.move();</code> — Body executes.</li>
        <li><code>i++</code> — Increments <code>i</code> by 1, then loops back to step 2.</li>
      </ol>

      <h4>4.2 The <code>while</code> Loop (Condition-Driven Repetition)</h4>
      <p>Use a <code>while</code> loop when repetition depends on live sensor telemetry:</p>
      <pre><code>// Keep moving until optical sensor spots a wall:
while (drone.scanAhead() !== 'wall') {
  drone.move();
}</code></pre>

      <h4>4.3 Watchdog Protection</h4>
      <p>If a <code>while</code> loop condition never becomes false (e.g. <code>while(true)</code>), computers freeze. JS-FORGE includes a built-in kernel watchdog that automatically stops runaway loops after 25,000 operations without crashing your browser tab.</p>
    `
  },

  {
    id: "chap5",
    num: "5",
    title: "Functions & Subroutines",
    content: `
      <h3>5. Functions & Reusable Subroutines</h3>
      <p>Functions allow you to bundle complex multi-step maneuvers into a single custom named command.</p>

      <h4>5.1 Defining Custom Robot Maneuvers</h4>
      <pre><code>// Subroutine: Harvest an alcove and return to main corridor
function harvestAlcove() {
  drone.turnLeft();
  drone.move(2); // Snatch energy core
  drone.turnRight();
  drone.turnRight(); // 180° turnaround
  drone.move(2);
  drone.turnLeft();  // Face forward again
}

// Clean multiple chambers with zero code duplication:
drone.move();
harvestAlcove();
drone.move(2);
harvestAlcove();</code></pre>

      <h4>5.2 Arguments & Return Values</h4>
      <pre><code>function leapForward(distance) {
  for (let i = 0; i < distance; i++) {
    drone.move();
  }
}

leapForward(4); // Advances 4 tiles</code></pre>
    `
  },

  {
    id: "chap6",
    num: "6",
    title: "Data Structures: Arrays & Objects",
    content: `
      <h3>6. Data Structures: Arrays & Object Telemetry</h3>
      <p>Autonomous systems manage streams of data, target lists, and telemetry status dictionaries.</p>

      <h4>6.1 Arrays (Ordered Lists)</h4>
      <p>An array is an ordered list enclosed in square brackets <code>[]</code>:</p>
      <pre><code>let contacts = drone.radar(); // Returns array of targets
console.log("Radar contacts: " + contacts.length);

// Extract only energy crystals using .filter():
let crystals = contacts.filter(item => item.type === 'crystal');</code></pre>

      <h4>6.2 Objects (Key-Value Dictionaries)</h4>
      <p>An object bundles related properties using curly braces <code>{}</code>:</p>
      <pre><code>let telemetry = drone.getTelemetry();

console.log("Coordinates: " + telemetry.x + ", " + telemetry.y);
console.log("Heading: " + telemetry.heading);
console.log("Shields: " + telemetry.shields + "%");
console.log("Cores Collected: " + telemetry.coresCollected);</code></pre>
    `
  },

  {
    id: "chap7",
    num: "7",
    title: "CyberDrone Hardware API",
    content: `
      <h3>7. CyberDrone Hardware API Reference</h3>
      <p>The complete specification of virtual hardware methods exposed to your scripts:</p>

      <h4>7.1 Navigation & Actuators</h4>
      <table class="manual-table">
        <tr><th>Method</th><th>Arguments</th><th>Returns</th><th>Description</th></tr>
        <tr><td><code>drone.move(n)</code></td><td><code>n</code> (Number, default: 1)</td><td><code>Promise&lt;Boolean&gt;</code></td><td>Drives forward <code>n</code> tiles. Returns <code>false</code> if blocked.</td></tr>
        <tr><td><code>drone.moveBackward(n)</code></td><td><code>n</code> (Number, default: 1)</td><td><code>Promise&lt;Boolean&gt;</code></td><td>Reverses backward <code>n</code> tiles without turning.</td></tr>
        <tr><td><code>drone.turnRight()</code></td><td><em>None</em></td><td><code>Promise&lt;Void&gt;</code></td><td>Turns heading 90° clockwise (N ➔ E ➔ S ➔ W).</td></tr>
        <tr><td><code>drone.turnLeft()</code></td><td><em>None</em></td><td><code>Promise&lt;Void&gt;</code></td><td>Turns heading 90° counter-clockwise.</td></tr>
      </table>

      <h4>7.2 Optical Sensors & Radar</h4>
      <table class="manual-table">
        <tr><th>Method</th><th>Arguments</th><th>Returns</th><th>Description</th></tr>
        <tr><td><code>drone.scanAhead()</code></td><td><em>None</em></td><td><code>Promise&lt;String&gt;</code></td><td>Inspects 1 tile forward: <code>'empty'</code>, <code>'wall'</code>, <code>'crystal'</code>, <code>'laser'</code>, <code>'portal'</code>.</td></tr>
        <tr><td><code>drone.scan()</code></td><td><em>None</em></td><td><code>Promise&lt;Object&gt;</code></td><td>Inspects all 4 compass directions: <code>{ forward, right, rear, left }</code>.</td></tr>
        <tr><td><code>drone.radar()</code></td><td><em>None</em></td><td><code>Promise&lt;Array&gt;</code></td><td>Sweeps entire arena and returns contacts list with coordinates and distances.</td></tr>
      </table>

      <h4>7.3 Cyber Warfare & Diagnostics</h4>
      <table class="manual-table">
        <tr><th>Method</th><th>Arguments</th><th>Returns</th><th>Description</th></tr>
        <tr><td><code>drone.hack()</code></td><td><em>None</em></td><td><code>Promise&lt;Boolean&gt;</code></td><td>Disables laser firewalls directly ahead.</td></tr>
        <tr><td><code>drone.getTelemetry()</code></td><td><em>None</em></td><td><code>Object</code></td><td>Snapshot: <code>{ x, y, heading, battery, shields, coresCollected }</code>.</td></tr>
      </table>
    `
  },

  {
    id: "chap8",
    num: "8",
    title: "Graphics Programming Theory",
    content: `
      <h3>8. Graphics Programming Theory</h3>
      <p>How do computers draw graphics with code? Through <strong>coordinate grids and vector math</strong>.</p>

      <h4>8.1 The 16x16 Pixel Matrix</h4>
      <p>In digital graphics, every sprite is stored as a 2D matrix (a grid of rows and columns):</p>
      <pre><code>// grid is a 16x16 2D array
// Row 0 is TOP, Row 15 is BOTTOM
// Column 0 is REAR, Column 15 is FRONT

// Paint glowing cockpit:
grid[7][7] = colors.CYAN;
grid[7][8] = colors.CYAN;

// Paint 12-pixel caterpillar track with a loop:
for (let c = 2; c <= 13; c++) {
  grid[1][c] = colors.DARK;
}</code></pre>

      <h4>8.2 Canvas 2D Vector Context</h4>
      <p>The arena engine runs at 60 FPS on HTML5 Canvas using pure JavaScript vector math:</p>
      <ul>
        <li><code>ctx.translate(x, y)</code> moves the origin to the drone's position.</li>
        <li><code>ctx.rotate(angle)</code> aligns the coordinate plane with the drone's heading.</li>
        <li><code>ctx.shadowBlur = 10; ctx.shadowColor = '#00f0ff';</code> generates real-time GPU-accelerated neon bloom without Photoshop files!</li>
      </ul>
    `
  }
];
