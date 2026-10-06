// Voryki: deterministic game rules. Time advances only while the game is active.
export const SAVE_VERSION = 3;
export const INVENTORY_SIZE = 30;
export const ITEMS = Object.freeze({
  wood: { name: 'Gỗ', category: 'resource', stack: 99, buy: 8, sell: 3, icon: '🪵', description: 'Gỗ để sửa máng nước và xây dựng nông trại.' },
  stone: { name: 'Đá', category: 'resource', stack: 99, buy: 10, sell: 4, icon: '🪨', description: 'Đá để sửa máng nước và xây dựng.' },
  berry: { name: 'Quả mọng', category: 'food', stack: 20, buy: 14, sell: 6, energy: 16, icon: '🫐', description: 'Ăn để hồi 16 năng lượng hoặc tặng cho V-01.' },
  carrot: { name: 'Củ cải', category: 'farm', stack: 20, buy: 20, sell: 12, energy: 22, icon: '🥕', description: 'Nông sản đầu mùa. Hồi 22 năng lượng khi ăn.' },
  wheat: { name: 'Lúa mì', category: 'farm', stack: 20, buy: 18, sell: 10, icon: '🌾', description: 'Nông sản dùng để giao thương.' },
  carrot_seed: { name: 'Hạt củ cải', category: 'seed', stack: 99, buy: 8, sell: 2, icon: '🌱', description: 'Lớn sau 4 giờ trong game khi đất được tưới.' },
  wheat_seed: { name: 'Hạt lúa mì', category: 'seed', stack: 99, buy: 6, sell: 2, icon: '🌱', description: 'Lớn sau 6 giờ trong game khi đất được tưới.' },
  berry_seed: { name: 'Hạt quả mọng', category: 'seed', stack: 99, buy: 10, sell: 3, icon: '🌱', description: 'Lớn sau 3 giờ trong game khi đất được tưới.' },
});
export const CROPS = Object.freeze({
  carrot: { name: 'Củ cải', seed: 'carrot_seed', item: 'carrot', growth: 240, yield: 3 },
  wheat: { name: 'Lúa mì', seed: 'wheat_seed', item: 'wheat', growth: 360, yield: 3 },
  berry: { name: 'Quả mọng', seed: 'berry_seed', item: 'berry', growth: 180, yield: 4 },
});
export const SHOP = ['carrot_seed', 'wheat_seed', 'berry_seed', 'berry', 'wood', 'stone'];
export const RESOURCE_NODES = Object.freeze(Object.fromEntries([
  ...Array.from({ length: 4 }, (_, i) => [`wood_${i + 1}`, { item: 'wood', amount: 3, energy: 5 }]),
  ...Array.from({ length: 4 }, (_, i) => [`stone_${i + 1}`, { item: 'stone', amount: 3, energy: 6 }]),
  ...Array.from({ length: 3 }, (_, i) => [`berries_${i + 1}`, { item: 'berry', amount: 3, energy: 2 }]),
]));
const QUEST_FLAGS = ['seen', 'accepted', 'tracks', 'channelInspected', 'channelFixed', 'bankCleared', 'berryPlanted', 'berryWatered', 'berryGrown', 'returned', 'friend'];
const MAX_GOLD = 999999999;
const MAX_MINUTES = 1e9;
const owns = (record, key) => typeof key === 'string' && Object.hasOwn(record, key);
const copy = value => JSON.parse(JSON.stringify(value));
const result = (ok, message, events = []) => ({ ok, message, events });
const validAmount = value => Number.isInteger(value) && value > 0 && value <= 9999;
const validSlotIndex = value => Number.isInteger(value) && value >= 0 && value < INVENTORY_SIZE;
const boundedNumber = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
export const dayAt = minutes => Math.floor(minutes / 1440) + 1;
export const clockAt = minutes => ({ hour: Math.floor(minutes % 1440 / 60), minute: Math.floor(minutes % 60) });

