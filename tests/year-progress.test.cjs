const assert = require('node:assert/strict');
const test = require('node:test');
const homeInfo = require('../web/home-info.js');
const yearProgress = require('../web/year-progress.js');

for (const [time, year, daysLeft, quarter] of [
  ['2026-10-20T06:59:59Z', 2026, 74, 4],
  ['2026-10-20T07:00:00Z', 2026, 73, 4],
  ['2026-12-31T20:00:00Z', 2026, 1, 4],
  ['2027-01-01T07:00:00Z', 2027, 365, 1],
  ['2024-02-29T20:00:00Z', 2024, 307, 1],
  ['2024-04-01T07:00:00Z', 2024, 275, 2]
]) {
  test('year bar follows Vancouver calendar at ' + time, () => {
    const progress = yearProgress.calculate(homeInfo.calendarInfo(new Date(time)));
    assert.equal(progress.year, year);
    assert.equal(progress.daysLeft, daysLeft);
    assert.equal(progress.quarter, quarter);
    assert.equal(progress.remainingText, daysLeft + (daysLeft === 1 ? ' day left this year' : ' days left this year'));
    const days = year % 4 === 0 ? 366 : 365;
    assert.equal(progress.quarterDays.reduce((sum, count) => sum + count, 0), days);
    assert.ok(Math.abs(progress.percentage - (days - daysLeft) / days * 100) < 0.000001);
  });
}
