import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, act, advanceTime, countItem, cropProgress, getSummary,
  serializeState, deserializeState, validateState, ITEMS, INVENTORY_SIZE,
} from '../game-state.js';

const snapshot = state => JSON.stringify(state);
function succeed(state, action, payload) {
  const response = act(state, action, payload);
  assert.equal(response.ok, true, `${action}: ${response.message}`);
  assert.equal(validateState(state), true, `${action} produced an invalid save`);
  return response;
}
function failWithoutChange(state, action, payload) {
  const before = snapshot(state);
  const response = act(state, action, payload);
  assert.equal(response.ok, false, `${action} should fail`);
  assert.equal(snapshot(state), before, `${action} changed state after failing`);
  return response;
}
function passTime(state, minutes) {
  assert.equal(advanceTime(state, minutes).ok, true);
  assert.equal(validateState(state), true);
}
function prepareRiver(state) {
  succeed(state, 'see_v01');
  succeed(state, 'talk_villager');
  succeed(state, 'inspect_tracks');
  succeed(state, 'inspect_channel');
  succeed(state, 'gather', { nodeId: 'wood_1' });
  succeed(state, 'gather', { nodeId: 'wood_2' });
  succeed(state, 'gather', { nodeId: 'stone_1' });
  succeed(state, 'repair_channel');
  succeed(state, 'clear_bank');
  succeed(state, 'till', { plotId: 'river_berry' });
  succeed(state, 'plant', { plotId: 'river_berry', cropId: 'berry' });
}
function totals(state) {
  return Object.fromEntries(Object.keys(ITEMS).map(id => [id, countItem(state, id) + countItem(state, id, 'chest')]));
}
const fullSlots = () => Array.from({ length: INVENTORY_SIZE }, () => ({ id: 'stone', quantity: ITEMS.stone.stack, locked: false }));

test('full river quest starts with a wild V-01 and unlocks one following companion and reward', () => {
  const state = createState();
  assert.deepEqual(state.player, { x: 770, y: 612, facing: 'up' });
  assert.equal(state.inventory.length, 30);
  assert.equal(state.chest.length, 30);
  assert.equal(getSummary(state).following, false);
  failWithoutChange(state, 'befriend_v01', { method: 'hand' });
  succeed(state, 'see_v01');
  assert.equal(state.creatures.length, 0);
  succeed(state, 'talk_villager');
  assert.equal(countItem(state, 'berry_seed'), 1);
  succeed(state, 'talk_villager');
  assert.equal(countItem(state, 'berry_seed'), 1, 'seed reward is given once');
  failWithoutChange(state, 'repair_channel');
  succeed(state, 'inspect_tracks');
  succeed(state, 'inspect_channel');
  failWithoutChange(state, 'repair_channel');
  for (const nodeId of ['wood_1', 'wood_2', 'stone_1']) succeed(state, 'gather', { nodeId });
  succeed(state, 'repair_channel');
  assert.equal(countItem(state, 'wood'), 0);
  assert.equal(countItem(state, 'stone'), 0);
  failWithoutChange(state, 'repair_channel');
  succeed(state, 'clear_bank');
  succeed(state, 'till', { plotId: 'river_berry' });
  succeed(state, 'plant', { plotId: 'river_berry', cropId: 'berry' });
  succeed(state, 'water', { plotId: 'river_berry' });
  passTime(state, 180);
  assert.equal(state.quest.berryGrown, true);
  assert.equal(state.quest.returned, false, 'growing the crop alone does not replace sleeping');
  failWithoutChange(state, 'befriend_v01', { method: 'hand' });
  succeed(state, 'harvest', { plotId: 'river_berry' });
  assert.equal(countItem(state, 'berry'), 4);
  succeed(state, 'sleep');
  assert.equal(state.quest.returned, true, 'harvesting before sleep preserves care progress');
  assert.deepEqual(succeed(state, 'meet_v01').events, ['friendship_ready']);
  failWithoutChange(state, 'befriend_v01', { method: 'invalid' });
  succeed(state, 'befriend_v01', { method: 'hand' });
  assert.equal(state.gold, 380);
  assert.deepEqual(state.creatures, ['V01']);
  assert.equal(getSummary(state).following, true);
  assert.equal(state.quest.rewardClaimed, true);
  failWithoutChange(state, 'befriend_v01', { method: 'berry' });
  assert.equal(state.gold, 380);
  assert.equal(countItem(state, 'berry'), 4);
});