export function createState() {
  const state = {
    version: SAVE_VERSION, gold: 300, minutes: 480, day: 1, energy: 100,
    inventory: Array(INVENTORY_SIZE).fill(null), chest: Array(INVENTORY_SIZE).fill(null),
    tools: ['axe', 'pickaxe', 'hoe', 'watering_can'],
    plots: Object.fromEntries([...Array.from({ length: 12 }, (_, i) => `farm_${i + 1}`), 'river_berry'].map(id => [id, { tilled: false, crop: null }])),
    resources: Object.fromEntries(Object.keys(RESOURCE_NODES).map(id => [id, { harvestedDay: 0 }])),
    quest: { ...Object.fromEntries(QUEST_FLAGS.map(key => [key, false])), wateredAt: null, sleptAfterWater: false, rewardClaimed: false },
    player: { x: 770, y: 612, facing: 'up' }, creatures: [], upgrades: { house: 0 },
    stats: { gathered: 0, harvested: 0, slept: 0, goldEarned: 0 },
    flags: { introCompleted: false }, session: { screen: 'home', introIndex: 0 },
  };
  addItems(state.inventory, 'carrot_seed', 4);
  addItems(state.inventory, 'wheat_seed', 2);
  return state;
}

export function countItem(state, itemId, container = 'inventory') {
  if (!['inventory', 'chest'].includes(container) || !owns(ITEMS, itemId)) return 0;
  return state[container].reduce((total, slot) => total + (slot?.id === itemId ? slot.quantity : 0), 0);
}
function capacity(slots, itemId) {
  return slots.reduce((total, slot) => total + (!slot ? ITEMS[itemId].stack : slot.id === itemId ? ITEMS[itemId].stack - slot.quantity : 0), 0);
}
function addItems(slots, itemId, amount) {
  if (!owns(ITEMS, itemId) || !validAmount(amount) || capacity(slots, itemId) < amount) return false;
  let remaining = amount;
  for (const slot of slots) {
    if (slot?.id !== itemId || remaining === 0) continue;
    const addition = Math.min(remaining, ITEMS[itemId].stack - slot.quantity);
    slot.quantity += addition;
    remaining -= addition;
  }
  for (let i = 0; i < slots.length && remaining; i++) {
    if (slots[i]) continue;
    const addition = Math.min(remaining, ITEMS[itemId].stack);
    slots[i] = { id: itemId, quantity: addition, locked: false };
    remaining -= addition;
  }
  return true;
}
function available(slots, itemId, respectLock = false) {
  return slots.reduce((total, slot) => total + (slot?.id === itemId && (!respectLock || !slot.locked) ? slot.quantity : 0), 0);
}
function removeItems(slots, itemId, amount, respectLock = false) {
  if (!validAmount(amount) || available(slots, itemId, respectLock) < amount) return false;
  let remaining = amount;
  for (let i = 0; i < slots.length && remaining; i++) {
    const slot = slots[i];
    if (slot?.id !== itemId || (respectLock && slot.locked)) continue;
    const take = Math.min(remaining, slot.quantity);
    slot.quantity -= take;
    remaining -= take;
    if (!slot.quantity) slots[i] = null;
  }
  return true;
}
function spendEnergy(state, amount) {
  if (state.energy < amount) return false;
  state.energy -= amount;
  return true;
}
function updateQuest(state) {
  const q = state.quest;
  const berry = state.plots.river_berry.crop;
  if (q.berryWatered && berry?.id === 'berry' && berry.growth >= CROPS.berry.growth) q.berryGrown = true;
  if (q.channelFixed && q.bankCleared && q.berryGrown && q.sleptAfterWater) q.returned = true;
}
export function advanceTime(state, minutes) {
  if (!boundedNumber(minutes, 0, 10080) || state.minutes + minutes > MAX_MINUTES) return result(false, 'Khoảng thời gian không hợp lệ.');
  const end = state.minutes + minutes;
  let cursor = state.minutes;
  while (cursor < end) {
    const day = dayAt(cursor);
    const next = Math.min(end, day * 1440);
    for (const plot of Object.values(state.plots)) {
      const crop = plot.crop;
      if (crop && crop.wateredDay === day) crop.growth = Math.min(CROPS[crop.id].growth, crop.growth + next - cursor);
    }
    cursor = next;
  }
  state.minutes = end;
  state.day = dayAt(end);
  updateQuest(state);
  return result(true, '');
}

