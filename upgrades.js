const UPGRADES_DATA = [
  { id: 'seeds_hand', name: 'Горсть семечек', basePrice: 15, baseIncome: 1, icon: '🌱' },
  { id: 'granny', name: 'Бабушка у подъезда', basePrice: 100, baseIncome: 5, icon: '👵' },
  { id: 'kiosk', name: 'Семечный ларёк', basePrice: 1100, baseIncome: 32, icon: '🏪' },
  { id: 'roaster', name: 'Промышленная жаровня', basePrice: 12000, baseIncome: 180, icon: '🔥' },
  { id: 'plantation', name: 'Плантация подсолнухов', basePrice: 130000, baseIncome: 950, icon: '🌻' },
  { id: 'field', name: 'Краснодарское поле', basePrice: 1400000, baseIncome: 4200, icon: '🌾' },
  { id: 'harvester', name: 'Комбайн "Дон-1500"', basePrice: 20000000, baseIncome: 25000, icon: '🚜' },
  { id: 'farm', name: 'Автоматизированная ферма', basePrice: 330000000, baseIncome: 150000, icon: '🏡' },
  { id: 'factory', name: 'Завод "Бабкины Семечки"', basePrice: 5100000000, baseIncome: 900000, icon: '🏭' },
  { id: 'export', name: 'Мировой экспорт', basePrice: 75000000000, baseIncome: 5000000, icon: '🚢' }
];

function getUpgradePrice(upgrade, currentLevel) {
  return Math.floor(upgrade.basePrice * Math.pow(1.15, currentLevel));
}

function getUpgradeIncome(upgrade, currentLevel) {
  return upgrade.baseIncome * currentLevel;
}