test('berry friendship consumes exactly one berry and can be deferred without losing progress', () => {
  const state = createState();
  prepareRiver(state);
  succeed(state, 'water', { plotId: 'river_berry' });
  succeed(state, 'sleep');
  assert.equal(state.quest.returned, true);
  succeed(state, 'meet_v01');
  failWithoutChange(state, 'befriend_v01', { method: 'berry' });
  assert.equal(state.quest.returned, true);
  succeed(state, 'gather', { nodeId: 'berries_1' });
  succeed(state, 'befriend_v01', { method: 'berry' });
  assert.equal(countItem(state, 'berry'), 2);
  assert.equal(state.stats.goldEarned, 80);
});

test('crops grow only on watered days; crossing midnight requires another watering', () => {
  const state = createState();
  succeed(state, 'till', { plotId: 'farm_1' });
  succeed(state, 'plant', { plotId: 'farm_1', cropId: 'carrot' });
  passTime(state, 1410 - state.minutes);
  assert.equal(cropProgress(state, 'farm_1').ratio, 0);
  succeed(state, 'water', { plotId: 'farm_1' });
  failWithoutChange(state, 'water', { plotId: 'farm_1' });
  passTime(state, 1470 - state.minutes);
  assert.equal(state.day, 2);
  assert.equal(cropProgress(state, 'farm_1').growth, 30);
  assert.equal(cropProgress(state, 'farm_1').watered, false);
  passTime(state, 300);
  assert.equal(cropProgress(state, 'farm_1').growth, 30);
  succeed(state, 'water', { plotId: 'farm_1' });
  passTime(state, 208);
  assert.equal(cropProgress(state, 'farm_1').ready, true);
  succeed(state, 'harvest', { plotId: 'farm_1' });
  assert.equal(countItem(state, 'carrot'), 3);
  assert.equal(state.stats.harvested, 3);
  assert.equal(cropProgress(state, 'farm_1'), null);
  assert.equal(cropProgress(state, '__proto__'), null);
});

test('late-night quest watering cannot summon V-01 through elapsed clock time alone', () => {
  const state = createState();
  prepareRiver(state);
  passTime(state, 1410 - state.minutes);
  succeed(state, 'water', { plotId: 'river_berry' });
  succeed(state, 'sleep');
  assert.equal(cropProgress(state, 'river_berry').growth, 30);
  assert.equal(state.quest.returned, false);
  assert.equal(state.quest.berryGrown, false);
  failWithoutChange(state, 'befriend_v01', { method: 'hand' });
  succeed(state, 'water', { plotId: 'river_berry' });
  passTime(state, 148);
  assert.equal(state.quest.berryGrown, true);
  assert.equal(state.quest.returned, true);
});

test('buy, sell, chest transfer and sorting conserve items and spend/earn exact gold', () => {
  const state = createState();
  succeed(state, 'buy', { itemId: 'carrot_seed', quantity: 30 });
  assert.equal(state.gold, 60);
  assert.equal(countItem(state, 'carrot_seed'), 34);
  const before = totals(state);
  succeed(state, 'transfer', { itemId: 'carrot_seed', quantity: 31, to: 'chest' });
  assert.deepEqual(totals(state), before);
  assert.equal(countItem(state, 'carrot_seed'), 3);
  succeed(state, 'transfer', { itemId: 'carrot_seed', quantity: 31, to: 'inventory' });
  succeed(state, 'sort');
  assert.deepEqual(totals(state), before);
  succeed(state, 'sell', { itemId: 'carrot_seed', quantity: 30 });
  assert.equal(state.gold, 120);
  assert.equal(state.stats.goldEarned, 60);
  assert.equal(countItem(state, 'carrot_seed'), 4);
  failWithoutChange(state, 'sell', { itemId: 'carrot_seed', quantity: 5 });
  failWithoutChange(state, 'buy', { itemId: 'stone', quantity: 13 });
  for (const quantity of [0, -1, 0.5, NaN, Infinity, 10000, '1']) {
    failWithoutChange(state, 'buy', { itemId: 'stone', quantity });
    failWithoutChange(state, 'sell', { itemId: 'carrot_seed', quantity });
    failWithoutChange(state, 'transfer', { itemId: 'carrot_seed', quantity });
  }
});

