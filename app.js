const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

// Загрузка или инициализация сохранения
const SAVED_KEY = 'semechki_game_save_v1';
const defaultState = {
  balance: 0,
  energy: 1000,
  maxEnergy: 1000,
  clickPower: 1,
  passiveIncome: 0,
  level: 1,
  xp: 0,
  upgrades: {},
  invitedFriends: 0
};

let state = JSON.parse(localStorage.getItem(SAVED_KEY)) || defaultState;

function saveGame() {
  localStorage.setItem(SAVED_KEY, JSON.stringify(state));
}

// Элементы интерфейса
const balanceEl = document.getElementById('balance-val');
const energyValEl = document.getElementById('energy-val');
const energyFillEl = document.getElementById('energy-fill');
const clickerBtn = document.getElementById('clicker-btn');
const clickPowerEl = document.getElementById('click-power-val');
const passiveIncomeEl = document.getElementById('passive-income-val');
const levelEl = document.getElementById('user-level-val');

// Проверка и повышение уровня (+2 к клику за каждый уровень)
function checkLevelUp() {
  const xpPerLevel = 1000; // Нужно 1000 XP на каждый следующий уровень
  const newLevel = Math.floor(state.xp / xpPerLevel) + 1;

  if (newLevel > state.level) {
    state.level = newLevel;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
    if (tg?.showAlert) {
      tg.showAlert(`🎉 Поздравляем! Ты достиг ${state.level} уровня! Теперь +2 к клику!`);
    }
  }

  // Расчёт клика: Базовый (1) + по +2 за каждый уровень выше 1-го
  state.clickPower = 1 + (state.level - 1) * 2;
}

// Рендер основных показателей
function render() {
  checkLevelUp(); // Проверяем уровень при каждом обнове

  balanceEl.textContent = state.balance.toLocaleString();
  energyValEl.textContent = `${Math.floor(state.energy)} / ${state.maxEnergy}`;
  energyFillEl.style.width = `${(state.energy / state.maxEnergy) * 100}%`;
  clickPowerEl.textContent = `+${state.clickPower}`;
  passiveIncomeEl.textContent = `+${state.passiveIncome}/с`;
  levelEl.textContent = `${state.level} (${state.xp} XP)`;
}

// Логика клика
clickerBtn?.addEventListener('pointerdown', (e) => {
  if (state.energy < state.clickPower) {
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    return;
  }

  state.energy -= state.clickPower;
  state.balance += state.clickPower;
  state.xp += state.clickPower;

  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }

  // Анимация вылетающей цифры
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
  saveGame();
});

// Переключение вкладок
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) activeTab.classList.add('active');
  btn.classList.add('active');

  if (tabId === 'friends') {
    renderFriendsTab();
  }
}

// Отрисовка карточек прокачки в Ларьке
function renderUpgrades() {
  const container = document.getElementById('upgrades-list');
  if (!container) return;
  container.innerHTML = '';

  UPGRADES_DATA.forEach(item => {
    const currentLvl = state.upgrades[item.id] || 0;
    const price = getUpgradePrice(item, currentLvl);
    const income = getUpgradeIncome(item, currentLvl + 1);

    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.cssText = 'margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; padding: 12px;';
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 32px;">${item.icon}</div>
        <div>
          <div style="font-weight: bold; font-size: 15px;">${item.name}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            Уровень: <span style="color:#fff; font-weight:bold;">${currentLvl}</span> | +${income}/сек
          </div>
          <div style="font-size: 13px; color: var(--accent-gold); font-weight: 800; margin-top: 4px;">
            🌻 ${price.toLocaleString()}
          </div>
        </div>
      </div>
      <button onclick="buyUpgrade('${item.id}')" style="padding: 10px 14px; background: var(--accent-gold); border: none; border-radius: 10px; font-weight: bold; color: #000; cursor: pointer;">
        Купить
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
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    render();
    renderUpgrades();
    saveGame();
  } else {
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    if (tg?.showAlert) {
      tg.showAlert('Не хватает семечек для покупки!');
    } else {
      alert('Не хватает семечек!');
    }
  }
}

// Реферальная система
function getRefLink() {
  const userId = tg?.initDataUnsafe?.user?.id || 'demo_user';
  return `https://t.me/babkiny_semechki_bot?start=ref_${userId}`;
}

function renderFriendsTab() {
  const container = document.getElementById('tab-friends');
  if (!container) return;

  const refLink = getRefLink();

  container.innerHTML = `
    <div style="text-align: center; padding: 10px 0;">
      <div style="font-size: 48px; margin-bottom: 8px;">👥</div>
      <h2 style="font-size: 22px; margin-bottom: 6px;">Приглашай корешей!</h2>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
        Получай <b style="color: var(--accent-gold);">+5 000 🌻</b> за каждого приглашённого друга!
      </p>

      <div class="glass-card" style="margin-bottom: 16px; text-align: left; padding: 12px 16px;">
        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Твоя реферальная ссылка:</div>
        <div style="font-size: 13px; font-weight: bold; color: #fff; word-break: break-all; margin-top: 4px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
          ${refLink}
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <button onclick="copyRefLink('${refLink}')" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); border-radius: 12px; color: #fff; font-weight: bold; cursor: pointer;">
          📋 Копировать
        </button>
        <button onclick="shareRefLink('${refLink}')" style="flex: 1; padding: 12px; background: var(--accent-gold); border: none; border-radius: 12px; color: #000; font-weight: bold; cursor: pointer;">
          🚀 Поделиться
        </button>
      </div>

      <div class="glass-card" style="text-align: left; padding: 12px 16px;">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">Список друзей (${state.invitedFriends})</div>
        <div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px 0;">
          ${state.invitedFriends > 0 ? 'Друзья подгружаются...' : 'Пока никто не пришёл по твоей ссылке.'}
        </div>
      </div>
    </div>
  `;
}

function copyRefLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    if (tg?.showAlert) tg.showAlert('Ссылка скопирована!');
  }).catch(() => {
    const textArea = document.createElement("textarea");
    textArea.value = link;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    if (tg?.showAlert) tg.showAlert('Ссылка скопирована!');
  });
}

function shareRefLink(link) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Заходи в «Бабкины Семечки»! Кликай и зарабатывай $SEMECHKI 🌻')}`;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}

// Восстановление энергии и пассивный доход раз в секунду
setInterval(() => {
  if (state.energy < state.maxEnergy) {
    state.energy = Math.min(state.maxEnergy, state.energy + 3);
  }
  if (state.passiveIncome > 0) {
    state.balance += state.passiveIncome;
  }
  render();
  saveGame();
}, 1000);

// Инициализация TON Connect
if (window.TON_CONNECT_UI) {
  new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://dima210211.github.io/semechegame/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-btn'
  });
}

renderUpgrades();
render();
