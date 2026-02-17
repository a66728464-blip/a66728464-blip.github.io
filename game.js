/* ========================================
   クリッカーゲーム - ゲームロジック
   ======================================== */

// ========================================
// ゲームステート
// ========================================
const state = {
  score: 0,
  totalClicks: 0,
  clickMin: 1,
  clickMax: 5,
  clickRate: 1,       // 加算倍率
  clickMult: 1,       // 乗算倍率
  rebirthCount: 0,
  rebirthBonus: 1,    // 転生ボーナス乗算

  // アップグレードレベル
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

  // タイマー
  timerSeconds: 0,
  timerInterval: null,

  // プログレス
  progressTarget: 1000,
  progressCurrent: 0,
  progressStage: 0,

  // クリティカル
  criticalChance: 0,   // %
  bonusMultiplier: 1,
};

// ========================================
// DOM要素
// ========================================
const els = {
  scoreDisplay: document.getElementById('scoreDisplay'),
  mainButton: document.getElementById('mainButton'),
  clickEffects: document.getElementById('clickEffects'),
  progressFill: document.getElementById('progressFill'),
  timerDisplay: document.getElementById('timerDisplay'),
  notification: document.getElementById('notification'),

  // パネル
  leftPanel: document.getElementById('leftPanel'),
  panelTitle: document.getElementById('panelTitle'),
  switchPanel: document.getElementById('switchPanel'),
  robotPanel: document.getElementById('robotPanel'),
  shopPanel: document.getElementById('shopPanel'),

  // アップグレードレベル
  maxLevel: document.getElementById('maxLevel'),
  minLevel: document.getElementById('minLevel'),
  rateLevel: document.getElementById('rateLevel'),
  multLevel: document.getElementById('multLevel'),
  rebirthLevel: document.getElementById('rebirthLevel'),
  robotSpeedLevel: document.getElementById('robotSpeedLevel'),
  robotPowerLevel: document.getElementById('robotPowerLevel'),
  criticalLevel: document.getElementById('criticalLevel'),
  bonusLevel: document.getElementById('bonusLevel'),

  // アップグレードコスト
  maxCost: document.getElementById('maxCost'),
  minCost: document.getElementById('minCost'),
  rateCost: document.getElementById('rateCost'),
  multCost: document.getElementById('multCost'),
  rebirthCost: document.getElementById('rebirthCost'),
  robotSpeedCost: document.getElementById('robotSpeedCost'),
  robotPowerCost: document.getElementById('robotPowerCost'),
  criticalCost: document.getElementById('criticalCost'),
  bonusCost: document.getElementById('bonusCost'),

  // アップグレードボタン
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

  // サイドボタン
  btnSwitch: document.getElementById('btnSwitch'),
  btnRobot: document.getElementById('btnRobot'),
  btnShop: document.getElementById('btnShop'),
  btnMystery: document.getElementById('btnMystery'),
  menuBtn: document.getElementById('menuBtn'),

  // ドット
  dots: document.querySelectorAll('.dot'),
};

// ========================================
// ユーティリティ
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
// スコア計算
// ========================================
function calculateClick() {
  const base = randInt(state.clickMin, state.clickMax);
  let value = (base + state.clickRate) * state.clickMult * state.rebirthBonus * state.bonusMultiplier;

  // クリティカル判定
  const isCritical = Math.random() * 100 < state.criticalChance;
  if (isCritical) {
    value *= 3;
  }

  return { value: Math.floor(value), isCritical };
}

// ========================================
// クリック処理
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

  // ボタンパルス
  els.mainButton.classList.remove('pulse');
  void els.mainButton.offsetWidth;
  els.mainButton.classList.add('pulse');

  // スコアバンプ
  const scoreEl = document.querySelector('.score-display');
  scoreEl.classList.remove('bump');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bump');

  saveGame();
}

function getValueImage(value, isCritical) {
  // DATA/1.png = ピンク（最大値/クリティカル）
  // DATA/2.png = グリーン（1000〜9999）
  // DATA/3.png = 紫（基本値、〜99）
  // DATA/4.png = ゴールド（100〜999）
  if (isCritical) return 'DATA/1.png';
  if (value >= 10000) return 'DATA/1.png';
  if (value >= 1000) return 'DATA/2.png';
  if (value >= 100) return 'DATA/4.png';
  return 'DATA/3.png';
}