export function cropProgress(state, plotId) {
  if (!owns(state.plots, plotId)) return null;
  const crop = state.plots[plotId]?.crop;
  if (!crop) return null;
  const spec = CROPS[crop.id];
  return { ...crop, name: spec.name, ratio: Math.min(1, crop.growth / spec.growth), ready: crop.growth >= spec.growth, remaining: Math.max(0, spec.growth - crop.growth), watered: crop.wateredDay === state.day };
}

export function act(state, action, payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return result(false, 'Thao tác không hợp lệ.');
  const q = state.quest;
  const plot = owns(state.plots, payload.plotId) ? state.plots[payload.plotId] : null;
  switch (action) {
    case 'gather': {
      const node = owns(RESOURCE_NODES, payload.nodeId) ? RESOURCE_NODES[payload.nodeId] : null;
      if (!node) return result(false, 'Không tìm thấy tài nguyên này.');
      if (state.resources[payload.nodeId].harvestedDay === state.day) return result(false, 'Hôm nay chỗ này đã được thu thập. Hãy quay lại ngày mai.');
      if (capacity(state.inventory, node.item) < node.amount) return result(false, 'Túi đầy. Hãy cất hoặc bán bớt đồ rồi quay lại.');
      if (!spendEnergy(state, node.energy)) return result(false, 'Bạn đã mệt. Ăn quả mọng hoặc về nhà nghỉ ngơi.');
      addItems(state.inventory, node.item, node.amount);
      state.resources[payload.nodeId].harvestedDay = state.day;
      state.stats.gathered += node.amount;
      advanceTime(state, 5);
      return result(true, `Nhận ${node.amount} ${ITEMS[node.item].name.toLowerCase()}.`, ['inventory']);
    }
    case 'buy': {
      const { itemId, quantity = 1 } = payload;
      if (!SHOP.includes(itemId) || !validAmount(quantity)) return result(false, 'Món hàng hoặc số lượng không hợp lệ.');
      const price = ITEMS[itemId].buy * quantity;
      if (state.gold < price) return result(false, 'Bạn chưa đủ vàng.');
      if (capacity(state.inventory, itemId) < quantity) return result(false, 'Túi không đủ chỗ cho món hàng này.');
      addItems(state.inventory, itemId, quantity);
      state.gold -= price;
      return result(true, `Mua ${quantity} ${ITEMS[itemId].name.toLowerCase()} với ${price} vàng.`, ['inventory', 'gold']);
    }
    case 'sell': {
      const { itemId, quantity = 1 } = payload;
      if (!owns(ITEMS, itemId) || !validAmount(quantity)) return result(false, 'Món hàng hoặc số lượng không hợp lệ.');
      const price = ITEMS[itemId].sell * quantity;
      if (state.gold + price > MAX_GOLD) return result(false, 'Số dư vàng đã đạt giới hạn.');
      if (!removeItems(state.inventory, itemId, quantity, true)) return result(false, 'Không đủ vật phẩm để bán hoặc vật phẩm đang khóa.');
      state.gold += price;
      state.stats.goldEarned += price;
      return result(true, `Bán ${quantity} ${ITEMS[itemId].name.toLowerCase()}, nhận ${price} vàng.`, ['inventory', 'gold']);
    }
    case 'eat': {
      const item = owns(ITEMS, payload.itemId) ? ITEMS[payload.itemId] : null;
      if (!item?.energy) return result(false, 'Không thể ăn món này.');
      if (state.energy >= 100) return result(false, 'Bạn đang đầy năng lượng.');
      if (!removeItems(state.inventory, payload.itemId, 1)) return result(false, 'Bạn không còn món này trong túi.');
      state.energy = Math.min(100, state.energy + item.energy);
      return result(true, `Ăn ${item.name.toLowerCase()}. Năng lượng: ${Math.floor(state.energy)}/100.`, ['inventory', 'energy']);
    }
    case 'till': {
      if (!plot) return result(false, 'Chọn một ô đất trồng.');
      if (plot.tilled) return result(false, 'Ô đất đã được xới.');
      if (payload.plotId === 'river_berry' && !q.bankCleared) return result(false, 'Hãy dọn bờ sông trước khi xới đất.');
      if (!spendEnergy(state, 3)) return result(false, 'Bạn cần ăn hoặc nghỉ để hồi năng lượng.');
      plot.tilled = true;
      advanceTime(state, 3);
      return result(true, 'Đất đã tơi. Có thể gieo hạt.', ['farm']);
    }
    case 'plant': {
      const crop = owns(CROPS, payload.cropId) ? CROPS[payload.cropId] : null;
      if (!plot?.tilled) return result(false, 'Hãy dùng cuốc xới đất trước.');
      if (plot.crop) return result(false, 'Ô này đang có cây trồng.');
      if (!crop) return result(false, 'Hạt giống không hợp lệ.');
      if (payload.plotId === 'river_berry' && payload.cropId !== 'berry') return result(false, 'Luống ven sông dành cho quả mọng của V-01.');
      if (!countItem(state, crop.seed)) return result(false, `Bạn cần ${ITEMS[crop.seed].name.toLowerCase()}. Có bán ở cửa hàng.`);
      if (!spendEnergy(state, 2)) return result(false, 'Bạn cần nghỉ ngơi.');
      removeItems(state.inventory, crop.seed, 1);
      plot.crop = { id: payload.cropId, growth: 0, wateredDay: 0 };
      if (payload.plotId === 'river_berry') q.berryPlanted = true;
      advanceTime(state, 2);
      return result(true, `Đã gieo ${crop.name.toLowerCase()}. Tưới nước để cây bắt đầu lớn.`, ['inventory', 'farm']);
    }
    case 'water': {
      if (!plot?.crop) return result(false, 'Hãy gieo hạt vào ô đất trước.');
      if (plot.crop.growth >= CROPS[plot.crop.id].growth) return result(false, 'Cây đã chín. Bạn có thể thu hoạch.');
      if (plot.crop.wateredDay === state.day) return result(false, 'Ô đất đã được tưới hôm nay.');
      if (!spendEnergy(state, 2)) return result(false, 'Bạn cần nghỉ ngơi.');
      plot.crop.wateredDay = state.day;
      if (payload.plotId === 'river_berry' && !q.berryWatered) { q.berryWatered = true; q.wateredAt = state.minutes; }
      advanceTime(state, 2);
      return result(true, 'Đã tưới cây. Đất đủ ẩm cho hôm nay.', ['farm']);
    }
    case 'harvest': {
      if (!plot?.crop) return result(false, 'Ô này chưa có cây.');
      const crop = CROPS[plot.crop.id];
      if (plot.crop.growth < crop.growth) return result(false, `Cây cần thêm ${Math.ceil(crop.growth - plot.crop.growth)} phút được tưới trong game để chín.`);
      if (capacity(state.inventory, crop.item) < crop.yield) return result(false, 'Túi đầy. Cây vẫn ở đây để bạn quay lại thu hoạch.');
      if (!spendEnergy(state, 2)) return result(false, 'Bạn cần nghỉ ngơi.');
      addItems(state.inventory, crop.item, crop.yield);
      plot.crop = null;
      state.stats.harvested += crop.yield;
      advanceTime(state, 3);
      return result(true, `Thu hoạch ${crop.yield} ${crop.name.toLowerCase()}.`, ['farm', 'inventory']);
    }
    case 'sleep': {
      const target = Math.floor(state.minutes / 1440) * 1440 + 360;
      if ((target > state.minutes ? target : target + 1440) > MAX_MINUTES) return result(false, 'Đã đạt giới hạn thời gian của bản lưu.');
      advanceTime(state, target > state.minutes ? target - state.minutes : target + 1440 - state.minutes);
      state.energy = 100;
      state.stats.slept++;
      if (q.berryWatered) q.sleptAfterWater = true;
      updateQuest(state);
      return result(true, `Bạn thức dậy lúc 06:00, ngày ${state.day}. Năng lượng đã hồi phục.`, ['sleep', 'save']);
    }
    case 'see_v01':
      q.seen = true;
      return result(true, q.friend ? 'V-01 vui vẻ vẫy chiếc đuôi lá.' : 'V-01 nhìn bạn cảnh giác. Hãy tìm người dân gần bến để hỏi về nó.', ['quest']);
    case 'talk_villager':
      if (q.friend) return result(true, 'Nó đi cùng bạn sao? Có vẻ nó đã tin bạn rồi. Hãy đối xử với nó như một người bạn.');
      if (!q.accepted) {
        if (capacity(state.inventory, 'berry_seed') < 1) return result(false, 'Túi của bạn đầy rồi. Hãy chừa một ô để nhận hạt quả mọng.');
        q.seen = true;
        q.accepted = true;
        addItems(state.inventory, 'berry_seed', 1);
        return result(true, 'Nước ở nhánh sông nhỏ chảy yếu hẳn. Hãy xem dấu chân và máng nước cũ. Cầm hạt quả mọng này; bóng xanh ấy thích quả mọng lắm.', ['quest', 'inventory']);
      }
      return result(true, getQuestObjective(state));
    case 'inspect_tracks':
      if (!q.accepted) return result(false, 'Dấu chân nhỏ dẫn về phía bờ sông. Có lẽ dân làng biết thêm.');
      q.tracks = true;
      return result(true, 'Dấu chân nhỏ in trên bùn, dẫn từ mép nước tới bụi cỏ. Một chiếc lá xanh mắc trên cành thấp.', ['quest']);
    case 'inspect_channel':
      if (!q.accepted) return result(false, 'Một máng nước cũ. Hãy hỏi người dân gần bến.');
      q.channelInspected = true;
      return result(true, q.channelFixed ? 'Dòng nước đang chảy trở lại.' : 'Gỗ mục và đá vụn chặn dòng. Cần 6 gỗ và 3 đá để sửa máng.', ['quest']);
    case 'repair_channel':
      if (q.channelFixed) return result(false, 'Máng nước đã được sửa.');
      if (!q.accepted || !q.tracks || !q.channelInspected) return result(false, 'Hãy hỏi dân làng, quan sát dấu chân và kiểm tra máng nước trước.');
      if (countItem(state, 'wood') < 6 || countItem(state, 'stone') < 3) return result(false, 'Cần 6 gỗ và 3 đá để sửa máng nước.');
      if (!spendEnergy(state, 8)) return result(false, 'Bạn cần nghỉ để có sức sửa máng.');
      removeItems(state.inventory, 'wood', 6);
      removeItems(state.inventory, 'stone', 3);
      q.channelFixed = true;
      advanceTime(state, 15);
      return result(true, 'Nước bắt đầu róc rách qua máng. Bên kia bờ, V-01 lặng lẽ quan sát bạn.', ['quest', 'inventory']);
    case 'clear_bank':
      if (!q.channelFixed) return result(false, 'Hãy khơi lại dòng nước trước.');
      if (q.bankCleared) return result(false, 'Bờ sông đã sạch.');
      if (!spendEnergy(state, 4)) return result(false, 'Bạn cần nghỉ ngơi.');
      q.bankCleared = true;
      advanceTime(state, 5);
      return result(true, 'Bờ sông đã sạch hơn. Xới ô đất ven sông rồi gieo và tưới hạt quả mọng.', ['quest']);
    case 'meet_v01':
      q.seen = true;
      updateQuest(state);
      if (q.friend) return result(true, 'V-01 cọ nhẹ vào chân bạn.');
      if (!q.returned) return result(true, q.berryWatered ? 'V-01 còn dè chừng. Hãy nghỉ qua đêm rồi quay lại khi bụi quả đã lớn.' : 'V-01 nhìn bạn từ xa rồi lùi vào đám cỏ. Hãy giúp bờ sông trở lại yên bình.');
      return result(true, 'V-01 đến uống nước rồi tiến lại vài bước. Nó đặt một chiếc lá trước bạn. Bạn có thể nhẹ nhàng đưa tay ra.', ['friendship_ready']);
    case 'befriend_v01':
      if (q.friend) return result(false, 'V-01 đã là bạn đồng hành của bạn.');
      if (!q.returned) return result(false, 'V-01 chưa sẵn sàng. Hãy chăm sóc bờ sông và cho nó thêm thời gian.');
      if (!['hand', 'berry'].includes(payload.method)) return result(false, 'Hãy chọn đưa tay ra hoặc đặt một quả mọng xuống đất.');
      if (state.gold + 80 > MAX_GOLD) return result(false, 'Số dư vàng đã đạt giới hạn.');
      if (payload.method === 'berry' && !removeItems(state.inventory, 'berry', 1)) return result(false, 'Bạn chưa có quả mọng. Có thể chọn đưa tay ra.');
      q.friend = true;
      q.rewardClaimed = true;
      state.creatures = ['V01'];
      state.gold += 80;
      state.stats.goldEarned += 80;
      return result(true, 'V-01 đã tự chọn ở bên bạn! V-01 gia nhập đội và đi cùng bạn. Nhận 80 vàng từ lời cảm ơn của dân làng.', ['friendship', 'quest', 'gold', 'save']);
    case 'transfer': {
      const { itemId, quantity = 1, to = 'chest' } = payload;
      if (!['chest', 'inventory'].includes(to) || !owns(ITEMS, itemId) || !validAmount(quantity)) return result(false, 'Thao tác chuyển đồ không hợp lệ.');
      const from = to === 'chest' ? 'inventory' : 'chest';
      if (available(state[from], itemId, true) < quantity) return result(false, 'Không đủ đồ để chuyển hoặc món đồ đang khóa.');
      if (capacity(state[to], itemId) < quantity) return result(false, 'Nơi nhận đã đầy.');
      removeItems(state[from], itemId, quantity, true);
      addItems(state[to], itemId, quantity);
      return result(true, `Đã chuyển ${quantity} ${ITEMS[itemId].name.toLowerCase()} ${to === 'chest' ? 'vào rương' : 'vào túi'}.`, ['inventory']);
    }
    case 'sort': {
      state.inventory.sort((a, b) => !a && !b ? 0 : !a ? 1 : !b ? -1 : a.id.localeCompare(b.id));
      return result(true, 'Đã sắp xếp túi.', ['inventory']);
    }
    case 'move_slot': {
      const { from, to } = payload;
      if (!validSlotIndex(from) || !validSlotIndex(to) || from === to) return result(false, 'Chọn hai ô khác nhau trong túi.');
      const source = state.inventory[from];
      const target = state.inventory[to];
      if (!source) return result(false, 'Ô nguồn không có vật phẩm.');
      if (target && source.id === target.id && source.locked === target.locked) {
        const amount = Math.min(source.quantity, ITEMS[target.id].stack - target.quantity);
        if (amount === 0) return result(false, 'Chồng vật phẩm ở ô nhận đã đầy.');
        target.quantity += amount;
        source.quantity -= amount;
        if (source.quantity === 0) state.inventory[from] = null;
      } else {
        state.inventory[from] = target;
        state.inventory[to] = source;
      }
      return result(true, 'Đã di chuyển vật phẩm trong túi.', ['inventory']);
    }
    case 'split_slot': {
      const { from, to, quantity } = payload;
      if (!validSlotIndex(from) || !validSlotIndex(to) || from === to || !validAmount(quantity)) return result(false, 'Ô túi hoặc số lượng tách không hợp lệ.');
      const source = state.inventory[from];
      if (!source || quantity >= source.quantity) return result(false, 'Số lượng tách phải nhỏ hơn số lượng trong chồng.');
      if (state.inventory[to]) return result(false, 'Hãy chọn một ô trống để tách chồng.');
      state.inventory[to] = { id: source.id, quantity, locked: source.locked };
      source.quantity -= quantity;
      return result(true, 'Đã tách chồng vật phẩm.', ['inventory']);
    }
    case 'lock_slot': {
      const { index } = payload;
      if (!validSlotIndex(index) || !state.inventory[index]) return result(false, 'Hãy chọn một ô có vật phẩm.');
      const slot = state.inventory[index];
      slot.locked = !slot.locked;
      return result(true, slot.locked ? 'Đã khóa vật phẩm để tránh bán hoặc chuyển nhầm.' : 'Đã mở khóa vật phẩm.', ['inventory']);
    }
    case 'upgrade_house': {
      if (state.upgrades.house >= 1) return result(false, 'Ngôi nhà đã được nâng cấp trong bản chơi này.');
      if (state.gold < 120 || countItem(state, 'wood') < 12 || countItem(state, 'stone') < 6) return result(false, 'Cần 120 vàng, 12 gỗ và 6 đá để nâng cấp nhà.');
      removeItems(state.inventory, 'wood', 12);
      removeItems(state.inventory, 'stone', 6);
      state.gold -= 120;
      state.upgrades.house = 1;
      return result(true, 'Bạn gia cố mái, tường và sàn gỗ. Ngôi nhà đã vững chãi và ấm cúng hơn.', ['house', 'inventory', 'gold', 'save']);
    }
    default: return result(false, 'Hành động chưa được hỗ trợ.');
  }
}