test('stack boundaries and locked inventory cannot duplicate or discard goods', () => {
  const state = createState();
  state.gold = 10000;
  succeed(state, 'buy', { itemId: 'berry', quantity: 41 });
  assert.deepEqual(state.inventory.filter(slot => slot?.id === 'berry').map(slot => slot.quantity), [20, 20, 1]);
  const before = totals(state);
  succeed(state, 'transfer', { itemId: 'berry', quantity: 21 });
  assert.deepEqual(totals(state), before);
  assert.deepEqual(state.chest.filter(Boolean).map(slot => slot.quantity), [20, 1]);
  succeed(state, 'transfer', { itemId: 'berry', quantity: 21, to: 'inventory' });
  assert.deepEqual(totals(state), before);
  const locked = state.inventory.find(slot => slot?.id === 'berry' && slot.quantity === 20);
  locked.locked = true;
  failWithoutChange(state, 'sell', { itemId: 'berry', quantity: 22 });
  failWithoutChange(state, 'transfer', { itemId: 'berry', quantity: 22 });
  succeed(state, 'sell', { itemId: 'berry', quantity: 21 });
  assert.equal(countItem(state, 'berry'), 20);
  assert.equal(locked.quantity, 20);
  failWithoutChange(state, 'sell', { itemId: 'berry', quantity: 1 });
});

test('full containers preserve rewards, gathered resources, crops and gold on failure', () => {
  const state = createState();
  state.inventory = fullSlots();
  failWithoutChange(state, 'gather', { nodeId: 'wood_1' });
  failWithoutChange(state, 'buy', { itemId: 'berry', quantity: 1 });
  failWithoutChange(state, 'talk_villager');
  assert.equal(state.quest.accepted, false);
  assert.equal(state.resources.wood_1.harvestedDay, 0);
  state.chest = fullSlots();
  failWithoutChange(state, 'transfer', { itemId: 'stone', quantity: 1 });
  state.inventory = createState().inventory;
  succeed(state, 'till', { plotId: 'farm_1' });
  succeed(state, 'plant', { plotId: 'farm_1', cropId: 'carrot' });
  succeed(state, 'water', { plotId: 'farm_1' });
  passTime(state, 240);
  state.inventory = fullSlots();
  failWithoutChange(state, 'harvest', { plotId: 'farm_1' });
  assert.equal(cropProgress(state, 'farm_1').ready, true);
  state.inventory[0] = null;
  succeed(state, 'harvest', { plotId: 'farm_1' });
  assert.equal(countItem(state, 'carrot'), 3);
});

test('daily resources regrow after sleep and exhaustion preserves materials', () => {
  const state = createState();
  succeed(state, 'gather', { nodeId: 'wood_1' });
  failWithoutChange(state, 'gather', { nodeId: 'wood_1' });
  state.energy = 0;
  failWithoutChange(state, 'gather', { nodeId: 'wood_2' });
  failWithoutChange(state, 'till', { plotId: 'farm_1' });
  succeed(state, 'sleep');
  assert.equal(state.energy, 100);
  assert.equal(state.day, 2);
  succeed(state, 'gather', { nodeId: 'wood_1' });
  assert.equal(countItem(state, 'wood'), 6);
  succeed(state, 'gather', { nodeId: 'berries_1' });
  const energy = state.energy;
  succeed(state, 'eat', { itemId: 'berry' });
  assert.equal(state.energy, Math.min(100, energy + 16));
  assert.equal(countItem(state, 'berry'), 2);
  failWithoutChange(state, 'eat', { itemId: 'berry' });
});

test('one house upgrade consumes exactly its price and rejects incomplete or repeated payments', () => {
  const state = createState();
  failWithoutChange(state, 'upgrade_house');
  for (const nodeId of ['wood_1', 'wood_2', 'wood_3', 'wood_4', 'stone_1', 'stone_2']) succeed(state, 'gather', { nodeId });
  state.gold = 119;
  failWithoutChange(state, 'upgrade_house');
  state.gold = 300;
  succeed(state, 'upgrade_house');
  assert.equal(state.upgrades.house, 1);
  assert.equal(state.gold, 180);
  assert.equal(countItem(state, 'wood'), 0);
  assert.equal(countItem(state, 'stone'), 0);
  failWithoutChange(state, 'upgrade_house');
});

