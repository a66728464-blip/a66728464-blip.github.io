/* ========================================
   繧ｯ繝ｪ繝�き繝ｼ繧ｲ繝ｼ繝  - 繧ｲ繝ｼ繝 繝ｭ繧ｸ繝�け
   ======================================== */

// ========================================
// 繧ｲ繝ｼ繝 繧ｹ繝��繝�
// ========================================
const state = {
  score: 0,
  totalClicks: 0,
  clickMin: 1,
  clickMax: 5,
  clickRate: 1,       // 蜉 邂怜�咲紫
  clickMult: 1,       // 荵礼ｮ怜�咲紫
  rebirthCount: 0,
  rebirthBonus: 1,    // 霆｢逕溘�繝ｼ繝翫せ荵礼ｮ�

  // 繧｢繝��繧ｰ繝ｬ繝ｼ繝峨Ξ繝吶Ν
  upgrades: {
    max: { level: 0, baseCost: 10, costMult: 1.5 },
    min: { level: 0, baseCost: 10, costMult: 1.5 },
    rate: { level: 0, baseCost: 50, costMult: 1.6 },
    mult: { level: 0, baseCost: 200, costMult: 1.8 },
    rebirth: { level: 0, baseCost: 1000000, costMult: 3.0 },
    robotSpeed: { level: 0, baseCost: 100, costMult: 1.5 },
    robotPower: { level: 0, baseCost: 150, costMult: 1.6 },
    critical: { level: 0, baseCost: 500, costMult: 1.7 },
    bonus: { level: 0, baseCost: 300, costMult: 1.5 },
  },

  // ROBOT
  robotActive: false,
  robotInterval: null,

  // 繧ｿ繧､繝槭�
  timerSeconds: 0,
  timerInterval: null,

  // 繝励Ο繧ｰ繝ｬ繧ｹ
  progressTarget: 1000,
  progressCurrent: 0,
  progressStage: 0,

  // 繧ｯ繝ｪ繝�ぅ繧ｫ繝ｫ
  criticalChance: 0,   // %
  bonusMultiplier: 1,
};

// ========================================
// DOM隕∫ｴ 
// ========================================
const els = {
  scoreDisplay: document.getElementById('scoreDisplay'),
  mainButton: document.getElementById('mainButton'),
  clickEffects: document.getElementById('clickEffects'),
  progressFill: document.getElementById('progressFill'),
  timerDisplay: document.getElementById('timerDisplay'),
  notification: document.getElementById('notification'),

  // 繝代ロ繝ｫ
  leftPanel: document.getElementById('leftPanel'),
  panelTitle: document.getElementById('panelTitle'),
  switchPanel: document.getElementById('switchPanel'),
  robotPanel: document.getElementById('robotPanel'),
  shopPanel: document.getElementById('shopPanel'),

  // 繧｢繝��繧ｰ繝ｬ繝ｼ繝峨Ξ繝吶Ν
  maxLevel: document.getElementById('maxLevel'),
  minLevel: document.getElementById('minLevel'),
  rateLevel: document.getElementById('rateLevel'),
  multLevel: document.getElementById('multLevel'),
  rebirthLevel: document.getElementById('rebirthLevel'),
  robotSpeedLevel: document.getElementById('robotSpeedLevel'),
  robotPowerLevel: document.getElementById('robotPowerLevel'),
  criticalLevel: document.getElementById('criticalLevel'),
  bonusLevel: document.getElementById('bonusLevel'),

  // 繧｢繝��繧ｰ繝ｬ繝ｼ繝峨さ繧ｹ繝�
  maxCost: document.getElementById('maxCost'),
  minCost: document.getElementById('minCost'),
  rateCost: document.getElementById('rateCost'),
  multCost: document.getElementById('multCost'),
  rebirthCost: document.getElementById('rebirthCost'),
  robotSpeedCost: document.getElementById('robotSpeedCost'),
  robotPowerCost: document.getElementById('robotPowerCost'),
  criticalCost: document.getElementById('criticalCost'),
  bonusCost: document.getElementById('bonusCost'),

  // 繧｢繝��繧ｰ繝ｬ繝ｼ繝峨�繧ｿ繝ｳ
  upgradeMax: document.getElementById('upgradeMax'),
  upgradeMin: document.getElementById('upgradeMin'),
  upgradeRate: document.getElementById('upgradeRate'),
  upgradeMult: document.getElementById('upgradeMult'),
  upgradeRebirth: document.getElementById('upgradeRebirth'),
  robotSpeed: document.getElementById('robotSpeed'),
  robotPower: document.getElementById('robotPower'),
  shopCritical: document.getElementById('shopCritical'),
  shopBonus: document.getElementById('shopBonus'),

  // ROBOT
  toggleRobot: document.getElementById('toggleRobot'),
  robotIndicator: document.getElementById('robotIndicator'),
  robotStateText: document.getElementById('robotStateText'),

  // 繧ｵ繧､繝峨�繧ｿ繝ｳ
  btnSwitch: document.getElementById('btnSwitch'),
  btnRobot: document.getElementById('btnRobot'),
  btnShop: document.getElementById('btnShop'),
  btnMystery: document.getElementById('btnMystery'),
  menuBtn: document.getElementById('menuBtn'),

  // 繝峨ャ繝�
  dots: document.querySelectorAll('.dot'),
};

