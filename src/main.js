/**
 * JS-FORGE Master Coordinator
 * Tying together the Canvas Arena, Drone API, Sandboxed Runner, Audio, and Curriculum.
 */

import { sound } from './audio/synth.js';
import { ArenaRenderer } from './arena/canvas.js';
import { CyberDrone } from './engine/drone.js';
import { CodeRunner } from './engine/runner.js';
import { MISSIONS } from './missions/curriculum.js';
import { BotFabricator, COLOR_PALETTE, GRID_SIZE, PRESETS } from './arena/customBot.js';
import { BotCompiler, CODE_BOT_LESSONS } from './engine/botCompiler.js';
import { MANUAL_CHAPTERS } from './manual/manualData.js';
import { CampaignManager, CAMPAIGN_STAGES } from './engine/campaign.js';

class JsForgeApp {
  constructor() {
    this.currentSectorIndex = 0;
    this.savedSectorCodes = {};

    // Campaign State
    this.campaign = new CampaignManager();

    // DOM Elements
    this.canvas = document.getElementById('arenaCanvas');
    this.sectorSelect = document.getElementById('sectorSelect');
    this.codeEditor = document.getElementById('codeEditor');
    this.gutterLines = document.getElementById('gutterLines');
    this.lineHighlightBar = document.getElementById('lineHighlightBar');
    this.consoleLogs = document.getElementById('consoleLogs');
    this.btnStartGame = document.getElementById('btnStartGame');
    this.btnRestartGame = document.getElementById('btnRestartGame');
    this.btnDemoMode = document.getElementById('btnDemoMode');
    this.hardwareRibbon = document.getElementById('hardwareRibbon');

    // Telemetry Elements
    this.telemetryPos = document.getElementById('telemetryPos');
    this.telemetryHeading = document.getElementById('telemetryHeading');
    this.telemetryCores = document.getElementById('telemetryCores');
    this.telemetryBattery = document.getElementById('telemetryBattery');
    this.telemetryShields = document.getElementById('telemetryShields');

    // Mission Details Elements
    this.missionTitle = document.getElementById('missionTitle');
    this.missionSubtitle = document.getElementById('missionSubtitle');
    this.missionDesc = document.getElementById('missionDesc');

    // Modal Elements
    this.victoryModal = document.getElementById('victoryModal');
    this.victoryMessage = document.getElementById('victoryMessage');
    this.drawBotModal = document.getElementById('drawBotModal');
    this.codeBotModal = document.getElementById('codeBotModal');
    this.manualModal = document.getElementById('manualModal');
    this.restartConfirmModal = document.getElementById('restartConfirmModal');

    // Initialize Subsystems
    this.logger = {
      log: (...args) => this.addLog('log', args.join(' ')),
      info: (...args) => this.addLog('info', args.join(' ')),
      warn: (...args) => this.addLog('warn', args.join(' ')),
      error: (...args) => this.addLog('error', args.join(' '))
    };

    this.arena = new ArenaRenderer(this.canvas);
    this.fabricator = new BotFabricator();
    this.botCompiler = new BotCompiler();

    // Check if custom bot is stored and apply
    if (localStorage.getItem('jsforge_custom_bot_disabled') !== 'true') {
      this.arena.setCustomBot(this.fabricator.grid);
    }

    this.runner = new CodeRunner(
      (lineNum) => this.highlightEditorLine(lineNum),
      this.logger
    );
    this.drone = new CyberDrone(this.arena, this.logger, this.runner);

    // Setup Campaign Hardware Permissions Check
    this.drone.setPermissionCheck((action) => {
      if (!this.campaign.isActive) return true; // Full sandbox in Demo mode!

      const stage = this.campaign.getCurrentStage();
      if (!this.campaign.hasBuiltChassis) {
        sound.playError();
        this.logger.error("[HARDWARE ERROR] No robot detected on assembly cradle! Use DRAW BOT or CODE A BOT to construct your chassis first.");
        return false;
      }

      if (action === 'move') {
        if (stage.id < 2) {
          sound.playError();
          this.logger.error("[HARDWARE ERROR] Forward propulsion firmware is unprogrammed in Stage 1!");
          return false;
        }
        return true;
      }

      if (action === 'turn') {
        if (stage.id < 3) {
          sound.playError();
          this.logger.error("[HARDWARE LOCK] Gyro steering servos uncalibrated! You only have straight propulsion until Stage 3.");
          return false;
        }
        return true;
      }

      if (action === 'scan' || action === 'hack') {
        if (stage.id < 4) {
          sound.playError();
          this.logger.error("[HARDWARE LOCK] Optical sensors & hack interlocks are offline until Stage 4!");
          return false;
        }
        return true;
      }

      return true;
    });

    this.loadSavedState();
    this.setupUI();
    this.setupEditor();
    this.setupManualControls();
    this.setupFabricatorUI();
    this.setupCodeBotUI();
    this.setupManualModal();

    if (this.campaign.isActive) {
      this.setModeButtons(true);
      this.hardwareRibbon.style.display = 'flex';
      this.loadCampaignStage(this.campaign.currentStageIndex);
    } else {
      this.setModeButtons(false);
      this.hardwareRibbon.style.display = 'none';
      this.loadSector(this.currentSectorIndex);
    }

    // Continuous Telemetry Refresh
    setInterval(() => this.updateTelemetry(), 100);
  }

  setModeButtons(isCampaign) {
    if (isCampaign) {
      this.btnStartGame?.classList.add('active-mode');
      this.btnDemoMode?.classList.remove('active-mode');
    } else {
      this.btnStartGame?.classList.remove('active-mode');
      this.btnDemoMode?.classList.add('active-mode');
    }
  }