test('manual slot moves swap unlike stacks and merge matching stacks without losing overflow', () => {
  const state = createState();
  const before = totals(state);
  succeed(state, 'move_slot', { from: 0, to: 5 });
  assert.equal(state.inventory[0], null);
  assert.equal(state.inventory[5].id, 'carrot_seed');
  succeed(state, 'move_slot', { from: 5, to: 1 });
  assert.equal(state.inventory[5].id, 'wheat_seed');
  assert.equal(state.inventory[1].id, 'carrot_seed');
  assert.deepEqual(totals(state), before);
  state.inventory[0] = { id: 'berry', quantity: 8, locked: false };
  state.inventory[2] = { id: 'berry', quantity: 17, locked: false };
  const berries = totals(state);
  succeed(state, 'move_slot', { from: 0, to: 2 });
  assert.equal(state.inventory[2].quantity, 20);
  assert.equal(state.inventory[0].quantity, 5);
  assert.deepEqual(totals(state), berries);
  failWithoutChange(state, 'move_slot', { from: 0, to: 2 });
  succeed(state, 'move_slot', { from: 0, to: 3 });
  state.inventory[2].quantity = 14;
  succeed(state, 'move_slot', { from: 3, to: 2 });
  assert.equal(state.inventory[3], null);
  assert.equal(state.inventory[2].quantity, 19);
  state.inventory[3] = { id: 'berry', quantity: 3, locked: true };
  succeed(state, 'move_slot', { from: 3, to: 2 });
  assert.deepEqual(state.inventory[2], { id: 'berry', quantity: 3, locked: true });
  assert.deepEqual(state.inventory[3], { id: 'berry', quantity: 19, locked: false });
  failWithoutChange(state, 'move_slot', { from: 4, to: 0 });
  failWithoutChange(state, 'move_slot', { from: 2, to: 2 });
  for (const index of [-1, 30, 0.5, '1', NaN]) {
    failWithoutChange(state, 'move_slot', { from: index, to: 0 });
    failWithoutChange(state, 'move_slot', { from: 2, to: index });
  }
});

test('splitting stacks preserves quantities and lock flags, with atomic validation failures', () => {
  const state = createState();
  succeed(state, 'lock_slot', { index: 0 });
  const before = totals(state);
  succeed(state, 'split_slot', { from: 0, to: 3, quantity: 1 });
  assert.deepEqual(state.inventory[0], { id: 'carrot_seed', quantity: 3, locked: true });
  assert.deepEqual(state.inventory[3], { id: 'carrot_seed', quantity: 1, locked: true });
  assert.deepEqual(totals(state), before);
  failWithoutChange(state, 'split_slot', { from: 0, to: 1, quantity: 1 });
  failWithoutChange(state, 'split_slot', { from: 0, to: 0, quantity: 1 });
  failWithoutChange(state, 'split_slot', { from: 2, to: 4, quantity: 1 });
  for (const quantity of [0, -1, 0.5, 3, 4, '1', NaN, Infinity]) {
    failWithoutChange(state, 'split_slot', { from: 0, to: 4, quantity });
  }
  failWithoutChange(state, 'split_slot', { from: -1, to: 4, quantity: 1 });
  failWithoutChange(state, 'split_slot', { from: 0, to: 30, quantity: 1 });
});

test('locking a chosen slot blocks automatic sale/transfer and toggles without consuming items', () => {
  const state = createState();
  const before = totals(state);
  succeed(state, 'lock_slot', { index: 0 });
  assert.equal(state.inventory[0].locked, true);
  failWithoutChange(state, 'sell', { itemId: 'carrot_seed', quantity: 1 });
  failWithoutChange(state, 'transfer', { itemId: 'carrot_seed', quantity: 1 });
  succeed(state, 'lock_slot', { index: 0 });
  assert.equal(state.inventory[0].locked, false);
  assert.deepEqual(totals(state), before);
  failWithoutChange(state, 'lock_slot', { index: 2 });
  for (const index of [-1, 30, 0.5, '0', NaN]) failWithoutChange(state, 'lock_slot', { index });
});