// ========================================
// 繝ｦ繝ｼ繝�ぅ繝ｪ繝�ぅ
// ========================================
function formatNumber(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return Math.floor(n).toLocaleString();
  return Math.floor(n).toString();
}

function getCost(upgradeName) {
  const u = state.upgrades[upgradeName];
  return Math.floor(u.baseCost * Math.pow(u.costMult, u.level));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ========================================
// 繧ｹ繧ｳ繧｢險育ｮ�
// ========================================
function calculateClick() {
  const base = randInt(state.clickMin, state.clickMax);
  let value = (base + state.clickRate) * state.clickMult * state.rebirthBonus * state.bonusMultiplier;

  // 繧ｯ繝ｪ繝�ぅ繧ｫ繝ｫ蛻､螳�
  const isCritical = Math.random() * 100 < state.criticalChance;
  if (isCritical) {
    value *= 3;
  }

  return { value: Math.floor(value), isCritical };
}

// ========================================
// 繧ｯ繝ｪ繝�け蜃ｦ逅�
// ========================================
function handleClick(e) {
  const { value, isCritical } = calculateClick();
  state.score += value;
  state.totalClicks++;
  state.progressCurrent += value;

  updateScoreDisplay();
  updateProgress();
  showClickEffect(e, value, isCritical);
  updateUpgradeButtons();

  // 繝懊ち繝ｳ繝代Ν繧ｹ
  els.mainButton.classList.remove('pulse');
  void els.mainButton.offsetWidth;
  els.mainButton.classList.add('pulse');

  // 繧ｹ繧ｳ繧｢繝舌Φ繝�
  const scoreEl = document.querySelector('.score-display');
  scoreEl.classList.remove('bump');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bump');

  saveGame();
}

function getValueImage(value, isCritical) {
  // DATA/1.png = 繝斐Φ繧ｯ�域怙螟ｧ蛟､/繧ｯ繝ｪ繝�ぅ繧ｫ繝ｫ��
  // DATA/2.png = 繧ｰ繝ｪ繝ｼ繝ｳ��1000縲�9999��
  // DATA/3.png = 邏ｫ�亥渕譛ｬ蛟､縲√��99��
  // DATA/4.png = 繧ｴ繝ｼ繝ｫ繝会ｼ�100縲�999��
  if (isCritical) return 'DATA/1.png';
  if (value >= 10000) return 'DATA/1.png';
  if (value >= 1000) return 'DATA/2.png';
  if (value >= 100) return 'DATA/4.png';
  return 'DATA/3.png';
}

function showClickEffect(e, value, isCritical) {
  // 繝輔Ο繝ｼ繝医リ繝ｳ繝舌���NG逕ｻ蜒上ｒ菴ｿ逕ｨ��
  const num = document.createElement('div');
  num.className = 'click-number';

  const img = document.createElement('img');
  img.src = getValueImage(value, isCritical);
  img.alt = '+' + formatNumber(value);
  img.className = 'click-number-img';
  img.draggable = false;
  num.appendChild(img);

  const rect = els.clickEffects.getBoundingClientRect();
  let x, y;

  if (e && e.clientX) {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  } else {
    // ROBOT逕ｨ�壹Λ繝ｳ繝�繝 菴咲ｽｮ
    x = rect.width / 2 + randInt(-60, 60);
    y = rect.height / 2 + randInt(-40, 40);
  }

  num.style.left = x + 'px';
  num.style.top = y + 'px';
  els.clickEffects.appendChild(num);

  setTimeout(() => num.remove(), 1200);

  // 繝ｪ繝��繝ｫ
  const ripple = document.createElement('div');
  ripple.className = 'click-ripple';
  ripple.style.left = (x - 5) + 'px';
  ripple.style.top = (y - 5) + 'px';
  els.clickEffects.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ========================================
// UI譖ｴ譁ｰ
// ========================================
function updateScoreDisplay() {
  els.scoreDisplay.textContent = formatNumber(state.score);
}

function updateUpgradeButtons() {
  const upgradeMap = {
    max: { btn: els.upgradeMax, level: els.maxLevel, cost: els.maxCost },
    min: { btn: els.upgradeMin, level: els.minLevel, cost: els.minCost },
    rate: { btn: els.upgradeRate, level: els.rateLevel, cost: els.rateCost },
    mult: { btn: els.upgradeMult, level: els.multLevel, cost: els.multCost },
    rebirth: { btn: els.upgradeRebirth, level: els.rebirthLevel, cost: els.rebirthCost },
    robotSpeed: { btn: els.robotSpeed, level: els.robotSpeedLevel, cost: els.robotSpeedCost },
    robotPower: { btn: els.robotPower, level: els.robotPowerLevel, cost: els.robotPowerCost },
    critical: { btn: els.shopCritical, level: els.criticalLevel, cost: els.criticalCost },
    bonus: { btn: els.shopBonus, level: els.bonusLevel, cost: els.bonusCost },
  };

  for (const [name, elems] of Object.entries(upgradeMap)) {
    const cost = getCost(name);
    elems.level.textContent = state.upgrades[name].level;
    elems.cost.textContent = formatNumber(cost);

    if (state.score < cost) {
      elems.btn.classList.add('cant-afford');
    } else {
      elems.btn.classList.remove('cant-afford');
    }
  }
}

function updateProgress() {
  const pct = Math.min((state.progressCurrent / state.progressTarget) * 100, 100);
  els.progressFill.style.width = pct + '%';

  if (state.progressCurrent >= state.progressTarget) {
    state.progressCurrent = 0;
    state.progressStage++;
    if (state.progressStage > 4) state.progressStage = 0;
    state.progressTarget = Math.floor(state.progressTarget * 1.5);
    showNotification('脂 繧ｹ繝��繧ｸ繧ｯ繝ｪ繧｢�∵ｬ｡縺ｮ逶ｮ讓�: ' + formatNumber(state.progressTarget));
  }

  // 繝峨ャ繝域峩譁ｰ
  els.dots.forEach((dot, i) => {
    if (i <= state.progressStage) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// ========================================
// 繧｢繝��繧ｰ繝ｬ繝ｼ繝牙�逅�
// ========================================
function purchaseUpgrade(upgradeName) {
  const cost = getCost(upgradeName);
  if (state.score < cost) {
    showNotification('笞 �� 繧ｹ繧ｳ繧｢縺瑚ｶｳ繧翫∪縺帙ｓ��');
    return;
  }

  state.score -= cost;
  state.upgrades[upgradeName].level++;

  // 蜉ｹ譫懊ｒ驕ｩ逕ｨ
  switch (upgradeName) {
    case 'max':
      state.clickMax += 3 + state.upgrades.max.level;
      break;
    case 'min':
      state.clickMin += 1 + Math.floor(state.upgrades.min.level / 2);
      if (state.clickMin > state.clickMax) state.clickMin = state.clickMax;
      break;
    case 'rate':
      state.clickRate += 2;
      break;
    case 'mult':
      state.clickMult += 0.2;
      break;
    case 'rebirth':
      performRebirth();
      return;
    case 'robotSpeed':
      if (state.robotActive) restartRobot();
      break;
    case 'robotPower':
      break;
    case 'critical':
      state.criticalChance = Math.min(state.criticalChance + 3, 50);
      break;
    case 'bonus':
      state.bonusMultiplier += 0.15;
      break;
  }

  updateScoreDisplay();
  updateUpgradeButtons();
  showNotification('笨� ' + getUpgradeName(upgradeName) + ' 繧偵い繝��繧ｰ繝ｬ繝ｼ繝会ｼ�');
  saveGame();
}

function getUpgradeName(key) {
  const names = {
    max: '荳企剞蠅怜刈',
    min: '荳矩剞蠅怜刈',
    rate: '蛟咲紫蠑ｷ蛹�',
    mult: '荵礼ｮ怜ｼｷ蛹�',
    rebirth: '霆｢逕�',
    robotSpeed: '騾溷ｺｦUP',
    robotPower: '繝代Ρ繝ｼUP',
    critical: '繧ｯ繝ｪ繝�ぅ繧ｫ繝ｫ',
    bonus: '繝懊�繝翫せ',
  };
  return names[key] || key;
}

// ========================================
// 霆｢逕�
// ========================================
function performRebirth() {
  state.rebirthCount++;
  state.rebirthBonus += 0.5;

  // 繝ｪ繧ｻ繝�ヨ
  state.score = 0;
  state.clickMin = 1;
  state.clickMax = 5;
  state.clickRate = 1;
  state.clickMult = 1;
  state.criticalChance = 0;
  state.bonusMultiplier = 1;
  state.progressCurrent = 0;
  state.progressStage = 0;
  state.progressTarget = 1000;

  // 繧｢繝��繧ｰ繝ｬ繝ｼ繝峨Μ繧ｻ繝�ヨ�郁ｻ｢逕溘→ROBOT莉･螟厄ｼ�
  ['max', 'min', 'rate', 'mult', 'critical', 'bonus'].forEach(key => {
    state.upgrades[key].level = 0;
  });

  // ROBOT繧ｪ繝�
  if (state.robotActive) toggleRobot();

  // 繧ｨ繝輔ぉ繧ｯ繝�
  spawnRebirthParticles();

  updateScoreDisplay();
  updateUpgradeButtons();
  updateProgress();
  showNotification('笨ｨ 霆｢逕溘＠縺ｾ縺励◆�∬ｻ｢逕溘�繝ｼ繝翫せ: x' + state.rebirthBonus.toFixed(1));
  saveGame();
}

function spawnRebirthParticles() {
  const colors = ['#9a9ccc', '#b8bad8', '#8b8dba', '#c8cae8', '#ff88bb'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'rebirth-particle';
    p.style.left = (window.innerWidth / 2 + randInt(-200, 200)) + 'px';
    p.style.top = (window.innerHeight / 2 + randInt(-100, 100)) + 'px';
    p.style.background = colors[randInt(0, colors.length - 1)];
    p.style.width = randInt(4, 10) + 'px';
    p.style.height = p.style.width;
    p.style.animationDuration = (0.8 + Math.random() * 1.2) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

// ========================================
// ROBOT�郁�蜍輔け繝ｪ繝�け��
// ========================================
function toggleRobot() {
  state.robotActive = !state.robotActive;

  if (state.robotActive) {
    const speed = Math.max(100, 1000 - state.upgrades.robotSpeed.level * 80);
    state.robotInterval = setInterval(() => {
      const { value, isCritical } = calculateClick();
      const robotBoost = 1 + state.upgrades.robotPower.level * 0.3;
      const finalValue = Math.floor(value * robotBoost);
      state.score += finalValue;
      state.totalClicks++;
      state.progressCurrent += finalValue;
      updateScoreDisplay();
      updateProgress();
      showClickEffect(null, finalValue, isCritical);
      updateUpgradeButtons();
    }, speed);

    els.robotIndicator.classList.add('on');
    els.robotIndicator.classList.remove('off');
    els.robotStateText.textContent = 'ON';
    showNotification('､� ROBOT 襍ｷ蜍包ｼ�');
  } else {
    clearInterval(state.robotInterval);
    state.robotInterval = null;
    els.robotIndicator.classList.remove('on');
    els.robotIndicator.classList.add('off');
    els.robotStateText.textContent = 'OFF';
    showNotification('､� ROBOT 蛛懈ｭ｢');
  }
  saveGame();
}

function restartRobot() {
  if (state.robotActive) {
    clearInterval(state.robotInterval);
    const speed = Math.max(100, 1000 - state.upgrades.robotSpeed.level * 80);
    state.robotInterval = setInterval(() => {
      const { value, isCritical } = calculateClick();
      const robotBoost = 1 + state.upgrades.robotPower.level * 0.3;
      const finalValue = Math.floor(value * robotBoost);
      state.score += finalValue;
      state.totalClicks++;
      state.progressCurrent += finalValue;
      updateScoreDisplay();
      updateProgress();
      showClickEffect(null, finalValue, isCritical);
      updateUpgradeButtons();
    }, speed);
  }
}

// ========================================
// 繝代ロ繝ｫ蛻�ｊ譖ｿ縺�
// ========================================
function switchPanel(panel) {
  els.switchPanel.classList.add('hidden');
  els.robotPanel.classList.add('hidden');
  els.shopPanel.classList.add('hidden');

  // 繧ｵ繧､繝峨�繧ｿ繝ｳ縺ｮ繧｢繧ｯ繝�ぅ繝也憾諷�
  els.btnSwitch.classList.remove('active');
  els.btnRobot.classList.remove('active');
  els.btnShop.classList.remove('active');

  switch (panel) {
    case 'switch':
      els.switchPanel.classList.remove('hidden');
      els.panelTitle.textContent = 'SWITCH';
      els.btnSwitch.classList.add('active');
      break;
    case 'robot':
      els.robotPanel.classList.remove('hidden');
      els.panelTitle.textContent = 'ROBOT';
      els.btnRobot.classList.add('active');
      break;
    case 'shop':
      els.shopPanel.classList.remove('hidden');
      els.panelTitle.textContent = 'SHOP';
      els.btnShop.classList.add('active');
      break;
  }
}

// ========================================
// 繧ｿ繧､繝槭�
// ========================================
function startTimer() {
  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    const mins = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
    const secs = (state.timerSeconds % 60).toString().padStart(2, '0');
    els.timerDisplay.textContent = mins + ':' + secs;
  }, 1000);
}

// ========================================
// 騾夂衍
// ========================================
let notifTimeout = null;
function showNotification(msg) {
  if (notifTimeout) clearTimeout(notifTimeout);
  els.notification.textContent = msg;
  els.notification.classList.add('show');
  notifTimeout = setTimeout(() => {
    els.notification.classList.remove('show');
  }, 2000);
}

// ========================================
// 繧ｻ繝ｼ繝� / 繝ｭ繝ｼ繝�
// ========================================
function saveGame() {
  const data = {
    score: state.score,
    totalClicks: state.totalClicks,
    clickMin: state.clickMin,
    clickMax: state.clickMax,
    clickRate: state.clickRate,
    clickMult: state.clickMult,
    rebirthCount: state.rebirthCount,
    rebirthBonus: state.rebirthBonus,
    upgrades: state.upgrades,
    robotActive: state.robotActive,
    timerSeconds: state.timerSeconds,
    progressTarget: state.progressTarget,
    progressCurrent: state.progressCurrent,
    progressStage: state.progressStage,
    criticalChance: state.criticalChance,
    bonusMultiplier: state.bonusMultiplier,
  };
  localStorage.setItem('clickerGameSave', JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem('clickerGameSave');
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    Object.assign(state, {
      score: data.score || 0,
      totalClicks: data.totalClicks || 0,
      clickMin: data.clickMin || 1,
      clickMax: data.clickMax || 5,
      clickRate: data.clickRate || 1,
      clickMult: data.clickMult || 1,
      rebirthCount: data.rebirthCount || 0,
      rebirthBonus: data.rebirthBonus || 1,
      timerSeconds: data.timerSeconds || 0,
      progressTarget: data.progressTarget || 1000,
      progressCurrent: data.progressCurrent || 0,
      progressStage: data.progressStage || 0,
      criticalChance: data.criticalChance || 0,
      bonusMultiplier: data.bonusMultiplier || 1,
    });

    if (data.upgrades) {
      for (const key of Object.keys(data.upgrades)) {
        if (state.upgrades[key]) {
          state.upgrades[key].level = data.upgrades[key].level || 0;
        }
      }
    }

    // ROBOT蠕ｩ蜈�
    if (data.robotActive) {
      state.robotActive = false; // toggle縺ｧtrue縺ｫ縺吶ｋ
      toggleRobot();
    }

    return true;
  } catch {
    return false;
  }
}

// ========================================
// 繝｡繝九Η繝ｼ�医Μ繧ｻ繝�ヨ��
// ========================================
function showMenu() {
  if (confirm('繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ繧偵Μ繧ｻ繝�ヨ縺励∪縺吶°��')) {
    localStorage.removeItem('clickerGameSave');
    location.reload();
  }
}

// ========================================
// 繧､繝吶Φ繝医Μ繧ｹ繝翫�
// ========================================
function init() {
  // 繝ｭ繝ｼ繝�
  const loaded = loadGame();

  // 蛻晏屓陦ｨ遉ｺ譖ｴ譁ｰ
  updateScoreDisplay();
  updateUpgradeButtons();
  updateProgress();

  // 繧ｿ繧､繝槭�陦ｨ遉ｺ蠕ｩ蜈�
  const mins = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
  const secs = (state.timerSeconds % 60).toString().padStart(2, '0');
  els.timerDisplay.textContent = mins + ':' + secs;

  // 繧ｿ繧､繝槭�髢句ｧ�
  startTimer();

  if (loaded) {
    showNotification('唐 繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ繧偵Ο繝ｼ繝峨＠縺ｾ縺励◆');
  }

  // 繝｡繧､繝ｳ繧ｯ繝ｪ繝�け
  els.mainButton.addEventListener('click', handleClick);

  // 繧｢繝��繧ｰ繝ｬ繝ｼ繝峨�繧ｿ繝ｳ
  els.upgradeMax.addEventListener('click', () => purchaseUpgrade('max'));
  els.upgradeMin.addEventListener('click', () => purchaseUpgrade('min'));
  els.upgradeRate.addEventListener('click', () => purchaseUpgrade('rate'));
  els.upgradeMult.addEventListener('click', () => purchaseUpgrade('mult'));
  els.upgradeRebirth.addEventListener('click', () => purchaseUpgrade('rebirth'));
  els.robotSpeed.addEventListener('click', () => purchaseUpgrade('robotSpeed'));
  els.robotPower.addEventListener('click', () => purchaseUpgrade('robotPower'));
  els.shopCritical.addEventListener('click', () => purchaseUpgrade('critical'));
  els.shopBonus.addEventListener('click', () => purchaseUpgrade('bonus'));

  // ROBOT
  els.toggleRobot.addEventListener('click', toggleRobot);

  // 繝代ロ繝ｫ蛻�ｊ譖ｿ縺�
  els.btnSwitch.addEventListener('click', () => switchPanel('switch'));
  els.btnRobot.addEventListener('click', () => switchPanel('robot'));
  els.btnShop.addEventListener('click', () => switchPanel('shop'));
  els.btnMystery.addEventListener('click', () => {
    showNotification('白 縺ｾ縺 隗｣謾ｾ縺輔ｌ縺ｦ縺�∪縺帙ｓ...');
  });

  // 繝｡繝九Η繝ｼ
  els.menuBtn.addEventListener('click', showMenu);

  // 蛻晄悄繝代ロ繝ｫ
  switchPanel('switch');

  // 閾ｪ蜍輔そ繝ｼ繝�
  setInterval(saveGame, 10000);
}

// 蛻晄悄蛹�
document.addEventListener('DOMContentLoaded', init);