  executeFactoryReset() {
    sound.playVictory();
    this.restartConfirmModal?.classList.remove('active');

    // 1. Wipe all localStorage items for jsforge (like LogicForge)
    localStorage.removeItem('jsforge_campaign_active');
    localStorage.removeItem('jsforge_campaign_stage');
    localStorage.removeItem('jsforge_custom_bot_installed');
    localStorage.removeItem('jsforge_custom_bot');
    localStorage.removeItem('jsforge_custom_bot_disabled');
    localStorage.removeItem('jsforge_saved_codes');
    localStorage.removeItem('jsforge_sector');

    // 2. Reset runtime objects
    this.savedSectorCodes = {};
    this.currentSectorIndex = 0;
    this.fabricator.clear();
    this.arena.setCustomBot(null);

    // 3. Start fresh campaign at Stage 1
    this.campaign.startNewGame();
    this.setModeButtons(true);
    this.hardwareRibbon.style.display = 'flex';
    this.arena.setCradleMode(true);
    this.loadCampaignStage(0);

    this.consoleLogs.innerHTML = '';
    this.logger.info("=================================================");
    this.logger.warn("[FACTORY RESET COMPLETE] All stored data deleted!");
    this.logger.info("[CAMPAIGN RESTARTED] Stage 1: Fabrication Protocol");
    this.logger.info("[SYSTEM] No robot on cradle. Open DRAW BOT or CODE A BOT to begin!");
    this.logger.info("=================================================");
  }

  loadSavedState() {
    try {
      const savedIndex = localStorage.getItem('jsforge_sector');
      if (savedIndex !== null) {
        this.currentSectorIndex = parseInt(savedIndex, 10) || 0;
      }
      const savedCodes = localStorage.getItem('jsforge_saved_codes');
      if (savedCodes) {
        this.savedSectorCodes = JSON.parse(savedCodes);
      }
    } catch (e) {
      console.warn("Storage access restricted", e);
    }
  }

  saveState() {
    try {
      localStorage.setItem('jsforge_sector', this.currentSectorIndex);
      localStorage.setItem('jsforge_saved_codes', JSON.stringify(this.savedSectorCodes));
    } catch (e) {
      // Ignore storage errors
    }
  }

