(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.homeInfo = factory(); }
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var ZONE = 'America/Vancouver';
  var ENDPOINT = 'https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&forecast_days=2&timezone=America%2FVancouver&timeformat=unixtime';
  var CACHE = 'q80b.launcher.vancouver-weather.v2';
  var ICONS = {
    sun: '<circle cx="24" cy="24" r="8"/><path d="M24 3v6m0 30v6M3 24h6m30 0h6M9 9l4 4m22 22 4 4M9 39l4-4M35 13l4-4"/>',
    moon: '<path d="M35 35A18 18 0 0 1 15 8a18 18 0 1 0 20 27Z"/>',
    cloud: '<path d="M14 36h23a8 8 0 0 0 0-16h-2a12 12 0 0 0-23-2 9 9 0 0 0 2 18Z"/>',
    rain: '<path d="M12 29h26a7 7 0 0 0-2-14 11 11 0 0 0-21-2 8 8 0 0 0-3 16Zm4 6-3 7m13-7-3 7m13-7-3 7"/>',
    snow: '<path d="M12 28h26a7 7 0 0 0-2-14 11 11 0 0 0-21-2 8 8 0 0 0-3 16Zm4 9v6m-3-3h6m10-3v6m-3-3h6m9-3v6m-3-3h6"/>',
    fog: '<path d="M12 25h26a7 7 0 0 0-2-14 11 11 0 0 0-21-2 8 8 0 0 0-3 16ZM6 33h35M11 41h25"/>',
    thunder: '<path d="M12 28h26a7 7 0 0 0-2-14 11 11 0 0 0-21-2 8 8 0 0 0-3 16Zm14 1-8 11h8l-3 7 12-14h-9Z"/>'
  };

  // Vancouver adopted permanent UTC-7 on 2026-03-08. Older TV timezone
  // databases still predict a November fallback, so do not depend on them.
  // https://news.gov.bc.ca/releases/2026AG0013-000209
  function vancouverDate(now) {
    var daylight = now.getTime() >= Date.UTC(2026, 2, 8, 10);
    if (!daylight) {
      var y = now.getUTCFullYear();
      var marchSunday = 1 + ((7 - new Date(Date.UTC(y, 2, 1)).getUTCDay()) % 7) + 7;
      var novemberSunday = 1 + ((7 - new Date(Date.UTC(y, 10, 1)).getUTCDay()) % 7);
      daylight = now.getTime() >= Date.UTC(y, 2, marchSunday, 10) && now.getTime() < Date.UTC(y, 10, novemberSunday, 9);
    }
    return new Date(now.getTime() - (daylight ? 7 : 8) * 3600000);
  }
  function clockText(now) {
    var local = vancouverDate(now);
    var hour = local.getUTCHours();
    return (hour % 12 || 12) + ':' + ('0' + local.getUTCMinutes()).slice(-2) + (hour < 12 ? ' AM' : ' PM');
  }
  function calendarInfo(now) {
    var local = vancouverDate(now);
    var year = local.getUTCFullYear();
    var month = local.getUTCMonth();
    var day = local.getUTCDate();
    return { year: year, daysLeft: Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, month, day)) / 86400000) };
  }

  function conditions(code, isDay) {
    if (code === 0) { return { label: isDay ? 'Clear skies' : 'Clear night', icon: isDay ? 'sun' : 'moon' }; }
    if (code === 1) { return { label: 'Mainly clear', icon: isDay ? 'sun' : 'moon' }; }
    if (code === 2) { return { label: 'Partly cloudy', icon: 'cloud' }; }
    if (code === 3) { return { label: 'Overcast', icon: 'cloud' }; }
    if (code === 45 || code === 48) { return { label: 'Fog', icon: 'fog' }; }
    if ([51, 53, 55, 56, 57].indexOf(code) !== -1) { return { label: 'Drizzle', icon: 'rain' }; }
    if ([61, 63, 65, 66, 67, 80, 81, 82].indexOf(code) !== -1) { return { label: 'Rain', icon: 'rain' }; }
    if ([71, 73, 75, 77, 85, 86].indexOf(code) !== -1) { return { label: 'Snow', icon: 'snow' }; }
    if ([95, 96, 99].indexOf(code) !== -1) { return { label: 'Thunderstorms', icon: 'thunder' }; }
    return { label: 'Conditions unavailable', icon: 'cloud' };
  }

  function number(value) { return typeof value === 'number' && isFinite(value); }
  function dateKey(timestamp) {
    var local = vancouverDate(new Date(timestamp));
    return local.getUTCFullYear() + '-' + local.getUTCMonth() + '-' + local.getUTCDate();
  }
  function validHour(row) {
    return row && number(row.time) && number(row.temperature) && row.temperature >= -100 && row.temperature <= 70 &&
      number(row.chance) && row.chance >= 0 && row.chance <= 100 && number(row.precipitation) &&
      row.precipitation >= 0 && row.precipitation <= 500 && number(row.code);
  }
  function nextHours(value, now) {
    if (!value || !number(value.fetchedAt) || now - value.fetchedAt > 12 * 3600000 || value.fetchedAt > now + 1200000 ||
        !Array.isArray(value.hours)) { return []; }
    var endOfHour = Math.floor(now / 3600000) * 3600000 + 3600000;
    var rows = value.hours.filter(function (row) { return validHour(row) && row.time >= endOfHour; }).slice(0, 6);
    if (rows.length !== 6 || rows.some(function (row, i) { return row.time !== endOfHour + i * 3600000; })) { return []; }
    return rows;
  }
  function forecastSummary(value, now) {
    var rows = nextHours(value, now);
    if (!rows.length) { return 'Hourly forecast unavailable'; }
    var wet = rows.filter(function (row) { return row.chance >= 50 && row.precipitation >= 0.1; })[0];
    if (wet) {
      var kind = conditions(wet.code, true).icon === 'snow' ? 'Snow' : 'Rain';
      return kind + ' likely by ' + clockText(new Date(wet.time)).replace(':00', '');
    }
    var peak = Math.round(Math.max.apply(Math, rows.map(function (row) { return row.chance; })));
    return peak >= 20 ? 'Up to ' + peak + '% precipitation chance' : 'Mostly dry over the next 6 hours';
  }
  function skyPhase(value, now) {
    if (value && number(value.sunrise) && number(value.sunset) && value.sunset > value.sunrise &&
        value.sunset - value.sunrise < 24 * 3600000 && dateKey(value.sunrise) === dateKey(now)) {
      if (now < value.sunrise - 30 * 60000 || now >= value.sunset + 45 * 60000) { return 'night'; }
      if (now < value.sunrise + 30 * 60000) { return 'dawn'; }
      if (now >= value.sunset - 45 * 60000) { return 'dusk'; }
      return 'day';
    }
    // Time-only fallback when solar data is unavailable. Do not reuse yesterday's sunset.
    var local = vancouverDate(new Date(now));
    var hour = local.getUTCHours() + local.getUTCMinutes() / 60;
    return hour < 7 || hour >= 20 ? 'night' : hour < 8 ? 'dawn' : hour >= 18 ? 'dusk' : 'day';
  }
  function normalizeWeather(payload, now) {
    var current = payload && payload.current;
    if (!current || !number(current.temperature_2m) || current.temperature_2m < -100 || current.temperature_2m > 70 ||
        !number(current.weather_code) || !number(current.time) || current.time * 1000 > now + 20 * 60000 ||
        current.time * 1000 < now - 2 * 3600000 || (payload.current_units && payload.current_units.temperature_2m !== '°C')) {
      throw new Error('Weather response is invalid or out of date');
    }
    var daily = payload.daily || {};
    var high = daily.temperature_2m_max && daily.temperature_2m_max[0];
    var low = daily.temperature_2m_min && daily.temperature_2m_min[0];
    var value = { temperature: Math.round(current.temperature_2m), code: current.weather_code, isDay: current.is_day === 1,
      high: number(high) ? Math.round(high) : null, low: number(low) ? Math.round(low) : null,
      observedAt: current.time * 1000, fetchedAt: now };
    var rise = daily.sunrise && daily.sunrise[0];
    var set = daily.sunset && daily.sunset[0];
    if (number(rise) && number(set) && set > rise && dateKey(rise * 1000) === dateKey(now)) {
      value.sunrise = rise * 1000; value.sunset = set * 1000;
    }
    var hourly = payload.hourly;
    var units = payload.hourly_units;
    var keys = ['temperature_2m', 'precipitation_probability', 'precipitation', 'weather_code'];
    if (hourly && Array.isArray(hourly.time) && hourly.time.length <= 72 && units && units.temperature_2m === '°C' &&
        units.precipitation_probability === '%' && units.precipitation === 'mm' &&
        keys.every(function (key) { return Array.isArray(hourly[key]) && hourly[key].length === hourly.time.length; })) {
      value.hours = hourly.time.map(function (time, i) {
        return { time: number(time) ? time * 1000 : NaN, temperature: hourly.temperature_2m[i], chance: hourly.precipitation_probability[i],
          precipitation: hourly.precipitation[i], code: hourly.weather_code[i] };
      }).filter(function (row) { return validHour(row) && row.time >= now - 24 * 3600000 && row.time <= now + 60 * 3600000; });
    }
    return value;
  }

  function mountWeather(doc) {
    var win = doc.defaultView;
    var busy = false;
    var latest = null;
    var saved = true;
    function renderForecast(value, offline) {
      var now = Date.now();
      var rows = nextHours(value, now);
      var summary = forecastSummary(value, now);
      doc.getElementById('forecast-summary').textContent = summary;
      doc.getElementById('forecast-freshness').textContent = !rows.length ? 'Retries automatically' : offline ?
        'Saved forecast · refreshes automatically' : 'Updated ' + clockText(new Date(value.fetchedAt));
      doc.getElementById('forecast-hours').hidden = !rows.length;
      var list = doc.getElementById('forecast-rows');
      while (list.firstChild) { list.removeChild(list.firstChild); }
      rows.forEach(function (row) {
        var item = doc.createElement('div'); item.className = 'forecast-row'; item.setAttribute('role', 'row');
        [clockText(new Date(row.time)).replace(':00', ''), Math.round(row.temperature) + '°',
          Math.round(row.chance) + '%', row.precipitation.toFixed(1) + ' mm'].forEach(function (text) {
          var cell = doc.createElement('span'); cell.setAttribute('role', 'cell'); cell.textContent = text; item.appendChild(cell);
        });
        list.appendChild(item);
      });
      var solar = value && number(value.sunset) && dateKey(value.sunset) === dateKey(now);
      doc.getElementById('forecast-sunset').textContent = solar ? 'Sunset ' + clockText(new Date(value.sunset)) : '';
      var hint = doc.getElementById('weather-rain');
      hint.textContent = rows.length && /likely/.test(summary) ? (offline ? 'Saved · ' : '') + summary : '';
      hint.hidden = !hint.textContent;
      doc.body.setAttribute('data-sky', skyPhase(value, now));
    }
    function render(value, offline) {
      saved = offline;
      var description = conditions(value.code, value.isDay);
      doc.getElementById('weather-temperature').textContent = value.temperature + '°';
      doc.getElementById('weather-condition').textContent = description.label;
      doc.getElementById('weather-range').textContent = value.high !== null && value.low !== null ? 'H ' + value.high + '°  L ' + value.low + '°' : '';
      doc.getElementById('weather-icon').innerHTML = '<svg viewBox="0 0 48 48">' + ICONS[description.icon] + '</svg>';
      var age = Math.max(0, Math.round((Date.now() - value.observedAt) / 60000));
      doc.getElementById('weather-updated').textContent = offline ? 'Saved · ' + (age < 60 ? age + ' min ago' : Math.floor(age / 60) + ' hr ago') : '';
      doc.getElementById('weather-updated').hidden = !offline;
      renderForecast(value, offline);
    }
    try {
      var cached = JSON.parse(win.localStorage.getItem(CACHE));
      if (cached && number(cached.temperature) && number(cached.observedAt) && cached.observedAt <= Date.now() + 1200000 && Date.now() - cached.observedAt < 12 * 3600000) {
        latest = cached; render(latest, true);
      }
    } catch (ignore) { /* Weather storage is optional. */ }
    function unavailable() {
      busy = false;
      if (latest && Date.now() - latest.observedAt < 12 * 3600000) { render(latest, true); }
      else {
        latest = null;
        doc.getElementById('weather-temperature').textContent = '—';
        doc.getElementById('weather-condition').textContent = 'Weather unavailable';
        doc.getElementById('weather-range').textContent = '';
        doc.getElementById('weather-updated').textContent = 'Retries automatically';
        doc.getElementById('weather-updated').hidden = false;
        renderForecast(null, true);
      }
    }
    function refresh() {
      if (busy || doc.hidden) { return; }
      busy = true;
      try {
      var request = new win.XMLHttpRequest();
      request.open('GET', ENDPOINT, true);
      request.timeout = 8000;
      request.onload = function () {
        try {
          if (request.status !== 200) { throw new Error('Weather unavailable'); }
          latest = normalizeWeather(JSON.parse(request.responseText), Date.now());
          busy = false;
          try { win.localStorage.setItem(CACHE, JSON.stringify(latest)); } catch (ignore) {}
          render(latest, false);
        } catch (error) { unavailable(); }
      };
      request.onerror = unavailable; request.ontimeout = unavailable;
      request.send();
      } catch (error) { unavailable(); }
    }
    renderForecast(latest, true);
    refresh();
    win.setInterval(refresh, 15 * 60000);
    win.setInterval(function () {
      if (doc.hidden) { return; }
      if (latest && Date.now() - latest.observedAt >= 12 * 3600000) { unavailable(); }
      else if (latest) { render(latest, saved); }
      else { renderForecast(null, true); }
    }, 30000);
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) { refresh(); } });
  }
  return { calendarInfo: calendarInfo, clockText: clockText, conditions: conditions, normalizeWeather: normalizeWeather,
    nextHours: nextHours, forecastSummary: forecastSummary, skyPhase: skyPhase, mountWeather: mountWeather, endpoint: ENDPOINT };
}));