function showClickEffect(e, value, isCritical) {
  // フロートナンバー（PNG画像を使用）
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
    // ROBOT用：ランダム位置
    x = rect.width / 2 + randInt(-60, 60);
    y = rect.height / 2 + randInt(-40, 40);
  }

  num.style.left = x + 'px';
  num.style.top = y + 'px';
  els.clickEffects.appendChild(num);

  setTimeout(() => num.remove(), 1200);

  // リップル
  const ripple = document.createElement('div');
  ripple.className = 'click-ripple';
  ripple.style.left = (x - 5) + 'px';
  ripple.style.top = (y - 5) + 'px';
  els.clickEffects.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ========================================
// UI更新
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

  }

  // ドット更新
  els.dots.forEach((dot, i) => {
    if (i <= state.progressStage) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// ========================================
// アップグレード処理
// ========================================
function purchaseUpgrade(upgradeName) {
  const cost = getCost(upgradeName);
  if (state.score < cost) {

    return;
  }

  state.score -= cost;
  state.upgrades[upgradeName].level++;

  // 効果を適用
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

  saveGame();
}

function getUpgradeName(key) {
  const names = {
    max: '上限増加',
    min: '下限増加',
    rate: '倍率強化',
    mult: '乗算強化',
    rebirth: '転生',
    robotSpeed: '速度UP',
    robotPower: 'パワーUP',
    critical: 'クリティカル',
    bonus: 'ボーナス',
  };
  return names[key] || key;
}

// ========================================
// 転生
// ========================================
function performRebirth() {
  state.rebirthCount++;
  state.rebirthBonus += 0.5;

  // リセット
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

  // アップグレードリセット（転生とROBOT以外）
  ['max', 'min', 'rate', 'mult', 'critical', 'bonus'].forEach(key => {
    state.upgrades[key].level = 0;
  });

  // ROBOTオフ
  if (state.robotActive) toggleRobot();

  // エフェクト
  spawnRebirthParticles();

  updateScoreDisplay();
  updateUpgradeButtons();
  updateProgress();
  showNotification('✨ 転生しました！転生ボーナス: x' + state.rebirthBonus.toFixed(1));
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
// ROBOT（自動クリック）
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
    showNotification('🤖 ROBOT 起動！');
  } else {
    clearInterval(state.robotInterval);
    state.robotInterval = null;
    els.robotIndicator.classList.remove('on');
    els.robotIndicator.classList.add('off');
    els.robotStateText.textContent = 'OFF';
    showNotification('🤖 ROBOT 停止');
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
// パネル切り替え
// ========================================
function switchPanel(panel) {
  els.switchPanel.classList.add('hidden');
  els.robotPanel.classList.add('hidden');
  els.shopPanel.classList.add('hidden');

  // サイドボタンのアクティブ状態
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
// タイマー
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
// 通知
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
// セーブ / ロード
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

    // ROBOT復元
    if (data.robotActive) {
      state.robotActive = false; // toggleでtrueにする
      toggleRobot();
    }

    return true;
  } catch {
    return false;
  }
}

// ========================================
// メニュー（リセット）
// ========================================
function showMenu() {
  if (confirm('セーブデータをリセットしますか？')) {
    localStorage.removeItem('clickerGameSave');
    location.reload();
  }
}

// ========================================
// イベントリスナー
// ========================================
function init() {
  // ロード
  const loaded = loadGame();

  // 初回表示更新
  updateScoreDisplay();
  updateUpgradeButtons();
  updateProgress();

  // タイマー表示復元
  const mins = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
  const secs = (state.timerSeconds % 60).toString().padStart(2, '0');
  els.timerDisplay.textContent = mins + ':' + secs;

  // タイマー開始
  startTimer();

  if (loaded) {
    showNotification('📂 セーブデータをロードしました');
  }

  // メインクリック
  els.mainButton.addEventListener('click', handleClick);

  // アップグレードボタン
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

  // パネル切り替え
  els.btnSwitch.addEventListener('click', () => switchPanel('switch'));
  els.btnRobot.addEventListener('click', () => switchPanel('robot'));
  els.btnShop.addEventListener('click', () => switchPanel('shop'));
  els.btnMystery.addEventListener('click', () => {
    showNotification('🔒 まだ解放されていません...');
  });

  // メニュー
  els.menuBtn.addEventListener('click', showMenu);

  // 初期パネル
  switchPanel('switch');

  // 自動セーブ
  setInterval(saveGame, 10000);
}

// 初期化
document.addEventListener('DOMContentLoaded', init);