  setupUI() {
    // START / RESUME Campaign Button
    this.btnStartGame?.addEventListener('click', () => {
      sound.playUiClick();
      if (!this.campaign.isActive) {
        this.campaign.isActive = true;
        this.campaign.saveState();
        this.setModeButtons(true);
        this.hardwareRibbon.style.display = 'flex';
        this.loadCampaignStage(this.campaign.currentStageIndex);
        this.logger.info(`[CAMPAIGN RESUME] Playing Campaign Mode at Stage: ${this.campaign.getCurrentStage().title}`);
      } else {
        this.logger.info(`[CAMPAIGN ACTIVE] Current Stage: ${this.campaign.getCurrentStage().title}`);
      }
    });

    // DEMO Sandbox Mode Button
    this.btnDemoMode?.addEventListener('click', () => {
      sound.playUiClick();
      this.campaign.exitToDemo();
      this.setModeButtons(false);
      this.hardwareRibbon.style.display = 'none';
      this.arena.setCradleMode(false);
      this.loadSector(this.currentSectorIndex);
      this.logger.info("[MODE] Switched to Sandbox Demo Curriculum.");
    });

    // RESTART Button -> Opens LogicForge-style Factory Reset Confirmation
    this.btnRestartGame?.addEventListener('click', () => {
      sound.playError();
      this.restartConfirmModal?.classList.add('active');
    });

    document.getElementById('btnCloseRestartModal')?.addEventListener('click', () => {
      sound.playUiClick();
      this.restartConfirmModal?.classList.remove('active');
    });

    document.getElementById('btnCancelRestart')?.addEventListener('click', () => {
      sound.playUiClick();
      this.restartConfirmModal?.classList.remove('active');
    });

    document.getElementById('btnConfirmRestart')?.addEventListener('click', () => {
      this.executeFactoryReset();
    });

    // Populate Sector Selector Dropdown
    this.sectorSelect.innerHTML = '';
    MISSIONS.forEach((m, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = m.title;
      this.sectorSelect.appendChild(opt);
    });

    this.sectorSelect.value = this.currentSectorIndex;
    this.sectorSelect.addEventListener('change', (e) => {
      sound.playUiClick();
      const val = parseInt(e.target.value, 10);
      if (this.campaign.isActive) {
        this.loadCampaignStage(val);
      } else {
        this.loadSector(val);
      }
    });

    // Speed Controls
    ['05', '10', '20'].forEach(spdKey => {
      const btn = document.getElementById(`speed${spdKey}`);
      btn.addEventListener('click', () => {
        sound.playUiClick();
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.runner.setSpeed(parseFloat(btn.dataset.speed));
      });
    });

    // Sound Toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    soundBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      soundIcon.textContent = isMuted ? '🔇' : '🔊';
      soundBtn.classList.toggle('muted', isMuted);
    });

    // Reset Bot Button
    document.getElementById('resetBotBtn').addEventListener('click', () => {
      sound.playUiClick();
      this.resetCurrentLevel();
      this.logger.info("[SYSTEM] Drone telemetry reset to spawn point.");
    });

    // Run Code Button
    document.getElementById('btnRunCode').addEventListener('click', () => {
      sound.init();
      sound.playUiClick();
      this.runUserScript(false);
    });

    // Watch Demo Button
    document.getElementById('btnWatchDemo').addEventListener('click', () => {
      sound.init();
      sound.playUiClick();
      this.runDemoScript();
    });

    // Step Code Button
    document.getElementById('btnStepCode').addEventListener('click', () => {
      sound.init();
      sound.playUiClick();
      if (this.runner.isRunning) {
        this.runner.stepOnce();
      } else {
        this.runUserScript(true);
      }
    });

    // Stop Code Button
    document.getElementById('btnStopCode').addEventListener('click', () => {
      sound.playUiClick();
      this.runner.stop();
      this.logger.warn("[STOP] Script execution aborted by user.");
    });

    // Restore Starter Code Button
    document.getElementById('btnRestoreCode').addEventListener('click', () => {
      sound.playUiClick();
      if (this.campaign.isActive) {
        const stage = this.campaign.getCurrentStage();
        this.codeEditor.value = stage.starterCode;
        this.updateGutter();
        this.logger.info("[EDITOR] Stage starter code restored.");
      } else {
        const mission = MISSIONS[this.currentSectorIndex];
        this.codeEditor.value = mission.starterCode;
        this.savedSectorCodes[this.currentSectorIndex] = mission.starterCode;
        this.saveState();
        this.updateGutter();
        this.logger.info("[EDITOR] Starter template restored.");
      }
    });

    // Toggle Code Window Size (% of workspace)
    const splitWorkspace = document.querySelector('main.workspace-split');
    const btnToggleCodeSize = document.getElementById('btnToggleCodeSize');
    const codeSizeLabel = document.getElementById('codeSizeLabel');
    const codeSizes = [
      { cls: 'split-65', pct: '65%' },
      { cls: 'split-75', pct: '75%' },
      { cls: 'split-50', pct: '50%' }
    ];
    let currentCodeSizeIndex = 0;

    btnToggleCodeSize?.addEventListener('click', () => {
      sound.playUiClick();
      currentCodeSizeIndex = (currentCodeSizeIndex + 1) % codeSizes.length;
      const current = codeSizes[currentCodeSizeIndex];
      splitWorkspace.classList.remove('split-65', 'split-75', 'split-50');
      splitWorkspace.classList.add(current.cls);
      if (codeSizeLabel) {
        codeSizeLabel.textContent = `CODE: ${current.pct}`;
      }
      setTimeout(() => this.arena.resize(), 50);
      setTimeout(() => this.arena.resize(), 270);
      this.logger.info(`[WORKSPACE] Code window width scaled to ${current.pct}.`);
    });

    // Clear Console Button
    document.getElementById('btnClearConsole').addEventListener('click', () => {
      sound.playUiClick();
      this.consoleLogs.innerHTML = '';
    });

    // Modal Buttons
    document.getElementById('btnModalStay').addEventListener('click', () => {
      sound.playUiClick();
      this.victoryModal.classList.remove('active');
      this.resetCurrentLevel();
    });

    document.getElementById('btnModalNext').addEventListener('click', () => {
      sound.playUiClick();
      this.victoryModal.classList.remove('active');
      if (this.campaign.isActive) {
        if (this.campaign.currentStageIndex < CAMPAIGN_STAGES.length - 1) {
          this.campaign.advanceStage();
          this.loadCampaignStage(this.campaign.currentStageIndex);
        } else {
          this.logger.info("[CONGRATULATIONS] All Campaign Stages Mastered! You built your robot from scratch!");
        }
      } else {
        if (this.currentSectorIndex < MISSIONS.length - 1) {
          this.loadSector(this.currentSectorIndex + 1);
        }
      }
    });
  }

  setupEditor() {
    this.codeEditor.addEventListener('input', () => {
      this.updateGutter();
      this.savedSectorCodes[this.currentSectorIndex] = this.codeEditor.value;
      this.saveState();
    });

    // Handle Tab key inside editor (indent 2 spaces)
    this.codeEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.codeEditor.selectionStart;
        const end = this.codeEditor.selectionEnd;
        const val = this.codeEditor.value;
        this.codeEditor.value = val.substring(0, start) + '  ' + val.substring(end);
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + 2;
        this.updateGutter();
      }
    });

    // Sync scroll between textarea and line highlight
    this.codeEditor.addEventListener('scroll', () => {
      this.gutterLines.scrollTop = this.codeEditor.scrollTop;
    });
  }

  updateGutter() {
    const lines = this.codeEditor.value.split('\n');
    const count = lines.length;
    let html = '';
    for (let i = 1; i <= count; i++) {
      html += `<div class="gutter-line" data-line="${i}">${i}</div>`;
    }
    this.gutterLines.innerHTML = html;
  }

  highlightEditorLine(lineNum) {
    document.querySelectorAll('.gutter-line').forEach(el => el.classList.remove('active-line'));
    if (!lineNum) {
      this.lineHighlightBar.style.display = 'none';
      return;
    }

    const gutterItem = document.querySelector(`.gutter-line[data-line="${lineNum}"]`);
    if (gutterItem) {
      gutterItem.classList.add('active-line');
    }

    // Line height is 20px, padding-top is 12px
    const topPos = 12 + (lineNum - 1) * 20 - this.codeEditor.scrollTop;
    this.lineHighlightBar.style.top = `${topPos}px`;
    this.lineHighlightBar.style.display = 'block';
  }

  setupManualControls() {
    const flashBtn = (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('dpad-active');
        setTimeout(() => el.classList.remove('dpad-active'), 150);
      }
    };

    const forward = async () => {
      sound.init();
      flashBtn('btnDpadForward');
      await this.drone.move(1);
      this.updateTelemetry();
      this.checkManualWin();
    };

    const reverse = async () => {
      sound.init();
      flashBtn('btnDpadReverse');
      await this.drone.moveBackward(1);
      this.updateTelemetry();
      this.checkManualWin();
    };

    const left = async () => {
      sound.init();
      flashBtn('btnDpadLeft');
      await this.drone.turnLeft();
      this.updateTelemetry();
    };

    const right = async () => {
      sound.init();
      flashBtn('btnDpadRight');
      await this.drone.turnRight();
      this.updateTelemetry();
    };

    const scan = async () => {
      sound.init();
      flashBtn('btnDpadScan');
      const res = await this.drone.scanAhead();
      this.logger.info(`[MANUAL SCAN] Forward tile is: ${res}`);
    };

    const hack = async () => {
      sound.init();
      flashBtn('btnDpadHack');
      const res = await this.drone.hack();
      if (!res) {
        this.logger.warn(`[MANUAL HACK] No hackable barrier directly ahead.`);
      }
      this.updateTelemetry();
      this.checkManualWin();
    };

    // D-Pad Click Bindings
    document.getElementById('btnDpadForward')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.codeEditor.blur();
      forward();
    });
    document.getElementById('btnDpadReverse')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.codeEditor.blur();
      reverse();
    });
    document.getElementById('btnDpadLeft')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.codeEditor.blur();
      left();
    });
    document.getElementById('btnDpadRight')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.codeEditor.blur();
      right();
    });
    document.getElementById('btnDpadScan')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.codeEditor.blur();
      scan();
    });
    document.getElementById('btnDpadHack')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.codeEditor.blur();
      hack();
    });

    // Clicking anywhere on arena panel clears focus from editor so keyboard controls work immediately
    document.querySelector('.arena-panel')?.addEventListener('click', () => {
      this.codeEditor.blur();
    });

    // Keyboard bindings (W, A, S, D, Arrow keys, Space/E for Scan, H/F for Hack)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.codeEditor.blur();
        return;
      }

      // If user is actively typing code in the editor, let them type
      if (document.activeElement === this.codeEditor) return;
      if (this.runner.isRunning) return;

      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') {
        e.preventDefault();
        forward();
      } else if (k === 's' || e.key === 'ArrowDown') {
        e.preventDefault();
        reverse();
      } else if (k === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        left();
      } else if (k === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        right();
      } else if (e.key === ' ' || k === 'e') {
        e.preventDefault();
        scan();
      } else if (k === 'h' || k === 'f') {
        e.preventDefault();
        hack();
      }
    });
  }

  checkManualWin() {
    const telemetry = this.drone.getTelemetry();
    if (this.campaign.isActive) {
      const stage = this.campaign.getCurrentStage();
      if (stage.id > 1 && stage.checkWin(telemetry, this.campaign.hasBuiltChassis)) {
        sound.playVictory();
        this.victoryMessage.textContent = stage.winMessage;
        this.victoryModal.classList.add('active');
        this.logger.info(`[STAGE COMPLETE] ${stage.winMessage}`);
      }
      return;
    }

    const mission = MISSIONS[this.currentSectorIndex];
    if (!mission) return;
    if (mission.checkWin(telemetry)) {
      sound.playVictory();
      this.victoryMessage.textContent = mission.winMessage;
      this.victoryModal.classList.add('active');
      this.logger.info(`[SECTOR SECURED] ${mission.winMessage}`);
    }
  }

  loadSector(index) {
    this.runner.stop();
    this.currentSectorIndex = index;

    // Refresh dropdown if switching back from campaign
    if (this.sectorSelect.options.length !== MISSIONS.length || !this.sectorSelect.options[0].textContent.includes('Sector')) {
      this.sectorSelect.innerHTML = '';
      MISSIONS.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = m.title;
        this.sectorSelect.appendChild(opt);
      });
    }
    this.sectorSelect.value = index;
    this.saveState();

    const mission = MISSIONS[index];

    // Update Mission Briefing
    this.missionTitle.textContent = mission.title;
    this.missionSubtitle.textContent = mission.subtitle;
    this.missionDesc.innerHTML = mission.conceptExplanation;

    // Load Code (either student's saved code or starter template)
    const code = this.savedSectorCodes[index] || mission.starterCode;
    this.codeEditor.value = code;
    this.updateGutter();

    // Reset Arena & Drone
    this.resetCurrentLevel();

    this.logger.info(`=== INITIALIZED ${mission.title.toUpperCase()} ===`);
  }

  loadCampaignStage(index) {
    this.runner.stop();
    this.campaign.currentStageIndex = index;
    this.campaign.saveState();

    // Populate stage selector
    this.sectorSelect.innerHTML = '';
    CAMPAIGN_STAGES.forEach((stage, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = stage.title;
      this.sectorSelect.appendChild(opt);
    });
    this.sectorSelect.value = index;

    const stage = this.campaign.getCurrentStage();

    // Update Briefing HUD
    this.missionTitle.textContent = stage.title;
    this.missionSubtitle.textContent = stage.subtitle;
    this.missionDesc.innerHTML = stage.story;

    // Load Stage Code
    this.codeEditor.value = stage.starterCode;
    this.updateGutter();

    // Update Hardware Status Ribbon
    this.updateHardwareRibbon();

    // Reset Arena & Drone
    this.resetCurrentLevel();

    this.logger.info(`=== CAMPAIGN INITIALIZED: ${stage.title} ===`);
  }

  updateHardwareRibbon() {
    if (!this.campaign.isActive) {
      this.hardwareRibbon.style.display = 'none';
      return;
    }
    this.hardwareRibbon.style.display = 'flex';
    const stage = this.campaign.getCurrentStage();

    const setBadge = (id, isOnline, label) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isOnline) {
        el.className = 'hw-badge online';
        el.innerHTML = `<span class="hw-icon">✅</span> ${label}`;
      } else {
        el.className = 'hw-badge';
        el.innerHTML = `<span class="hw-icon">❌</span> ${label}`;
      }
    };

    setBadge('hwChassis', this.campaign.hasBuiltChassis, 'CHASSIS');
    setBadge('hwEngine', stage.id >= 3, 'PROPULSION');
    setBadge('hwSteering', stage.id >= 4, 'GYRO STEERING');
    setBadge('hwScanner', stage.id >= 5, 'OPTICAL SENSOR');
    setBadge('hwAutomation', false, 'AUTOMATION LOOP');
  }

  resetCurrentLevel() {
    this.runner.stop();
    if (this.campaign.isActive) {
      const stage = this.campaign.getCurrentStage();
      const levelClone = JSON.parse(JSON.stringify(stage.arenaSetup));
      this.arena.loadLevel(levelClone);
      this.drone.reset(levelClone);
      this.arena.setCradleMode(stage.id === 1 && !this.campaign.hasBuiltChassis);
      this.updateTelemetry();
    } else {
      const mission = MISSIONS[this.currentSectorIndex];
      // Deep clone level data so crystal deletions reset
      const levelClone = JSON.parse(JSON.stringify(mission.levelData));
      this.arena.loadLevel(levelClone);
      this.drone.reset(levelClone);
      this.arena.setCradleMode(false);
      this.updateTelemetry();
    }
  }

  updateTelemetry() {
    const t = this.drone.getTelemetry();
    this.telemetryPos.textContent = `${t.x}, ${t.y}`;
    this.telemetryHeading.textContent = `${t.heading} (${t.directionIndex * 90}°)`;
    this.telemetryCores.textContent = `${t.coresCollected} / ${t.totalCrystals}`;
    this.telemetryBattery.textContent = `${t.battery}%`;
    this.telemetryShields.textContent = `${t.shields}%`;

    if (t.shields <= 30) {
      this.telemetryShields.style.color = '#ff0055';
    } else {
      this.telemetryShields.style.color = '#00f0ff';
    }
  }

  addLog(type, message) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString().split(' ')[0];
    entry.textContent = `[${timestamp}] ${message}`;
    this.consoleLogs.appendChild(entry);
    this.consoleLogs.scrollTop = this.consoleLogs.scrollHeight;
  }

  async runDemoScript() {
    this.resetCurrentLevel();
    let demoCode = '';
    if (this.campaign.isActive) {
      const stage = this.campaign.getCurrentStage();
      demoCode = stage.demoCode || stage.starterCode;
    } else {
      const mission = MISSIONS[this.currentSectorIndex];
      demoCode = mission.demoCode;
    }
    this.codeEditor.value = demoCode;
    this.updateGutter();
    this.logger.info(`[DEMO RUN] Executing optimal solution with step tracing...`);

    const res = await this.runner.execute(
      demoCode,
      this.drone,
      this.logger,
      true,  // isDemo
      false  // stepMode
    );

    this.checkMissionStatus(res);
  }

  async runUserScript(startInStepMode = false) {
    this.resetCurrentLevel();
    const script = this.codeEditor.value;
    this.logger.info(`[RUN] Executing student script${startInStepMode ? ' (STEP MODE)' : ''}...`);

    const res = await this.runner.execute(
      script,
      this.drone,
      this.logger,
      false,
      startInStepMode
    );

    this.checkMissionStatus(res);
  }

  checkMissionStatus(executionResult) {
    if (!executionResult || executionResult.aborted) {
      return;
    }

    const telemetry = this.drone.getTelemetry();

    if (this.campaign.isActive) {
      const stage = this.campaign.getCurrentStage();
      if (stage.checkWin(telemetry, this.campaign.hasBuiltChassis)) {
        sound.playVictory();
        this.victoryMessage.textContent = stage.winMessage;
        this.victoryModal.classList.add('active');
        this.logger.info(`[STAGE COMPLETE] ${stage.winMessage}`);
        if (stage.id === 5) {
          const autoBadge = document.getElementById('hwAutomation');
          if (autoBadge) {
            autoBadge.className = 'hw-badge online';
            autoBadge.innerHTML = `<span class="hw-icon">✅</span> AUTOMATION LOOP`;
          }
        }
      } else if (telemetry.isDestroyed) {
        sound.playError();
        this.logger.error(`[MISSION FAILED] Drone was destroyed. Review hazard conditions and retry.`);
      } else {
        this.logger.warn(`[OBJECTIVE INCOMPLETE] The campaign stage criteria were not satisfied. Try again!`);
      }
      return;
    }

    const mission = MISSIONS[this.currentSectorIndex];
    if (mission.checkWin(telemetry)) {
      sound.playVictory();
      this.victoryMessage.textContent = mission.winMessage;
      this.victoryModal.classList.add('active');
      this.logger.info(`[SECTOR SECURED] ${mission.winMessage}`);
    } else if (telemetry.isDestroyed) {
      sound.playError();
      this.logger.error(`[MISSION FAILED] Drone was destroyed. Review hazard conditions and retry.`);
    } else {
      this.logger.warn(`[OBJECTIVE INCOMPLETE] The extraction criteria were not satisfied. Try again!`);
    }
  }

  setupFabricatorUI() {
    const btnOpen = document.getElementById('btnOpenDrawBot');
    const btnClose = document.getElementById('btnCloseDrawBot');
    const pixelGridEl = document.getElementById('pixelMatrixGrid');
    const paletteEl = document.getElementById('paletteSwatches');
    const chkSymmetry = document.getElementById('chkSymmetry');
    const btnClear = document.getElementById('btnGridClear');
    const btnSave = document.getElementById('btnSaveDrawBot');
    const btnResetDefault = document.getElementById('btnResetBotDefault');
    const previewCanvas = document.getElementById('botPreviewCanvas');
    const previewCtx = previewCanvas.getContext('2d');

    let currentColor = '#00f0ff';
    let isDrawing = false;
    let previewAngle = 0;
    let previewAnimId = null;

    // Open/Close Modal
    const openModal = () => {
      sound.init();
      sound.playUiClick();
      this.drawBotModal.classList.add('active');
      renderGrid();
      startPreview();
    };

    const closeModal = () => {
      sound.playUiClick();
      this.drawBotModal.classList.remove('active');
      if (previewAnimId) {
        cancelAnimationFrame(previewAnimId);
        previewAnimId = null;
      }
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);

    // 1. Render Palette Swatches
    paletteEl.innerHTML = '';
    COLOR_PALETTE.forEach(p => {
      const swatch = document.createElement('div');
      swatch.className = `palette-swatch ${p.hex === currentColor ? 'active-swatch' : ''}`;
      if (p.hex === null) {
        swatch.classList.add('eraser-swatch');
        swatch.textContent = '✕';
        swatch.title = 'Eraser (Clear Pixel)';
      } else {
        swatch.style.backgroundColor = p.hex;
        swatch.title = `${p.name} (${p.hex})`;
      }

      swatch.addEventListener('click', () => {
        sound.playUiClick();
        document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active-swatch'));
        swatch.classList.add('active-swatch');
        currentColor = p.hex;
      });

      paletteEl.appendChild(swatch);
    });

    // 2. Render 16x16 Grid
    const renderGrid = () => {
      pixelGridEl.innerHTML = '';
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = document.createElement('div');
          cell.className = 'pixel-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;

          const color = this.fabricator.getPixel(r, c);
          if (color) {
            cell.style.backgroundColor = color;
          }

          const paint = () => {
            const sym = chkSymmetry.checked;
            this.fabricator.setPixel(r, c, currentColor, sym);
            cell.style.backgroundColor = currentColor || '';

            if (sym) {
              const symR = GRID_SIZE - 1 - r;
              const symCell = pixelGridEl.querySelector(`[data-r="${symR}"][data-c="${c}"]`);
              if (symCell) symCell.style.backgroundColor = currentColor || '';
            }
          };

          cell.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDrawing = true;
            paint();
          });

          cell.addEventListener('mouseenter', () => {
            if (isDrawing) paint();
          });

          pixelGridEl.appendChild(cell);
        }
      }
    };

    window.addEventListener('mouseup', () => {
      isDrawing = false;
    });

    // 3. Clear Matrix
    btnClear?.addEventListener('click', () => {
      sound.playUiClick();
      this.fabricator.clear();
      renderGrid();
    });

    // 4. Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playUiClick();
        this.fabricator.loadPreset(btn.dataset.preset);
        renderGrid();
      });
    });

    // 5. Live Hologram Preview Animation
    const startPreview = () => {
      if (previewAnimId) cancelAnimationFrame(previewAnimId);

      const loop = () => {
        previewAngle += 0.02;

        const w = previewCanvas.width;
        const h = previewCanvas.height;
        previewCtx.clearRect(0, 0, w, h);

        // Circular hologram background
        const grad = previewCtx.createRadialGradient(w/2, h/2, 10, w/2, h/2, 75);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        previewCtx.fillStyle = grad;
        previewCtx.beginPath();
        previewCtx.arc(w/2, h/2, 75, 0, Math.PI * 2);
        previewCtx.fill();

        // Hologram grid rings
        previewCtx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        previewCtx.lineWidth = 1;
        previewCtx.beginPath();
        previewCtx.arc(w/2, h/2, 50, 0, Math.PI * 2);
        previewCtx.arc(w/2, h/2, 70, 0, Math.PI * 2);
        previewCtx.stroke();

        // Render Bot in Center with current previewAngle
        previewCtx.save();
        previewCtx.translate(w/2, h/2);
        previewCtx.rotate(previewAngle);

        // Headlight beam
        const cone = previewCtx.createRadialGradient(0, 0, 2, 70, 0, 80);
        cone.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
        cone.addColorStop(1, 'rgba(0, 240, 255, 0)');
        previewCtx.fillStyle = cone;
        previewCtx.beginPath();
        previewCtx.moveTo(10, 0);
        previewCtx.arc(0, 0, 70, -0.4, 0.4);
        previewCtx.closePath();
        previewCtx.fill();

        // Render custom bot pixels
        const size = 64;
        const pxSize = size / 16;
        const startX = -size / 2;
        const startY = -size / 2;

        for (let r = 0; r < 16; r++) {
          for (let c = 0; c < 16; c++) {
            const col = this.fabricator.getPixel(r, c);
            if (col) {
              previewCtx.fillStyle = col;
              previewCtx.fillRect(startX + c * pxSize, startY + r * pxSize, pxSize, pxSize);
            }
          }
        }

        // Shield ring
        previewCtx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        previewCtx.lineWidth = 1.5;
        previewCtx.beginPath();
        previewCtx.arc(0, 0, 36, 0, Math.PI * 2);
        previewCtx.stroke();

        previewCtx.restore();

        previewAnimId = requestAnimationFrame(loop);
      };
      previewAnimId = requestAnimationFrame(loop);
    };

    // 6. Install on Drone
    btnSave?.addEventListener('click', () => {
      sound.playVictory();
      this.fabricator.saveToStorage();
      localStorage.removeItem('jsforge_custom_bot_disabled');
      this.arena.setCustomBot(this.fabricator.grid);
      this.logger.info(`[FABRICATOR] Custom drawn Cyber Rover installed on flight chassis!`);
      closeModal();

      if (this.campaign.isActive && !this.campaign.hasBuiltChassis) {
        this.campaign.markChassisBuilt();
        this.arena.setCradleMode(false);
        this.updateHardwareRibbon();
        sound.playVictory();
        this.victoryMessage.textContent = this.campaign.getCurrentStage().winMessage;
        this.victoryModal.classList.add('active');
        this.logger.info(`[FABRICATION SUCCESS] Robot chassis drawn and installed on assembly cradle!`);
      }
    });

    // 7. Reset to Default Vector Chassis
    btnResetDefault?.addEventListener('click', () => {
      sound.playUiClick();
      localStorage.setItem('jsforge_custom_bot_disabled', 'true');
      this.arena.setCustomBot(null);
      this.logger.info(`[FABRICATOR] Default procedural vector chassis restored.`);
      closeModal();
    });
  }

  setupCodeBotUI() {
    const btnOpen = document.getElementById('btnOpenCodeBot');
    const btnClose = document.getElementById('btnCloseCodeBot');
    const tabsContainer = document.getElementById('codeBotTabs');
    const conceptBox = document.getElementById('codeBotConcept');
    const textarea = document.getElementById('codeBotTextarea');
    const consoleBox = document.getElementById('codeBotConsole');
    const btnRun = document.getElementById('btnRunCodeBot');
    const btnResetLesson = document.getElementById('btnResetCodeBotLesson');
    const btnInstall = document.getElementById('btnInstallCodeBot');
    const previewCanvas = document.getElementById('codeBotPreviewCanvas');
    const previewCtx = previewCanvas.getContext('2d');

    let currentLessonIndex = 0;
    let compiledGrid = null;
    let previewAngle = 0;
    let previewAnimId = null;

    const logToStudio = (type, msg) => {
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      const time = new Date().toLocaleTimeString().split(' ')[0];
      entry.textContent = `[${time}] ${msg}`;
      consoleBox.appendChild(entry);
      consoleBox.scrollTop = consoleBox.scrollHeight;
    };

    const studioLogger = {
      log: (...args) => logToStudio('log', args.join(' ')),
      info: (...args) => logToStudio('info', args.join(' ')),
      warn: (...args) => logToStudio('warn', args.join(' ')),
      error: (...args) => logToStudio('error', args.join(' '))
    };

    // Open & Close Modal
    const openModal = () => {
      sound.init();
      sound.playUiClick();
      this.codeBotModal.classList.add('active');
      loadLesson(currentLessonIndex);
      startPreview();
    };

    const closeModal = () => {
      sound.playUiClick();
      this.codeBotModal.classList.remove('active');
      if (previewAnimId) {
        cancelAnimationFrame(previewAnimId);
        previewAnimId = null;
      }
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);

    // Render Lesson Tabs
    tabsContainer.innerHTML = '';
    CODE_BOT_LESSONS.forEach((lesson, idx) => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `codebot-tab-btn ${idx === currentLessonIndex ? 'active-tab' : ''}`;
      tabBtn.textContent = lesson.title;
      tabBtn.addEventListener('click', () => {
        sound.playUiClick();
        document.querySelectorAll('.codebot-tab-btn').forEach(b => b.classList.remove('active-tab'));
        tabBtn.classList.add('active-tab');
        loadLesson(idx);
      });
      tabsContainer.appendChild(tabBtn);
    });

    const loadLesson = (idx) => {
      currentLessonIndex = idx;
      const lesson = CODE_BOT_LESSONS[idx];
      conceptBox.innerHTML = `<strong>${lesson.conceptTitle}</strong><br>${lesson.conceptSummary || lesson.conceptExplanation}`;
      textarea.value = lesson.starterCode;
      compileCode();
    };

    // Compile Code from Textarea
    const compileCode = () => {
      const code = textarea.value;
      const result = this.botCompiler.compile(code, studioLogger);
      if (result.success) {
        compiledGrid = result.grid;
        sound.playStep();
        logToStudio('info', `Compilation successful! Grid matrix populated.`);
      } else {
        sound.playError();
        logToStudio('error', `Build failed: ${result.error?.message}`);
      }
    };

    btnRun?.addEventListener('click', () => {
      sound.init();
      compileCode();
    });

    btnResetLesson?.addEventListener('click', () => {
      sound.playUiClick();
      loadLesson(currentLessonIndex);
      logToStudio('info', 'Lesson starter code restored.');
    });

    // Install on Drone
    btnInstall?.addEventListener('click', () => {
      compileCode();
      if (compiledGrid) {
        sound.playVictory();
        this.fabricator.grid = compiledGrid;
        this.fabricator.saveToStorage();
        localStorage.removeItem('jsforge_custom_bot_disabled');
        this.arena.setCustomBot(compiledGrid);
        this.logger.info(`[CODE BOT] Code-generated robot deployed to arena flight computer!`);
        closeModal();

        if (this.campaign.isActive && !this.campaign.hasBuiltChassis) {
          this.campaign.markChassisBuilt();
          this.arena.setCradleMode(false);
          this.updateHardwareRibbon();
          sound.playVictory();
          this.victoryMessage.textContent = this.campaign.getCurrentStage().winMessage;
          this.victoryModal.classList.add('active');
          this.logger.info(`[FABRICATION SUCCESS] Robot chassis programmed and installed on assembly cradle!`);
        }
      }
    });

    // 60 FPS Hologram Preview Loop
    const startPreview = () => {
      if (previewAnimId) cancelAnimationFrame(previewAnimId);

      const loop = () => {
        previewAngle += 0.02;

        const w = previewCanvas.width;
        const h = previewCanvas.height;
        previewCtx.clearRect(0, 0, w, h);

        // Circular cyber radar background
        const grad = previewCtx.createRadialGradient(w/2, h/2, 10, w/2, h/2, 85);
        grad.addColorStop(0, 'rgba(0, 255, 136, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        previewCtx.fillStyle = grad;
        previewCtx.beginPath();
        previewCtx.arc(w/2, h/2, 85, 0, Math.PI * 2);
        previewCtx.fill();

        // Hologram grid rings
        previewCtx.strokeStyle = 'rgba(0, 255, 136, 0.25)';
        previewCtx.lineWidth = 1;
        previewCtx.beginPath();
        previewCtx.arc(w/2, h/2, 55, 0, Math.PI * 2);
        previewCtx.arc(w/2, h/2, 80, 0, Math.PI * 2);
        previewCtx.stroke();

        // Center crosshair
        previewCtx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
        previewCtx.beginPath();
        previewCtx.moveTo(w/2 - 80, h/2);
        previewCtx.lineTo(w/2 + 80, h/2);
        previewCtx.moveTo(w/2, h/2 - 80);
        previewCtx.lineTo(w/2, h/2 + 80);
        previewCtx.stroke();

        // Render Bot in Center
        previewCtx.save();
        previewCtx.translate(w/2, h/2);
        previewCtx.rotate(previewAngle);

        // Forward Scanner Beam
        const cone = previewCtx.createRadialGradient(0, 0, 2, 75, 0, 85);
        cone.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
        cone.addColorStop(1, 'rgba(0, 255, 136, 0)');
        previewCtx.fillStyle = cone;
        previewCtx.beginPath();
        previewCtx.moveTo(10, 0);
        previewCtx.arc(0, 0, 75, -0.4, 0.4);
        previewCtx.closePath();
        previewCtx.fill();

        // Render compiled grid pixels
        if (compiledGrid) {
          const size = 76;
          const pxSize = size / 16;
          const startX = -size / 2;
          const startY = -size / 2;

          for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
              const col = compiledGrid[r][c];
              if (col) {
                previewCtx.fillStyle = col;
                previewCtx.fillRect(startX + c * pxSize, startY + r * pxSize, pxSize, pxSize);
              }
            }
          }
        }

        // Shield perimeter
        previewCtx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        previewCtx.lineWidth = 1.5;
        previewCtx.beginPath();
        previewCtx.arc(0, 0, 44, 0, Math.PI * 2);
        previewCtx.stroke();

        previewCtx.restore();

        previewAnimId = requestAnimationFrame(loop);
      };
      previewAnimId = requestAnimationFrame(loop);
    };

    // Allow clicking cheat-item to quick-copy
    document.querySelectorAll('.cheat-item').forEach(item => {
      item.title = 'Click to copy snippet or highlight with mouse';
      item.addEventListener('click', () => {
        const sel = window.getSelection().toString();
        if (sel) return; // Don't interrupt manual mouse text highlighting
        const codeText = item.querySelector('code')?.innerText;
        if (codeText) {
          navigator.clipboard.writeText(codeText).then(() => {
            sound.playUiClick();
            logToStudio('info', `Copied to clipboard: ${codeText}`);
          });
        }
      });
    });

    // Tab key handling in codebot-textarea (indent 2 spaces)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        textarea.value = val.substring(0, start) + '  ' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    });
  }

  setupManualModal() {
    const btnOpen = document.getElementById('btnOpenManual');
    const btnClose = document.getElementById('btnCloseManual');
    const btnCloseFooter = document.getElementById('btnCloseManualFooter');
    const tocContainer = document.getElementById('manualToc');
    const contentBox = document.getElementById('manualContent');

    let currentChapterIndex = 0;

    const openModal = () => {
      sound.init();
      sound.playUiClick();
      this.manualModal.classList.add('active');
      renderToc();
      loadChapter(currentChapterIndex);
    };

    const closeModal = () => {
      sound.playUiClick();
      this.manualModal.classList.remove('active');
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);
    btnCloseFooter?.addEventListener('click', closeModal);

    const renderToc = () => {
      tocContainer.innerHTML = '';
      MANUAL_CHAPTERS.forEach((chap, idx) => {
        const btn = document.createElement('button');
        btn.className = `manual-toc-btn ${idx === currentChapterIndex ? 'active-toc' : ''}`;
        btn.innerHTML = `<span class="toc-num">#${chap.num}</span><span>${chap.title}</span>`;
        btn.addEventListener('click', () => {
          sound.playUiClick();
          document.querySelectorAll('.manual-toc-btn').forEach(b => b.classList.remove('active-toc'));
          btn.classList.add('active-toc');
          loadChapter(idx);
        });
        tocContainer.appendChild(btn);
      });
    };

    const loadChapter = (idx) => {
      currentChapterIndex = idx;
      const chap = MANUAL_CHAPTERS[idx];
      contentBox.innerHTML = chap.content;
      contentBox.scrollTop = 0;
      this.attachCopyButtons(contentBox);
    };
  }

  attachCopyButtons(container) {
    if (!container) return;
    container.querySelectorAll('pre').forEach(pre => {
      if (pre.querySelector('.copy-snippet-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-snippet-btn';
      btn.innerHTML = '📋 COPY';
      btn.title = 'Copy code snippet to clipboard';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const codeEl = pre.querySelector('code');
        const codeText = (codeEl ? codeEl.innerText : pre.innerText).replace('📋 COPY', '').trim();
        navigator.clipboard.writeText(codeText).then(() => {
          sound.playUiClick();
          btn.innerHTML = '✓ COPIED!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = '📋 COPY';
            btn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = codeText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          btn.innerHTML = '✓ COPIED!';
          setTimeout(() => { btn.innerHTML = '📋 COPY'; }, 2000);
        });
      });
      pre.appendChild(btn);
    });
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new JsForgeApp();
});
