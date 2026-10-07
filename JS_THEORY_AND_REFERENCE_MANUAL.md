# ⚡ JS-FORGE: JAVASCRIPT THEORY & ROBOTICS LAB MANUAL
> **The Definitive Engineering & Programming Reference for Cybernetic Flight Systems**  
> *Pair programmed with Jack & assistant Esperanza.*

---

## 📖 TABLE OF CONTENTS
1. [The Execution Engine & JavaScript Theory](#1-the-execution-engine--javascript-theory)
2. [Variables, Types & Memory Allocation](#2-variables-types--memory-allocation)
3. [Conditionals & Logic Branching](#3-conditionals--logic-branching)
4. [Iteration Loops & Automation](#4-iteration-loops--automation)
5. [Functions & Reusable Subroutines](#5-functions--reusable-subroutines)
6. [Data Structures: Arrays & Object Telemetry](#6-data-structures-arrays--object-telemetry)
7. [CyberDrone Virtual Hardware API Reference](#7-cyberdrone-virtual-hardware-api-reference)
8. [Graphics Programming: 2D Matrices & Canvas Vectors](#8-graphics-programming-2d-matrices--canvas-vectors)
9. [Mission Curriculum & Solutions Roadmap](#9-mission-curriculum--solutions-roadmap)

---

## 1. THE EXECUTION ENGINE & JAVASCRIPT THEORY

In 1995, Brendan Eich developed JavaScript in just 10 days. Originally designed for simple browser scripts, JavaScript has evolved into the world's most ubiquitous programming language, powering web applications, flight control dashboards, servers (Node.js), and game engines.

### 1.1 Sequential Execution (The Program Counter)
By default, the JavaScript runtime executes statements **sequentially from top to bottom**:

```javascript
drone.move();       // Step 1: Physical advance
drone.turnRight();  // Step 2: Rotational torque
drone.move(2);      // Step 3: Advance 2 units
```

Every line must complete before the next line begins. In **JS-FORGE**, the execution engine slows this down visually so you can observe the hardware register the command in real-time.

### 1.2 Synchronous vs. Asynchronous Operations
In physical robotics, mechanical actuators (servos, caterpillar tracks, plasma drills) take time to move through space. In JavaScript, asynchronous tasks are represented using `Promise` and `async / await`:

```javascript
// Synchronous (instantaneous calculation)
let distance = 4 + 2; // Executes in nanoseconds

// Asynchronous (hardware waiting on physics)
await drone.move(distance); // Pauses until tracks traverse the tiles
```

> **JS-FORGE Note:** To keep early sectors accessible to beginners, the code runner automatically instruments `drone.*` calls with asynchronous yield pauses under the hood, allowing you to write natural JavaScript while maintaining 60 FPS hardware synchronization!

---

## 2. VARIABLES, TYPES & MEMORY ALLOCATION

Variables are labeled memory cells that store data values for later calculation.

### 2.1 Variable Declaration: `let` vs `const`
| Keyword | Mutability | Scope | Recommended Usage |
| :--- | :--- | :--- | :--- |
| `const` | **Immutable** (Cannot be reassigned) | Block `{}` | Fixed constants, calibrated parameters, hardware configs |
| `let` | **Mutable** (Can be reassigned) | Block `{}` | Counters, sensor readings, battery meters, dynamic coordinates |

```javascript
const EXTRACTION_PORTAL_X = 6; // Immutable coordinate
let batteryLevel = 100;        // Dynamic value
batteryLevel = batteryLevel - 5; // Reassignment
```

### 2.2 Data Types in Robotics
| Type | Example | Robotics Context |
| :--- | :--- | :--- |
| **Number** | `42`, `3.14`, `-10` | Coordinates, velocities, timers, sensor range |
| **String** | `'laser'`, `'clear'`, `'wall'` | Sensor telemetry outputs, security codes |
| **Boolean** | `true`, `false` | Bumper contact, shield status, firewall active |
| **Array** | `[1, 2, 4, 8]` | Radar target lists, breadcrumb trail coordinates |
| **Object** | `{ x: 2, y: 5, hp: 100 }` | Drone state telemetry, entity definitions |

---

## 3. CONDITIONALS & LOGIC BRANCHING

Autonomous machines cannot rely on rigid, hardcoded paths. They must inspect their environment and make dynamic branching decisions using **boolean expressions**.

### 3.1 Comparison Operators
| Operator | Meaning | Example | Result |
| :---: | :--- | :--- | :---: |
| `===` | Strict Equality | `'laser' === 'laser'` | `true` |
| `!==` | Strict Inequality | `5 !== 10` | `true` |
| `>` | Greater Than | `shields > 30` | `true` if shields >= 31 |
| `<` | Less Than | `distance < 2` | `true` if distance <= 1 |
| `>=` | Greater Than or Equal | `cores >= 3` | `true` if cores 3 or more |

### 3.2 Boolean Logic Gates (Logical Operators)
Just like physical TTL logic chips (AND, OR, NOT), JavaScript uses logical operators:

```javascript
// AND (&&) - Both conditions must be TRUE
if (drone.scanAhead() === 'empty' && drone.getTelemetry().battery > 20) {
  drone.move();
}

// OR (||) - Either condition can be TRUE
if (itemAhead === 'crystal' || itemAhead === 'portal') {
  drone.move();
}

// NOT (!) - Inverts boolean
let blocked = (itemAhead === 'wall');
if (!blocked) {
  drone.move();
}
```

### 3.3 The `if / else if / else` Construct
```javascript
let sensor = drone.scanAhead();

if (sensor === 'laser') {
  console.log("Hazard! Taking bypass route.");
  drone.turnLeft();
  drone.move(2);
  drone.turnRight();
} else if (sensor === 'crystal') {
  console.log("Energy core in range! Harvesting.");
  drone.move();
} else {
  console.log("Standard path clear.");
  drone.move();
}
```

---

## 4. ITERATION LOOPS & AUTOMATION

Loops adhere to the software engineering principle of **DRY (Don't Repeat Yourself)**. Instead of repeating lines manually, loops automate repetitive actions.

### 4.1 The `for` Loop (Counted Repetition)
Used when the number of cycles is known in advance:

```javascript
// Syntax: for (initialization; condition; increment)
for (let i = 0; i < 5; i++) {
  drone.move();
}
```
* **Phase 1 (Init):** `let i = 0` sets the counter.
* **Phase 2 (Check):** Is `i < 5`? If true, execute block.
* **Phase 3 (Body):** `drone.move()` executes.
* **Phase 4 (Step):** `i++` increases counter to 1, then loops back to Phase 2.

### 4.2 The `while` Loop (Condition-Driven Repetition)
Used when the number of cycles depends on external sensor state:

```javascript
// Advance until the optical scanner spots a wall:
while (drone.scanAhead() !== 'wall') {
  drone.move();
}
```

### 4.3 Infinite Loop Watchdog Protection
If a `while` loop condition never becomes false (e.g. `while (true) {}`), computers lock up. **JS-FORGE** integrates a real-time watchdog that safely halts runaway scripts after 25,000 continuous operations without freezing your browser.

---

## 5. FUNCTIONS & REUSABLE SUBROUTINES

Functions encapsulate complex algorithms into named, reusable modules.

### 5.1 Defining & Invoking Functions
```javascript
// Definition
function clearCorridor(distance) {
  for (let i = 0; i < distance; i++) {
    drone.move();
  }
}

// Invocation
clearCorridor(4);
drone.turnRight();
clearCorridor(2);
```

### 5.2 Return Values
Functions can compute and pass data back to the caller using `return`:

```javascript
function calculateSafeRoute(sensorReading) {
  if (sensorReading === 'laser') {
    return 'BYPASS';
  } else {
    return 'DIRECT';
  }
}

let decision = calculateSafeRoute(drone.scanAhead());
```

---

## 6. DATA STRUCTURES: ARRAYS & OBJECT TELEMETRY

Complex robotics systems handle streams of telemetry, sensor arrays, and coordinate collections.

### 6.1 Arrays (Ordered Collections)
An array is an indexed list enclosed in brackets `[]`:

```javascript
let waypoints = [3, 5, 2, 8];
console.log(waypoints[0]); // 3 (Zero-indexed!)
console.log(waypoints.length); // 4
```

#### Functional Array Methods:
* **`.filter(fn)`**: Extracts matching items based on a condition:
  ```javascript
  let radarContacts = drone.radar();
  // Filter only crystals:
  let energyCores = radarContacts.filter(item => item.type === 'crystal');
  ```
* **`.forEach(fn)`**: Executes code for every item in an array:
  ```javascript
  energyCores.forEach(core => {
    console.log("Core located at: " + core.x + ", " + core.y);
  });
  ```

### 6.2 Objects (Key-Value Dictionaries)
Objects encapsulate related states using key-value pairs `{}`:

```javascript
let telemetry = drone.getTelemetry();

// Accessing properties with dot notation:
console.log(telemetry.x);         // Current X coordinate
console.log(telemetry.battery);   // Current battery %
console.log(telemetry.shields);   // Shield integrity %
```

---

## 7. CYBERDRONE VIRTUAL HARDWARE API REFERENCE

Every command available to your JavaScript scripts in **JS-FORGE**:

### 7.1 Navigation & Actuators
| Method | Arguments | Returns | Description |
| :--- | :--- | :---: | :--- |
| `drone.move(steps)` | `steps` *(Number, default: 1)* | `Promise<Boolean>` | Advances forward in current heading. Returns `false` if blocked by walls or boundary. |
| `drone.moveBackward(steps)` | `steps` *(Number, default: 1)* | `Promise<Boolean>` | Reverses backward without changing heading. |
| `drone.turnRight()` | *None* | `Promise<Void>` | Rotates heading 90° clockwise (North ➔ East ➔ South ➔ West). |
| `drone.turnLeft()` | *None* | `Promise<Void>` | Rotates heading 90° counter-clockwise. |

### 7.2 Optical Sensors & Radar
| Method | Arguments | Returns | Description |
| :--- | :--- | :---: | :--- |
| `drone.scanAhead()` | *None* | `Promise<String>` | Inspects the single tile directly ahead. Returns: `'empty'`, `'wall'`, `'crystal'`, `'laser'`, `'laser_disabled'`, `'portal'`, `'terminal'`. |
| `drone.scan()` | *None* | `Promise<Object>` | Inspects all 4 compass directions: `{ forward, right, rear, left }`. |
| `drone.radar()` | *None* | `Promise<Array>` | Sweeps the entire room and returns all contacts: `[{ type, x, y, distance }]`. |

### 7.3 Interlocks & Cyber Warfare
| Method | Arguments | Returns | Description |
| :--- | :--- | :---: | :--- |
| `drone.hack(passcode)` | `passcode` *(Optional)* | `Promise<Boolean>` | Disables active laser firewalls directly ahead or unlocks secure data terminals. |
| `drone.getTelemetry()` | *None* | `Object` | Returns instant snapshot: `{ x, y, heading, battery, shields, coresCollected }`. |

---

## 8. GRAPHICS PROGRAMMING: 2D MATRICES & CANVAS VECTORS

How computers translate numbers and algorithms into glowing pixels and shapes on screen.

### 8.1 The 16x16 Pixel Coordinate Matrix
A digital sprite is a 2D matrix (an array of arrays):
```javascript
// Row 0 is TOP, Row 15 is BOTTOM
// Column 0 is REAR, Column 15 is FRONT
grid[row][col] = colorHex;
```

#### Drawing Geometry with Loops:
```javascript
// 1. Horizontal Line (Tracks):
for (let c = 2; c <= 13; c++) {
  grid[1][c] = colors.DARK;
}

// 2. Symmetrical Angled Wings:
for (let c = 3; c <= 12; c++) {
  let offset = Math.floor((c - 3) * 0.5);
  grid[7 - offset][c] = colors.CYAN; // Top wing
  grid[8 + offset][c] = colors.CYAN; // Bottom wing
}
```

### 8.2 HTML5 Canvas Vector Architecture
The game engine renders the arena and drone at 60 FPS using the Canvas 2D Context:
* `ctx.save()` / `ctx.restore()`: Isolate coordinate transformations.
* `ctx.translate(x, y)`: Reposition the origin point to the drone center.
* `ctx.rotate(angle)`: Orient the entire coordinate plane along the heading vector.
* `ctx.shadowBlur` / `ctx.shadowColor`: GPU-accelerated neon bloom lighting.

---

## 9. MISSION CURRICULUM & SOLUTIONS ROADMAP

| Sector | Title | Core Concept | Objective |
| :---: | :--- | :--- | :--- |
| **0** | **The Grand Showcase** | System Awakening | Watch the master script execute with live code line tracing. |
| **1** | **Vector Ignition** | Variables & Methods | Master `drone.move(n)` and directional turns to harvest 2 cores. |
| **2** | **Laser Interlocks** | `if / else` Logic | Scan ahead with `drone.scanAhead()` to avoid deadly laser firewalls. |
| **3** | **Harvesting Loops** | `for` & `while` Iteration | Automate full-grid energy harvesting without repeating code. |
| **4** | **Subroutine Protocols** | Custom Functions | Encapsulate maneuvers into reusable functions (`harvestAlcove()`). |
| **5** | **Radar Array Lock** | Arrays & `.filter()` | Parse live radar telemetry to locate and harvest scattered power cores. |

---

*“Logic is the foundation. Code is the ignition. The arena is yours.”* ⚡🤖