export function getQuestObjective(state) {
  const q = state.quest;
  if (q.friend) return 'Bạn đồng hành đầu tiên • V-01 đã gia nhập đội. Tiếp tục trồng trọt, khai thác và khám phá thung lũng.';
  if (!q.seen) return 'Một thế giới xa lạ • Khám phá nông trại và tìm bóng xanh bên dòng sông.';
  if (!q.accepted) return 'Dấu vết bên dòng nước • Hỏi người dân gần bến về V-01.';
  if (!q.tracks || !q.channelInspected) return `Dấu vết bên dòng nước • ${!q.tracks ? 'Quan sát dấu chân. ' : ''}${!q.channelInspected ? 'Kiểm tra máng nước cũ.' : ''}`;
  if (!q.channelFixed) return `Khơi lại dòng nước • Sửa máng: gỗ ${Math.min(6, countItem(state, 'wood'))}/6, đá ${Math.min(3, countItem(state, 'stone'))}/3.`;
  if (!q.bankCleared) return 'Chăm sóc bờ sông • Dọn vật cản cạnh máng nước.';
  if (!q.berryPlanted) return 'Chăm sóc bờ sông • Xới đất và gieo hạt quả mọng ở luống ven sông.';
  if (!q.berryWatered) return 'Chăm sóc bờ sông • Tưới cây quả mọng ven sông.';
  if (!q.returned) return 'Một nơi an toàn • Nghỉ qua đêm tại nhà, rồi trở lại bờ sông.';
  return 'Để V-01 tự quyết định • Nhẹ nhàng đến gần V-01 và đưa tay ra.';
}

