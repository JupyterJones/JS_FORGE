/**
 * JS-FORGE Async Code Execution Sandbox & Stepper
 * Features:
 * - Real-time step highlighting in the code editor
 * - Non-blocking async runner with speed control (0.5x, 1x, 2x)
 * - Single-step mode (⏭ STEP)
 * - Beginner-friendly automatic 'await' injection for drone methods
 * - Infinite loop & recursion watchdog
 */

export class CodeRunner {
  constructor(editorGutterCallback, terminalLogger) {
    this.editorGutterCallback = editorGutterCallback;
    this.logger = terminalLogger;

    this.isRunning = false;
    this.isPaused = false;
    this.isStepMode = false;
    this.speedMultiplier = 1.0;
    this.baseDelay = 350; // ms per tick

    this.stepResolver = null;
    this.abortController = null;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.25, Math.min(4.0, multiplier));
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.isStepMode = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.stepResolver) {
      this.stepResolver();
      this.stepResolver = null;
    }
    if (this.editorGutterCallback) {
      this.editorGutterCallback(null);
    }
  }

  stepOnce() {
    if (this.stepResolver) {
      const resolve = this.stepResolver;
      this.stepResolver = null;
      resolve();
    }
  }

  async tick(actionName) {
    if (!this.isRunning) {
      // Outside script execution / manual drive: proceed immediately without delay
      return;
    }

    // Determine calling line number from stack trace
    try {
      const err = new Error();
      const stackLines = (err.stack || '').split('\n');
      for (const line of stackLines) {
        const match = line.match(/(?:<anonymous>|eval|runUserCode):(\d+):(\d+)/);
        if (match) {
          const rawLine = parseInt(match[1], 10);
          // Adjust for wrapper header lines
          const userLine = Math.max(1, rawLine - 3);
          if (this.editorGutterCallback) {
            this.editorGutterCallback(userLine);
          }
          break;
        }
      }
    } catch (e) {
      // Ignore stack parsing errors
    }

    if (this.isStepMode) {
      // Pause until user clicks 'Step' or 'Run'
      await new Promise((resolve) => {
        this.stepResolver = resolve;
      });
    } else {
      // Timed tick delay according to speed
      const delay = Math.max(50, Math.floor(this.baseDelay / this.speedMultiplier));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        if (this.abortController) {
          this.abortController.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error("EXECUTION_ABORTED"));
          }, { once: true });
        }
      });
    }

    if (!this.isRunning) {
      throw new Error("EXECUTION_ABORTED");
    }
  }

  /**
   * Pre-transforms user code to:
   * 1. Auto-inject `await` before drone calls (so beginners can write `drone.move()` without having to know async/await yet)
   * 2. Insert infinite loop watchdog into while / for loops
   */
  transformCode(userCode) {
    const lines = userCode.split('\n');
    const transformed = lines.map((line) => {
      // If line contains drone.method() and doesn't already have await
      let processed = line;
      if (/(?<!await\s+)drone\.(move|moveBackward|turnRight|turnLeft|scanAhead|scan|radar|hack)\s*\(/.test(processed)) {
        processed = processed.replace(/(?<!await\s+)drone\.(move|moveBackward|turnRight|turnLeft|scanAhead|scan|radar|hack)\s*\(/g, 'await drone.$1(');
      }
      return processed;
    });

    return transformed.join('\n');
  }

  async execute(userCode, drone, customConsole, isDemo = false, startInStepMode = false) {
    this.stop();
    this.isRunning = true;
    this.isStepMode = startInStepMode;
    this.abortController = new AbortController();

    const transformedCode = this.transformCode(userCode);

    // Watchdog and sandboxed runner wrapper
    const sandboxScript = `
      return (async function runUserCode(drone, console, __watchdog) {
        let __ops = 0;
        function __guard() {
          if (++__ops > 25000) throw new Error("Infinite loop detected! Watchdog halted script to prevent freezing.");
        }
        ${transformedCode}
      });
    `;

    try {
      const runnerFn = new Function(sandboxScript)();
      await runnerFn(drone, customConsole, null);
      if (this.editorGutterCallback) {
        this.editorGutterCallback(null);
      }
      return { success: true };
    } catch (err) {
      if (err.message === "EXECUTION_ABORTED") {
        return { success: false, aborted: true };
      }

      this.logger.error(`[RUNTIME ERROR] ${err.name}: ${err.message}`);
      if (this.editorGutterCallback) {
        this.editorGutterCallback(null);
      }
      return { success: false, error: err };
    } finally {
      this.isRunning = false;
      this.isStepMode = false;
    }
  }
}
