const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

let state = {
  balance: 0,
  energy: 1000,
  maxEnergy: 1000,
  clickPower: 1,
  passiveIncome: 0,
  level: 1,
  xp: 0,
  upgrades: {}
};

const balanceEl = document.getElementById('balance-val');
const energyValEl = document.getElementById('energy-val');
const energyFillEl = document.getElementById('energy-fill');
const clickerBtn = document.getElementById('clicker-btn');
const clickPowerEl = document.getElementById('click-power-val');
const passiveIncomeEl = document.getElementById('passive-income-val');
const levelEl = document.getElementById('user-level-val');

function render() {
  balanceEl.textContent = state.balance.toLocaleString();
  energyValEl.textContent = `${Math.floor(state.energy)} / ${state.maxEnergy}`;
  energyFillEl.style.width = `${(state.energy / state.maxEnergy) * 100}%`;
  clickPowerEl.textContent = `+${state.clickPower}`;
  passiveIncomeEl.textContent = `+${state.passiveIncome}/с`;
  levelEl.textContent = `${state.level} (${state.xp} XP)`;
}

clickerBtn.addEventListener('pointerdown', (e) => {
  if (state.energy < state.clickPower) return;

  state.energy -= state.clickPower;
  state.balance += state.clickPower;
  state.xp += state.clickPower;

  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }

  const rect = clickerBtn.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const num = document.createElement('div');
  num.className = 'floating-number';
  num.textContent = `+${state.clickPower}`;
  num.style.left = `${x}px`;
  num.style.top = `${y}px`;

  clickerBtn.appendChild(num);
  setTimeout(() => num.remove(), 800);

  render();
});

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`tab-${tabId}`).classList.add('active');
  btn.classList.add('active');
}

function renderUpgrades() {
  const container = document.getElementById('upgrades-list');
  container.innerHTML = '';

  UPGRADES_DATA.forEach(item => {
    const currentLvl = state.upgrades[item.id] || 0;
    const price = getUpgradePrice(item, currentLvl);
    const income = getUpgradeIncome(item, currentLvl + 1);

    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.cssText = 'margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;';
    card.innerHTML = `
      <div>
        <div style="font-weight: bold;">${item.icon} ${item.name}</div>
        <div style="font-size: 12px; color: var(--text-muted);">
          Ур: ${currentLvl} | +${income}/сек
        </div>
        <div style="font-size: 13px; color: var(--accent-gold); font-weight: 700; margin-top: 2px;">
          💰 ${price.toLocaleString()} $SEMECHKI
        </div>
      </div>
      <button onclick="buyUpgrade('${item.id}')" style="padding: 8px 16px; background: var(--accent-gold); border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
        Прокачать
      </button>
    `;
    container.appendChild(card);
  });
}

function buyUpgrade(id) {
  const item = UPGRADES_DATA.find(u => u.id === id);
  const currentLvl = state.upgrades[id] || 0;
  const price = getUpgradePrice(item, currentLvl);

  if (state.balance >= price) {
    state.balance -= price;
    state.upgrades[id] = currentLvl + 1;
    state.passiveIncome += item.baseIncome;
    render();
    renderUpgrades();
  } else {
    alert('Не хватает семечек!');
  }
}

setInterval(() => {
  if (state.energy < state.maxEnergy) {
    state.energy = Math.min(state.maxEnergy, state.energy + 3);
  }
  if (state.passiveIncome > 0) {
    state.balance += state.passiveIncome;
  }
  render();
}, 1000);

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://dima210211.github.io/semechegame/tonconnect-manifest.json',
  buttonRootId: 'ton-connect-btn'
});

renderUpgrades();
render();
