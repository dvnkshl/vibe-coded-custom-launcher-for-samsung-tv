(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.yearProgress = factory(); }
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var DAY = 86400000;
  function calculate(calendar) {
    var year = calendar.year;
    var start = Date.UTC(year, 0, 1);
    var end = Date.UTC(year + 1, 0, 1);
    var totalDays = (end - start) / DAY;
    var daysLeft = Math.max(0, Math.min(totalDays, calendar.daysLeft));
    var today = end - daysLeft * DAY;
    var percentage = (today - start) / (end - start) * 100;
    var remaining = 100 - percentage;
    var quarters = [];
    var dividers = [];
    var quarter = 1;
    for (var i = 0; i < 4; i += 1) {
      var quarterStart = Date.UTC(year, i * 3, 1);
      var quarterEnd = Date.UTC(year, (i + 1) * 3, 1);
      quarters.push((quarterEnd - quarterStart) / DAY);
      if (i < 3) { dividers.push((quarterEnd - start) / (end - start) * 100); }
      if (today >= quarterStart) { quarter = i + 1; }
    }
    return { year:year, quarter:quarter, percentage:percentage, remaining:remaining, daysLeft:daysLeft,
      remainingText:daysLeft + (daysLeft === 1 ? ' day left this year' : ' days left this year'),
      quarterDays:quarters, dividers:dividers };
  }
  return { calculate:calculate };
}));
