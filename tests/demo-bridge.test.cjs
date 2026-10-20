'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('friend demo never accesses TV APIs, power clients, storage or network, even without a preview query', async () => {
  const window = { location: { search: '' } };
  for (const name of ['tizen', 'WebSocket', 'XMLHttpRequest', 'localStorage', 'homePower']) {
    Object.defineProperty(window, name, { get() { throw new Error('Demo accessed ' + name); } });
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../web/tv-bridge.js'), 'utf8'), { window, Promise });
  const bridge = window.tvBridge;
  assert.equal(bridge.mode, 'preview');
  const sources = await bridge.getSources();
  assert.equal(sources.length, 4); assert.ok(sources.every(item => item.connected === null));
  for (const number of [1,2,3,4]) assert.equal((await bridge.selectSource({ type: 'HDMI', number })).preview, true);
  assert.equal((await bridge.openSettings()).preview, true);
  assert.equal((await bridge.openSamsungHome()).preview, true);
  assert.equal((await bridge.prepareStandby()).preview, true);
  assert.equal((await bridge.powerOff(() => true)).requestSent, false);
});