test('malformed payloads and prototype property names fail safely without mutation', () => {
  const state = createState();
  for (const payload of [null, [], 'wood']) failWithoutChange(state, 'gather', payload);
  for (const id of ['__proto__', 'constructor', 'toString', 'missing']) {
    failWithoutChange(state, 'gather', { nodeId: id });
    failWithoutChange(state, 'buy', { itemId: id });
    failWithoutChange(state, 'sell', { itemId: id });
    failWithoutChange(state, 'eat', { itemId: id });
    failWithoutChange(state, 'transfer', { itemId: id });
    failWithoutChange(state, 'till', { plotId: id });
    failWithoutChange(state, 'plant', { plotId: 'farm_1', cropId: id });
  }
  succeed(state, 'till', { plotId: 'farm_1' });
  failWithoutChange(state, 'plant', { plotId: 'farm_1', cropId: '__proto__' });
  assert.equal(countItem(state, 'wood', '__proto__'), 0);
});

test('saves round-trip a progressing world without sharing mutable references', () => {
  const state = createState();
  prepareRiver(state);
  succeed(state, 'water', { plotId: 'river_berry' });
  passTime(state, 0.5);
  succeed(state, 'transfer', { itemId: 'carrot_seed', quantity: 2 });
  state.inventory.find(Boolean).locked = true;
  state.player.x = 803.25;
  state.flags.introCompleted = true;
  state.session.screen = 'game';
  const loaded = deserializeState(serializeState(state));
  assert.deepEqual(loaded, state);
  loaded.player.x++;
  loaded.chest.find(Boolean).quantity--;
  assert.notEqual(loaded.player.x, state.player.x);
  assert.equal(countItem(state, 'carrot_seed', 'chest'), 2);
  succeed(state, 'sleep');
  succeed(state, 'befriend_v01', { method: 'hand' });
  assert.deepEqual(deserializeState(serializeState(state)), state);
});

test('strict save validation rejects corrupt structure and impossible quest progress', () => {
  for (const text of ['', 'null', '[]', '{}', '{', 'x'.repeat(250001)]) assert.equal(deserializeState(text), null);
  const mutations = [
    state => { state.version = 2; },
    state => { state.gold = -1; },
    state => { state.gold = 0.5; },
    state => { state.day++; },
    state => { state.energy = 101; },
    state => { state.inventory.pop(); },
    state => { state.inventory[0].quantity = 100; },
    state => { state.inventory[0].id = 'constructor'; },
    state => { state.inventory[0].unexpected = true; },
    state => { delete state.inventory[0].locked; },
    state => { state.chest[0] = { id: 'berry', quantity: -2, locked: false }; },
    state => { state.plots.unexpected = { tilled: false, crop: null }; },
    state => { state.plots.farm_1.crop = { id: 'carrot', growth: 1, wateredDay: 0 }; },
    state => { state.resources.wood_1.harvestedDay = 2; },
    state => { state.resources.unexpected = { harvestedDay: 0 }; },
    state => { state.quest.accepted = true; },
    state => { state.quest.tracks = true; },
    state => { state.quest.wateredAt = state.minutes; },
    state => { state.quest.friend = true; state.creatures = ['V01']; },
    state => { state.quest.sleptAfterWater = true; },
    state => { state.tools.push('axe'); },
    state => { state.tools[3] = 'unknown_tool'; },
    state => { state.player.x = 1537; },
    state => { state.stats.gathered = Number.MAX_SAFE_INTEGER + 1; },
    state => { state.upgrades.house = 2; },
    state => { state.flags.introCompleted = 'yes'; },
    state => { state.session.screen = 'unknown'; },
    state => { state.unexpected = true; },
  ];
  for (const mutate of mutations) {
    const state = createState();
    mutate(state);
    assert.equal(validateState(state), false, mutate.toString());
    assert.equal(deserializeState(JSON.stringify(state)), null, mutate.toString());
    assert.throws(() => serializeState(state), /không hợp lệ/);
  }
  const sparse = createState();
  delete sparse.inventory[2];
  assert.equal(validateState(sparse), false);
  const quest = createState();
  prepareRiver(quest);
  succeed(quest, 'water', { plotId: 'river_berry' });
  quest.quest.berryGrown = true;
  assert.equal(validateState(quest), false, 'a newly planted crop cannot already be grown');
});