export function getSummary(state) {
  const clock = clockAt(state.minutes);
  return {
    day: state.day, time: `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`,
    isNight: clock.hour >= 19 || clock.hour < 6,
    gold: state.gold, energy: Math.floor(state.energy), inventoryUsed: state.inventory.filter(Boolean).length,
    quest: getQuestObjective(state), following: state.quest.friend,
  };
}

function exactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function validateSlots(slots) {
  return Array.isArray(slots) && slots.length === INVENTORY_SIZE && Array.from(slots).every(slot => slot === null || (
    exactKeys(slot, ['id', 'quantity', 'locked']) && owns(ITEMS, slot.id) && Number.isSafeInteger(slot.quantity) &&
    slot.quantity > 0 && slot.quantity <= ITEMS[slot.id].stack && typeof slot.locked === 'boolean'
  ));
}
export function validateState(state) {
  const base = createState();
  if (!exactKeys(state, Object.keys(base)) || state.version !== SAVE_VERSION || !Number.isSafeInteger(state.gold) || !boundedNumber(state.gold, 0, MAX_GOLD)) return false;
  if (!boundedNumber(state.minutes, 0, MAX_MINUTES) || state.day !== dayAt(state.minutes) || !boundedNumber(state.energy, 0, 100)) return false;
  if (!validateSlots(state.inventory) || !validateSlots(state.chest)) return false;
  if (!exactKeys(state.plots, Object.keys(base.plots)) || !Object.keys(base.plots).every(id => {
    const p = state.plots[id];
    return exactKeys(p, ['tilled', 'crop']) && typeof p.tilled === 'boolean' && (p.crop === null || (
      p.tilled && exactKeys(p.crop, ['id', 'growth', 'wateredDay']) && owns(CROPS, p.crop.id) &&
      (id !== 'river_berry' || p.crop.id === 'berry') && boundedNumber(p.crop.growth, 0, CROPS[p.crop.id].growth) &&
      Number.isInteger(p.crop.wateredDay) && p.crop.wateredDay >= 0 && p.crop.wateredDay <= state.day &&
      (p.crop.growth === 0 || p.crop.wateredDay > 0)
    ));
  })) return false;
  if (!exactKeys(state.resources, Object.keys(RESOURCE_NODES)) || !Object.keys(RESOURCE_NODES).every(id =>
    exactKeys(state.resources[id], ['harvestedDay']) && Number.isInteger(state.resources[id].harvestedDay) &&
    state.resources[id].harvestedDay >= 0 && state.resources[id].harvestedDay <= state.day
  )) return false;
  const q = state.quest;
  if (!exactKeys(q, Object.keys(base.quest)) || ![...QUEST_FLAGS, 'sleptAfterWater', 'rewardClaimed'].every(key => typeof q[key] === 'boolean')) return false;
  if (!(q.wateredAt === null || boundedNumber(q.wateredAt, 0, state.minutes))) return false;
  if (q.accepted && !q.seen || (q.tracks || q.channelInspected) && !q.accepted ||
      q.channelFixed && !(q.accepted && q.tracks && q.channelInspected) || q.bankCleared && !q.channelFixed ||
      q.berryPlanted && !q.bankCleared || q.berryWatered && (q.wateredAt === null || !q.berryPlanted) ||
      !q.berryWatered && (q.wateredAt !== null || q.berryGrown || q.sleptAfterWater) ||
      q.berryGrown && state.minutes < q.wateredAt + CROPS.berry.growth ||
      q.sleptAfterWater && state.stats?.slept < 1 ||
      q.returned !== (q.channelFixed && q.bankCleared && q.berryGrown && q.sleptAfterWater) ||
      q.friend && !q.returned || q.rewardClaimed !== q.friend) return false;
  const river = state.plots.river_berry;
  if (river.tilled && !q.bankCleared || river.crop && !q.berryPlanted || q.berryPlanted && !q.berryGrown && !river.crop) return false;
  if (q.berryWatered && !q.berryGrown && river.crop?.wateredDay === 0) return false;
  if (q.berryWatered && river.crop?.growth >= CROPS.berry.growth && !q.berryGrown) return false;
  if (!Array.isArray(state.creatures) || state.creatures.length !== (q.friend ? 1 : 0) || (q.friend && state.creatures[0] !== 'V01')) return false;
  if (!exactKeys(state.player, Object.keys(base.player)) || !boundedNumber(state.player.x, 0, 1536) || !boundedNumber(state.player.y, 0, 1024) || !['up', 'down', 'left', 'right'].includes(state.player.facing)) return false;
  if (!exactKeys(state.stats, Object.keys(base.stats)) || !Object.keys(base.stats).every(key => Number.isSafeInteger(state.stats[key]) && state.stats[key] >= 0)) return false;
  if (!Array.isArray(state.tools) || state.tools.length !== base.tools.length || new Set(state.tools).size !== base.tools.length || Array.from(state.tools).some(tool => !base.tools.includes(tool))) return false;
  if (!exactKeys(state.upgrades, ['house']) || ![0, 1].includes(state.upgrades.house)) return false;
  if (!exactKeys(state.flags, Object.keys(base.flags)) || typeof state.flags.introCompleted !== 'boolean') return false;
  if (!exactKeys(state.session, Object.keys(base.session)) || !['home', 'intro', 'game', 'map', 'cinema'].includes(state.session.screen) || !Number.isInteger(state.session.introIndex) || state.session.introIndex < 0 || state.session.introIndex > 100) return false;
  return true;
}
export function serializeState(state) {
  if (!validateState(state)) throw new Error('Trạng thái lưu không hợp lệ.');
  return JSON.stringify(state);
}
export function deserializeState(text) {
  try {
    if (typeof text !== 'string' || text.length > 250000) return null;
    const parsed = JSON.parse(text);
    return validateState(parsed) ? copy(parsed) : null;
  } catch { return null; }
}
