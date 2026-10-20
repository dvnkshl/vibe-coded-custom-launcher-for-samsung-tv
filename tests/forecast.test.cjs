const assert = require('node:assert/strict');
const test = require('node:test');
const info = require('../web/home-info.js');

const now = Date.parse('2026-10-20T00:30:00Z'); // 17:30 in Vancouver.
function payload() {
  return {
    current_units: {temperature_2m: '°C'},
    current: {temperature_2m: 12, weather_code: 2, is_day: 1, time: now / 1000 - 600},
    daily: {temperature_2m_max: [14], temperature_2m_min: [8],
      sunrise: [Date.parse('2026-10-19T14:40:00Z') / 1000], sunset: [Date.parse('2026-10-20T01:12:00Z') / 1000]},
    hourly_units: {temperature_2m: '°C', precipitation_probability: '%', precipitation: 'mm'},
    hourly: {time: Array.from({length: 8}, (_, i) => Date.parse('2026-10-20T01:00:00Z') / 1000 + i * 3600),
      temperature_2m: [12,11,10,10,9,8,7,7], precipitation_probability: [0,10,70,80,40,20,10,0],
      precipitation: [0,0,0.8,1.2,0.2,0,0,0], weather_code: [2,2,61,63,61,2,1,0]}
  };
}

test('rain timing uses upcoming hour-ending periods and Vancouver time', () => {
  const value = info.normalizeWeather(payload(), now);
  assert.equal(info.nextHours(value, now).length, 6);
  assert.equal(info.forecastSummary(value, now), 'Rain likely by 8 PM');
  assert.equal(info.forecastSummary(value, now + 3600000), 'Rain likely by 8 PM');
  value.hours[2].code = 73;
  assert.equal(info.forecastSummary(value, now), 'Snow likely by 8 PM');
});

test('missing, stale, malformed and gapped forecasts cannot claim dry weather', () => {
  const value = info.normalizeWeather(payload(), now);
  assert.equal(info.nextHours({...value, hours: value.hours.slice(1)}, now).length, 0);
  assert.equal(info.nextHours({...value, hours: [value.hours[0], ...value.hours]}, now).length, 0);
  assert.equal(info.nextHours({...value, fetchedAt: now - 13 * 3600000}, now).length, 0);
  assert.equal(info.nextHours({...value, fetchedAt: now + 3600000}, now).length, 0);
  const malformed = payload(); malformed.hourly.precipitation_probability[0] = null;
  assert.equal(info.forecastSummary(info.normalizeWeather(malformed, now), now), 'Hourly forecast unavailable');
  const wrongUnits = payload(); wrongUnits.hourly_units.precipitation = 'inch';
  assert.equal(info.forecastSummary(info.normalizeWeather(wrongUnits, now), now), 'Hourly forecast unavailable');
});

test('dry and uncertain forecasts keep their probability distinction', () => {
  const value = info.normalizeWeather(payload(), now);
  value.hours.forEach(row => {row.chance = 10; row.precipitation = 0;});
  assert.equal(info.forecastSummary(value, now), 'Mostly dry over the next 6 hours');
  value.hours[1].chance = 40;
  assert.equal(info.forecastSummary(value, now), 'Up to 40% precipitation chance');
});

test('backdrop changes across actual sunrise and sunset, with a local-time fallback', () => {
  const value = info.normalizeWeather(payload(), now);
  assert.equal(info.skyPhase(value, Date.parse('2026-10-19T14:00:00Z')), 'night');
  assert.equal(info.skyPhase(value, Date.parse('2026-10-19T14:20:00Z')), 'dawn');
  assert.equal(info.skyPhase(value, Date.parse('2026-10-19T17:00:00Z')), 'day');
  assert.equal(info.skyPhase(value, now), 'dusk');
  assert.equal(info.skyPhase(value, Date.parse('2026-10-20T02:00:00Z')), 'night');
  assert.equal(info.skyPhase(value, Date.parse('2026-10-20T20:00:00Z')), 'day');
  assert.equal(info.skyPhase(null, Date.parse('2027-01-01T08:00:00Z')), 'night');
});
