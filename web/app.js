(function () {
  'use strict';

  var STORAGE_KEY = 'q80b.launcher.layout.v1';
  var IDLE_KEY = 'q80b.launcher.idle.v1';
  var DEFAULTS = [
    { label: 'Apple TV', number: 3, visible: true },
    { label: 'PlayStation', number: 1, visible: true },
    { label: 'HDMI 2', number: 2, visible: false },
    { label: 'HDMI 4', number: 4, visible: false }
  ];
  var ART = [
    '<img class="apple-mark" src="assets/apple-tv-mark.png" alt="" draggable="false">',
    '<img class="ps-mark" src="assets/playstation-mark.svg" alt="" draggable="false">',
    '<span class="hdmi-art"><svg viewBox="0 0 48 48"><path d="M6 13h36v13l-6 7H12l-6-7Z"/><path d="M12 18h24v6l-3 4H15l-3-4Z"/><path d="M17 20v4m7-4v4m7-4v4M18 34v6h12v-6"/></svg><span class="art-port">2</span></span>',
    '<span class="hdmi-art"><svg viewBox="0 0 48 48"><path d="M6 13h36v13l-6 7H12l-6-7Z"/><path d="M12 18h24v6l-3 4H15l-3-4Z"/><path d="M17 20v4m7-4v4m7-4v4M18 34v6h12v-6"/></svg><span class="art-port">4</span></span>'
  ];
  var home = document.getElementById('home');
  var tiles = document.querySelectorAll('.source');
  var dialog = document.getElementById('layout-dialog');
  var settingsDialog = document.getElementById('settings-panel');
  var panelOpener = null;
  var form = document.getElementById('layout-form');
  var notice = document.getElementById('notice');
  var noticeWrap = document.getElementById('notice-wrap');
  var retry = document.getElementById('retry-sources');
  var layoutError = document.getElementById('layout-error');
  var preferences = readPreferences();
  var sources = [];
  var busy = false;
  var dialogOpener = null;
  var lastHomeFocus = tiles[0];
  var shortcutButtons = document.querySelectorAll('.tv-shortcuts .quiet-button');
  var sourceRequest = 0;
  var isPreview = true; // Friend kit is always a design demo.
  var idle;

  function currentPanel() { return !dialog.hidden ? dialog : !settingsDialog.hidden ? settingsDialog : null; }
  function openPreferences() {
    if (busy || currentPanel()) { return; }
    panelOpener = document.activeElement;
    settingsDialog.hidden = false;
    window.scenicUI.setPanelOpen(true);
    home.setAttribute('aria-hidden', 'true');
    document.getElementById('close-preferences').focus();
  }
  function closePreferences() {
    settingsDialog.hidden = true;
    window.scenicUI.setPanelOpen(false);
    home.removeAttribute('aria-hidden');
    restoreFocus(panelOpener || document.getElementById('settings'));
  }

  function copyDefaults() {
    return DEFAULTS.map(function (item) { return { label: item.label, number: item.number, visible: item.visible }; });
  }

  function validTiles(value) {
    var seen = {};
    if (!Array.isArray(value) || value.length !== 4) { return false; }
    return value.some(function (item) { return item && item.visible; }) && value.every(function (item) {
      if (!item || typeof item.label !== 'string' || !item.label.trim() || item.label.length > 32 ||
          typeof item.number !== 'number' || item.number < 1 || item.number > 4 || item.number % 1 || seen[item.number] || typeof item.visible !== 'boolean') {
        return false;
      }
      seen[item.number] = true;
      return true;
    });
  }

  function readPreferences() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === 1 && Array.isArray(saved.tiles)) {
        saved.tiles = saved.tiles.map(function (item, index) { return { label: item.label, number: item.number, visible: index < 2 }; });
        saved.version = 2;
      }
      if (saved && saved.version === 2 && validTiles(saved.tiles)) {
        return { version: 2, configured: saved.configured === true, tiles: saved.tiles };
      }
    } catch (error) { /* A missing or invalid local preference never blocks the launcher. */ }
    return { version: 2, configured: false, tiles: copyDefaults() };
  }

  function savePreferences() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      return true;
    } catch (error) { return false; }
  }

  function sourceFor(number) {
    var i;
    for (i = 0; i < sources.length; i += 1) {
      if (sources[i].number === number) { return sources[i]; }
    }
    return { type: 'HDMI', number: number, connected: null };
  }

  function render() {
    var i;
    for (i = 0; i < tiles.length; i += 1) {
      var tile = tiles[i];
      var preference = preferences.tiles[i];
      var source = sourceFor(preference.number);
      tile.hidden = !preference.visible;
      tile.tabIndex = preference.visible ? 0 : -1;
      tile.setAttribute('data-last-visible', 'false');
      var status = source.connected === true ? 'Connected' : source.connected === false ? 'Not connected' : '';
      tile.querySelector('.source-art').innerHTML = ART[i];
      var artPort = tile.querySelector('.art-port');
      if (artPort) { artPort.textContent = String(preference.number); }
      tile.querySelector('.source-name').textContent = preference.label;
      tile.setAttribute('data-connected', source.connected === true ? 'true' : source.connected === false ? 'false' : 'unknown');
      tile.setAttribute('aria-label', preference.label + ', HDMI ' + preference.number + ', ' + (status || 'Connection unknown').toLowerCase());
    }
    var showing = Array.prototype.filter.call(tiles, function (tile) { return !tile.hidden; });
    showing[showing.length - 1].setAttribute('data-last-visible', 'true');
    document.getElementById('dock').setAttribute('data-count', showing.length);
    document.getElementById('all-inputs').checked = showing.length === 4;
  }

  function showNotice(message, tone, allowRetry) {
    notice.textContent = message;
    notice.setAttribute('data-tone', tone || 'info');
    retry.hidden = !allowRetry;
    noticeWrap.hidden = !message;
  }

  function updateClock() {
    var clock = document.getElementById('clock');
    var now = new Date();
    if (!clock) { return; }
    clock.textContent = window.homeInfo.clockText(now);
    clock.setAttribute('datetime', now.toISOString());
    var progress = window.yearProgress.calculate(window.homeInfo.calendarInfo(now));
    var year = document.getElementById('year-progress');
    document.getElementById('year-label').textContent = String(progress.year);
    document.getElementById('year-summary').textContent = progress.remainingText;
    year.style.setProperty('--year-progress', progress.percentage + '%');
    year.style.setProperty('--quarter-widths', progress.quarterDays.map(function (days) { return days + 'fr'; }).join(' '));
    var track = document.getElementById('year-track');
    track.setAttribute('aria-label', 'Progress through ' + progress.year);
    track.setAttribute('aria-valuenow', progress.percentage.toFixed(1));
    track.setAttribute('aria-valuetext', progress.remainingText + '; Q' + progress.quarter + ' of ' + progress.year);
    Array.prototype.forEach.call(document.querySelectorAll('.quarter-tick'), function (tick, index) { tick.style.left = progress.dividers[index] + '%'; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-quarter]'), function (label) {
      var quarter = Number(label.getAttribute('data-quarter'));
      label.classList.toggle('is-current', quarter === progress.quarter);
      label.classList.toggle('is-complete', quarter < progress.quarter);
    });
  }

  function friendlyError(error, fallback) {
    return error && typeof error.userMessage === 'string' && error.userMessage ? error.userMessage : fallback;
  }

  function bridgeCall(method, argument, timeout) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = window.setTimeout(function () {
        if (!settled) {
          settled = true;
          reject({ userMessage: 'The TV has not confirmed this action. Check the screen before trying again.' });
        }
      }, timeout || 12000);
      function finish(callback, value) {
        if (settled) { return; }
        settled = true;
        window.clearTimeout(timer);
        callback(value);
      }
      try {
        if (!window.tvBridge || typeof window.tvBridge[method] !== 'function') {
          throw { userMessage: 'TV controls are unavailable. Samsung’s remote controls still work.' };
        }
        Promise.resolve(window.tvBridge[method](argument)).then(function (value) {
          finish(resolve, value);
        }, function (error) {
          finish(reject, error);
        });
      } catch (error) { finish(reject, error); }
    });
  }

  function refreshSources() {
    var request = ++sourceRequest;
    retry.hidden = true;
    bridgeCall('getSources', undefined, 7000).then(function (value) {
      if (request !== sourceRequest) { return; }
      if (!Array.isArray(value)) { throw new Error('Invalid source list'); }
      var seen = {};
      sources = value.filter(function (item) {
        if (!item || item.type !== 'HDMI' || typeof item.number !== 'number' || item.number < 1 || item.number > 4 || item.number % 1 || seen[item.number]) { return false; }
        seen[item.number] = true;
        return true;
      }).map(function (item) {
        return { type: 'HDMI', number: item.number, connected: typeof item.connected === 'boolean' ? item.connected : null, label: item.label };
      });
      render();
      if (!busy) { showNotice('', 'info', false); }
    }).catch(function (error) {
      if (request !== sourceRequest) { return; }
      sources = [];
      render();
      if (!busy) {
        showNotice(friendlyError(error, 'Could not read the HDMI ports. You can still choose a source.'), 'error', true);
      }
    });
  }

  function restoreFocus(element) {
    if (!currentPanel() && !document.hidden) {
      var target = element && document.documentElement.contains(element) && visible(element) ? element :
        Array.prototype.filter.call(tiles, visible)[0];
      if (target) { target.focus(); }
    }
  }

  function runAction(method, argument, opener, progress, failure) {
    if (busy) { return; }
    busy = true;
    if (idle) { idle.pause(); }
    home.setAttribute('aria-busy', 'true');
    if (opener) { opener.setAttribute('aria-busy', 'true'); }
    showNotice(progress, 'progress', false);
    bridgeCall(method, argument).then(function () {
      showNotice(isPreview ? 'Preview only. No TV action was taken.' : 'Request sent to the TV.', 'info', false);
    }).catch(function (error) {
      showNotice(friendlyError(error, failure), 'error', false);
    }).then(function () {
      busy = false;
      home.removeAttribute('aria-busy');
      if (opener) { opener.removeAttribute('aria-busy'); }
      restoreFocus(opener || lastHomeFocus);
      if (idle) { idle.resume(); }
    });
  }

  function setupIdle() {
    var toggle = document.getElementById('idle-off');
    var status = document.getElementById('idle-status');
    var retryPower = document.getElementById('retry-power');
    var enabled = false; // Unfinished power feature is opt-in for visual testing only.
    var ready = false;
    var preparing = false;
    var focused = typeof document.hasFocus === 'function' && document.hasFocus();
    try {
      var saved = JSON.parse(window.localStorage.getItem(IDLE_KEY));
      if (saved && saved.version === 1 && typeof saved.enabled === 'boolean') { enabled = saved.enabled; }
    } catch (ignore) {}
    toggle.checked = enabled;
    function setStatus(message) { status.textContent = message; }
    idle = window.homeIdle.create({
      now: function () { return window.performance.now(); },
      setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window),
      isEligible: function () {
        return enabled && ready && focused && !document.hidden && !busy && document.hasFocus();
      },
      onWarning: function (show) { document.getElementById('idle-warning').hidden = !show; },
      onExpire: function (guard) {
        return bridgeCall('powerOff', guard, 10000).then(function (result) {
          setStatus(result.preview ? 'Preview only. The TV was not turned off.' : 'Power-off request sent.');
        });
      },
      onError: function (error) {
        if (error && error.cancelled) { idle.pause(); return; }
        ready = false; retryPower.hidden = false;
        setStatus(error && error.message ? error.message : 'Automatic power off is unavailable. Try enabling TV power control again.');
        console.warn('Home idle power unavailable. No automatic retry.');
      }
    });
    function prepare() {
      if (!enabled || preparing) { return; }
      preparing = true; ready = false; idle.pause(); retryPower.hidden = true;
      setStatus(isPreview ? 'Preview only. No TV power commands are sent.' : 'Waiting for TV power-control permission…');
      bridgeCall('prepareStandby', undefined, 65000).then(function () {
        ready = true;
        setStatus(enabled ? (isPreview ? 'Preview only. No TV power commands are sent.' : 'Ready. Home turns the TV off after 30 idle minutes.') : 'Automatic power off is off.');
        idle.resume();
        console.info('Home idle power ready; timeout 30 minutes; preview=' + isPreview);
      }).catch(function (error) {
        retryPower.hidden = !enabled;
        setStatus(enabled ? friendlyError(error, error && error.message ? error.message : 'TV power-control permission was not confirmed.') : 'Automatic power off is off.');
        console.warn('Home idle power permission unavailable.');
      }).then(function () { preparing = false; });
    }
    toggle.addEventListener('change', function () {
      enabled = toggle.checked;
      try { window.localStorage.setItem(IDLE_KEY, JSON.stringify({ version: 1, enabled: enabled })); } catch (ignore) {}
      idle.pause();
      if (enabled) { prepare(); }
      else { retryPower.hidden = true; setStatus('Automatic power off is off.'); }
    });
    retryPower.addEventListener('click', prepare);
    ['keydown', 'pointerdown', 'pointermove', 'click', 'wheel', 'touchstart'].forEach(function (name) {
      document.addEventListener(name, idle.activity, { capture: true, passive: true });
    });
    window.addEventListener('blur', function () { focused = false; idle.pause(); });
    window.addEventListener('focus', function () { focused = true; idle.resume(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { idle.pause(); }
      else { focused = document.hasFocus(); idle.resume(); }
    });
    if (enabled) { prepare(); }
    else { setStatus('Automatic power off is off.'); }
  }

  function openLayout() {
    if (busy || currentPanel()) { return; }
    dialogOpener = document.activeElement;
    var i;
    for (i = 0; i < 4; i += 1) {
      document.getElementById('name-' + i).value = preferences.tiles[i].label;
      document.getElementById('port-' + i).value = String(preferences.tiles[i].number);
      document.getElementById('show-' + i).checked = preferences.tiles[i].visible;
    }
    layoutError.hidden = true;
    dialog.hidden = false;
    window.scenicUI.setPanelOpen(true);
    document.getElementById('name-0').focus();
    home.setAttribute('aria-hidden', 'true');
  }

  function closeLayout() {
    dialog.hidden = true;
    window.scenicUI.setPanelOpen(false);
    home.removeAttribute('aria-hidden');
    restoreFocus(dialogOpener || document.getElementById('edit-layout'));
  }

  function showLayoutError(message, field) {
    layoutError.textContent = message;
    layoutError.hidden = false;
    if (field) { field.focus(); }
  }

  function saveLayout(event) {
    event.preventDefault();
    var next = [];
    var seen = {};
    var i;
    for (i = 0; i < 4; i += 1) {
      var nameField = document.getElementById('name-' + i);
      var portField = document.getElementById('port-' + i);
      var label = nameField.value.trim();
      var number = Number(portField.value);
      if (!label || label.length > 32) {
        showLayoutError('Give each tile a name between 1 and 32 characters.', nameField);
        return;
      }
      if (number < 1 || number > 4 || number % 1 || seen[number]) {
        showLayoutError('Choose a different HDMI port for each tile.', portField);
        return;
      }
      seen[number] = true;
      next.push({ label: label, number: number, visible: document.getElementById('show-' + i).checked });
    }
    if (!next.some(function (item) { return item.visible; })) {
      showLayoutError('Keep at least one input visible.', document.getElementById('show-0'));
      return;
    }
    preferences = { version: 2, configured: true, tiles: next };
    var persisted = savePreferences();
    render();
    closeLayout();
    showNotice(persisted ? 'Layout saved.' : 'Layout saved for this session. TV storage is unavailable.', 'info', false);
  }

  function resetLayout() {
    preferences = { version: 2, configured: false, tiles: copyDefaults() };
    var persisted = savePreferences();
    render();
    closeLayout();
    showNotice(persisted ? 'Layout reset. TV settings and apps were not changed.' : 'Layout reset for this session. TV storage is unavailable.', 'info', false);
  }

  function visible(element) {
    return !element.disabled && element.offsetWidth > 0 && element.offsetHeight > 0;
  }

  function focusables() {
    var root = currentPanel() || home;
    return Array.prototype.filter.call(root.querySelectorAll('[data-nav]'), visible);
  }

  function moveFocus(direction) {
    var candidates = focusables();
    var active = document.activeElement;
    if (candidates.indexOf(active) === -1) {
      if (candidates.length) { candidates[0].focus(); }
      return;
    }
    var current = active.getBoundingClientRect();
    var x = current.left + current.width / 2;
    var y = current.top + current.height / 2;
    var best = null;
    var bestScore = Infinity;
    candidates.forEach(function (candidate) {
      if (candidate === active) { return; }
      var rect = candidate.getBoundingClientRect();
      var dx = rect.left + rect.width / 2 - x;
      var dy = rect.top + rect.height / 2 - y;
      var primary = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
      var secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
      if (primary <= 2) { return; }
      /* Favor a shared row/column; do not jump diagonally over the nearby item. */
      var overlap = direction === 'left' || direction === 'right' ? rect.bottom > current.top && rect.top < current.bottom : rect.right > current.left && rect.left < current.right;
      if ((direction === 'left' || direction === 'right') && !overlap) { return; }
      var score = primary + secondary * 2.5 + (overlap ? 0 : 1500);
      if (score < bestScore) { bestScore = score; best = candidate; }
    });
    if (best) { best.focus(); }
  }

  function handleKey(event) {
    var code = event.keyCode || event.which;
    var active = document.activeElement;
    var tag = active && active.tagName;
    var editingText = (tag === 'INPUT' && active.type !== 'checkbox') || tag === 'TEXTAREA';
    var isBack = code === 10009 || code === 27 || code === 461 || (code === 8 && !editingText);
    if (isBack) {
      event.preventDefault();
      if (!settingsDialog.hidden) { closePreferences(); }
      else if (!dialog.hidden) {
        if (editingText) {
          /* The first Back leaves text entry; the next Back closes the editor. */
          active.blur();
          document.getElementById('close-layout').focus();
        } else { closeLayout(); }
      } else if (!busy) {
        runAction('openSamsungHome', undefined, lastHomeFocus, 'Opening Samsung Home…', 'Could not open Samsung Home. Use the Home button on the Samsung remote.');
      }
      return;
    }
    if (currentPanel() && code === 9) {
      var controls = focusables();
      var index = controls.indexOf(active);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && index === controls.length - 1) {
        event.preventDefault();
        controls[0].focus();
      }
      return;
    }
    if (tag === 'INPUT' && active.type === 'checkbox' && code === 13) {
      event.preventDefault(); active.checked = !active.checked;
      var changed = document.createEvent('Event'); changed.initEvent('change', true, false); active.dispatchEvent(changed); return;
    }
    if (code >= 37 && code <= 40) {
      /* Text caret movement and native select menus retain their familiar keys. */
      if (editingText && (code === 37 || code === 39)) { return; }
      if (tag === 'SELECT' && (code === 38 || code === 40)) { return; }
      event.preventDefault();
      moveFocus({ 37: 'left', 38: 'up', 39: 'right', 40: 'down' }[code]);
    }
    /* Enter, text entry, volume, power, Settings, media and other system keys pass through. */
  }

  Array.prototype.forEach.call(tiles, function (tile, index) {
    tile.addEventListener('focus', function () {
      lastHomeFocus = tile;
      Array.prototype.forEach.call(tiles, function (other) { other.classList.toggle('is-selected', other === tile); });
    });
    tile.addEventListener('click', function () {
      var preference = preferences.tiles[index];
      var actual = sourceFor(preference.number);
      var source = { type: 'HDMI', number: preference.number, connected: actual.connected, label: preference.label };
      runAction('selectSource', source, tile, 'Switching to ' + preference.label + '…', 'Could not switch to HDMI ' + preference.number + '. Try the Samsung input controls.');
    });
  });
  document.getElementById('samsung-settings').addEventListener('click', function () {
    runAction('openSettings', undefined, this, 'Opening Samsung Settings…', 'Could not open Settings. Use the Settings button on the Samsung remote.');
  });
  document.getElementById('samsung-home').addEventListener('click', function () {
    runAction('openSamsungHome', undefined, this, 'Opening Samsung Home…', 'Could not open Samsung Home. Use the Home button on the Samsung remote.');
  });
  document.getElementById('edit-layout').addEventListener('click', openLayout);
  document.getElementById('settings').addEventListener('click', openPreferences);
  document.getElementById('close-preferences').addEventListener('click', closePreferences);
  document.getElementById('close-layout').addEventListener('click', closeLayout);
  document.getElementById('cancel-layout').addEventListener('click', closeLayout);
  document.getElementById('reset-layout').addEventListener('click', resetLayout);
  form.addEventListener('submit', saveLayout);
  retry.addEventListener('click', refreshSources);
  document.getElementById('clock-left').addEventListener('change', function () {
    window.scenicUI.setClockLeft(this.checked);
  });
  document.getElementById('all-inputs').addEventListener('change', function () {
    var all = this.checked;
    preferences.tiles.forEach(function (tile, index) { tile.visible = all || index < 2; });
    var persisted = savePreferences();
    render();
    if (!persisted) { showNotice('Layout saved for this session. TV storage is unavailable.', 'info', false); }
  });
  document.addEventListener('keydown', handleKey);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      if (!currentPanel()) { restoreFocus(lastHomeFocus); }
      updateClock();
      refreshSources();
    }
  });
  window.addEventListener('focus', function () {
    if (!currentPanel() && (document.activeElement === document.body || !document.activeElement ||
        Array.prototype.indexOf.call(shortcutButtons, document.activeElement) !== -1)) { restoreFocus(lastHomeFocus); }
  });

  render();
  updateClock();
  window.scenicUI.startWeather();
  window.setInterval(updateClock, 30000);
  restoreFocus(tiles[0]);
  refreshSources();
  setupIdle();
}());
