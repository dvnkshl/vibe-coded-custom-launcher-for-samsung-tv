const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const info = require('../web/home-info.js');

test('countdown uses the Vancouver date across New Year and UTC midnight', () => {
  assert.deepEqual(info.calendarInfo(new Date('2027-01-01T06:59:59Z')), { year: 2026, daysLeft: 1 });
  assert.deepEqual(info.calendarInfo(new Date('2027-01-01T07:00:00Z')), { year: 2027, daysLeft: 365 });
  assert.deepEqual(info.calendarInfo(new Date('2026-10-19T23:00:00Z')), { year: 2026, daysLeft: 74 });
  assert.deepEqual(info.calendarInfo(new Date('2028-01-01T07:00:00Z')), { year: 2028, daysLeft: 366 });
});

test('countdown counts calendar days through Pacific DST changes', () => {
  assert.equal(info.calendarInfo(new Date('2026-03-08T09:30:00Z')).daysLeft,
    info.calendarInfo(new Date('2026-03-08T10:30:00Z')).daysLeft);
  assert.equal(info.calendarInfo(new Date('2026-11-01T08:30:00Z')).daysLeft,
    info.calendarInfo(new Date('2026-11-01T09:30:00Z')).daysLeft);
});

test('older TV timezone data cannot shift the Vancouver New Year boundary', () => {
  const sandbox = { module: { exports: {} }, Intl: undefined };
  vm.runInNewContext(fs.readFileSync(require.resolve('../web/home-info.js'), 'utf8'), sandbox);
  const result = sandbox.module.exports.calendarInfo(new Date('2027-01-01T06:30:00Z'));
  assert.equal(result.year, 2026); assert.equal(result.daysLeft, 1);
});

test('invalid or stale weather is rejected instead of shown as current', () => {
  const now = Date.parse('2026-10-19T21:00:00Z');
  const good = { current_units: { temperature_2m: '°C' }, current: {
    temperature_2m: 12.4, weather_code: 63, is_day: 1, time: now / 1000 - 600
  }, daily: { temperature_2m_max: [14.2], temperature_2m_min: [8.6] } };
  assert.deepEqual(info.normalizeWeather(good, now), { temperature: 12, code: 63, isDay: true,
    high: 14, low: 9, observedAt: now - 600000, fetchedAt: now });
  for (const current of [{ ...good.current, temperature_2m: NaN }, { ...good.current, time: now / 1000 - 10000 },
    { ...good.current, time: now / 1000 + 10000 }]) {
    assert.throws(() => info.normalizeWeather({ ...good, current }, now));
  }
  assert.throws(() => info.normalizeWeather({ ...good, current_units: { temperature_2m: '°F' } }, now));
  assert.equal(info.conditions(63, true).icon, 'rain');
  assert.equal(info.conditions(0, false).icon, 'moon');
});

test('Vancouver stays at UTC-7 in November after the 2026 change', () => {
  assert.equal(info.clockText(new Date('2026-11-01T09:30:00Z')), '2:30 AM');
  assert.equal(info.clockText(new Date('2026-12-31T23:05:00Z')), '4:05 PM');
});
